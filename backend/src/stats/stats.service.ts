import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, TypeEvenementUsage } from '@prisma/client';
import ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';

export type FormatExportStats = 'csv' | 'xlsx';
type LigneEvenement = { jour: string; type: string; total: number };
type LigneUsage = { type: string; dimension: string | null; total: number };

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatsNationales() {
    const [totalApprenants, totalFiliere, totalEtablissements, repartitionType] = await Promise.all([
      this.prisma.apprenant.count(),
      this.prisma.filiere.count({ where: { masquee: false } }),
      this.prisma.etablissement.count({ where: { actif: true } }),
      this.prisma.filiere.groupBy({ by: ['type'], where: { masquee: false }, _count: true }),
    ]);
    return { totalApprenants, totalFiliere, totalEtablissements, repartitionType };
  }

  async getStatsDepartement(departement: string) {
    const [totalApprenants, totalEtablissements] = await Promise.all([
      this.prisma.apprenant.count({ where: { departement } }),
      this.prisma.etablissement.count({ where: { departement, actif: true } }),
    ]);
    return { departement, totalApprenants, totalEtablissements };
  }

  async getStatsDepartements() {
    const [apprenants, etablissements] = await Promise.all([
      this.prisma.apprenant.groupBy({ by: ['departement'], _count: true }),
      this.prisma.etablissement.groupBy({ by: ['departement'], where: { departement: { not: null }, actif: true }, _count: true }),
    ]);
    const parDepartement = new Map<string, { departement: string; apprenants: number; etablissements: number }>();
    for (const a of apprenants) parDepartement.set(a.departement, { departement: a.departement, apprenants: a._count, etablissements: 0 });
    for (const e of etablissements) {
      const departement = e.departement ?? 'Non renseigné';
      const entree = parDepartement.get(departement) ?? { departement, apprenants: 0, etablissements: 0 };
      entree.etablissements = e._count;
      parDepartement.set(departement, entree);
    }
    return [...parDepartement.values()].sort((a, b) => a.departement.localeCompare(b.departement, 'fr'));
  }

  async getStatsFiliere() {
    return this.prisma.filiere.groupBy({ by: ['type'], where: { masquee: false }, _count: true, _avg: { tauxInsertion: true } });
  }

  async getObservatoire(debutBrut?: string, finBrut?: string, departement?: string) {
    const { debut, fin, periode } = this.periode(debutBrut, finBrut);
    const periodeApprenant = { createdAt: { gte: debut, lt: fin }, ...(departement ? { departement } : {}) };
    const periodeDecouverte = { dateSaisie: { gte: debut, lt: fin }, ...(departement ? { apprenant: { departement } } : {}) };
    const periodePreference = { dateSaisie: { gte: debut, lt: fin }, ...(departement ? { apprenant: { departement } } : {}) };
    const periodeRecommandation = { dateGeneration: { gte: debut, lt: fin }, ...(departement ? { apprenant: { departement } } : {}) };
    const periodeFavori = { createdAt: { gte: debut, lt: fin }, ...(departement ? { apprenant: { departement } } : {}) };

    const [
      totalApprenants,
      nouveauxApprenants,
      totalParents,
      apprenantsAvecDecouverte,
      decouvertesSaisies,
      recommandations,
      preferences,
      preferencesValidees,
      favoris,
      departements,
      parPalier,
      parSerie,
      filieres,
      etablissementsActifs,
      etablissementsLocalises,
      offres,
      topFilieres,
      tendancesUsages,
      usagesParType,
    ] = await Promise.all([
      this.prisma.apprenant.count({ where: departement ? { departement } : undefined }),
      this.prisma.apprenant.count({ where: periodeApprenant }),
      this.prisma.utilisateur.count({ where: { role: 'PARENT', actif: true, ...(departement ? { parentLinks: { some: { apprenant: { departement } } } } : {}) } }),
      this.compterApprenantsAvecDecouverte(departement),
      this.prisma.decouverte.count({ where: periodeDecouverte }),
      this.prisma.recommandation.count({ where: periodeRecommandation }),
      this.prisma.preference.count({ where: periodePreference }),
      this.prisma.preference.count({ where: { ...periodePreference, valideParent: true } }),
      this.prisma.favori.count({ where: periodeFavori }),
      this.repartitionDepartement(departement),
      this.prisma.apprenant.groupBy({ by: ['palier'], where: { ...(departement ? { departement } : {}), palier: { not: null } }, _count: true }),
      this.prisma.apprenant.groupBy({ by: ['serie'], where: { ...(departement ? { departement } : {}), serie: { not: null } }, _count: true }),
      this.prisma.filiere.findMany({ where: { masquee: false }, select: { id: true, nom: true, type: true, description: true, domaines: true, sources: true, imageUrl: true } }),
      this.prisma.etablissement.count({ where: { actif: true, ...(departement ? { departement } : {}) } }),
      this.prisma.etablissement.count({ where: { actif: true, departement: { not: null }, commune: { not: null }, ...(departement ? { departement } : {}) } }),
      this.prisma.offreFormation.count({ where: { filiere: { masquee: false }, etablissement: { actif: true, ...(departement ? { departement } : {}) } } }),
      this.topFiliereRecommandations(debut, fin, departement),
      this.prisma.$queryRaw<LigneEvenement[]>(Prisma.sql`
        SELECT to_char("jour", 'YYYY-MM-DD') AS jour,
               "type"::text AS type, SUM("nombre")::int AS total
        FROM "evenements_usage"
        WHERE "jour" >= ${debut}::date AND "jour" < ${fin}::date
        GROUP BY 1, 2 ORDER BY 1, 2
      `),
      this.prisma.$queryRaw<LigneUsage[]>(Prisma.sql`
        SELECT "type"::text AS type, NULLIF("dimension", '') AS dimension, SUM("nombre")::int AS total
        FROM "evenements_usage"
        WHERE "jour" >= ${debut}::date AND "jour" < ${fin}::date
        GROUP BY 1, 2 ORDER BY total DESC
      `),
    ]);

    const manqueSource = filieres.filter((f) => !Array.isArray(f.sources) || f.sources.length === 0).length;
    const manqueDescription = filieres.filter((f) => !f.description?.trim()).length;
    const manqueImage = filieres.filter((f) => !f.imageUrl?.trim()).length;
    const manqueDomaine = filieres.filter((f) => f.domaines.length === 0).length;
    const couverture = (numerateur: number, denominateur: number) => denominateur ? Math.round((numerateur / denominateur) * 1000) / 10 : 0;

    return {
      periode,
      filtres: { departement: departement ?? null },
      synthese: {
        apprenants: totalApprenants,
        nouveauxApprenants,
        parentsActifs: totalParents,
        etablissementsActifs,
        filieresPubliees: filieres.length,
        offresFormationActives: offres,
      },
      parcours: {
        apprenantsAvecDecouverte,
        decouvertesEnregistrees: decouvertesSaisies,
        recommandationsCalculees: recommandations,
        preferencesEnregistrees: preferences,
        preferencesValideesParParent: preferencesValidees,
        favorisEnregistres: favoris,
        tauxDecouverte: couverture(apprenantsAvecDecouverte, totalApprenants),
        tauxValidationParent: couverture(preferencesValidees, preferences),
      },
      territoires: departements,
      repartition: {
        parPalier: parPalier.map((row) => ({ valeur: row.palier, total: row._count })),
        parSerie: parSerie.map((row) => ({ valeur: row.serie, total: row._count })),
      },
      qualiteCatalogue: {
        total: filieres.length,
        sansSource: manqueSource,
        sansDescription: manqueDescription,
        sansImage: manqueImage,
        sansDomaine: manqueDomaine,
        etablissementAvecDepartementEtCommune: etablissementsLocalises,
        tauxLocalisationEtablissement: couverture(etablissementsLocalises, etablissementsActifs),
      },
      filieresLesPlusRecommandees: topFilieres,
      usages: {
        sansIdentifiantVisiteur: true,
        sansTexteLibre: true,
        evenementsParJour: tendancesUsages,
        evenementsParTypeEtDimension: usagesParType,
      },
    };
  }

  async exporter(format: FormatExportStats, debut?: string, fin?: string, departement?: string) {
    const data = await this.getObservatoire(debut, fin, departement);
    if (format === 'csv') return this.csv(data);
    return this.xlsx(data);
  }

  private periode(debutBrut?: string, finBrut?: string) {
    const maintenant = new Date();
    const fin = finBrut ? this.dateJour(finBrut, 'fin') : new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), maintenant.getUTCDate() + 1));
    const debut = debutBrut ? this.dateJour(debutBrut, 'début') : new Date(fin.getTime() - 90 * 24 * 60 * 60 * 1000);
    if (debut >= fin) throw new BadRequestException('La date de début doit précéder la date de fin.');
    if (fin.getTime() - debut.getTime() > 3 * 366 * 24 * 60 * 60 * 1000) throw new BadRequestException('La période ne peut pas dépasser trois ans.');
    return { debut, fin, periode: { debut: debut.toISOString().slice(0, 10), fin: new Date(fin.getTime() - 1).toISOString().slice(0, 10) } };
  }

  private dateJour(value: string, label: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new BadRequestException(`La date ${label} doit respecter le format AAAA-MM-JJ.`);
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new BadRequestException(`La date ${label} est invalide.`);
    if (label === 'fin') date.setUTCDate(date.getUTCDate() + 1);
    return date;
  }

  private async repartitionDepartement(departement?: string) {
    const [apprenants, etablissements] = await Promise.all([
      this.prisma.apprenant.groupBy({ by: ['departement'], where: departement ? { departement } : undefined, _count: true }),
      this.prisma.etablissement.groupBy({ by: ['departement'], where: { actif: true, ...(departement ? { departement } : {}), departement: departement ?? { not: null } }, _count: true }),
    ]);
    const resultat = new Map<string, { departement: string; apprenants: number; etablissements: number }>();
    for (const item of apprenants) resultat.set(item.departement, { departement: item.departement, apprenants: item._count, etablissements: 0 });
    for (const item of etablissements) {
      const code = item.departement ?? 'Non renseigné';
      const ligne = resultat.get(code) ?? { departement: code, apprenants: 0, etablissements: 0 };
      ligne.etablissements = item._count;
      resultat.set(code, ligne);
    }
    return [...resultat.values()].sort((a, b) => a.departement.localeCompare(b.departement, 'fr'));
  }

  private async compterApprenantsAvecDecouverte(departement?: string) {
    const apprenants = await this.prisma.decouverte.groupBy({
      by: ['apprenantNip'],
      where: departement ? { apprenant: { departement } } : undefined,
    });
    return apprenants.length;
  }

  private async topFiliereRecommandations(debut: Date, fin: Date, departement?: string) {
    const regroupement = await this.prisma.recommandation.groupBy({
      by: ['filiereId'],
      where: { dateGeneration: { gte: debut, lt: fin }, ...(departement ? { apprenant: { departement } } : {}) },
      _count: true,
      orderBy: { _count: { filiereId: 'desc' } },
      take: 10,
    });
    if (!regroupement.length) return [];
    const filieres = await this.prisma.filiere.findMany({ where: { id: { in: regroupement.map((item) => item.filiereId) } }, select: { id: true, nom: true, type: true } });
    const parId = new Map(filieres.map((item) => [item.id, item]));
    return regroupement.map((item) => ({ ...(parId.get(item.filiereId) ?? { id: item.filiereId, nom: 'Filière archivée', type: null }), recommandations: item._count }));
  }

  private csv(data: Awaited<ReturnType<StatsService['getObservatoire']>>) {
    const lignes: string[][] = [
      ['Périmètre', 'Début de période', data.periode.debut],
      ['Périmètre', 'Fin de période', data.periode.fin],
      ['Périmètre', 'Département', data.filtres.departement ?? 'Tous les départements'],
      ['Périmètre', 'Export généré le (UTC)', new Date().toISOString()],
      ['Lecture', 'Note', 'Les effectifs et référentiels sont des stocks de la plateforme ; les événements sont filtrés sur la période. Ces données ne représentent pas la totalité des élèves du Bénin.'],
      ['Section', 'Indicateur', 'Valeur'],
    ];
    for (const [key, value] of Object.entries(data.synthese)) lignes.push(['Synthèse', key, String(value)]);
    for (const [key, value] of Object.entries(data.parcours)) lignes.push(['Parcours', key, String(value)]);
    for (const [key, value] of Object.entries(data.qualiteCatalogue)) lignes.push(['Qualité du catalogue', key, String(value)]);
    data.territoires.forEach((row) => lignes.push(['Territoires', row.departement, `apprenants=${row.apprenants}; établissements=${row.etablissements}`]));
    data.repartition.parPalier.forEach((row) => lignes.push(['Répartition par palier', row.valeur ?? 'Non renseigné', String(row.total)]));
    data.repartition.parSerie.forEach((row) => lignes.push(['Répartition par série', row.valeur ?? 'Non renseignée', String(row.total)]));
    data.usages.evenementsParJour.forEach((row) => lignes.push(['Usage par jour', `${row.jour} — ${row.type}`, String(row.total)]));
    data.usages.evenementsParTypeEtDimension.forEach((row) => lignes.push(['Usage par type', `${row.type} — ${row.dimension ?? 'sans dimension'}`, String(row.total)]));
    data.filieresLesPlusRecommandees.forEach((row) => lignes.push(['Filières recommandées', row.nom, String(row.recommandations)]));
    const echapper = (cellule: string) => {
      const texteSecurise = /^[\s]*[=+\-@]/.test(cellule) ? `'${cellule}` : cellule;
      return `"${texteSecurise.replace(/"/g, '""')}"`;
    };
    return `\uFEFF${lignes.map((ligne) => ligne.map(echapper).join(';')).join('\r\n')}`;
  }

  private async xlsx(data: Awaited<ReturnType<StatsService['getObservatoire']>>) {
    const classeur = new ExcelJS.Workbook();
    classeur.creator = 'Mon Orientation — Observatoire DGES';
    classeur.created = new Date();
    const ajouterTableau = (nom: string, lignes: (string | number | null)[][]) => {
      const feuille = classeur.addWorksheet(nom);
      feuille.addRows(lignes);
      feuille.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      feuille.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF176B4D' } };
      feuille.columns.forEach((column, index) => { column.width = Math.min(42, Math.max(16, ...feuille.getColumn(index + 1).values.map((v) => String(v ?? '').length + 2))); });
      feuille.views = [{ state: 'frozen', ySplit: 1 }];
    };
    ajouterTableau('Périmètre', [
      ['Champ', 'Valeur'],
      ['Début de période', data.periode.debut],
      ['Fin de période', data.periode.fin],
      ['Département', data.filtres.departement ?? 'Tous les départements'],
      ['Export généré le (UTC)', new Date().toISOString()],
      ['Lecture', 'Effectifs et référentiels : stocks actuels de la plateforme. Activité : période sélectionnée. Ces données ne représentent pas la totalité des élèves du Bénin.'],
    ]);
    ajouterTableau('Synthèse', [['Indicateur', 'Valeur'], ...Object.entries(data.synthese), ...Object.entries(data.parcours), ...Object.entries(data.qualiteCatalogue)]);
    ajouterTableau('Territoires', [['Département', 'Apprenants', 'Établissements'], ...data.territoires.map((row) => [row.departement, row.apprenants, row.etablissements])]);
    ajouterTableau('Usages', [['Jour', 'Type', 'Nombre'], ...data.usages.evenementsParJour.map((row) => [row.jour, row.type, row.total]), [], ['Type', 'Dimension', 'Nombre'], ...data.usages.evenementsParTypeEtDimension.map((row) => [row.type, row.dimension ?? '', row.total])]);
    ajouterTableau('Catalogue', [['Filière', 'Type', 'Recommandations'], ...data.filieresLesPlusRecommandees.map((row) => [row.nom, row.type ?? '', row.recommandations]), [], ['Qualité', 'Nombre'], ['Sans source', data.qualiteCatalogue.sansSource], ['Sans description', data.qualiteCatalogue.sansDescription], ['Sans image', data.qualiteCatalogue.sansImage], ['Sans domaine', data.qualiteCatalogue.sansDomaine]]);
    return Buffer.from(await classeur.xlsx.writeBuffer());
  }
}
