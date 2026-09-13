import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Injectable()
export class ConseillerService {
  constructor(private prisma: PrismaService) {}

  async chat(nip: string, message: string, langue: string = 'fr') {
    const apprenant = await this.prisma.apprenant.findUnique({
      where: { nip },
      include: { notes: true, preferences: true },
    });

    const context = this.buildContext(apprenant);
    const response = await this.generateResponse(message, context, langue);

    const userMsg: ChatMessage = { role: 'user', content: message, timestamp: new Date() };
    const assistantMsg: ChatMessage = { role: 'assistant', content: response, timestamp: new Date() };

    let conversation = await this.prisma.conversationIA.findFirst({
      where: { apprenantNip: nip },
      orderBy: { dateDebut: 'desc' },
    });

    const existingMessages = (conversation?.messages as any[]) || [];
    const newMessages = [...existingMessages, userMsg, assistantMsg];

    if (conversation) {
      await this.prisma.conversationIA.update({
        where: { id: conversation.id },
        data: { messages: newMessages, langue },
      });
    } else {
      conversation = await this.prisma.conversationIA.create({
        data: {
          apprenantNip: nip,
          messages: newMessages,
          langue,
          palier: 'TROISIEME',
        },
      });
    }

    return { response, conversationId: conversation.id };
  }

  async getHistorique(nip: string) {
    return this.prisma.conversationIA.findMany({
      where: { apprenantNip: nip },
      orderBy: { dateDebut: 'desc' },
      take: 10,
    });
  }

  private buildContext(apprenant: any) {
    if (!apprenant) return 'Aucune donnée disponible.';

    const notes = apprenant.notes || [];
    const moyenne = notes.length > 0
      ? (notes.reduce((s: number, n: any) => s + n.note, 0) / notes.length).toFixed(1)
      : 'N/A';

    const preferences = apprenant.preferences || [];
    const pref = preferences[0];

    return `Apprenant: ${apprenant.prenom} ${apprenant.nom}
Moyenne générale: ${moyenne}/20
Préférences: ${pref ? `1) ${pref.filiereId1 || 'N/A'}, 2) ${pref.filiereId2 || 'N/A'}, 3) ${pref.filiereId3 || 'N/A'}` : 'Non renseignées'}`;
  }

  private async generateResponse(message: string, context: string, langue: string): Promise<string> {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('bonjour') || lowerMsg.includes('salut')) {
      return 'Bonjour ! Je suis votre conseiller pédagogique. Comment puis-je vous aider dans votre orientation ?';
    }

    if (lowerMsg.includes('métier') || lowerMsg.includes('carrier')) {
      return 'Le Bénin offre de nombreuses opportunités métier à travers les filières techniques, professionnelles et les écoles de métiers. Quel domaine vous intéresse ? (technique, agricole, commerce...)';
    }

    if (lowerMsg.includes('filier') || lowerMsg.includes('orientation')) {
      return `D'après votre profil, voici les points importants :\n${context}\n\nVoulez-vous en savoir plus sur une filière en particulier ?`;
    }

    if (lowerMsg.includes('salaire') || lowerMsg.includes('gain') || lowerMsg.includes('argent')) {
      return 'Les salaires varient selon les filières et les métiers. En général :\n- École de Métiers : 50 000 - 150 000 FCFA\n- Bac Technique : 75 000 - 200 000 FCFA\n- Université (selon spécialité) : 100 000 - 500 000+ FCFA\n\nVoulez-vous des précisions sur un domaine ?';
    }

    if (lowerMsg.includes('bourse')) {
      return 'Plusieurs bourses sont disponibles pour les élèves méritants. Contactez votre établissement ou consultez la section "Bourses" dans le catalogue pour en savoir plus.';
    }

    return `Merci pour votre question ! D'après votre profil :\n${context}\n\nPouvez-vous reformuler ou préciser votre question pour que je puisse mieux vous aider ?`;
  }
}
