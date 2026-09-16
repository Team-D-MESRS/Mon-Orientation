#!/usr/bin/env python3
"""
Extrait les filières publiques du « Guide d'information et de sensibilisation des nouveaux bacheliers 2026-2027 »
(MESRS, PDF conservé hors dépôt) vers un fichier JSON lu par le seed.

Usage : python3 extraire-guide-mesrs.py <guide.pdf> <sortie.json> [--controle]
Dépendance : pdfplumber.
"""
import collections
import json
import re
import sys
import unicodedata

import pdfplumber

CONSULTE_LE = '2026-09-14'
SOURCE = 'MESRS — Guide d’information et de sensibilisation des nouveaux bacheliers 2026-2027'
URL_SOURCE = 'https://www.enseignementsuperieur.gouv.bj'

# (première page, dernière page, sigle de l'université) — pages des tableaux, sans les pages de garde
SECTIONS = [(23, 45, 'UAC'), (46, 54, 'UP'), (55, 68, 'UNSTIM'), (69, 80, 'UNA'), (81, 82, 'IUEP'),
            (84, 84, 'INTER-ETATS'), (85, 87, 'UADC'), (89, 89, 'SEME-CITY')]
UNIVERSITES = {
    'UAC': 'Université d’Abomey-Calavi',
    'UP': 'Université de Parakou',
    'UNSTIM': 'Université nationale des sciences, technologies, ingénierie et mathématiques',
    'UNA': 'Université nationale d’agriculture',
    'IUEP': 'Institut universitaire d’enseignement professionnel',
    'INTER-ETATS': 'Écoles inter-États',
    'UADC': 'Université africaine de développement coopératif',
    'SEME-CITY': 'Sèmè City',
}
# Établissements sans sigle exploitable entre parenthèses (début du nom normalisé → sigle)
SIGLES = {
    'institut de cadre de vie': 'ICV',
    "ecole nationale d'administration": 'ENA',
    "institut national de l'education physique et sportive": 'INEPS',
    'ecole normale superieure /porto-novo': 'ENS-PN',
    'institut confucius': 'CONFUCIUS',
    "metiers de l'agriculture": 'IUEP',
    'institut de formation et de recherche demographique': 'IFORD',
    'ecole centrale de casablanca': 'ECC',
    'africa design school': 'ADS',
    'seme city institute of technology and innovation': 'SCITI',
}
# Libellé affiché quand le sigle seul serait peu parlant
ETIQUETTES = {'CONFUCIUS': 'Institut Confucius', 'ENS-PN': 'ENS Porto-Novo', 'ENS/Nati': 'ENS Natitingou',
              'FAST/Natitingou': 'FAST Natitingou'}
# Filières du référentiel précédent (sources non officielles) : leur code est conservé pour garder leurs identifiants
ANCIENS_CODES = {
    ('UAC', 'FSS', 'Médecine Générale'): 'UNIV-FSS-MEDECINE',
    ('UAC', 'FSS', 'Pharmacie'): 'UNIV-FSS-PHARMACIE',
    ('UAC', 'EPAC', 'Génie Informatique et Télécom'): 'UNIV-EPAC-GIT',
    ('UAC', 'EPAC', 'Génie Civil'): 'UNIV-EPAC-GC',
    ('UAC', 'EPAC', 'Génie Electrique'): 'UNIV-EPAC-GEE',
    ('UAC', 'FAST', 'Physique-Chimie'): 'UNIV-FAST-MPC',
    ('UAC', 'FAST', 'Sciences de la Vie et de la Terre'): 'UNIV-FAST-SVT',
    ('UAC', 'FASEG', 'Sciences Économiques et de Gestion'): 'UNIV-FASEG-ECONOMIE',
    ('UAC', 'FASEG', 'Sciences et Techniques Comptables'): 'UNIV-FASEG-GESTION',
    ('UAC', 'FADESP', 'Droit'): 'UNIV-FADESP-DROIT',
    ('UAC', 'FLLAC', 'Lettres Modernes'): 'UNIV-FLASH-LETTRES',
    ('UAC', 'FASHS Calavi', 'Géographie et Aménagement'): 'UNIV-FLASH-SHS',
    ('UAC', 'IFRI', 'Génie Logiciel'): 'UNIV-IFRI-INFORMATIQUE',
    ('UAC', 'ENEAM', 'Statistique Économique'): 'UNIV-ENEAM-STATISTIQUE',
    ('UAC', 'ENEAM', 'Gestion Financière et Comptable'): 'UNIV-ENEAM-GESTION',
    ('UNSTIM', 'INSTI', 'Maintenance des Systèmes (Maintenance Industrielle)'): 'UNIV-INSTI-MAINT-INDUSTRIELLE',
    ('UNSTIM', 'INSTI', 'Maintenance des Systèmes (Maintenance Automobile)'): 'UNIV-INSTI-MAINT-AUTOMOBILE',
    ('UNSTIM', 'ENSET', 'Electrotechnique'): 'UNIV-ENSET',
    ('UAC', 'IMSP', 'Classes préparatoires'): 'UNIV-IMSP-PREPA',
}

