#!/usr/bin/env python3
"""
Extrait les répertoires officiels des lycées techniques (MESRS / DESTFP, PDF conservés hors dépôt)
vers un fichier JSON lu par le seed : établissements publics et offre de formation de chacun.

Usage : python3 extraire-repertoires-eftp.py <REPERTOIRE_LTP.pdf> <REPERTOIRE_LTA.pdf> <sortie.json> [--controle]
Dépendance : pdfplumber.

Deux difficultés des tableaux, traitées ici sans jamais deviner :

1. Les libellés d'identité (département, commune, quartier, lycée, durée) sont CENTRÉS dans leur
   bloc : « NATITINGOU » est écrit au milieu des lignes de son établissement, pas en face de la
   première. On découpe donc la page en segments atomiques, puis on fusionne les segments voisins
   tant que chaque colonne d'identité garde au plus une valeur — le bloc obtenu est l'établissement.

2. Les colonnes FORMATION et FILIERES sont centrées de la même façon, mais varient légitimement
   dans un même établissement : la géométrie seule ne suffit pas à rattacher une spécialité à son
   diplôme. On croise donc la géométrie avec les listes officielles du communiqué N°0902 (offre
   2026-2027). En cas de contradiction entre les deux, le script s'arrête.

Ce que les documents disent est repris tel quel. Le champ `type` (LYCEE_PRO / LYCEE_TECHNIQUE /
ECOLE_METIER) est un classement de l'équipe, comme `domaines` dans le référentiel.
"""
import collections
import json
import re
import sys
import unicodedata

import pdfplumber

CONSULTE_LE = '2026-09-16'
URL_SOURCE = 'https://www.enseignementsuperieur.gouv.bj'
SOURCES = {
    'LTP': 'MESRS / DESTFP — Répertoire des lycées techniques professionnels',
    'LTA': 'MESRS / DESTFP — Répertoire des lycées techniques agricoles',
}

IDENTITE = ('departement', 'commune', 'quatier', 'lycees', 'duree de formation')
OBLIGATOIRES = {'departement', 'commune', 'lycees', 'formation', 'filieres', 'specialites'}
EN_TETES = {'departement', 'commune', 'quatier', 'quartier', 'lycees', 'formation', 'filieres',
            'specialites', 'duree de formation'}

# Intitulés de la colonne « FORMATION » → (code, libellé du diplôme)
DIPLOMES = {
    'bac techno': ('BAC_TECHNO', 'Baccalauréat technologique'),
    'dtm': ('DTM', 'Diplôme de technicien aux métiers (DTM)'),
    'dt': ('DT', 'Diplôme de technicien (DT)'),
    'de': ('DE', "Diplôme d'État"),
}
LIBELLE_DIPLOME = {code: libelle for code, libelle in DIPLOMES.values()}
FILIERES = {
    'stag': 'Sciences et techniques administratives et de gestion',
    'sti': 'Sciences et techniques industrielles',
    'sta': 'Sciences et techniques agricoles',
    'stms': 'Sciences et techniques médico-sociales',
}
TYPES = [(r'^efms', 'ECOLE_METIER'), (r'^lta|^lams', 'LYCEE_TECHNIQUE'), (r'^ltp|^lyteb', 'LYCEE_PRO')]

