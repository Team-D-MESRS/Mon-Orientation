'use client';

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, FilePlus2, History, Plus, RefreshCw, Save, Send, Trash2 } from 'lucide-react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Button } from '@/components/ui/Button';
import { Alerte, Chargement } from '@/components/espace/ui';
import { adminApi, mediaApi, type BrouillonAdmin, type EtablissementAdmin, type FiliereAdmin, type HistoriqueAdmin, type PageSiteAdmin, type TypeRessourceAdmin } from '@/lib/api';
import { messageErreur } from '@/lib/erreurs';
import { TYPE_LABELS, type Domaine, type NiveauAcces, type TypeFiliere } from '@/lib/filiere';

const TYPES_FILIERE: TypeFiliere[] = ['GENERALE', 'TECHNIQUE', 'TECHNIQUE_AGRICOLE', 'PROFESSIONNELLE', 'UNIVERSITE'];
const NIVEAUX: NiveauAcces[] = ['APRES_BEPC', 'APRES_BAC'];
const DOMAINES: Domaine[] = ['AGRICULTURE', 'ARTISANAT', 'ARTS', 'BTP', 'DROIT', 'ELECTRICITE', 'ENSEIGNEMENT', 'ENVIRONNEMENT', 'GESTION', 'INDUSTRIE', 'LETTRES', 'NUMERIQUE', 'SANTE', 'SCIENCES', 'SPORT', 'TOURISME'];
const TYPES_ETABLISSEMENT = ['UNIVERSITE', 'LYCEE_TECHNIQUE', 'LYCEE_AGRICOLE', 'ECOLE_METIER', 'AUTRE'];
const SLUGS_PAGES = ['accueil', 'faq', 'guide', 'contact'] as const;
const IMAGES_EXISTANTES = [
  '/images/card-agriculture.webp', '/images/card-artisanat.webp', '/images/card-arts.webp', '/images/card-btp.webp',
  '/images/card-droit.webp', '/images/card-electricite.webp', '/images/card-enseignement.webp', '/images/card-environnement.webp',
  '/images/card-gestion.webp', '/images/card-industrie.webp', '/images/card-numerique.webp', '/images/card-services.webp',
  '/images/card-sport.webp', '/images/card-tourisme.webp',
];
type Onglet = 'catalogue' | 'etablissements' | 'contenus' | 'brouillons' | 'historique';
type SectionForm = { titre: string; texte: string; lienLabel: string; lienUrl: string };
type FiliereForm = {
  id?: string; code: string; nom: string; type: TypeFiliere; niveauAcces: NiveauAcces | ''; description: string;
  diplomes: string; metiers: string; debouches: string; tauxInsertion: string; conditions: string; series: string;
  ouSeFormer: string; bourses: string; domaines: string; sources: string; imageUrl: string; videoUrl: string;
  quotaBourses: string; quotaAides: string; modeEntree: string; seriesRecommandees: string; matieresClassement: string;
  etablissementId: string; offreEtablissements: string[]; offresExistantes: Record<string, { duree: string | null; source: string }>;
  masquee: boolean; contenuMetier?: unknown; matieresCles?: unknown;
};
type EtablissementForm = {
  id?: string; code: string; educmasterId: string; nom: string; sigle: string; universite: string; type: string;
  departement: string; commune: string; quartier: string; internat: string; externat: string; capacite: string; actif: boolean;
  offresFilieres: string[]; offresExistantes: Record<string, { duree: string | null; source: string }>;
};

const CHAMP = 'w-full rounded-bj-md border border-border bg-surface px-3v py-2v text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-bj-green/50';
const LABEL = 'block text-sm font-medium mb-1v';
const PANEL = 'bj-card p-5v';
const split = (value: string) => value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
const lireTexte = (value: unknown) => typeof value === 'string' ? value : '';
const lireListe = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').join('\n') : '';
const lireObjets = (value: unknown) => Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null) : [];
const videFiliere = (): FiliereForm => ({ code: '', nom: '', type: 'TECHNIQUE', niveauAcces: 'APRES_BEPC', description: '', diplomes: '', metiers: '', debouches: '', tauxInsertion: '', conditions: '', series: '', ouSeFormer: '', bourses: '', domaines: '', sources: '', imageUrl: '', videoUrl: '', quotaBourses: '', quotaAides: '', modeEntree: '', seriesRecommandees: '', matieresClassement: '', etablissementId: '', offreEtablissements: [], offresExistantes: {}, masquee: false });
const videEtablissement = (): EtablissementForm => ({ code: '', educmasterId: '', nom: '', sigle: '', universite: '', type: 'LYCEE_TECHNIQUE', departement: '', commune: '', quartier: '', internat: '', externat: '', capacite: '', actif: true, offresFilieres: [], offresExistantes: {} });
const templateSections = (): SectionForm[] => [{ titre: '', texte: '', lienLabel: '', lienUrl: '' }];