SERIES_BAC = ['A1', 'A2', 'B', 'C', 'D', 'E', 'EA', 'F1', 'F2', 'F3', 'F4', 'G1', 'G2', 'G3']
# Forme normalisée (sans accents, minuscules) → matière des bulletins scolaires
MATIERES = {
    'maths': 'Mathématiques', 'math': 'Mathématiques', 'mathematiques': 'Mathématiques',
    'pct': 'PCT', 'spct': 'PCT', 'physique-chimie': 'PCT',
    'svt': 'SVT',
    'francais': 'Français', 'dissertation francaise': 'Français',
    'hist-geo': 'Histoire-Géographie', 'histoire-geographie': 'Histoire-Géographie', 'histoire': 'Histoire-Géographie',
    'geographie': 'Histoire-Géographie',
    'anglais': 'Anglais', 'philo': 'Philosophie', 'philosophie': 'Philosophie',
    'economie': 'Économie', 'allemand': 'Allemand', 'espagnol': 'Espagnol', 'espagol': 'Espagnol',
    'eps': 'EPS', 'pratique eps': 'EPS',
}
# Mots écrits sans accent parce qu'en capitale dans le guide (« Education ») : accent rétabli
ACCENTS = {
    'education': 'éducation', 'energies': 'énergies', 'energetique': 'énergétique', 'energetiques': 'énergétiques',
    'economie': 'économie', 'economique': 'économique', 'economiques': 'économiques', 'electrique': 'électrique',
    'electronique': 'électronique', 'electrotechnique': 'électrotechnique', 'electrification': 'électrification',
    'equipements': 'équipements', 'ecohydrologie': 'écohydrologie', 'etudes': 'études', 'econometrie': 'économétrie',
    'ecosystemes': 'écosystèmes', 'epidemiologique': 'épidémiologique', 'elevage': 'élevage', 'evaluation': 'évaluation',
}
NOMS_PROPRES = {'terre': 'Terre'}
# (domaine, motif sur le nom de la filière et le sigle de l'établissement, sans accents ni majuscules)
DOMAINES = [
    ('SANTE', r'sante publique|medec|pharma|infirm|obstetri|kinesi|dietet|biomedic|imagerie|epidemio|veterinaire|micro assurance sante'),
    ('AGRICULTURE', r'agro|agri|production vegetale|production animale|productions? et sante animales|halieut|aquacult|peche|forest|foret|horticult|semenc|rural|elevage|bio-ressources|vulgarisation|intrants|produits agricoles|technologie alimentaire'),
    ('ENVIRONNEMENT', r'environnement|\beau\b|hydro|assainissement|climat(?!isation)|ecosystem|cadre de vie|ressources naturelles|espaces verts'),
    ('NUMERIQUE', r'informatiq|telecom|reseaux|logiciel|multimedia|internet|intelligence artificielle|systemes embarques|donnees|digital'),
    ('BTP', r'genie civil|travaux publics|architecture|urbanisme|geomatique|infrastructures|espaces urbains'),
    ('ELECTRICITE', r'electri|electrotech|electronique|energ|froid|climatisation'),
    ('INDUSTRIE', r'mecani|maintenance|machinisme|agroequipement|equipements motorises|genie chimique|procedes|productique|fabrication|industrie|conditionnement|emballage|automobile|technologie alimentaire'),
    ('GESTION', r'econom|gestion|financ|comptab|banque|assurance|commerc|marketing|management|entrepren|statisti|planification|\btransports?\b|logistique|negoce|maritime|cooperati|secretariat|ressources humaines|developpement local|agrobusiness|exploitations'),
    ('DROIT', r'droit|politique|relations internationales|administration generale|administration des finances|decentralisation'),
    ('LETTRES', r'lettres|langue|anglais|allemand|espagnol|francais|chinois|arabe|philosoph|histoire|geographie|socio|anthropolog|psycholog|sciences du langage|traduction|information documentaire|education et de la formation|genre et developpement|population|demograph|islamique|assistance sociale|communautaire'),
    ('ENSEIGNEMENT', r'\bens\b|enset|ens-pn|ens/nati|didactique|andragogie|sciences de l.education'),
    ('SCIENCES', r'mathemat|(?<!education )physique|chimie|biolog|genetique|biotechnolog|microbiolog|sciences de la vie|preparatoires|sciences et techniques de l.ingenieur|analyse biomedicale'),
    ('TOURISME', r'touris|hotel|restauration|recreolog'),
    ('ARTS', r'\barts?\b|musique|cinema|audiovisuel|culturel|design|journalisme|patrimoine'),
    ('SPORT', r'\bsporti(f|ve)s?\b|education physique|recreolog'),
]
DOMAINES_ETABLISSEMENT = {'ECC': ['SCIENCES', 'INDUSTRIE']}  # « toutes les filières » d'une école d'ingénieurs


