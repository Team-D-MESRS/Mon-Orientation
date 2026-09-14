import { HttpException, HttpStatus, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiError, Content, FinishReason, FunctionCall, GenerateContentResponse, GoogleGenAI, Part } from '@google/genai';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UtilisateurConnecte } from '../auth/utilisateur-courant.decorator';
import { CONSIGNES_CONSEILLER, CONSIGNE_INTERLOCUTEUR, CONSIGNE_LANGUE, Interlocuteur, Langue } from './prompt-conseiller';
import { ErreurOutil, OUTILS_CONSEILLER, OutilsConseillerService } from './outils-conseiller';

/** Message tel qu'enregistré en base : texte seulement, les appels d'outils ne sont pas rejoués. */
interface MessageEnregistre {
  role: 'user' | 'assistant';
  content: string;
  horodatage: string;
  outils?: string[];
  langue?: Langue;
}

const MAX_TOURS_MODELE = 6; // appels au modèle pour un même message de l'utilisateur
const MAX_MESSAGES_HISTORIQUE = 20; // derniers messages renvoyés au modèle (nombre pair : l'historique commence par l'utilisateur)
const DELAI_APPEL_MS = 90_000;
const MAX_JETONS_SORTIE = 8192;

// Arrêts où les filtres de sécurité de Gemini ont empêché une réponse exploitable
const ARRETS_BLOQUES = new Set<FinishReason>([
  FinishReason.SAFETY,
  FinishReason.PROHIBITED_CONTENT,
  FinishReason.BLOCKLIST,
  FinishReason.SPII,
  FinishReason.RECITATION,
]);

const REPONSE_REFUS = "Je ne peux pas répondre à cette demande. Pose-moi une question sur ton orientation, les formations ou les métiers.";
const REPONSE_TROP_LONGUE =
  'Ta question demande plus de recherches que je ne peux en faire en une fois. Peux-tu la découper en questions plus simples ?';
const REPONSE_VIDE = "Je n'ai pas pu formuler de réponse. Peux-tu reformuler ta question ?";

@Injectable()
export class ConseillerService {
  private readonly logger = new Logger(ConseillerService.name);
  private readonly client: GoogleGenAI | null;
  private readonly modele: string;
  private readonly modeleSecours: string | null;

  constructor(
    private prisma: PrismaService,
    private outils: OutilsConseillerService,
    config: ConfigService,
  ) {
    // Sans clé, le conseiller répond « non configuré » plutôt que d'échouer à chaque appel
    const cle = config.get<string>('GEMINI_API_KEY') || config.get<string>('GOOGLE_API_KEY');
    this.client = cle ? new GoogleGenAI({ apiKey: cle }) : null;
    this.modele = config.get<string>('CONSEILLER_MODELE', 'gemini-3.6-flash');
    this.modeleSecours = config.get<string>('CONSEILLER_MODELE_SECOURS', 'gemini-3.5-flash-lite') || null;
    if (!this.client) this.logger.warn('GEMINI_API_KEY absente : le conseiller pédagogique est désactivé');
  }