function AdminGestion() {
  const router = useRouter();
  const [onglet, setOnglet] = useState<Onglet>('catalogue');
  const [filieres, setFilieres] = useState<FiliereAdmin[]>([]);
  const [etablissements, setEtablissements] = useState<EtablissementAdmin[]>([]);
  const [pages, setPages] = useState<PageSiteAdmin[]>([]);
  const [brouillons, setBrouillons] = useState<BrouillonAdmin[]>([]);
  const [historique, setHistorique] = useState<HistoriqueAdmin[]>([]);
  const [brouillonEnEdition, setBrouillonEnEdition] = useState<{ id: string; type: TypeRessourceAdmin } | null>(null);
  const [formFiliere, setFormFiliere] = useState<FiliereForm>(videFiliere());
  const [formEtablissement, setFormEtablissement] = useState<EtablissementForm>(videEtablissement());
  const [slugPage, setSlugPage] = useState<(typeof SLUGS_PAGES)[number]>('faq');
  const [titrePage, setTitrePage] = useState('');
  const [introPage, setIntroPage] = useState('');
  const [sectionsPage, setSectionsPage] = useState<SectionForm[]>(templateSections());
  const [ciblePageId, setCiblePageId] = useState<string | undefined>();
  const [archiverPage, setArchiverPage] = useState(false);
  const [filtre, setFiltre] = useState('');
  const [apercuId, setApercuId] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);
  const [action, setAction] = useState(false);
  const [mediaUpload, setMediaUpload] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  async function recharger() {
    setChargement(true);
    try {
      const [f, e, p, b, h] = await Promise.all([adminApi.catalogue(), adminApi.etablissements(), adminApi.pages(), adminApi.brouillons(), adminApi.historique()]);
      setFilieres(f.data);
      setEtablissements(e.data);
      setPages(p.data);
      setBrouillons(b.data);
      setHistorique(h.data);
      setErreur(null);
    } catch (error) { setErreur(messageErreur(error)); }
    finally { setChargement(false); }
  }

  async function televerserImage(file: File) {
    setErreur(null); setSucces(null); setMediaUpload(true);
    try {
      const resultat = await mediaApi.televerserImage(file);
      setFormFiliere((actuel) => ({ ...actuel, imageUrl: resultat.data.url }));
      setSucces('Image téléversée. Elle sera publiée avec le prochain brouillon de filière.');
    } catch (error) { setErreur(messageErreur(error)); }
    finally { setMediaUpload(false); }
  }

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('onglet');
    if (param && ['catalogue', 'etablissements', 'contenus', 'brouillons', 'historique'].includes(param)) setOnglet(param as Onglet);
    void recharger();
  }, []);

  const filieresFiltrees = useMemo(() => filieres.filter((f) => `${f.nom} ${f.code ?? ''} ${f.type}`.toLocaleLowerCase('fr').includes(filtre.toLocaleLowerCase('fr'))), [filieres, filtre]);
  const etablissementsFiltres = useMemo(() => etablissements.filter((e) => `${e.nom} ${e.sigle ?? ''} ${e.commune ?? ''} ${e.departement ?? ''}`.toLocaleLowerCase('fr').includes(filtre.toLocaleLowerCase('fr'))), [etablissements, filtre]);
  const pagesDisponibles = SLUGS_PAGES.filter((slug) => !pages.some((page) => page.slug === slug));

  function ouvrirFiliere(item?: FiliereAdmin) {
    if (!item) { setFormFiliere(videFiliere()); return; }
    setFormFiliere({
      id: item.id, code: item.code ?? '', nom: item.nom, type: item.type, niveauAcces: item.niveauAcces ?? '',
      description: item.description ?? '', diplomes: (item.diplomesDelivres ?? []).join('\n'), metiers: (item.metiersVises ?? []).join('\n'),
      debouches: item.debouches ?? '', tauxInsertion: item.tauxInsertion == null ? '' : String(item.tauxInsertion), conditions: item.conditionsAcces ?? '',
      series: (item.seriesAdmises ?? []).join('\n'), ouSeFormer: item.ouSeFormer ?? '', bourses: item.bourses == null ? '' : String(item.bourses),
      domaines: item.domaines.join('\n'), sources: (item.sources ?? []).map((s) => `${s.libelle} | ${s.url} | ${s.consulteLe} | ${s.officielle ? 'oui' : 'non'}`).join('\n'),
      imageUrl: item.imageUrl ?? '', videoUrl: item.videoUrl ?? '', quotaBourses: item.quotaBourses == null ? '' : String(item.quotaBourses),
      quotaAides: item.quotaAides == null ? '' : String(item.quotaAides), modeEntree: item.modeEntree ?? '', seriesRecommandees: item.seriesRecommandees ?? '',
      matieresClassement: item.matieresClassement ?? '', etablissementId: (item as FiliereAdmin & { etablissementId?: string | null }).etablissementId ?? '',
      offreEtablissements: item.offres.map((o) => o.etablissementId),
      offresExistantes: Object.fromEntries(item.offres.map((o) => [o.etablissementId, { duree: o.duree, source: o.source }])), masquee: item.masquee,
      contenuMetier: item.contenuMetier, matieresCles: (item as FiliereAdmin & { matieresCles?: unknown }).matieresCles,
    });
    document.getElementById('formulaire-filiere')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function ouvrirEtablissement(item?: EtablissementAdmin) {
    if (!item) { setFormEtablissement(videEtablissement()); return; }
    setFormEtablissement({
      id: item.id, code: item.code ?? '', educmasterId: item.educmasterId ?? '', nom: item.nom, sigle: item.sigle ?? '',
      universite: item.universite ?? '', type: item.type, departement: item.departement ?? '', commune: item.commune ?? '',
      quartier: item.quartier ?? '', internat: item.internat == null ? '' : String(item.internat), externat: item.externat == null ? '' : String(item.externat),
      capacite: item.capacite == null ? '' : String(item.capacite), actif: item.actif, offresFilieres: item.offres.map((o) => o.filiereId),
      offresExistantes: Object.fromEntries(item.offres.map((o) => [o.filiereId, { duree: o.duree, source: o.source }])),
    });
    document.getElementById('formulaire-etablissement')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function ouvrirPage(item?: PageSiteAdmin, slug?: (typeof SLUGS_PAGES)[number]) {
    if (item) {
      setCiblePageId(item.id); setSlugPage(item.slug as (typeof SLUGS_PAGES)[number]); setTitrePage(item.titre); setIntroPage(item.intro ?? '');
      setSectionsPage((item.sections ?? []).map((s) => ({ titre: s.titre, texte: s.paragraphes.join('\n\n'), lienLabel: s.lienLabel ?? '', lienUrl: s.lienUrl ?? '' })));
      setArchiverPage(item.statut === 'ARCHIVE');
    } else {
      const choix = slug ?? pagesDisponibles[0] ?? 'faq';
      setCiblePageId(undefined); setSlugPage(choix); setTitrePage(choix === 'accueil' ? 'Ton avenir commence ici' : choix.charAt(0).toUpperCase() + choix.slice(1)); setIntroPage(''); setSectionsPage(templateSections());
      setArchiverPage(false);
    }
    document.getElementById('formulaire-page')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function ouvrirBrouillon(brouillon: BrouillonAdmin) {
    const data = brouillon.payload;
    setBrouillonEnEdition({ id: brouillon.id, type: brouillon.type });
    setApercuId(null); setErreur(null); setSucces(null);

    if (brouillon.type === 'FILIERE') {
      const offres = lireObjets(data.offres);
      const sources = lireObjets(data.sources);
      const type = lireTexte(data.type) as TypeFiliere;
      const niveauAcces = lireTexte(data.niveauAcces) as NiveauAcces;
      setFormFiliere({
        ...videFiliere(), id: brouillon.cibleId ?? undefined,
        code: lireTexte(data.code), nom: lireTexte(data.nom),
        type: TYPES_FILIERE.includes(type) ? type : 'TECHNIQUE',
        niveauAcces: NIVEAUX.includes(niveauAcces) ? niveauAcces : '',
        description: lireTexte(data.description), diplomes: lireListe(data.diplomesDelivres), metiers: lireListe(data.metiersVises),
        debouches: lireTexte(data.debouches), tauxInsertion: data.tauxInsertion == null ? '' : String(data.tauxInsertion),
        conditions: lireTexte(data.conditionsAcces), series: lireListe(data.seriesAdmises), ouSeFormer: lireTexte(data.ouSeFormer),
        bourses: data.bourses == null ? '' : String(data.bourses), domaines: lireListe(data.domaines),
        sources: sources.map((source) => `${lireTexte(source.libelle)} | ${lireTexte(source.url)} | ${lireTexte(source.consulteLe)} | ${source.officielle === true ? 'oui' : 'non'}`).join('\n'),
        imageUrl: lireTexte(data.imageUrl), videoUrl: lireTexte(data.videoUrl),
        quotaBourses: data.quotaBourses == null ? '' : String(data.quotaBourses), quotaAides: data.quotaAides == null ? '' : String(data.quotaAides),
        modeEntree: lireTexte(data.modeEntree), seriesRecommandees: lireTexte(data.seriesRecommandees), matieresClassement: lireTexte(data.matieresClassement),
        etablissementId: lireTexte(data.etablissementId),
        offreEtablissements: offres.map((offre) => lireTexte(offre.etablissementId)).filter(Boolean),
        offresExistantes: Object.fromEntries(offres.map((offre) => [lireTexte(offre.etablissementId), { duree: offre.duree == null ? null : lireTexte(offre.duree), source: lireTexte(offre.source) }])),
        masquee: data.masquee === true, contenuMetier: data.contenuMetier, matieresCles: data.matieresCles,
      });
      setOnglet('catalogue');
      router.replace('/admin/gestion?onglet=catalogue', { scroll: false });
      window.requestAnimationFrame(() => document.getElementById('formulaire-filiere')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      return;
    }

    if (brouillon.type === 'ETABLISSEMENT') {
      const offres = lireObjets(data.offres);
      setFormEtablissement({
        id: brouillon.cibleId ?? undefined, code: lireTexte(data.code), educmasterId: lireTexte(data.educmasterId),
        nom: lireTexte(data.nom), sigle: lireTexte(data.sigle), universite: lireTexte(data.universite),
        type: lireTexte(data.type) || 'LYCEE_TECHNIQUE', departement: lireTexte(data.departement), commune: lireTexte(data.commune),
        quartier: lireTexte(data.quartier), internat: data.internat == null ? '' : String(data.internat), externat: data.externat == null ? '' : String(data.externat),
        capacite: data.capacite == null ? '' : String(data.capacite), actif: data.actif !== false,
        offresFilieres: offres.map((offre) => lireTexte(offre.filiereId)).filter(Boolean),
        offresExistantes: Object.fromEntries(offres.map((offre) => [lireTexte(offre.filiereId), { duree: offre.duree == null ? null : lireTexte(offre.duree), source: lireTexte(offre.source) }])),
      });
      setOnglet('etablissements');
      router.replace('/admin/gestion?onglet=etablissements', { scroll: false });
      window.requestAnimationFrame(() => document.getElementById('formulaire-etablissement')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      return;
    }

    const sections = lireObjets(data.sections).map((section) => ({
      titre: lireTexte(section.titre),
      texte: Array.isArray(section.paragraphes) ? section.paragraphes.filter((item): item is string => typeof item === 'string').join('\n\n') : '',
      lienLabel: lireTexte(section.lienLabel), lienUrl: lireTexte(section.lienUrl),
    }));
    const slug = lireTexte(data.slug) as (typeof SLUGS_PAGES)[number];
    setCiblePageId(brouillon.cibleId ?? undefined);
    setSlugPage(SLUGS_PAGES.includes(slug) ? slug : 'faq');
    setTitrePage(lireTexte(data.titre)); setIntroPage(lireTexte(data.intro));
    setSectionsPage(sections.length ? sections : templateSections()); setArchiverPage(data.statut === 'ARCHIVE');
    setOnglet('contenus');
    router.replace('/admin/gestion?onglet=contenus', { scroll: false });
    window.requestAnimationFrame(() => document.getElementById('formulaire-page')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  async function sauvegarderBrouillon(type: TypeRessourceAdmin, payload: Record<string, unknown>, cibleId?: string) {
    if (brouillonEnEdition && brouillonEnEdition.type !== type) throw new Error('Annule la reprise du brouillon avant de changer de type de ressource.');
    const edition = brouillonEnEdition;
    if (edition) await adminApi.modifierBrouillon(edition.id, payload);
    else await adminApi.creerBrouillon(type, payload, cibleId);
    setBrouillonEnEdition(null);
    return Boolean(edition);
  }

  async function enregistrerFiliere(event: FormEvent) {
    event.preventDefault(); setAction(true); setErreur(null); setSucces(null);
    try {
      const sources = formFiliere.sources.split('\n').map((ligne) => ligne.split('|').map((part) => part.trim())).filter((parts) => parts.length >= 3 && parts[0] && parts[1]).map(([libelle, url, consulteLe, officielle]) => ({ libelle, url, consulteLe, officielle: officielle?.toLowerCase() === 'oui' }));
      const payload: Record<string, unknown> = {
        code: formFiliere.code || null, nom: formFiliere.nom, type: formFiliere.type, niveauAcces: formFiliere.niveauAcces || null,
        description: formFiliere.description || null, diplomesDelivres: split(formFiliere.diplomes), metiersVises: split(formFiliere.metiers),
        debouches: formFiliere.debouches || null, tauxInsertion: formFiliere.tauxInsertion ? Number(formFiliere.tauxInsertion) : null,
        conditionsAcces: formFiliere.conditions || null, seriesAdmises: split(formFiliere.series), ouSeFormer: formFiliere.ouSeFormer || null,
        bourses: formFiliere.bourses === '' ? null : formFiliere.bourses === 'true', sources, domaines: split(formFiliere.domaines),
        quotaBourses: formFiliere.quotaBourses ? Number(formFiliere.quotaBourses) : null, quotaAides: formFiliere.quotaAides ? Number(formFiliere.quotaAides) : null,
        modeEntree: formFiliere.modeEntree || null, seriesRecommandees: formFiliere.seriesRecommandees || null, matieresClassement: formFiliere.matieresClassement || null,
        etablissementId: formFiliere.etablissementId || null, imageUrl: formFiliere.imageUrl || null, videoUrl: formFiliere.videoUrl || null,
       masquee: formFiliere.masquee, contenuMetier: formFiliere.contenuMetier ?? null, matieresCles: formFiliere.matieresCles ?? null,
        offres: formFiliere.offreEtablissements.map((etablissementId) => ({ etablissementId, duree: formFiliere.offresExistantes[etablissementId]?.duree ?? null, source: formFiliere.offresExistantes[etablissementId]?.source ?? 'Console Admin' })),
      };
      const modification = await sauvegarderBrouillon('FILIERE', payload, formFiliere.id);
      setSucces(modification ? 'Brouillon de filière mis à jour. Prévisualise-le avant publication.' : 'Brouillon de filière enregistré. Prévisualise-le avant publication.'); await recharger();
    } catch (error) { setErreur(messageErreur(error)); }
    finally { setAction(false); }
  }

  async function enregistrerEtablissement(event: FormEvent) {
    event.preventDefault(); setAction(true); setErreur(null); setSucces(null);
    try {
      const payload: Record<string, unknown> = {
        code: formEtablissement.code || null, educmasterId: formEtablissement.educmasterId || null, nom: formEtablissement.nom,
        sigle: formEtablissement.sigle || null, universite: formEtablissement.universite || null, type: formEtablissement.type,
        departement: formEtablissement.departement || null, commune: formEtablissement.commune || null, quartier: formEtablissement.quartier || null,
        internat: formEtablissement.internat === '' ? null : formEtablissement.internat === 'true', externat: formEtablissement.externat === '' ? null : formEtablissement.externat === 'true',
        capacite: formEtablissement.capacite ? Number(formEtablissement.capacite) : null, actif: formEtablissement.actif,
        offres: formEtablissement.offresFilieres.map((filiereId) => ({ filiereId, duree: formEtablissement.offresExistantes[filiereId]?.duree ?? null, source: formEtablissement.offresExistantes[filiereId]?.source ?? 'Console Admin' })),
      };
      const modification = await sauvegarderBrouillon('ETABLISSEMENT', payload, formEtablissement.id);
      setSucces(modification ? 'Brouillon d’établissement mis à jour. Prévisualise-le avant publication.' : 'Brouillon d’établissement enregistré. Prévisualise-le avant publication.'); await recharger();
    } catch (error) { setErreur(messageErreur(error)); }
    finally { setAction(false); }
  }

  async function enregistrerPage(event: FormEvent) {
    event.preventDefault(); setAction(true); setErreur(null); setSucces(null);
    try {
      const payload: Record<string, unknown> = {
        slug: slugPage, titre: titrePage, intro: introPage || null,
        statut: archiverPage ? 'ARCHIVE' : 'PUBLIE',
        sections: sectionsPage.filter((s) => s.titre.trim()).map((s) => ({
          titre: s.titre.trim(), paragraphes: s.texte.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
          lienLabel: s.lienLabel || null, lienUrl: s.lienUrl || null,
        })),
      };
      const modification = await sauvegarderBrouillon('PAGE_SITE', payload, ciblePageId);
      setSucces(modification ? 'Brouillon éditorial mis à jour. Prévisualise-le avant publication.' : 'Brouillon éditorial enregistré. Prévisualise-le avant publication.'); await recharger();
    } catch (error) { setErreur(messageErreur(error)); }
    finally { setAction(false); }
  }

  async function publier(id: string) {
    if (!window.confirm('Publier maintenant cette version sur le site ?')) return;
    setAction(true); setErreur(null); setSucces(null);
    try { await adminApi.publier(id); setApercuId(null); setSucces('Version publiée. L’ancienne version reste dans l’historique.'); await recharger(); }
    catch (error) { setErreur(messageErreur(error)); }
    finally { setAction(false); }
  }
  async function supprimer(id: string) {
    if (!window.confirm('Supprimer ce brouillon non publié ?')) return;
    setAction(true); setErreur(null);
    try { await adminApi.supprimerBrouillon(id); setSucces('Brouillon supprimé.'); await recharger(); }
    catch (error) { setErreur(messageErreur(error)); }
    finally { setAction(false); }
  }
  async function restaurer(id: string) {
    setAction(true); setErreur(null); setSucces(null);
    try { await adminApi.restaurer(id); setSucces('Une nouvelle ébauche de restauration est prête dans l’onglet Brouillons.'); await recharger(); setOnglet('brouillons'); }
    catch (error) { setErreur(messageErreur(error)); }
    finally { setAction(false); }
  }

  if (chargement) return <div className="mo-container py-10v"><Chargement texte="Chargement des contenus…" /></div>;
  const onglets: { id: Onglet; label: string }[] = [
    { id: 'catalogue', label: `Filières (${filieres.length})` },
    { id: 'etablissements', label: `Établissements (${etablissements.length})` },
    { id: 'contenus', label: `Pages (${pages.length})` },
    { id: 'brouillons', label: `Brouillons (${brouillons.filter((b) => b.etat === 'BROUILLON').length})` },
    { id: 'historique', label: 'Historique' },
  ];

  return (
    <div className="mo-container py-8v space-y-6v">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3v">
        <div><p className="mo-kicker">Administration · édition contrôlée</p><h1 className="text-3xl font-bold mt-2v">Atelier de gestion</h1><p className="text-text-secondary mt-2v">Chaque modification passe par un brouillon, un aperçu puis une publication explicite.</p></div>
        <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={() => void recharger()}>Actualiser</Button>
      </header>
      <div className="flex flex-wrap gap-2v border-b border-border" role="tablist" aria-label="Sections d’administration">
        {onglets.map((item) => <button key={item.id} role="tab" aria-selected={onglet === item.id} disabled={Boolean(brouillonEnEdition && item.id !== onglet)} onClick={() => { setOnglet(item.id); router.replace(`/admin/gestion?onglet=${item.id}`, { scroll: false }); }} className={`px-3v py-2v text-sm font-medium border-b-2 disabled:cursor-not-allowed disabled:opacity-50 ${onglet === item.id ? 'border-bj-green text-bj-green' : 'border-transparent text-text-secondary hover:text-text'}`}>{item.label}</button>)}
      </div>
      {brouillonEnEdition && <div className="flex flex-wrap items-center justify-between gap-3v rounded-bj-md border border-bj-blue/30 bg-bj-blue/5 p-3v text-sm"><p>Modification du brouillon {brouillonEnEdition.type}. Les autres onglets sont temporairement verrouillés pour éviter d’enregistrer le mauvais type de fiche.</p><Button size="sm" variant="secondary" onClick={() => setBrouillonEnEdition(null)}>Annuler la reprise</Button></div>}
      {erreur && <Alerte ton="erreur">{erreur}</Alerte>}{succes && <Alerte ton="succes">{succes}</Alerte>}

      {onglet === 'catalogue' && <section className="grid xl:grid-cols-[minmax(0,1fr)_minmax(400px,0.9fr)] gap-5v">
        <div className={PANEL}>
          <div className="flex flex-wrap items-center justify-between gap-3v"><div><h2 className="text-xl font-bold">Filières</h2><p className="text-sm text-text-secondary">Les fiches masquées restent consultables par lien direct.</p></div><Button disabled={Boolean(brouillonEnEdition)} onClick={() => ouvrirFiliere()} icon={<Plus size={16} />}>Nouvelle fiche</Button></div>
          <label className="block mt-4v"><span className={LABEL}>Rechercher</span><input className={CHAMP} value={filtre} onChange={(e) => setFiltre(e.target.value)} placeholder="Nom, code ou type" /></label>
          <div className="mt-4v max-h-[75vh] overflow-auto divide-y divide-border">
            {filieresFiltrees.map((f) => <div key={f.id} className="py-3v flex items-start justify-between gap-3v"><div><p className="font-semibold">{f.nom}{f.masquee && <span className="ml-2 text-xs text-bj-ochre">Archivée</span>}</p><p className="text-xs text-text-secondary">{TYPE_LABELS[f.type] ?? f.type} · {f.niveauAcces ?? 'Niveau non renseigné'} · {f.code ?? 'sans code'}</p></div><Button size="sm" variant="secondary" disabled={Boolean(brouillonEnEdition)} onClick={() => ouvrirFiliere(f)}>Préparer une version</Button></div>)}
          </div>
        </div>
        <form id="formulaire-filiere" className={`${PANEL} space-y-4v`} onSubmit={enregistrerFiliere}>
          <div><p className="mo-kicker">Brouillon de catalogue</p><h2 className="text-xl font-bold mt-1v">{formFiliere.id ? 'Modifier une filière' : 'Créer une filière'}</h2></div>
          <div className="grid sm:grid-cols-2 gap-3v"><Champ label="Nom" required><input className={CHAMP} required value={formFiliere.nom} onChange={(e) => setFormFiliere({ ...formFiliere, nom: e.target.value })} /></Champ><Champ label="Code"><input className={CHAMP} value={formFiliere.code} onChange={(e) => setFormFiliere({ ...formFiliere, code: e.target.value })} /></Champ>
            <Champ label="Type"><select className={CHAMP} value={formFiliere.type} onChange={(e) => setFormFiliere({ ...formFiliere, type: e.target.value as TypeFiliere })}>{TYPES_FILIERE.map((t) => <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>)}</select></Champ>
            <Champ label="Niveau d’accès"><select className={CHAMP} value={formFiliere.niveauAcces} onChange={(e) => setFormFiliere({ ...formFiliere, niveauAcces: e.target.value as NiveauAcces | '' })}><option value="">Non précisé</option>{NIVEAUX.map((n) => <option key={n} value={n}>{n === 'APRES_BEPC' ? 'Après le BEPC' : 'Après le bac'}</option>)}</select></Champ>
          </div>
          <Champ label="Description"><textarea className={CHAMP} rows={4} value={formFiliere.description} onChange={(e) => setFormFiliere({ ...formFiliere, description: e.target.value })} /></Champ>
          <div className="grid sm:grid-cols-2 gap-3v"><Champ label="Diplômes délivrés (un par ligne)"><textarea className={CHAMP} rows={3} value={formFiliere.diplomes} onChange={(e) => setFormFiliere({ ...formFiliere, diplomes: e.target.value })} /></Champ><Champ label="Métiers visés (un par ligne)"><textarea className={CHAMP} rows={3} value={formFiliere.metiers} onChange={(e) => setFormFiliere({ ...formFiliere, metiers: e.target.value })} /></Champ></div>
          <Champ label="Conditions d’accès"><textarea className={CHAMP} rows={3} value={formFiliere.conditions} onChange={(e) => setFormFiliere({ ...formFiliere, conditions: e.target.value })} /></Champ>
          <div className="grid sm:grid-cols-2 gap-3v"><Champ label="Séries admises (une par ligne)"><textarea className={CHAMP} rows={2} value={formFiliere.series} onChange={(e) => setFormFiliere({ ...formFiliere, series: e.target.value })} /></Champ><Champ label="Domaines (un code par ligne)"><textarea className={CHAMP} rows={2} value={formFiliere.domaines} onChange={(e) => setFormFiliere({ ...formFiliere, domaines: e.target.value })} placeholder={DOMAINES.join('\n')} /></Champ></div>
          <Champ label="Débouchés"><textarea className={CHAMP} rows={3} value={formFiliere.debouches} onChange={(e) => setFormFiliere({ ...formFiliere, debouches: e.target.value })} /></Champ>
          <Champ label="Où se former (complément textuel)"><textarea className={CHAMP} rows={2} value={formFiliere.ouSeFormer} onChange={(e) => setFormFiliere({ ...formFiliere, ouSeFormer: e.target.value })} /></Champ>
          <div className="grid sm:grid-cols-2 gap-3v"><Champ label="Visuel livré avec le site"><select className={CHAMP} value={IMAGES_EXISTANTES.includes(formFiliere.imageUrl) ? formFiliere.imageUrl : ''} onChange={(e) => setFormFiliere({ ...formFiliere, imageUrl: e.target.value })}><option value="">Visuel automatique selon le domaine</option>{IMAGES_EXISTANTES.map((image) => <option key={image} value={image}>{image.replace('/images/', '')}</option>)}</select></Champ><Champ label="Vidéo (URL)" ><input className={CHAMP} value={formFiliere.videoUrl} onChange={(e) => setFormFiliere({ ...formFiliere, videoUrl: e.target.value })} placeholder="https://…" /></Champ></div>
          <Champ label="Chemin ou URL d’image personnalisée"><input className={CHAMP} value={formFiliere.imageUrl} onChange={(e) => setFormFiliere({ ...formFiliere, imageUrl: e.target.value })} placeholder="/images/card-agriculture.webp ou https://…" /><small className="text-text-muted">Tu peux choisir un visuel déjà livré, saisir une URL hébergée ou envoyer un nouveau fichier ci-dessous.</small></Champ>
          <Champ label="Envoyer un nouveau visuel (JPEG, PNG ou WebP ; 8 Mo maximum)"><input type="file" accept="image/jpeg,image/png,image/webp" disabled={mediaUpload} className={CHAMP} onChange={(e) => { const fichier = e.currentTarget.files?.[0]; if (fichier) void televerserImage(fichier); e.currentTarget.value = ''; }} /><small className="text-text-muted">L’envoi nécessite la configuration MinIO/S3 de l’environnement de production. {mediaUpload ? 'Téléversement en cours…' : ''}</small></Champ>
          {formFiliere.imageUrl && <img src={formFiliere.imageUrl} alt="Aperçu du visuel de la filière" className="max-h-44 rounded-bj-md object-cover" />}
          <Champ label="Sources (une par ligne : libellé | URL | date consultée | officielle oui/non)"><textarea className={CHAMP} rows={4} value={formFiliere.sources} onChange={(e) => setFormFiliere({ ...formFiliere, sources: e.target.value })} placeholder="Guide MESRS | https://… | 2026-10-01 | oui" /></Champ>
          <div className="grid sm:grid-cols-3 gap-3v"><Champ label="Taux d’insertion (%)"><input type="number" min="0" max="100" step="0.1" className={CHAMP} value={formFiliere.tauxInsertion} onChange={(e) => setFormFiliere({ ...formFiliere, tauxInsertion: e.target.value })} /></Champ><Champ label="Quota bourses"><input type="number" min="0" className={CHAMP} value={formFiliere.quotaBourses} onChange={(e) => setFormFiliere({ ...formFiliere, quotaBourses: e.target.value })} /></Champ><Champ label="Quota aides"><input type="number" min="0" className={CHAMP} value={formFiliere.quotaAides} onChange={(e) => setFormFiliere({ ...formFiliere, quotaAides: e.target.value })} /></Champ></div>
          <div className="grid sm:grid-cols-2 gap-3v"><Champ label="Mode d’entrée"><input className={CHAMP} value={formFiliere.modeEntree} onChange={(e) => setFormFiliere({ ...formFiliere, modeEntree: e.target.value })} /></Champ><Champ label="Séries recommandées"><input className={CHAMP} value={formFiliere.seriesRecommandees} onChange={(e) => setFormFiliere({ ...formFiliere, seriesRecommandees: e.target.value })} /></Champ></div>
          <Champ label="Matières de classement"><input className={CHAMP} value={formFiliere.matieresClassement} onChange={(e) => setFormFiliere({ ...formFiliere, matieresClassement: e.target.value })} /></Champ>
          <Champ label="Établissement de référence"><select className={CHAMP} value={formFiliere.etablissementId} onChange={(e) => setFormFiliere({ ...formFiliere, etablissementId: e.target.value })}><option value="">Aucun établissement unique</option>{etablissements.filter((e) => e.actif).map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}</select></Champ>
          <Champ label="Lieux proposant cette filière"><select className={`${CHAMP} min-h-32`} multiple value={formFiliere.offreEtablissements} onChange={(e) => setFormFiliere({ ...formFiliere, offreEtablissements: Array.from(e.target.selectedOptions).map((o) => o.value) })}>{etablissements.filter((e) => e.actif).map((e) => <option key={e.id} value={e.id}>{e.nom} — {e.commune ?? 'commune non renseignée'}</option>)}</select><small className="text-text-muted">Utilise Ctrl/Cmd pour sélectionner plusieurs lieux. Les sources et durées des offres conservées ne sont pas modifiées.</small></Champ>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formFiliere.bourses === 'true'} onChange={(e) => setFormFiliere({ ...formFiliere, bourses: e.target.checked ? 'true' : 'false' })} />Bourse disponible</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formFiliere.masquee} onChange={(e) => setFormFiliere({ ...formFiliere, masquee: e.target.checked })} />Archiver / masquer cette fiche après publication</label>
          <Button type="submit" loading={action} icon={<Save size={16} />}>{brouillonEnEdition ? 'Enregistrer les modifications du brouillon' : 'Enregistrer comme brouillon'}</Button>
        </form>
      </section>}

      {onglet === 'etablissements' && <section className="grid xl:grid-cols-[minmax(0,1fr)_minmax(400px,0.9fr)] gap-5v">
        <div className={PANEL}><div className="flex items-center justify-between gap-3v"><div><h2 className="text-xl font-bold">Établissements</h2><p className="text-sm text-text-secondary">Gestion de fiches, pas de profils de connexion.</p></div><Button disabled={Boolean(brouillonEnEdition)} onClick={() => ouvrirEtablissement()} icon={<Plus size={16} />}>Nouvel établissement</Button></div>
          <label className="block mt-4v"><span className={LABEL}>Rechercher</span><input className={CHAMP} value={filtre} onChange={(e) => setFiltre(e.target.value)} placeholder="Nom, commune ou département" /></label>
          <div className="mt-4v max-h-[75vh] overflow-auto divide-y divide-border">{etablissementsFiltres.map((e) => <div key={e.id} className="py-3v flex items-start justify-between gap-3v"><div><p className="font-semibold">{e.nom}{!e.actif && <span className="ml-2 text-xs text-bj-ochre">Archivé</span>}</p><p className="text-xs text-text-secondary">{e.commune ?? 'Commune à renseigner'} · {e.departement ?? 'Département à renseigner'} · {e.offres.length} offre(s)</p></div><Button size="sm" variant="secondary" disabled={Boolean(brouillonEnEdition)} onClick={() => ouvrirEtablissement(e)}>Modifier</Button></div>)}</div>
        </div>
        <form id="formulaire-etablissement" className={`${PANEL} space-y-4v`} onSubmit={enregistrerEtablissement}>
          <div><p className="mo-kicker">Brouillon référentiel</p><h2 className="text-xl font-bold mt-1v">{formEtablissement.id ? 'Modifier un établissement' : 'Créer un établissement'}</h2></div>
          <div className="grid sm:grid-cols-2 gap-3v"><Champ label="Nom" required><input className={CHAMP} required value={formEtablissement.nom} onChange={(e) => setFormEtablissement({ ...formEtablissement, nom: e.target.value })} /></Champ><Champ label="Sigle"><input className={CHAMP} value={formEtablissement.sigle} onChange={(e) => setFormEtablissement({ ...formEtablissement, sigle: e.target.value })} /></Champ><Champ label="Code interne"><input className={CHAMP} value={formEtablissement.code} onChange={(e) => setFormEtablissement({ ...formEtablissement, code: e.target.value })} /></Champ><Champ label="Identifiant EducMaster"><input className={CHAMP} value={formEtablissement.educmasterId} onChange={(e) => setFormEtablissement({ ...formEtablissement, educmasterId: e.target.value })} /></Champ><Champ label="Type"><select className={CHAMP} value={formEtablissement.type} onChange={(e) => setFormEtablissement({ ...formEtablissement, type: e.target.value })}>{TYPES_ETABLISSEMENT.map((t) => <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>)}</select></Champ><Champ label="Université de rattachement"><input className={CHAMP} value={formEtablissement.universite} onChange={(e) => setFormEtablissement({ ...formEtablissement, universite: e.target.value })} /></Champ><Champ label="Département"><input className={CHAMP} value={formEtablissement.departement} onChange={(e) => setFormEtablissement({ ...formEtablissement, departement: e.target.value })} /></Champ><Champ label="Commune"><input className={CHAMP} value={formEtablissement.commune} onChange={(e) => setFormEtablissement({ ...formEtablissement, commune: e.target.value })} /></Champ><Champ label="Quartier"><input className={CHAMP} value={formEtablissement.quartier} onChange={(e) => setFormEtablissement({ ...formEtablissement, quartier: e.target.value })} /></Champ><Champ label="Capacité"><input type="number" min="0" className={CHAMP} value={formEtablissement.capacite} onChange={(e) => setFormEtablissement({ ...formEtablissement, capacite: e.target.value })} /></Champ><Champ label="Internat"><select className={CHAMP} value={formEtablissement.internat} onChange={(e) => setFormEtablissement({ ...formEtablissement, internat: e.target.value })}><option value="">Non renseigné</option><option value="true">Oui</option><option value="false">Non</option></select></Champ><Champ label="Externat"><select className={CHAMP} value={formEtablissement.externat} onChange={(e) => setFormEtablissement({ ...formEtablissement, externat: e.target.value })}><option value="">Non renseigné</option><option value="true">Oui</option><option value="false">Non</option></select></Champ></div>
          <Champ label="Formations proposées"><select className={`${CHAMP} min-h-40`} multiple value={formEtablissement.offresFilieres} onChange={(e) => setFormEtablissement({ ...formEtablissement, offresFilieres: Array.from(e.target.selectedOptions).map((o) => o.value) })}>{filieres.filter((f) => !f.masquee).map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}</select><small className="text-text-muted">Sélection multiple avec Ctrl/Cmd. Les sources et durées des offres conservées ne sont pas modifiées.</small></Champ>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formEtablissement.actif} onChange={(e) => setFormEtablissement({ ...formEtablissement, actif: e.target.checked })} />Établissement actif (décocher pour l’archiver à la publication)</label>
          <Button type="submit" loading={action} icon={<Save size={16} />}>{brouillonEnEdition ? 'Enregistrer les modifications du brouillon' : 'Enregistrer comme brouillon'}</Button>
        </form>
      </section>}

      {onglet === 'contenus' && <section className="grid xl:grid-cols-[minmax(0,1fr)_minmax(400px,0.9fr)] gap-5v">
        <div className={PANEL}><div className="flex items-center justify-between gap-3v"><div><h2 className="text-xl font-bold">Pages éditoriales</h2><p className="text-sm text-text-secondary">Accueil, FAQ, guide et contact.</p></div>{pagesDisponibles.length > 0 && <Button disabled={Boolean(brouillonEnEdition)} onClick={() => ouvrirPage(undefined, pagesDisponibles[0])} icon={<FilePlus2 size={16} />}>Créer une page</Button>}</div>
          <div className="mt-4v divide-y divide-border">{pages.map((p) => <div key={p.id} className="py-3v flex items-center justify-between gap-3v"><div><p className="font-semibold">{p.titre}</p><p className="text-xs text-text-secondary">/{p.slug} · {p.statut === 'PUBLIE' ? 'Publié' : p.statut === 'ARCHIVE' ? 'Archivé' : 'Brouillon'}</p></div><Button size="sm" variant="secondary" disabled={Boolean(brouillonEnEdition)} onClick={() => ouvrirPage(p)}>Éditer une version</Button></div>)}{pages.length === 0 && <p className="py-4v text-sm text-text-secondary">Aucune page CMS n’est publiée. Les versions actuelles codées dans le site restent visibles tant qu’une page CMS n’est pas publiée.</p>}</div>
        </div>
        <form id="formulaire-page" className={`${PANEL} space-y-4v`} onSubmit={enregistrerPage}>
          <div><p className="mo-kicker">CMS éditorial</p><h2 className="text-xl font-bold mt-1v">{ciblePageId ? 'Préparer une nouvelle version' : 'Créer une page'}</h2><p className="text-sm text-text-secondary mt-1v">Le contenu publié remplacera le contenu statique de la route correspondante. Les textes sont rendus comme du texte sûr, sans HTML exécutable.</p></div>
          <Champ label="Route"><select className={CHAMP} value={slugPage} disabled={Boolean(ciblePageId)} onChange={(e) => setSlugPage(e.target.value as (typeof SLUGS_PAGES)[number])}>{(ciblePageId ? SLUGS_PAGES : pagesDisponibles).map((s) => <option key={s} value={s}>/{s}</option>)}</select></Champ>
          <Champ label="Titre" required><input className={CHAMP} required value={titrePage} onChange={(e) => setTitrePage(e.target.value)} /></Champ>
          <Champ label="Introduction"><textarea className={CHAMP} rows={3} value={introPage} onChange={(e) => setIntroPage(e.target.value)} /></Champ>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={archiverPage} onChange={(e) => setArchiverPage(e.target.checked)} />Archiver cette page après publication (elle ne sera plus servie par le CMS)</label>
          {sectionsPage.map((section, index) => <div key={index} className="rounded-bj-md border border-border p-3v space-y-3v"><div className="flex items-center justify-between"><strong className="text-sm">Section {index + 1}</strong><Button size="sm" variant="ghost" onClick={() => setSectionsPage(sectionsPage.filter((_, i) => i !== index))} aria-label={`Supprimer la section ${index + 1}`}><Trash2 size={15} /></Button></div><Champ label="Titre de section"><input className={CHAMP} value={section.titre} onChange={(e) => setSectionsPage(sectionsPage.map((s, i) => i === index ? { ...s, titre: e.target.value } : s))} /></Champ><Champ label="Paragraphes (séparer par une ligne vide)"><textarea className={CHAMP} rows={5} value={section.texte} onChange={(e) => setSectionsPage(sectionsPage.map((s, i) => i === index ? { ...s, texte: e.target.value } : s))} /></Champ><div className="grid sm:grid-cols-2 gap-3v"><Champ label="Libellé du lien"><input className={CHAMP} value={section.lienLabel} onChange={(e) => setSectionsPage(sectionsPage.map((s, i) => i === index ? { ...s, lienLabel: e.target.value } : s))} /></Champ><Champ label="URL interne ou HTTPS"><input className={CHAMP} value={section.lienUrl} onChange={(e) => setSectionsPage(sectionsPage.map((s, i) => i === index ? { ...s, lienUrl: e.target.value } : s))} /></Champ></div></div>)}
          <Button variant="secondary" onClick={() => setSectionsPage([...sectionsPage, { titre: '', texte: '', lienLabel: '', lienUrl: '' }])} icon={<Plus size={16} />}>Ajouter une section</Button>
          <Button type="submit" loading={action} icon={<Save size={16} />}>{brouillonEnEdition ? 'Enregistrer les modifications du brouillon' : 'Enregistrer comme brouillon'}</Button>
        </form>
      </section>}

      {onglet === 'brouillons' && <section className="space-y-4v"><div className={PANEL}><h2 className="text-xl font-bold">Brouillons à vérifier</h2><p className="text-sm text-text-secondary mt-1v">La publication rend le changement visible sur le site. Vérifie le résumé avant de confirmer.</p></div>
        {brouillons.filter((b) => b.etat === 'BROUILLON').map((b) => <article key={b.id} className={`${PANEL} space-y-3v`}><div className="flex flex-wrap items-start justify-between gap-3v"><div><p className="text-xs uppercase tracking-wide text-bj-green">{libelleType(b.type)} · brouillon</p><h3 className="text-lg font-bold mt-1v">{b.titre}</h3><p className="text-xs text-text-secondary">Préparé par {b.auteur ? `${b.auteur.prenom} ${b.auteur.nom}` : 'Administrateur'} · {new Date(b.updatedAt).toLocaleString('fr-FR')}</p></div><div className="flex flex-wrap gap-2v"><Button size="sm" variant="secondary" onClick={() => ouvrirBrouillon(b)} icon={<FilePlus2 size={15} />}>Modifier</Button><Button size="sm" variant="secondary" onClick={() => setApercuId(apercuId === b.id ? null : b.id)} icon={<Eye size={15} />}>{apercuId === b.id ? 'Masquer l’aperçu' : 'Aperçu'}</Button><Button size="sm" onClick={() => void publier(b.id)} loading={action} icon={<Send size={15} />}>Publier</Button><Button size="sm" variant="ghost" onClick={() => void supprimer(b.id)} loading={action} aria-label="Supprimer le brouillon"><Trash2 size={15} /></Button></div></div>{apercuId === b.id && <Apercu brouillon={b} />}</article>)}
        {brouillons.every((b) => b.etat !== 'BROUILLON') && <div className={PANEL}>Aucun brouillon en attente.</div>}
      </section>}

      {onglet === 'historique' && <section className={PANEL}><h2 className="text-xl font-bold">Historique et restauration</h2><p className="text-sm text-text-secondary mt-1v mb-4v">La restauration crée un nouveau brouillon : l’Admin doit le prévisualiser et le publier.</p><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b border-border"><th className="py-2v pr-3v">Date</th><th className="py-2v pr-3v">Ressource</th><th className="py-2v pr-3v">Action</th><th className="py-2v pr-3v">Auteur</th><th className="py-2v">Avant</th><th /></tr></thead><tbody>{historique.map((h) => <tr key={h.id} className="border-b border-border"><td className="py-3v pr-3v whitespace-nowrap">{new Date(h.createdAt).toLocaleString('fr-FR')}</td><td className="py-3v pr-3v">{libelleType(h.type)} · {h.cibleId.slice(0, 8)}</td><td className="py-3v pr-3v">{h.action}</td><td className="py-3v pr-3v">{h.auteur.prenom} {h.auteur.nom}</td><td className="py-3v pr-3v">{h.avant ? resumePayload(h.avant) : '—'}</td><td className="py-3v text-right">{h.avant && <Button size="sm" variant="secondary" loading={action} onClick={() => void restaurer(h.id)} icon={<History size={14} />}>Restaurer</Button>}</td></tr>)}</tbody></table></div>{historique.length === 0 && <p className="mt-4v text-sm text-text-secondary">L’historique apparaîtra après la première modification.</p>}</section>}
    </div>
  );
}

function Champ({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) { return <label className="block"><span className={LABEL}>{label}{required && <span aria-hidden="true"> *</span>}</span>{children}</label>; }
function libelleType(type: TypeRessourceAdmin) { return type === 'FILIERE' ? 'Filière' : type === 'ETABLISSEMENT' ? 'Établissement' : 'Page éditoriale'; }
function resumePayload(payload: Record<string, unknown>) { return String(payload.nom ?? payload.titre ?? payload.slug ?? 'Version précédente'); }
function Apercu({ brouillon }: { brouillon: BrouillonAdmin }) {
  const data = brouillon.payload;
  const sections = Array.isArray(data.sections) ? data.sections as { titre?: string; paragraphes?: string[] }[] : [];
  return <div className="rounded-bj-md bg-surface-muted p-4v border border-border" aria-label="Aperçu du brouillon">
    <h4 className="font-bold">Aperçu : {String(data.titre ?? data.nom ?? brouillon.titre)}</h4>
    {typeof data.intro === 'string' && <p className="mt-2v text-sm">{data.intro}</p>}
    {typeof data.description === 'string' && <p className="mt-2v text-sm">{data.description}</p>}
    {typeof data.imageUrl === 'string' && data.imageUrl && <img src={data.imageUrl} alt="Aperçu du visuel" className="mt-3v max-h-48 rounded-bj-md object-cover" />}
    {sections.map((section, index) => <section key={index} className="mt-3v"><h5 className="font-semibold">{section.titre}</h5>{section.paragraphes?.map((p, i) => <p key={i} className="text-sm mt-1v">{p}</p>)}</section>)}
    <details className="mt-3v"><summary className="cursor-pointer text-xs text-text-secondary">Voir les champs techniques de cette version</summary><pre className="mt-2v max-h-56 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(data, null, 2)}</pre></details>
  </div>;
}

export default function AdminGestionPage() { return <RequireAuth roles={['ADMIN']}><AdminGestion /></RequireAuth>; }