# Offre officielle 2026-2027 (communiqué N°0902 du MESRS) : motif reconnaissant l'intitulé du
# répertoire → diplôme. Sert de contrôle de la géométrie, et de recours quand la cellule est vide.
OFFRE_OFFICIELLE = [
    ('BAC_TECHNO', r'\((?:F[1-4]|G[1-3]|ea)\)'),                    # séries du baccalauréat technologique
    ('DE', r'hygieniste'),
    ('DT', r'mecano-soudes|mode et du vetement|mode-vetements|developpeur d.applications|programmeur systeme'
           r'|producteur multimedia|fabrication mecanique|tourisme \(accueil'),
    ('DTM', r'accueil touristique|metier d.electricite|metiers de l.electricite|energie|froid sanitaire'
            r'|maintenance electronique|reseau et secu|reseaux et secu|voitures particulieres|gros .?uvre'
            r'|geometre|technicien d.etude|fabrication des equipements en bois|qualite de l.eau'
            r'|aviculture|horticulture|elevage|production|arboriculture|pisciculture|halieutique'
            r'|racines et de tubercules|plantes a fibres|cerealieres'),
]
# Filière déduite de la spécialité quand la cellule est vide. Le vocabulaire des répertoires est
# fermé (STAG, STI, STMS côté LTP ; STA pour tout le LTA) : STI s'obtient donc par élimination.
# Tout désaccord avec la géométrie arrête le script.
FILIERE_OFFICIELLE = [
    ('stms', r'hygieniste'),
    ('stag', r'\(g[1-3]\)|comptabilite|secretariat|gestion commerciale'),
]

# Communes absentes de la colonne « département » du répertoire LTP (case vide p. 2) et introuvables
# dans le répertoire LTA : rattachement explicite, à vérifier avec le ministère.
DEPARTEMENT_COMMUNE = {'parakou': 'BORGOU'}

# Mots en capitales dans les répertoires, donc sans accents : accent rétabli après mise en minuscules
ACCENTS = {
    'electrotechnique': 'électrotechnique', 'electronique': 'électronique', 'electricite': 'électricité',
    'energie': 'énergie', 'energies': 'énergies', 'mecanique': 'mécanique', 'mecano-soudes': 'mécano-soudés',
    'genie': 'génie', 'secretariat': 'secrétariat', 'comptabilite': 'comptabilité', 'geometre': 'géomètre',
    'realisation': 'réalisation', 'developpeur': 'développeur', 'systeme': 'système', 'elevage': 'élevage',
    'cerealieres': 'céréalières', 'legumineuses': 'légumineuses', 'fruitiere': 'fruitière',
    'forestiere': 'forestière', 'vivriere': 'vivrière', 'oleagineuses': 'oléagineuses',
    'hygieniste': 'hygiéniste', 'etude': 'étude', 'etudes': 'études', 'equipements': 'équipements',
    'securite': 'sécurité', 'reseau': 'réseau', 'particulieres': 'particulières', 'metier': 'métier',
    'metiers': 'métiers', 'vetement': 'vêtement', 'a': 'à', 'batiment': 'bâtiment',
    'multimedia': 'multimédia', 'halieutique': 'halieutique',
    'secuirte': 'sécurité',                   # coquille du répertoire LTP (« SECUIRTE INFORMATIQUE »)
}
# Accents des toponymes, absents des répertoires écrits en capitales : orthographe d'usage, à
# confirmer par le ministère. Clés sous forme normalisée (cle()).
NOMS_PROPRES = {
    'oueme': 'Ouémé', 'come': 'Comè', 'pobe': 'Pobè', 'adja-ouere': 'Adja-Ouèrè', 'bebereke': 'Bèbèrèkè',
    'klouekanmey': 'Klouékanmey', 'abomey calavi': 'Abomey-Calavi', 'akodeha': 'Akodéha', 'sekou': 'Sékou',
}
# Sigles présents dans les noms d'établissements : ils restent en capitales, contrairement aux
# noms de lieux écrits eux aussi en capitales (PARAKOU, BANIKOARA…).
SIGLES_NOMS = {'LTP', 'LTA', 'LAMS', 'EFMS', 'LYTEB', 'ASBA', 'THR', 'EFS'}
ELISIONS = {'de', 'du', 'des', 'd', 'la', 'le', 'et'}
ROMAINS = {'I', 'II', 'III', 'IV', 'V'}
ACCENTS_RE = re.compile(r'\b(?:%s)\b' % '|'.join(sorted(map(re.escape, ACCENTS), key=len, reverse=True)), re.I)


def sans_accents(t):
    return ''.join(c for c in unicodedata.normalize('NFD', t) if unicodedata.category(c) != 'Mn')