def sans_accents(t):
    return ''.join(c for c in unicodedata.normalize('NFD', t) if unicodedata.category(c) != 'Mn')


def cle(t):
    return sans_accents(re.sub(r'\s+', ' ', t.replace('’', "'").replace('–', '-')).strip()).lower()


def une_ligne(t):
    return re.sub(r'\s+', ' ', t or '').strip()


def recoller(t):
    """« Socio- Anthropologie » (coupure de ligne dans le PDF) → « Socio-Anthropologie »."""
    return re.sub(r'(?<=\w)- (?=\w)', '-', une_ligne(t)).replace("'", '’')


def accentue(mot, majuscule):
    accent = ACCENTS.get(sans_accents(mot).lower())
    if not accent:
        return mot
    return accent[:1].upper() + accent[1:] if majuscule else accent


def en_phrase(t):
    """Casse de phrase à la française, sigles conservés : « Génie Civil » → « Génie civil »."""
    t = recoller(t).replace('Intélligence', 'Intelligence')
    sortie = []
    for i, mot in enumerate(t.split(' ')):
        resultat = []
        for j, m in enumerate(re.split(r'([-’])', mot)):
            nu = m.strip('()')
            if m in ('-', '’') or not nu:
                resultat.append(m)
            elif len(re.findall(r'[A-Z]', nu)) >= 2 or re.search(r'\d', nu):
                resultat.append(m)                        # sigle : IA, SEIoT, PCT…
            elif i == 0 and j == 0:
                resultat.append(m.replace(nu, accentue(nu, True)) if nu[:1] == 'E' else m)
            else:
                bas = nu[:1].lower() + nu[1:]
                bas = NOMS_PROPRES.get(bas, accentue(bas, False) if nu[:1] == 'E' else bas)
                resultat.append(m.replace(nu, bas))
        sortie.append(''.join(resultat))
    return ' '.join(sortie)


def slug(t, taille=40):
    s = re.sub(r'[^A-Z0-9]+', '-', sans_accents(t).upper()).strip('-')
    return s[:taille].rstrip('-')


def sigle_de(etab):
    k = cle(recoller(etab))
    for debut, s in SIGLES.items():
        if k.startswith(debut):
            return s
    m = re.findall(r'\(([^()]*)\)', etab)
    if m and not m[-1].startswith('Ex'):
        return re.sub(r'\s*/\s*', '/', une_ligne(m[-1]))
    return None


problemes_series = collections.Counter()


