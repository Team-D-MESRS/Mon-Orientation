import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UtilisateurConnecte } from '../auth/utilisateur-courant.decorator';

interface MessageEnregistre {
  role: 'user' | 'assistant';
  content: string;
  horodatage: string;
}

interface EchangeGuido {
  question: string;
  reponse: string;
}

interface ReponseApiGuido {
  conversation_id: string;
  question: string;
  reponse: string;
}

const MAX_ECHANGES_API = 12;
const DELAI_APPEL_MS = 45_000;

// Réponse déterministe pour les signaux sérieux : ce filet reste local et ne transmet pas le message au bot externe.
const SIGNAUX_DETRESSE = [
  'harcèlement', 'harcèle', 'harcelée', 'harcelé', 'harcele', 'me frappe', 'me tape', 'me bat', 'violence',
  'abusé', 'abusée', 'agressée', 'agressé', 'envie de mourir', 'me suicider', 'suicide',
  'me faire du mal', 'me blesser', "j'ai peur de rentrer", "j'ai peur de lui", "j'ai peur d'elle",
];

const REPONSE_DETRESSE_ELEVE =
  "Ce que tu dis est important, mais je ne suis pas la bonne personne pour t'aider avec ça : je suis un assistant sur l'orientation scolaire. Parle-en dès que possible à un adulte de confiance — un parent, ton professeur principal, le conseiller d'orientation ou le chef d'établissement. Tu peux revenir me parler d'orientation quand tu veux.";
const REPONSE_DETRESSE_PARENT =
  "Ce que vous décrivez dépasse ce que je peux traiter : je suis un assistant sur l'orientation scolaire, pas un professionnel formé pour ce type de situation. Je vous invite à en parler sans attendre à un adulte de confiance de l'établissement (conseiller d'orientation, chef d'établissement) ou à un professionnel adapté. Je reste disponible pour toute question sur l'orientation de votre enfant.";