def cle(t):
    return sans_accents(re.sub(r'\s+', ' ', (t or '').replace('’', "'").replace('–', '-')).strip()).lower()


def une_ligne(t):
    return re.sub(r'\s+', ' ', (t or '').replace('\n', ' ')).strip()


def slug(t, taille=40):
    s = re.sub(r'[^A-Z0-9]+', '-', sans_accents(t).upper()).strip('-')
    return s[:taille].rstrip('-')


def accentue(t):
    return ACCENTS_RE.sub(lambda m: ACCENTS[m.group(0).lower()], t)


def en_phrase(t):
    """« GENIE CIVIL (F4) » → « Génie civil (F4) ». Dans ces répertoires, tous les sigles et séries
    sont entre parenthèses : c'est ce qui les distingue des mots écrits en capitales."""
    t = re.sub(r'(?<=[^\s(])\(', ' (', une_ligne(t))      # « ASSAINISSEMENT(EA) » → « … (EA) »
    mots = []
    for mot in t.split(' '):
        nu = mot.strip('()')
        if nu and '(' in mot and nu.isalnum() and nu.isupper() and len(nu) <= 5:
            mots.append(mot)                              # (G2), (F3), (EA), (CEMS), (MMV), (FM)
        else:
            mots.append(accentue(mot.lower()))
    phrase = ' '.join(mots)
    return phrase[:1].upper() + phrase[1:]


def mot_propre(mot):
    """Un mot d'un nom de lieu. Ce qui n'est pas tout en capitales vient déjà bien écrit du
    répertoire (« Kandi », « Pobè », « d'Akassato ») et n'est pas retouché."""
    ouvrant = mot[:len(mot) - len(mot.lstrip('('))]
    fermant = mot[len(mot.rstrip(')')):]
    nu = mot.strip('()')
    if not nu:
        return mot
    if nu.upper() in SIGLES_NOMS or nu in ROMAINS:
        corps = nu.upper()
    elif cle(nu) in NOMS_PROPRES:
        corps = NOMS_PROPRES[cle(nu)]
    elif not nu.isupper():
        corps = nu
    elif cle(nu) in ELISIONS:
        corps = nu.lower()
    else:
        corps = '-'.join(p[:1].upper() + p[1:].lower() for p in nu.split('-'))
    return ouvrant + corps + fermant


def en_nom_propre(t):
    """« PORTO-NOVO » → « Porto-Novo », « OUEME » → « Ouémé », « LTA D'AKODEHA » → « LTA d'Akodéha »."""
    t = re.sub(r'-\s+', '-', une_ligne(t))
    return NOMS_PROPRES.get(cle(t)) or re.sub(r"[^\s']+", lambda m: mot_propre(m.group(0)), t)


def nom_etablissement(t):
    """« LTA DE KPATABA » → « LTA de Kpataba », « LTP THR(EFS d'Akassato) » → « LTP THR (EFS d'Akassato) »."""
    return en_nom_propre(re.sub(r'(?<=[^\s(])\(', ' (', une_ligne(t)))


def quartier_lisible(t):
    """Adresse libre : recomposée seulement si le répertoire l'a écrite entièrement en capitales ;
    celles déjà rédigées (« 1ère rue à gauche après WINNER… ») sont laissées intactes."""
    t = re.sub(r'\(\s+', '(', re.sub(r'(?<=[^\s(])\(', ' (', une_ligne(t)))
    lettres = [c for c in t if c.isalpha()]
    if lettres and all(c.isupper() for c in lettres):
        t = re.sub(r"[^\s']+", lambda m: mot_propre(m.group(0)), t)
    return t[:1].upper() + t[1:]


def suite(valeur):
    """Fragment de texte coupé par le PDF (« et Internat) », « (Longitude : … ») plutôt qu'une valeur."""
    return bool(valeur) and (valeur[0].islower() or valeur[0] in '(,')


def _u(t):
    return une_ligne(t).upper()