def series(brut):
    t = une_ligne(brut).replace('"', '')
    if not t or t == '-':
        return []
    if re.search(r'toutes s[ée]ries', t, re.I):
        return ['Toutes séries']
    t = re.sub(r'\([^()]*\)', '', t)       # précisions entre parenthèses (spécialités du DT ou du DEAT)
    t = re.sub(r'\bet\b', ',', t)
    sortie, apres_dt = [], False
    for partie in t.split(','):
        for jeton in partie.split():
            j = jeton.upper()
            if j.startswith('DEAT'):
                sortie.append('DEAT'); apres_dt = True
            elif j.startswith('DT'):
                sortie.append('DT'); apres_dt = True
            elif j == 'A':
                sortie += ['A1', 'A2']; apres_dt = False
            elif j == 'F':
                sortie += ['F1', 'F2', 'F3', 'F4']; apres_dt = False
            elif j in SERIES_BAC:
                sortie.append(j); apres_dt = False
            elif apres_dt or re.search(r'[a-zà-ÿ]', jeton):
                continue                        # intitulé de spécialité du DT ou du DEAT
            else:
                problemes_series[(brut, jeton)] += 1
    return list(dict.fromkeys(sortie))


def elements(brut):
    """Éléments d'une cellule : puces « • » si présentes, sinon une ligne par élément (suites de ligne recollées)."""
    t = (brut or '').replace('–', '-').replace('"', '').replace('(cid:2220)', '')
    puces = '•' in t
    morceaux = t.split('•') if puces else t.split('\n')
    sortie = []
    for m in morceaux:
        m = recoller(m).strip(' ;,.')
        if not m or m == '-':
            continue
        if sortie and not puces and (m[0].islower() or m[0] in '(&'):
            sortie[-1] += ' ' + m
        else:
            sortie.append(m)
    return sortie


def est_entete(e):
    """« Pour C et D : », « A1, A2, B, C, D : », « Pour DEAT : … »"""
    # Une liste de séries contient une virgule ou un deux-points : « PCT » ou « SVT » seuls sont des matières
    return bool(re.match(r'pour\b', cle(e))) or bool(re.fullmatch(r'(?=.*[,:])[A-Z0-9 ,/]+:?', e.strip()))


def matiere_bulletin(texte):
    k = cle(re.sub(r'\([^()]*\)', '', texte)).strip(' ;,.:').replace('commentaire de texte en ', '')
    for alternative in re.split(r'\s+ou\s+|/', k):          # « Maths ou Étude de cas » → Maths
        if alternative.strip() in MATIERES:
            return MATIERES[alternative.strip()]
    return None


def matieres_cles(brut):
    """Matières du classement présentes dans les bulletins, pour le cas général (premier bloc « Pour … : »)."""
    sortie = []
    for e in elements(brut):
        if est_entete(e):
            if sortie:
                break                                         # bloc suivant : cas particulier (DT, DEAT…)
            e = e.split(':', 1)[1] if ':' in e else ''
            if not e.strip():
                continue
        m = matiere_bulletin(e)
        if m:
            sortie.append(m)
        else:                                                 # « Maths PCT SVT » sans séparateur
            sortie += [MATIERES[cle(x)] for x in e.split() if cle(x) in MATIERES]
    return list(dict.fromkeys(sortie))[:3]


def metiers(brut):
    liste = [x.strip(' ;,.') for e in elements(brut) for x in e.split(';')]
    return list(dict.fromkeys(x[:1].upper() + x[1:] for x in liste if len(x) > 2))


def domaines(nom, sigle, etab):
    if sigle in DOMAINES_ETABLISSEMENT:
        return DOMAINES_ETABLISSEMENT[sigle]
    k = cle(f'{nom} {sigle or ""}')
    trouves = [d for d, motif in DOMAINES if re.search(motif, k)]
    if re.search(r'normale superieure', cle(etab)) and 'ENSEIGNEMENT' not in trouves:
        trouves.insert(0, 'ENSEIGNEMENT')
    return trouves[:2]


