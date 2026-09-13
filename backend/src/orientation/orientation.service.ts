import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface RecommandationResult {
  filiereId: string;
  score: number;
  explication: string;
}

@Injectable()
export class OrientationService {
  constructor(private prisma: PrismaService) {}

  async calculerRecommandations(nip: string, palier: string) {
    const apprenant = await this.prisma.apprenant.findUnique({
      where: { nip },
      include: { notes: true, preferences: true },
    });

    if (!apprenant) return [];

    const filieres = await this.prisma.filiere.findMany({
      include: { etablissement: true },
    });

    const notesByMatiere = this.groupNotesByMatiere(apprenant.notes);
    const moyenneGenerale = this.calculerMoyenneGenerale(apprenant.notes);
    const forces = this.detecterForces(notesByMatiere);
    const preference = apprenant.preferences.find(p => p.palier === palier as any);

    const recommandations: RecommandationResult[] = [];

    for (const filiere of filieres) {
      let score = 0;
      const raisons: string[] = [];

      if (moyenneGenerale >= 12) score += 20;
      else if (moyenneGenerale >= 10) score += 10;

      if (preference) {
        if (filiere.id === preference.filiereId1) { score += 30; raisons.push('Votre 1ère préférence'); }
        if (filiere.id === preference.filiereId2) { score += 20; raisons.push('Votre 2ème préférence'); }
        if (filiere.id === preference.filiereId3) { score += 10; raisons.push('Votre 3ème préférence'); }
      }

      if (filiere.tauxInsertion && filiere.tauxInsertion > 70) {
        score += 15;
        raisons.push(`Taux d'insertion élevé (${filiere.tauxInsertion}%)`);
      }

      if (forces.length > 0 && filiere.description) {
        const desc = filiere.description.toLowerCase();
        for (const force of forces) {
          if (desc.includes(force.toLowerCase())) {
            score += 10;
            raisons.push(`Correspond à vos forces en ${force}`);
          }
        }
      }

      if (score > 0) {
        recommandations.push({
          filiereId: filiere.id,
          score: Math.min(score, 100),
          explication: raisons.length > 0
            ? raisons.join('. ') + `. Moyenne générale : ${moyenneGenerale.toFixed(1)}/20`
            : `Moyenne générale : ${moyenneGenerale.toFixed(1)}/20`,
        });
      }
    }

    recommandations.sort((a, b) => b.score - a.score);
    return recommandations.slice(0, 5);
  }

  async getRecommandations(nip: string) {
    return this.prisma.recommandation.findMany({
      where: { apprenantNip: nip, active: true },
      include: { filiere: true },
      orderBy: { score: 'desc' },
    });
  }

  async explain(recommandationId: string) {
    const reco = await this.prisma.recommandation.findUnique({
      where: { id: recommandationId },
      include: { filiere: true, apprenant: true },
    });
    return reco;
  }

  private groupNotesByMatiere(notes: any[]) {
    const grouped: Record<string, number[]> = {};
    for (const note of notes) {
      if (!grouped[note.matiere]) grouped[note.matiere] = [];
      grouped[note.matiere].push(note.note);
    }
    return grouped;
  }

  private calculerMoyenneGenerale(notes: any[]): number {
    if (notes.length === 0) return 0;
    const total = notes.reduce((sum, n) => sum + n.note, 0);
    return total / notes.length;
  }

  private detecterForces(notesByMatiere: Record<string, number[]>): string[] {
    const forces: string[] = [];
    for (const [matiere, notes] of Object.entries(notesByMatiere)) {
      const moyenne = notes.reduce((a, b) => a + b, 0) / notes.length;
      if (moyenne >= 14) forces.push(matiere);
    }
    return forces;
  }
}