def chevauchent(a, b):
    """Deux lectures du même libellé : « AKODEHA » et « AKODEHA (MONGONHOUI) », ou deux moitiés qui
    se recouvrent (« ADJA-OUERE CENTRE (OKE- » et « CENTRE (OKE- ODAN) »)."""
    ka, kb = _u(a), _u(b)
    if not ka or not kb or ka in kb or kb in ka:
        return True
    return any(ka.endswith(kb[:n]) or kb.endswith(ka[:n]) for n in range(min(len(ka), len(kb)), 3, -1))


def fusionner(a, b):
    """« ADJA-OUERE CENTRE (OKE- » + « CENTRE (OKE- ODAN) » → « ADJA-OUERE CENTRE (OKE- ODAN) »."""
    ka, kb = _u(a), _u(b)
    if not ka:
        return b
    if not kb or kb in ka:
        return a
    if ka in kb:
        return b
    for n in range(min(len(ka), len(kb)), 3, -1):
        if ka.endswith(kb[:n]):
            return une_ligne(a) + b[n:]
    return a


def colonnes_de(page, table):
    """Index de chaque colonne d'après son en-tête, et cellules (haut, bas, texte) de chacune."""
    spans, index = {}, {}
    for i in range(len(table.rows[0].cells)):
        cellules = []
        for row in table.rows:
            boite = row.cells[i]
            if boite is not None:
                cellules.append((boite[1], boite[3], une_ligne(page.crop(boite).extract_text() or '')))
        titre = cle(next((t for _, _, t in cellules if t), ''))
        if titre in EN_TETES:
            index[titre] = i
            spans[titre] = [c for c in cellules if cle(c[2]) not in EN_TETES]
    return index, spans


def couvrant(cellules, y):
    """Texte de la cellule couvrant l'ordonnée y ; la plus petite si plusieurs se chevauchent."""
    candidats = [(bas - haut, t) for haut, bas, t in cellules if haut - 0.5 <= y <= bas + 0.5]
    return min(candidats)[1] if candidats else ''


def blocs(spans, segments):
    """Fusionne les segments voisins tant que chaque colonne d'identité garde au plus une valeur.
    Un bloc = un établissement, quelle que soit la place du libellé dans sa hauteur."""
    sortie = []
    for segment in segments:
        valeurs = {c: couvrant(spans.get(c, []), sum(segment) / 2) for c in IDENTITE}
        if sortie and compatible(sortie[-1], valeurs):
            for c, v in valeurs.items():
                if not v:
                    continue
                if suite(v):                                  # fragment : recollé s'il apporte du texte
                    if sortie[-1][c] and _u(v) not in _u(sortie[-1][c]):
                        sortie[-1][c] += ' ' + v
                else:
                    sortie[-1][c] = fusionner(sortie[-1][c], v)
            sortie[-1]['bas'] = segment[1]
        else:
            bloc = {c: ('' if suite(v) else v) for c, v in valeurs.items()}
            bloc.update(haut=segment[0], bas=segment[1])
            sortie.append(bloc)
    return sortie


def compatible(bloc, valeurs):
    """Le segment rejoint le bloc tant qu'aucune colonne d'identité n'y prend une valeur vraiment
    différente — deux lectures qui se chevauchent désignent le même établissement."""
    for c, v in valeurs.items():
        if v and not suite(v) and bloc[c] and not chevauchent(bloc[c], v):
            return False
    return True


def diplome_officiel(specialite):
    k = cle(specialite)
    trouves = [code for code, motif in OFFRE_OFFICIELLE if re.search(motif, k, re.I)]
    return trouves[0] if trouves else None


def filiere_officielle(specialite, origine):
    if origine == 'LTA':
        return 'sta'                          # colonne FILIERES du répertoire agricole : STA partout
    for code, motif in FILIERE_OFFICIELLE:
        if re.search(motif, cle(specialite), re.I):
            return code
    return 'sti'                              # ni médico-social ni gestion : industriel par élimination