def extraire(chemin):
    lignes, note_mode = [], {}
    champs_fusionnables = ('mode', 'bac', 'matieres', 'debouches')
    with pdfplumber.open(chemin) as pdf:
        for debut, fin, univ in SECTIONS:
            precedent = {}
            for n in range(debut, fin + 1):
                for tableau in pdf.pages[n - 1].extract_tables():
                    for row in tableau:
                        c = [(x or '').replace('(cid:2220)', '').strip() for x in row]   # retours à la ligne conservés
                        if len(c) == 16:                       # page 41 : colonnes intercalaires vides
                            c = [c[i] for i in (0, 1, 3, 5, 7, 9, 11, 13, 15)]
                        u = [une_ligne(x) for x in c]
                        remplies = [x for x in u if x]
                        if not remplies:
                            continue
                        if u[0].startswith('Mode d’entrée'):   # note sous le tableau de l'UADC
                            note_mode[univ] = u[0].split(':', 1)[1].strip()
                            continue
                        if len(remplies) == 1 and u[0] == u[0].upper() and not u[0].isdigit():
                            continue                           # titre du tableau
                        if u[0] == 'N°' or 'Bourse' in u or any(x.lower().startswith(('etablissement', 'établissement')) for x in u[:2]):
                            continue                           # en-têtes
                        if len(u) >= 9 and not u[2] and u[6] and not any(u[i] for i in (0, 1, 3, 4, 5)) and lignes:
                            lignes[-1]['bac'] += ', ' + u[6]    # ligne d'appoint (« DT tourisme ») de la filière précédente
                            lignes[-1]['matieres'] += '\n' + c[7]
                            continue
                        if len(u) >= 9:
                            ligne = dict(etab=u[1], filiere=u[2], bourse=u[3], aide=u[4], mode=u[5], bac=u[6],
                                         matieres=c[7], debouches=c[8])
                        elif len(u) == 3:
                            ligne = dict(etab=u[1], filiere=u[2], bourse='', aide='', mode='', bac='', matieres='', debouches='')
                        else:
                            raise SystemExit(f'Largeur de tableau inattendue p. {n} : {u}')
                        ligne.update(univ=univ, page=n)
                        meme = not ligne['etab'] or cle(ligne['etab']) == cle(precedent.get('etab', ''))
                        ligne['etab'] = ligne['etab'] or precedent.get('etab', '')
                        if meme:                               # cellules fusionnées : reprises de la ligne précédente
                            for k in ('bourse', 'aide') + champs_fusionnables:
                                ligne[k] = ligne[k] or precedent.get(k, '')
                        if not ligne['filiere']:
                            raise SystemExit(f'Ligne sans filière p. {n} : {u}')
                        lignes.append(ligne)
                        precedent = ligne
    # Cellule fusionnée dont le texte est placé sur une ligne suivante : reprise vers le haut, dans le même établissement
    for i in range(len(lignes) - 2, -1, -1):
        a, b = lignes[i], lignes[i + 1]
        if a['univ'] == b['univ'] and cle(a['etab']) == cle(b['etab']):
            for k in champs_fusionnables:
                a[k] = a[k] or b[k]
    for l in lignes:
        if l['univ'] in note_mode and l['mode'] in ('', '-'):
            l['mode'] = note_mode[l['univ']]
    return lignes


def quota(v):
    return int(v) if v.isdigit() else None


def condition(mode, bac, b, a):
    k = cle(mode)
    if k.startswith('classement'):
        phrase = 'Admission sur classement des bacheliers (choix sur la plateforme officielle apresmonbac.bj).'
    elif k.startswith('concours'):
        phrase = 'Admission sur concours.'
    elif 'payant' in k:
        phrase = 'Formation à titre payant : modalités d’inscription auprès de l’établissement.'
    else:
        phrase = 'Modalités d’admission à demander à l’établissement.'
    if bac and bac != '-':
        phrase += f' Séries de bac recommandées : {recoller(bac).strip(" ,")}.'
    if b is not None or a is not None:
        phrase += f' Places avec bourse : {b or 0} ; aides universitaires ou places partiellement payantes : {a or 0}.'
    return phrase