@Injectable()
export class ConseillerService {
  private readonly logger = new Logger(ConseillerService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly autoriserHttpNonSecurise: boolean;

  constructor(
    private prisma: PrismaService,
    config: ConfigService,
  ) {
    this.apiUrl = config.get<string>('GUIDO_API_URL')?.trim() ?? '';
    this.apiKey = config.get<string>('GUIDO_API_KEY')?.trim() ?? '';
    this.autoriserHttpNonSecurise = config.get<string>('GUIDO_ALLOW_INSECURE_HTTP') === 'true';
    if (!this.apiUrl || !this.apiKey) {
      this.logger.warn('Guido externe non configuré : renseigner GUIDO_API_URL et GUIDO_API_KEY côté serveur');
    }
  }

  async chat(
    nip: string,
    message: string,
    utilisateur: UtilisateurConnecte,
    conversationId?: string,
  ) {
    const question = message?.trim();
    if (!question) throw new BadRequestException('Le message est vide');
    if (question.length > 2000) throw new BadRequestException('Le message dépasse la limite de 2000 caractères.');

    const conversation = conversationId
      ? await this.prisma.conversationIA.findFirst({ where: { id: conversationId, apprenantNip: nip } })
      : null;
    if (conversationId && !conversation) throw new NotFoundException('Conversation introuvable');

    const historique = (conversation?.messages as unknown as MessageEnregistre[] | null) ?? [];
    const id = conversation?.id ?? randomUUID();
    const dateQuestion = new Date().toISOString();
    const estSignalDetresse = SIGNAUX_DETRESSE.some((signal) => question.toLocaleLowerCase('fr').includes(signal));
    const reponse = estSignalDetresse
      ? utilisateur.role === 'PARENT' ? REPONSE_DETRESSE_PARENT : REPONSE_DETRESSE_ELEVE
      : await this.appelerGuido(id, question, this.formerHistorique(historique));

    const messages = [
      ...historique,
      { role: 'user', content: question, horodatage: dateQuestion },
      { role: 'assistant', content: reponse, horodatage: new Date().toISOString() },
    ] satisfies MessageEnregistre[];
    const donnees = messages as unknown as Prisma.InputJsonValue;

    if (conversation) {
      await this.prisma.conversationIA.update({ where: { id: conversation.id }, data: { messages: donnees, langue: 'fr' } });
    } else {
      const apprenant = await this.prisma.apprenant.findUnique({ where: { nip }, select: { palier: true } });
      await this.prisma.conversationIA.create({
        data: { id, apprenantNip: nip, messages: donnees, langue: 'fr', palier: apprenant?.palier ?? 'TROISIEME' },
      });
    }

    return { conversationId: id, reponse, outilsUtilises: [] as string[] };
  }

  async getHistorique(nip: string) {
    return this.prisma.conversationIA.findMany({
      where: { apprenantNip: nip },
      orderBy: { dateDebut: 'desc' },
      take: 10,
    });
  }

  private formerHistorique(messages: MessageEnregistre[]): EchangeGuido[] {
    const echanges: EchangeGuido[] = [];
    for (let i = 0; i + 1 < messages.length; i += 1) {
      const question = messages[i];
      const reponse = messages[i + 1];
      if (question.role === 'user' && reponse.role === 'assistant') {
        echanges.push({ question: question.content.slice(0, 2000), reponse: reponse.content.slice(0, 8000) });
      }
    }
    return echanges.slice(-MAX_ECHANGES_API);
  }

  private async appelerGuido(conversationId: string, question: string, historique: EchangeGuido[]): Promise<string> {
    if (!this.apiUrl || !this.apiKey) {
      throw new ServiceUnavailableException("Le conseiller n'est pas configuré : renseignez GUIDO_API_URL et GUIDO_API_KEY côté serveur.");
    }

    let base: URL;
    try {
      base = new URL(this.apiUrl);
    } catch {
      throw new ServiceUnavailableException('La configuration de l’API Guido est invalide.');
    }
    const boucleLocale = ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname);
    const httpAutorise = base.protocol === 'http:' && (
      boucleLocale || (this.autoriserHttpNonSecurise && process.env.NODE_ENV !== 'production')
    );
    if (base.protocol !== 'https:' && !httpAutorise) {
      throw new ServiceUnavailableException('L’API Guido doit être configurée en HTTPS avant tout échange.');
    }
    if (base.username || base.password || base.search || base.hash) {
      throw new ServiceUnavailableException('La configuration de l’API Guido ne doit contenir ni identifiants ni paramètres.');
    }

    const chemin = base.pathname.replace(/\/+$/, '');
    const endpoint = `${base.origin}${chemin}/api/chat`;
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-API-Key': this.apiKey },
        body: JSON.stringify({ conversation_id: conversationId, question, historique }),
        signal: AbortSignal.timeout(DELAI_APPEL_MS),
      });
    } catch (error) {
      this.logger.warn(`API Guido injoignable (${error instanceof Error ? error.name : 'erreur réseau'})`);
      throw new ServiceUnavailableException('Guido est momentanément indisponible. Réessaie dans quelques instants.');
    }

    if (response.status === 401) {
      this.logger.error('L’API Guido a refusé la clé serveur (401)');
      throw new ServiceUnavailableException('Le service Guido est mal configuré.');
    }
    if (response.status === 502 || response.status === 503 || response.status === 429) {
      throw new ServiceUnavailableException('Guido est momentanément indisponible. Réessaie dans quelques instants.');
    }
    if (!response.ok) {
      this.logger.warn(`Réponse inattendue de l’API Guido (${response.status})`);
      throw new BadGatewayException('Le service Guido a renvoyé une réponse inattendue.');
    }

    let donnees: ReponseApiGuido;
    try {
      donnees = await response.json() as ReponseApiGuido;
    } catch {
      throw new BadGatewayException('Le service Guido a renvoyé une réponse invalide.');
    }
    if (donnees.conversation_id !== conversationId || typeof donnees.reponse !== 'string' || !donnees.reponse.trim()) {
      throw new BadGatewayException('Le service Guido a renvoyé une réponse incompatible avec son contrat API.');
    }
    return donnees.reponse;
  }
}