def resoudre(champ, geometrie, officiel, page, specialite, conflits):
    """Valeur lue dans le tableau, sinon déduite des listes officielles. Un désaccord est fatal."""
    if geometrie and officiel and geometrie != officiel:
        conflits.append((page, specialite, champ, geometrie, officiel))
    return geometrie or officiel, 'géométrie' if geometrie else 'liste officielle'


def extraire(chemin, origine):
    """Une entrée par spécialité, avec son établissement (par blocs) et son diplôme (géométrie + listes)."""
    lignes, conflits = [], []
    with pdfplumber.open(chemin) as pdf:
        for n, page in enumerate(pdf.pages, start=1):
            tableaux = page.find_tables()
            if not tableaux:
                raise SystemExit(f'{chemin} p. {n} : aucun tableau détecté')
            for table in tableaux:
                index, spans = colonnes_de(page, table)
                manquantes = OBLIGATOIRES - set(index)
                if manquantes:
                    raise SystemExit(f'{chemin} p. {n} : colonnes introuvables {sorted(manquantes)}')
                bornes = sorted({y for c in spans.values() for haut, bas, _ in c for y in (haut, bas)})
                segments = list(zip(bornes, bornes[1:]))
                for bloc in blocs(spans, segments):
                    for haut, bas, specialite in spans['specialites']:
                        if not specialite or not (bloc['haut'] - 0.5 <= (haut + bas) / 2 <= bloc['bas'] + 0.5):
                            continue
                        milieu = (haut + bas) / 2
                        lu = cle(couvrant(spans['filieres'], milieu))
                        diplome, issu = resoudre(
                            'diplôme', DIPLOMES.get(cle(couvrant(spans['formation'], milieu)), (None,))[0],
                            diplome_officiel(specialite), n, specialite, conflits)
                        filiere, issu_filiere = resoudre(
                            'filière', lu if lu in FILIERES else None,
                            filiere_officielle(specialite, origine), n, specialite, conflits)
                        lignes.append(dict(
                            origine=origine, page=n, specialite=specialite,
                            diplome=diplome, issuDe=issu, issuDeFiliere=issu_filiere,
                            filiere=filiere,
                            departement=bloc['departement'], commune=bloc['commune'],
                            quartier=bloc['quatier'], lycee=bloc['lycees'],
                            duree=bloc['duree de formation'],
                        ))
    if conflits:
        details = '\n'.join(f'  p. {p} « {s} » : {c} — tableau {g}, communiqué {o}' for p, s, c, g, o in conflits)
        raise SystemExit(f'{chemin} : rattachements contradictoires\n{details}')
    return lignes


def internat(nom):
    """« LTP Kandi (Externat) » → (« LTP Kandi », externat, internat) : utile à un élève éloigné."""
    m = re.search(r'\(([^()]*(?:xternat|nternat)[^()]*)\)?\s*$', nom)
    if not m:
        return une_ligne(nom), None, None
    modes = cle(m.group(1))
    return une_ligne(nom[:m.start()]), 'externat' in modes, 'internat' in modes


def type_etablissement(nom):
    for motif, type_ in TYPES:
        if re.search(motif, cle(nom)):
            return type_
    raise SystemExit(f'Type d’établissement inconnu : {nom}')