def normaliser(lignes):
    etablissements, filieres, codes = {}, [], set()
    for l in lignes:
        univ = l['univ']
        etab_nom = recoller(l['etab'])
        filiere_brute = recoller(l['filiere'])
        if univ == 'IUEP':                                   # « Métiers de l'agriculture » est une filière de l'IUEP
            filiere_brute = 'Métiers de l’agriculture (toutes les filières)'
            etab_nom = 'Institut universitaire d’enseignement professionnel (IUEP)'
        sigle = sigle_de(etab_nom) or sigle_de(l['etab'])
        if not sigle:
            raise SystemExit(f'Sigle introuvable : {etab_nom}')
        code_etab = f'{univ}-{slug(sigle, 20)}'
        etablissements.setdefault(code_etab, dict(code=code_etab, nom=etab_nom, sigle=sigle, universite=UNIVERSITES[univ]))
        toutes = cle(filiere_brute).startswith('toutes les filieres')
        if toutes:
            nom = etab_nom
        elif univ == 'SEME-CITY':
            nom = f'{en_phrase(filiere_brute)} — {etab_nom} (Sèmè City)'
        elif univ == 'IUEP':
            nom = 'Métiers de l’agriculture (toutes les filières) — IUEP'
        else:
            nom = f'{en_phrase(filiere_brute)} — {ETIQUETTES.get(sigle, sigle)} ({univ})'
        ancien = next((code for (u, s, debut), code in ANCIENS_CODES.items()
                       if u == univ and s == sigle and filiere_brute.startswith(debut)), None)
        code = ancien or f'UNIV-{univ}-{slug(sigle, 20)}-{slug(filiere_brute)}'
        base, i = code, 2
        while code in codes:
            code = f'{base}-{i}'
            i += 1
        codes.add(code)
        b, a = quota(l['bourse']), quota(l['aide'])
        if toutes:
            description = f'{etab_nom} ({UNIVERSITES[univ]}) : plusieurs filières sont proposées, à découvrir auprès de l’établissement.'
        else:
            description = f'Formation proposée par {etab_nom} — {UNIVERSITES[univ]}.'
        bac = recoller(l['bac']).strip(' ,"')
        filieres.append(dict(
            code=code, ancienCode=bool(ancien), nom=nom, etablissement=code_etab, page=l['page'],
            description=description,
            quotaBourses=b, quotaAides=a,
            modeEntree=l['mode'] if l['mode'] not in ('', '-') else None,
            seriesRecommandees=bac if bac and bac != '-' else None,
            seriesAdmises=series(l['bac']),
            matieresClassement=' • '.join(elements(l['matieres'])) or None,
            matieresCles=matieres_cles(l['matieres']),
            metiersVises=metiers(l['debouches']),
            conditionsAcces=condition(l['mode'], l['bac'], b, a),
            domaines=domaines(etab_nom if toutes else filiere_brute, sigle, etab_nom),
        ))
    return list(etablissements.values()), filieres


def main():
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    lignes = extraire(sys.argv[1])
    etablissements, filieres = normaliser(lignes)
    trouves = {f['code'] for f in filieres if f['ancienCode']}
    manquants = set(ANCIENS_CODES.values()) - trouves
    if manquants:
        raise SystemExit(f'Anciens codes non retrouvés : {sorted(manquants)}')
    sans_domaine = [f['nom'] for f in filieres if not f['domaines']]
    if sans_domaine:
        raise SystemExit(f'Filières sans domaine : {sans_domaine}')
    json.dump(dict(source=dict(libelle=SOURCE, url=URL_SOURCE, consulteLe=CONSULTE_LE),
                   etablissements=etablissements, filieres=filieres),
              open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
    print(f'{len(filieres)} filières, {len(etablissements)} établissements → {sys.argv[2]}')
    if '--controle' in sys.argv:
        print('--- SÉRIES NON RECONNUES', dict(problemes_series) or 'aucune')
        print('--- SANS MATIÈRE CLÉ', [f['nom'] for f in filieres if not f['matieresCles']])
        print('--- DOMAINES', dict(sorted(collections.Counter(d for f in filieres for d in f['domaines']).items())))
        print('--- CONTRÔLES CIBLÉS')
        for f in filieres:
            if re.search(r'transports|climatisation|documentaire|physique et sportive|alimentaire|Casablanca|terre|Econom|Electr|Energ|Equip|réseaux inf|ERER|Productions et santé|Langue chinoise|Porto|Natitingou|Sèmè|IUEP|Génie de l’environnement|Génie civil — EPAC|Génie électrique — EPAC|Tronc', f['nom']):
                print(f"  {f['nom'][:70]:70} | {','.join(f['domaines']):22} | {', '.join(f['matieresCles'])}")
        print('--- EXEMPLES DE MÉTIERS')
        for f in filieres[:3] + filieres[100:102]:
            print(f"  {f['nom'][:40]} → {f['metiersVises'][:4]}")
            print(f"     matières : {f['matieresClassement']}")


if __name__ == '__main__':
    main()