  async chat(nip: string, message: string, utilisateur: UtilisateurConnecte, conversationId?: string, langue: Langue = 'fr') {
    const conversation = conversationId
      ? await this.prisma.conversationIA.findFirst({ where: { id: conversationId, apprenantNip: nip } })
      : null;
    if (conversationId && !conversation) throw new NotFoundException('Conversation introuvable');
    if (!this.client) {
      throw new ServiceUnavailableException("Le conseiller n'est pas encore configuré sur ce serveur.");
    }

    const historique = (conversation?.messages as unknown as MessageEnregistre[] | null) ?? [];
    const contents: Content[] = [
      ...historique.slice(-MAX_MESSAGES_HISTORIQUE).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      { role: 'user', parts: [{ text: this.blocContexte(await this.outils.contexteEleve(nip)) }, { text: message }] },
    ];
    const interlocuteur: Interlocuteur = utilisateur.role === 'PARENT' ? 'parent' : 'eleve';
    const questionPosee = new Date().toISOString();

    const { texte, outilsUtilises } = await this.repondre(contents, interlocuteur, nip, langue);

    const conversationMaj = [
      ...historique,
      { role: 'user', content: message, horodatage: questionPosee },
      { role: 'assistant', content: texte, horodatage: new Date().toISOString(), outils: outilsUtilises, langue },
    ] satisfies MessageEnregistre[];
    const donnees = conversationMaj as unknown as Prisma.InputJsonValue;

    let id: string;
    if (conversation) {
      // La langue de la conversation est celle de la dernière réponse
      await this.prisma.conversationIA.update({ where: { id: conversation.id }, data: { messages: donnees, langue } });
      id = conversation.id;
    } else {
      const apprenant = await this.prisma.apprenant.findUnique({ where: { nip }, select: { palier: true } });
      const creee = await this.prisma.conversationIA.create({
        data: { apprenantNip: nip, messages: donnees, langue, palier: apprenant?.palier ?? 'TROISIEME' },
      });
      id = creee.id;
    }

    return { conversationId: id, reponse: texte, outilsUtilises };
  }

  async getHistorique(nip: string) {
    return this.prisma.conversationIA.findMany({
      where: { apprenantNip: nip },
      orderBy: { dateDebut: 'desc' },
      take: 10,
    });
  }

  /** Boucle d'appels de fonctions, bornée à MAX_TOURS_MODELE appels au modèle. */
  private async repondre(contenusInitiaux: Content[], interlocuteur: Interlocuteur, nip: string, langue: Langue) {
    let modele = this.modele;
    let contents = [...contenusInitiaux];
    let outilsUtilises: string[] = [];

    for (let tour = 0; tour < MAX_TOURS_MODELE; tour++) {
      let reponse: GenerateContentResponse;
      try {
        reponse = await this.appelerModele(contents, interlocuteur, modele, langue);
      } catch (err) {
        // Surcharge ou quota épuisé (fréquent sur l'offre gratuite) : la question repart de zéro sur le modèle de secours,
        // qui a son propre quota. De zéro, car les signatures de réflexion déjà reçues sont propres au premier modèle.
        if (this.modeleSecours && modele !== this.modeleSecours && this.estPassager(err)) {
          const detail = (err as ApiError).message.match(/"quotaId":\s*"([^"]+)"/)?.[1] ?? (err as ApiError).status;
          this.logger.warn(`${modele} indisponible (${detail}) : la question repart sur ${this.modeleSecours}`);
          modele = this.modeleSecours;
          contents = [...contenusInitiaux];
          outilsUtilises = [];
          tour = -1;
          continue;
        }
        throw this.erreurFournisseur(err);
      }
      const candidat = reponse.candidates?.[0];

      const blocage = reponse.promptFeedback?.blockReason ?? (candidat?.finishReason && ARRETS_BLOQUES.has(candidat.finishReason) ? candidat.finishReason : null);
      if (blocage) {
        this.logger.warn(`Réponse bloquée par les filtres de sécurité (${blocage})`);
        return { texte: REPONSE_REFUS, outilsUtilises };
      }

      const appels = reponse.functionCalls ?? [];
      if (appels.length > 0 && candidat?.content) {
        // Le contenu du modèle est renvoyé tel quel : il porte les signatures de réflexion attendues au tour suivant
        contents.push(candidat.content);
        outilsUtilises.push(...appels.map((a) => a.name ?? 'inconnu'));
        // Tous les résultats dans un seul message (appels parallèles)
        const resultats = await Promise.all(appels.map((appel) => this.resultatOutil(appel, nip)));
        contents.push({ role: 'user', parts: resultats });
        continue;
      }

      const texte = (reponse.text ?? '').trim();
      return { texte: texte || REPONSE_VIDE, outilsUtilises };
    }