def normaliser(lignes):
    # Index commune → département construit sur les blocs renseignés, pour combler la case vide du LTP
    index = {cle(l['commune']): l['departement'] for l in lignes if l['departement'] and l['commune']}
    etablissements, offres = {}, []
    for l in lignes:
        departement = l['departement'] or index.get(cle(l['commune'])) or DEPARTEMENT_COMMUNE.get(cle(l['commune']), '')
        for champ, valeur in (('departement', departement), ('commune', l['commune']),
                              ('lycee', l['lycee']), ('diplome', l['diplome']), ('filiere', l['filiere'])):
            if not valeur:
                raise SystemExit(f'{l["origine"]} p. {l["page"]} : « {l["specialite"]} » sans {champ}')
        nom, ext, inter = internat(l['lycee'])
        code = slug(nom, 30)
        affiche = nom_etablissement(nom)
        etab = etablissements.setdefault(code, dict(
            code=code, nom=affiche, type=type_etablissement(nom),
            departement=en_nom_propre(departement), commune=en_nom_propre(l['commune']),
            quartier=quartier_lisible(re.sub(r'\(?(Longitude|Latitude).*', '', l['quartier'])).strip(' ,(') or None,
            externat=ext, internat=inter,
        ))
        if cle(etab['nom']) != cle(affiche):
            raise SystemExit(f'Code {code} partagé par « {etab["nom"]} » et « {affiche} »')
        filiere = FILIERES.get(cle(l['filiere']))
        if not filiere:
            raise SystemExit(f'Filière inconnue : « {l["filiere"]} » ({nom})')
        serie = re.search(r'\((F[1-4]|G[1-3]|EA)\)', l['specialite'])
        offres.append(dict(
            etablissement=code, diplome=l['diplome'], diplomeLibelle=LIBELLE_DIPLOME[l['diplome']],
            filiere=cle(l['filiere']).upper(), filiereLibelle=filiere,
            specialite=en_phrase(l['specialite']), serie=serie.group(1) if serie else None,
            duree=une_ligne(l['duree']).lower() or None, issuDe=l['issuDe'], issuDeFiliere=l['issuDeFiliere'],
            origine=l['origine'], page=l['page'],
        ))
    uniques, vues = [], set()
    for o in offres:
        k = (o['etablissement'], o['diplome'], cle(o['specialite']))
        if k not in vues:
            vues.add(k)
            uniques.append(o)
    return etablissements, uniques


def main():
    if len(sys.argv) < 4:
        raise SystemExit(__doc__)
    ltp, lta, sortie = sys.argv[1], sys.argv[2], sys.argv[3]
    lignes = extraire(ltp, 'LTP') + extraire(lta, 'LTA')
    etablissements, offres = normaliser(lignes)
    if not etablissements or not offres:
        raise SystemExit('Extraction vide')
    ordonnes = sorted(etablissements.values(), key=lambda e: (e['departement'], e['commune'], e['nom']))
    json.dump(dict(
        sources=[dict(libelle=SOURCES[o], url=URL_SOURCE, consulteLe=CONSULTE_LE, officielle=True) for o in ('LTP', 'LTA')],
        etablissements=ordonnes,
        offres=sorted(offres, key=lambda o: (o['etablissement'], o['diplome'], o['specialite'])),
    ), open(sortie, 'w'), ensure_ascii=False, indent=1)
    print(f'{len(ordonnes)} établissements, {len(offres)} offres de formation → {sortie}')
    if '--controle' in sys.argv:
        print('\n--- ÉTABLISSEMENTS')
        for e in ordonnes:
            h = 'internat' if e['internat'] else ('externat' if e['externat'] else '—')
            n = sum(1 for o in offres if o['etablissement'] == e['code'])
            print(f'  {e["code"]:30} {e["departement"]:12} {e["commune"]:15} {h:9} {n:2} offres')
        print('\n--- SPÉCIALITÉS PAR DIPLÔME (intitulés à rapprocher des fiches du référentiel)')
        par_diplome = collections.defaultdict(set)
        for o in offres:
            par_diplome[o['diplome']].add(o['specialite'])
        for d, s in sorted(par_diplome.items()):
            print(f'  {d} ({len(s)})')
            for x in sorted(s):
                print(f'      {x}')
        for champ, k in (('diplôme', 'issuDe'), ('filière', 'issuDeFiliere')):
            n = sum(1 for o in offres if o[k] != 'géométrie')
            print(f'\n--- {champ.upper()} DÉDUIT DES LISTES OFFICIELLES (cellule vide) : {n}/{len(offres)}')
        print('--- DÉPARTEMENTS', dict(sorted(collections.Counter(e['departement'] for e in ordonnes).items())))


if __name__ == '__main__':
    main()
