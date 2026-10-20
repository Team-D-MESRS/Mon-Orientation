'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { BarChart3, Download, FileSpreadsheet, Globe2, MapPinned, RefreshCw, Users, GraduationCap, Building2, BookOpenCheck, ClipboardList } from 'lucide-react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Button } from '@/components/ui/Button';
import { Alerte, Chargement } from '@/components/espace/ui';
import { statsApi, type StatsDepartement, type StatsObservatoire } from '@/lib/api';
import { TYPE_LABELS, type TypeFiliere } from '@/lib/filiere';
import { messageErreur } from '@/lib/erreurs';

function aujourdhui() { return new Date().toISOString().slice(0, 10); }
function debut90Jours() { const d = new Date(); d.setUTCDate(d.getUTCDate() - 89); return d.toISOString().slice(0, 10); }
function slugFichier(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
const CHAMP = 'rounded-bj-md border border-border bg-surface px-3v py-2v text-sm focus:outline-none focus:ring-2 focus:ring-bj-green/50';

function Observatoire() {
  const [debut, setDebut] = useState(debut90Jours);
  const [fin, setFin] = useState(aujourdhui);
  const [departement, setDepartement] = useState('');
  const [depts, setDepts] = useState<StatsDepartement[]>([]);
  const [data, setData] = useState<StatsObservatoire | null>(null);
  const [filtresAppliques, setFiltresAppliques] = useState<{ debut: string; fin: string; departement?: string }>({ debut: debut90Jours(), fin: aujourdhui() });
  const [chargement, setChargement] = useState(true);
  const [exportEnCours, setExportEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function charger(filtres = { debut, fin, departement }) {
    setChargement(true); setErreur(null);
    const params = { debut: filtres.debut, fin: filtres.fin, ...(filtres.departement ? { departement: filtres.departement } : {}) };
    try {
      const [observatoire, territoires] = await Promise.all([statsApi.getObservatoire(params), statsApi.getDepartements()]);
      setData(observatoire.data); setDepts(territoires.data); setFiltresAppliques(params);
    } catch (error) { setErreur(messageErreur(error)); }
    finally { setChargement(false); }
  }

  useEffect(() => { void charger({ debut: debut90Jours(), fin: aujourdhui(), departement: '' }); }, []);

  async function appliquer(event: FormEvent) {
    event.preventDefault();
    if (debut > fin) { setErreur('La date de début doit précéder ou égaler la date de fin.'); return; }
    await charger({ debut, fin, departement });
  }

  async function exporter(format: 'csv' | 'xlsx') {
    setExportEnCours(true); setErreur(null);
    try {
      const { data: blob } = await statsApi.exporter(format, filtresAppliques);
      const url = URL.createObjectURL(blob);
      const lien = document.createElement('a');
      lien.href = url;
      const territoire = filtresAppliques.departement ? slugFichier(filtresAppliques.departement) : 'tous-departements';
      lien.download = `observatoire-dges-${filtresAppliques.debut}-${filtresAppliques.fin}-${territoire}.${format}`;
      document.body.appendChild(lien); lien.click(); lien.remove(); URL.revokeObjectURL(url);
    } catch (error) { setErreur(messageErreur(error)); }
    finally { setExportEnCours(false); }
  }

  if (chargement && !data) return <div className="mo-container py-12v"><Chargement texte="Chargement de l’observatoire DGES…" /></div>;

  return (
    <div className="mo-container py-10v space-y-6v">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4v">
        <div><p className="mo-kicker">Direction générale de l’enseignement supérieur</p><h1 className="text-3xl md:text-4xl font-bold mt-2v">Observatoire de l’orientation</h1><p className="text-text-secondary mt-2v max-w-2xl">Vue agrégée des parcours sur la plateforme, de la couverture du catalogue et des usages consentis. Aucun dossier nominatif n’est affiché.</p></div>
        <div className="flex flex-wrap gap-2v"><Button variant="secondary" loading={exportEnCours} icon={<Download size={16} />} onClick={() => void exporter('csv')}>Exporter CSV</Button><Button variant="secondary" loading={exportEnCours} icon={<FileSpreadsheet size={16} />} onClick={() => void exporter('xlsx')}>Exporter XLSX</Button></div>
      </header>

      {erreur && <Alerte ton="erreur">{erreur}</Alerte>}
      <form onSubmit={appliquer} className="bj-card p-4v flex flex-col md:flex-row md:items-end gap-3v">
        <label className="grid gap-1v text-sm"><span className="font-medium">Du</span><input className={CHAMP} type="date" value={debut} max={fin || undefined} onChange={(e) => setDebut(e.target.value)} required /></label>
        <label className="grid gap-1v text-sm"><span className="font-medium">Au</span><input className={CHAMP} type="date" value={fin} min={debut || undefined} max={aujourdhui()} onChange={(e) => setFin(e.target.value)} required /></label>
        <label className="grid gap-1v text-sm flex-1"><span className="font-medium">Département</span><select className={CHAMP} value={departement} onChange={(e) => setDepartement(e.target.value)}><option value="">Tous les départements</option>{depts.map((d) => <option key={d.departement} value={d.departement}>{d.departement}</option>)}</select></label>
        <Button type="submit" loading={chargement} icon={<RefreshCw size={16} />}>Appliquer</Button>
      </form>

      {data && <>
        <Alerte ton="info"><strong>À lire avec prudence :</strong> période du {new Date(`${data.periode.debut}T00:00:00`).toLocaleDateString('fr-FR')} au {new Date(`${data.periode.fin}T00:00:00`).toLocaleDateString('fr-FR')}. Les filtres de date s’appliquent aux créations et activités datées ; les effectifs, répartitions et référentiels affichés sont des stocks actuels. Ces données décrivent Mon Orientation, pas l’ensemble des élèves du Bénin. Les données d’usage ne sont collectées qu’après consentement et aucun texte libre n’est stocké dans cette mesure.</Alerte>

        <section aria-label="Indicateurs principaux" className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3v">
          <Kpi titre="Dossiers apprenants" valeur={data.synthese.apprenants} icone={<Users size={18} />} note="Dossiers actuellement enregistrés dans le périmètre" />
          <Kpi titre="Nouveaux dossiers apprenants" valeur={data.synthese.nouveauxApprenants} icone={<GraduationCap size={18} />} note="Dossiers créés pendant la période sélectionnée" />
          <Kpi titre="Comptes parents actifs" valeur={data.synthese.parentsActifs} icone={<Users size={18} />} note="Comptes liés aux apprenants du périmètre choisi" />
          <Kpi titre="Établissements actifs" valeur={data.synthese.etablissementsActifs} icone={<Building2 size={18} />} note="Référentiel des établissements" />
          <Kpi titre="Filières publiées" valeur={data.synthese.filieresPubliees} icone={<BookOpenCheck size={18} />} note="Fiches visibles du catalogue" />
          <Kpi titre="Offres de formation actives" valeur={data.synthese.offresFormationActives} icone={<MapPinned size={18} />} note="Associations établissement–filière" />
        </section>

        <section className="grid lg:grid-cols-2 gap-4v">
          <div className="bj-card p-5v"><TitreSection icone={<ClipboardList size={18} />} titre="Parcours d’orientation" /><div className="grid sm:grid-cols-2 gap-3v mt-4v"><Mesure label="Dossiers avec questionnaire (stock actuel)" valeur={data.parcours.apprenantsAvecDecouverte} /><Mesure label="Questionnaires saisis sur la période" valeur={data.parcours.decouvertesEnregistrees} /><Mesure label="Recommandations générées sur la période" valeur={data.parcours.recommandationsCalculees} /><Mesure label="Préférences saisies sur la période" valeur={data.parcours.preferencesEnregistrees} /><Mesure label="Préférences de la période validées par un parent" valeur={data.parcours.preferencesValideesParParent} /><Mesure label="Favoris conservés, ajoutés sur la période" valeur={data.parcours.favorisEnregistres} /></div><p className="mt-2v text-xs text-text-muted">Ce compteur ne retrace pas les favoris retirés avant l’observation ; il porte sur ceux encore présents, filtrés par leur date de création.</p><div className="mt-4v grid sm:grid-cols-2 gap-3v"><Taux label="Dossiers avec une découverte (stock actuel)" valeur={data.parcours.tauxDecouverte} /><Taux label="Part des préférences de la période validées par un parent" valeur={data.parcours.tauxValidationParent} /></div></div>
          <div className="bj-card p-5v"><TitreSection icone={<BarChart3 size={18} />} titre="Répartition par palier scolaire" /><Barres items={data.repartition.parPalier.map((x) => ({ label: x.valeur ?? 'Non renseigné', valeur: x.total }))} max={Math.max(1, ...data.repartition.parPalier.map((x) => x.total))} /><p className="text-xs text-text-muted mt-3v">Effectifs actuels par niveau, tous âges confondus.</p><h3 className="font-semibold mt-5v mb-2v">Séries du baccalauréat</h3><Barres items={data.repartition.parSerie.map((x) => ({ label: x.valeur ?? 'Non renseignée', valeur: x.total }))} max={Math.max(1, ...data.repartition.parSerie.map((x) => x.total))} /></div>
        </section>

        <section className="grid lg:grid-cols-2 gap-4v">
          <div className="bj-card p-5v"><TitreSection icone={<Globe2 size={18} />} titre="Qualité et couverture du catalogue" /><div className="grid sm:grid-cols-2 gap-3v mt-4v"><Mesure label="Filières publiées" valeur={data.qualiteCatalogue.total} /><Mesure label="Sans source citée" valeur={data.qualiteCatalogue.sansSource} /><Mesure label="Sans description" valeur={data.qualiteCatalogue.sansDescription} /><Mesure label="Sans visuel dédié" valeur={data.qualiteCatalogue.sansImage} /><Mesure label="Sans domaine associé" valeur={data.qualiteCatalogue.sansDomaine} /><Mesure label="Établissements situés (commune + département)" valeur={data.qualiteCatalogue.etablissementAvecDepartementEtCommune} /></div><p className="mt-2v text-xs text-text-muted">Une image de domaine peut rester affichée en remplacement lorsqu’un visuel spécifique de filière manque.</p><Taux label="Couverture géographique des établissements actifs" valeur={data.qualiteCatalogue.tauxLocalisationEtablissement} /></div>
          <div className="bj-card p-5v"><TitreSection icone={<BookOpenCheck size={18} />} titre="Filières les plus recommandées" /><div className="mt-4v space-y-2v">{data.filieresLesPlusRecommandees.map((f) => <div key={f.id} className="flex items-center justify-between gap-3v border-b border-border pb-2v"><div><p className="font-medium">{f.nom}</p><p className="text-xs text-text-secondary">{f.type ? TYPE_LABELS[f.type as TypeFiliere] ?? f.type : 'Type non renseigné'}</p></div><strong className="text-bj-green tabular-nums">{f.recommandations.toLocaleString('fr-FR')}</strong></div>)}{data.filieresLesPlusRecommandees.length === 0 && <p className="text-sm text-text-secondary">Aucune recommandation observée sur cette période.</p>}</div></div>
        </section>

        <section className="grid lg:grid-cols-2 gap-4v">
          <div className="bj-card p-5v"><TitreSection icone={<MapPinned size={18} />} titre="Vue territoriale" /><div className="overflow-x-auto mt-4v"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left"><th className="py-2v">Département</th><th className="py-2v text-right">Apprenants</th><th className="py-2v text-right">Établissements</th></tr></thead><tbody>{data.territoires.map((d) => <tr key={d.departement} className="border-b border-border"><th scope="row" className="py-2v text-left font-medium">{d.departement}</th><td className="py-2v text-right tabular-nums">{d.apprenants.toLocaleString('fr-FR')}</td><td className="py-2v text-right tabular-nums">{d.etablissements.toLocaleString('fr-FR')}</td></tr>)}</tbody></table></div>{!data.territoires.length && <p className="mt-3v text-sm text-text-secondary">Aucune donnée territoriale pour ces filtres.</p>}</div>
          <div className="bj-card p-5v"><TitreSection icone={<BarChart3 size={18} />} titre="Usage du service (opt-in)" /><p className="text-xs text-text-secondary mt-2v">Événements agrégés, sans compte visiteur, recherche saisie ni message à Guido. Seuls les visiteurs ayant accepté la mesure sont comptés. Les événements n’ont pas de dimension géographique : ils couvrent tout le site même si un département est sélectionné.</p><Tendance items={data.usages.evenementsParJour.map((x) => ({ label: `${x.jour} · ${x.type}`, valeur: x.total }))} /><div className="mt-4v space-y-2v">{data.usages.evenementsParTypeEtDimension.map((u) => <div key={`${u.type}-${u.dimension}`} className="flex justify-between gap-3v text-sm"><span>{libelleEvenement(u.type)}{u.dimension ? ` · ${u.dimension}` : ''}</span><strong>{u.total.toLocaleString('fr-FR')}</strong></div>)}{data.usages.evenementsParTypeEtDimension.length === 0 && <p className="text-sm text-text-secondary">Aucun événement consenti sur cette période.</p>}</div></div>
        </section>
      </>}
    </div>
  );
}

function Kpi({ titre, valeur, icone, note }: { titre: string; valeur: number; icone: React.ReactNode; note: string }) { return <div className="bj-card p-4v"><div className="flex items-center gap-2v text-sm text-text-secondary">{icone}{titre}</div><strong className="block text-3xl font-bold mt-3v tabular-nums">{valeur.toLocaleString('fr-FR')}</strong><p className="text-xs text-text-muted mt-1v">{note}</p></div>; }
function TitreSection({ icone, titre }: { icone: React.ReactNode; titre: string }) { return <h2 className="font-bold flex items-center gap-2v">{icone}{titre}</h2>; }
function Mesure({ label, valeur }: { label: string; valeur: number }) { return <div className="rounded-bj-sm bg-surface-muted p-3v"><p className="text-xs text-text-secondary">{label}</p><p className="text-xl font-bold tabular-nums mt-1v">{valeur.toLocaleString('fr-FR')}</p></div>; }
function Taux({ label, valeur }: { label: string; valeur: number }) { return <div className="mt-4v"><div className="flex justify-between gap-3v text-sm"><span>{label}</span><strong>{valeur.toLocaleString('fr-FR')} %</strong></div><div className="h-2v rounded-full bg-surface-sunken mt-1v"><div className="h-2v rounded-full bg-bj-green" style={{ width: `${Math.min(100, Math.max(0, valeur))}%` }} /></div></div>; }
function Barres({ items, max }: { items: { label: string; valeur: number }[]; max: number }) { return <div className="space-y-3v mt-4v">{items.map((x) => <div key={x.label}><div className="flex justify-between gap-3v text-sm mb-1v"><span>{x.label}</span><strong className="tabular-nums">{x.valeur.toLocaleString('fr-FR')}</strong></div><div className="h-2v rounded-full bg-surface-sunken"><div className="h-2v rounded-full bg-bj-green" style={{ width: `${Math.min(100, x.valeur / max * 100)}%` }} /></div></div>)}</div>; }
function Tendance({ items }: { items: { label: string; valeur: number }[] }) { const max = Math.max(1, ...items.map((x) => x.valeur)); return <div className="mt-3v max-h-44 overflow-y-auto space-y-2v">{items.map((x) => <div key={x.label} className="grid grid-cols-[minmax(120px,1fr)_2fr_auto] gap-2v items-center text-xs"><span className="truncate">{x.label}</span><span className="h-2v rounded-full bg-surface-sunken"><span className="block h-2v rounded-full bg-bj-blue" style={{ width: `${Math.max(2, x.valeur / max * 100)}%` }} /></span><strong>{x.valeur}</strong></div>)}{!items.length && <p className="text-sm text-text-secondary">Aucun événement mesuré.</p>}</div>; }
function libelleEvenement(type: string) { return type === 'RECHERCHE_CATALOGUE' ? 'Recherche catalogue' : type === 'CONSULTATION_FILIERE' ? 'Consultation de fiche' : type === 'UTILISATION_GUIDO' ? 'Usage Guido' : type; }

export default function StatsPage() { return <RequireAuth roles={['DGES']}><Observatoire /></RequireAuth>; }