    this.logger.warn(`Limite de ${MAX_TOURS_MODELE} appels au modèle atteinte (outils : ${outilsUtilises.join(', ')})`);
    return { texte: REPONSE_TROP_LONGUE, outilsUtilises };
  }

  /** Contexte placé avant la question : dossier pseudonymisé et propositions, sans nom ni NIP. */
  private blocContexte(contexte: unknown) {
    return `Contexte fourni par la plateforme (dossier pseudonymisé de l'élève et propositions actuelles du moteur) :\n${JSON.stringify(contexte)}`;
  }

  /** Un appel au modèle ; les erreurs du SDK remontent telles quelles (traduites par repondre). */
  private async appelerModele(
    contents: Content[],
    interlocuteur: Interlocuteur,
    modele: string,
    langue: Langue,
  ): Promise<GenerateContentResponse> {
    const reponse = await this.client!.models.generateContent({
      model: modele,
      contents,
      config: {
        // Consignes communes en tête : Gemini réutilise automatiquement ce préfixe identique (cache implicite)
        systemInstruction: [CONSIGNES_CONSEILLER, CONSIGNE_INTERLOCUTEUR[interlocuteur], CONSIGNE_LANGUE[langue]].filter(Boolean).join('\n\n'),
        tools: [{ functionDeclarations: OUTILS_CONSEILLER }],
        maxOutputTokens: MAX_JETONS_SORTIE,
        // Une seule relance (le SDK en fait 5 par défaut) : en cas de surcharge, mieux vaut basculer vite sur le modèle de secours
        httpOptions: { timeout: DELAI_APPEL_MS, retryOptions: { attempts: 2 } },
      },
    });
    const u = reponse.usageMetadata;
    this.logger.log(
      `modèle=${modele} fin=${reponse.candidates?.[0]?.finishReason ?? '?'} appels=${reponse.functionCalls?.map((a) => a.name).join(',') || '-'} entrée=${u?.promptTokenCount ?? 0} cache=${u?.cachedContentTokenCount ?? 0} réflexion=${u?.thoughtsTokenCount ?? 0} sortie=${u?.candidatesTokenCount ?? 0}`,
    );
    return reponse;
  }

  /** Erreur passagère côté Google : quota du modèle épuisé, surcharge ou panne momentanée. */
  private estPassager(err: unknown): boolean {
    return err instanceof ApiError && [429, 500, 503, 504].includes(err.status);
  }

  private async resultatOutil(appel: FunctionCall, nip: string): Promise<Part> {
    const nom = appel.name ?? '';
    try {
      const resultat = await this.outils.executer(nom, appel.args, nip);
      return { functionResponse: { id: appel.id, name: nom, response: { output: resultat } } };
    } catch (err) {
      if (!(err instanceof ErreurOutil)) this.logger.error(`Outil ${nom} : ${String(err)}`);
      const message = err instanceof ErreurOutil ? err.message : 'Erreur interne lors de la consultation des données.';
      return { functionResponse: { id: appel.id, name: nom, response: { error: message } } };
    }
  }

  /** Traduit les erreurs de l'API Gemini en réponses HTTP lisibles pour l'élève. */
  private erreurFournisseur(err: unknown): HttpException {
    if (err instanceof ApiError) {
      // Gemini répond 400 (et non 401) quand la clé est invalide
      if (err.status === 401 || err.status === 403 || (err.status === 400 && /API[_ ]?KEY/i.test(err.message))) {
        this.logger.error(`Clé Gemini refusée (${err.status})`);
        return new ServiceUnavailableException("Le conseiller n'est pas correctement configuré sur ce serveur.");
      }
      if (err.status === 429) {
        this.logger.warn(`Quota Gemini atteint (429) : ${err.message.replace(/\s+/g, ' ').slice(0, 400)}`);
        return new HttpException('Le conseiller reçoit trop de demandes. Réessaie dans une minute.', HttpStatus.TOO_MANY_REQUESTS);
      }
      this.logger.error(`Erreur de l'API Gemini ${err.status} : ${err.message}`);
      return new ServiceUnavailableException('Le conseiller est momentanément indisponible. Réessaie dans quelques instants.');
    }
    this.logger.error(`Appel à Gemini impossible : ${String(err)}`);
    return new ServiceUnavailableException('Le conseiller est momentanément injoignable. Réessaie dans quelques instants.');
  }
}
