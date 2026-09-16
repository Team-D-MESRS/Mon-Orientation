#!/usr/bin/env python3
"""
Extrait les catalogues officiels des nouveaux métiers (DTM) vers un JSON lu par le seed :
11 métiers des lycées techniques professionnels, 10 métiers des lycées techniques agricoles.

Usage : python3 extraire-metiers-dtm.py <FTP_Nouv_Metiers.pdf> <LTA_Nouv_Metiers.pdf> <sortie.json> [--controle]
Dépendance : pdfplumber.

Les deux catalogues sont mis en pages en colonnes, différemment l'un de l'autre. Plutôt qu'un
algorithme universel — chaque règle générale essayée se cassait sur un cas réel — chaque document
a sa recette, vérifiée page à page contre le PDF :

  FTP, 1re page : rubriques pleine largeur, sauf la rangée DIPLÔMES / PROFIL D'ENTRÉE / [DURÉE] /
      AGE LIMITE, dont les titres partagent une même ligne : ils sont appariés de gauche à droite,
      chacun à son abscisse réelle (les fiches 3, 7 et 11 insèrent une colonne DURÉE).
      La liste des établissements est lue colonne par colonne, repérée à ses puces ; une ligne sans
      puce prolonge l'entrée précédente, et le PDF pose parfois une puce au milieu d'un nom.
  FTP, 2e page : deux colonnes séparées à x=340 au-dessus de DEBOUCHES ; DEBOUCHES occupe toute la
      largeur en deux sous-colonnes séparées à x=295.
  LTA, 1re page : deux colonnes à x=300. La colonne de droite a son propre enchaînement de
      rubriques, dont l'ordre change d'une fiche à l'autre. Un texte de gauche appartient au dernier
      titre de gauche au-dessus de lui ; un texte de droite au dernier titre rencontré, quelle que
      soit sa colonne — seule règle qui tienne sur les cinq mises en pages observées.
  LTA, 2e page : deux colonnes à x=230, chacune avec ses propres rubriques, le côté s'inversant
      d'une fiche à l'autre (DÉBOUCHÉS à gauche en fiche 1, à droite en fiche 2).

Deux pièges traités explicitement :
  - un titre est cherché à l'intérieur d'une colonne ; cherché sur la page entière, deux rubriques
    côte à côte se confondraient en une seule ligne et l'une des deux serait perdue ;
  - un titre peut occuper deux lignes (« COMPÉTENCES » / « PROFESSIONNELLES ») : on renvoie donc où
    il se termine, sinon la rubrique est introuvable et son texte ampute sa première ligne.

Toute rubrique attendue mais absente arrête le script : mieux vaut une extraction refusée qu'une
fiche officielle incomplète sans qu'on le sache.
"""
import json
import re
import sys
import unicodedata

import pdfplumber

CONSULTE_LE = '2026-09-16'
URL_SOURCE = 'https://www.enseignementsuperieur.gouv.bj'
SOURCES = {
    'LTP': 'MESTFP / DESTFP — Nouveaux métiers des lycées techniques professionnels (DTM)',
    'LTA': 'MESTFP / DESTFP — Nouveaux métiers des lycées techniques agricoles (DTM), rentrée 2026',
}

GUTTER_FTP = 340          # 2e page de fiche : missions à gauche, insertion à droite
GUTTER_DEBOUCHES = 295    # bloc DEBOUCHES, pleine largeur en deux sous-colonnes
GUTTER_LTA_1 = 300
GUTTER_LTA_2 = 230

FTP_PAGE1 = ['BREF SUR LE SECTEUR', 'OBJECTIF DE LA FORMATION', 'LISTE DES ETABLISSEMENTS',
             "CONDITIONS D'ADMISSION"]
FTP_COLONNES = ['DIPLOMES ATTENDUS', "PROFIL D'ENTREE", 'DUREE DE FORMATION', "AGE LIMITE D'ENTREE"]
FTP_GAUCHE = ['DESCRIPTION DU METIER', 'PRINCIPALES MISSIONS', 'COMPETENCES TECHNIQUES',
              'QUALITES REQUISES']
FTP_DROITE = ["OPPORTUNITES D'INSERTION"]
LTA_PAGE1 = ['DESCRIPTION', "CONDITIONS D'ACCES", "CRITERES D'ACCES", 'PROFIL DE SORTIE']
LTA_PAGE2 = ['COMPETENCES PROFESSIONNELLES', 'DEBOUCHES', "SECTEURS D'ACTIVITES",
             'PARTENARIAT AVEC LE MILIEU PROFESSIONNEL', 'PARTENARIAT PROFESSIONNEL']

CLES = {
    'BREF SUR LE SECTEUR': 'secteur', 'OBJECTIF DE LA FORMATION': 'objectif',
    'LISTE DES ETABLISSEMENTS': 'etablissements', "CONDITIONS D'ADMISSION": 'conditionsAdmission',
    'DIPLOMES ATTENDUS': 'diplome', "PROFIL D'ENTREE": 'profilEntree',
    'DUREE DE FORMATION': 'dureeFormation', "AGE LIMITE D'ENTREE": 'ageLimite',
    'DESCRIPTION DU METIER': 'description', 'PRINCIPALES MISSIONS': 'missions',
    'COMPETENCES TECHNIQUES': 'competences', 'QUALITES REQUISES': 'qualites',
    "OPPORTUNITES D'INSERTION": 'insertion', 'DEBOUCHES': 'debouches',
    'DESCRIPTION': 'description', "CONDITIONS D'ACCES": 'conditionsAcces',
    "CRITERES D'ACCES": 'criteresAcces', 'PROFIL DE SORTIE': 'profilSortie',
    'COMPETENCES PROFESSIONNELLES': 'competences', "SECTEURS D'ACTIVITES": 'secteurs',
    'PARTENARIAT AVEC LE MILIEU PROFESSIONNEL': 'partenariat',
    'PARTENARIAT PROFESSIONNEL': 'partenariat',
}
EN_LISTE = {'missions', 'competences', 'qualites', 'insertion', 'debouches', 'etablissements',
            'secteurs', 'partenariat'}
PUCES = '◦•▪'
AMORCE = 'VOICI UNE SELECTION'   # phrase d'amorce répétée avant la liste des entreprises
# Un nom d'établissement qui se termine par l'un de ces mots est coupé : il se poursuit à l'entrée suivante
SUSPENDUS = {'DE', 'DU', 'DES', 'ET', 'LA', 'LE', 'EN', 'AU', 'AUX', 'À'}


def sans_accents(t):
    return ''.join(c for c in unicodedata.normalize('NFD', t) if unicodedata.category(c) != 'Mn')


def cle(t):
    return sans_accents(re.sub(r'\s+', ' ', (t or '').replace('’', "'").replace('–', '-')).strip()).upper()


def une_ligne(t):
    return re.sub(r'\s+', ' ', (t or '').replace('\n', ' ')).strip()


def lignes(mots, tol=3.0):
    """Mots regroupés en lignes visuelles, chaque ligne lue de gauche à droite."""
    groupes = []
    for w in sorted(mots, key=lambda w: (w['top'], w['x0'])):
        if groupes and abs(w['top'] - groupes[-1][0]) <= tol:
            groupes[-1][1].append(w)
        else:
            groupes.append([w['top'], [w]])
    return [(t, ' '.join(x['text'] for x in sorted(ws, key=lambda k: k['x0']))) for t, ws in groupes]


def titres(mots, attendus, taille_min=9.5):
    """Rubriques d'UNE colonne : (libellé, x0, haut, apres). `apres` est la hauteur à partir de
    laquelle lire le texte — un libellé peut tenir sur deux lignes, qu'il faut toutes deux sauter."""
    grands = [w for w in mots if w['size'] >= taille_min]
    visuelles = lignes(grands)
    trouves = []
    for i, (haut, texte) in enumerate(visuelles):
        # Un titre est en capitales. Sans cette condition, une ligne de prose commençant par
        # « compétences professionnelles » ouvrirait une fausse rubrique.
        if not any(c.isalpha() for c in texte) or texte != texte.upper():
            continue
        suivante = visuelles[i + 1] if i + 1 < len(visuelles) else None
        if suivante and suivante[1] != suivante[1].upper():
            suivante = None
        k = cle(texte)
        for libelle in attendus:
            if k.startswith(libelle):
                fin_titre = haut
            elif suivante and libelle.startswith(k) and cle(f'{texte} {suivante[1]}').startswith(libelle):
                fin_titre = suivante[0]
            else:
                continue
            x0 = min(w['x0'] for w in grands if abs(w['top'] - haut) <= 3.0)
            trouves.append((libelle, x0, haut, fin_titre + 1))
            break
    return trouves


def apparier(rangee, attendus):
    """Rubriques alignées sur une même ligne, appariées de gauche à droite à leur abscisse propre."""
    trouves, i = [], 0
    while i < len(rangee):
        for libelle in attendus:
            mots_libelle = libelle.split(' ')
            bout = rangee[i:i + len(mots_libelle)]
            if len(bout) == len(mots_libelle) and all(
                    cle(w['text']).strip(':') == m for w, m in zip(bout, mots_libelle)):
                trouves.append((libelle, bout[0]['x0'], bout[0]['top']))
                i += len(mots_libelle)
                break
        else:
            i += 1
    return trouves


def texte_de(mots, haut, bas, xmin, xmax):
    return [txt for _, txt in lignes([w for w in mots if haut - 1 < w['top'] < bas and xmin <= w['x0'] < xmax])]


def vide(t):
    return not t or set(t) <= set('.… -')


def en_elements(lignes_texte):
    """Lignes d'une liste à puces → éléments recollés (une puce = un élément)."""
    elements = []
    for ligne in lignes_texte:
        ligne = une_ligne(ligne)
        if not ligne:
            continue
        for m in re.split(r'(?=(?:^|\s)[%s]\s)' % re.escape(PUCES), ligne):
            m = m.strip().lstrip(PUCES).strip()
            if vide(m):
                continue
            if elements and ligne.strip()[0] not in PUCES and m[:1].islower():
                elements[-1] += ' ' + m
            else:
                elements.append(m)
    return elements


def en_texte(lignes_texte):
    return une_ligne(' '.join(lignes_texte))


def ranger(fiche, libelle, contenu):
    champ = CLES[libelle]
    valeur = en_elements(contenu) if champ in EN_LISTE else en_texte(contenu)
    ancien = fiche.get(champ)
    if ancien:
        fiche[champ] = ancien + valeur if isinstance(valeur, list) else (ancien + ' ' + valeur).strip()
    elif valeur:
        fiche[champ] = valeur


def liste_par_colonnes(mots, haut, bas, largeur):
    """Liste d'établissements sur plusieurs colonnes : une puce ouvre une entrée, une ligne sans
    puce prolonge la précédente. Une entrée finissant sur « de », « du », « et »… est coupée : le
    PDF pose parfois une puce au milieu d'un nom qui se poursuit plus bas."""
    zone = [w for w in mots if haut < w['top'] < bas - 2]
    puces = sorted({round(w['x0']) for w in zone if w['text'] in PUCES})
    if not puces:
        return en_elements([t for _, t in lignes(zone)])
    elements = []
    for i, debut in enumerate(puces):
        fin = puces[i + 1] - 4 if i + 1 < len(puces) else largeur
        for _, texte in lignes([w for w in zone if debut - 4 <= w['x0'] < fin]):
            texte = une_ligne(texte)
            if vide(texte):
                continue
            if texte[0] in PUCES:
                entree = texte.lstrip(PUCES).strip()
                if not vide(entree):
                    elements.append(entree)
            elif elements:
                elements[-1] += ' ' + texte
    recolles = []
    for e in elements:
        if recolles and cle(recolles[-1].split(' ')[-1]) in SUSPENDUS:
            recolles[-1] += ' ' + e
        else:
            recolles.append(e)
    return recolles


def fiche_ftp(page1, page2, numero):
    fiche = {'origine': 'LTP', 'numero': numero, 'pages': [page1.page_number, page2.page_number]}
    m1 = page1.extract_words(extra_attrs=['size'])
    fiche['titre'] = une_ligne(' '.join(w['text'] for w in m1 if w['size'] > 16))

    reperes = titres(m1, FTP_PAGE1, 11.5)
    manquantes = set(FTP_PAGE1) - {r[0] for r in reperes}
    if manquantes:
        raise SystemExit(f'FTP fiche {numero} : rubriques manquantes {sorted(manquantes)}')
    # En capitales : le mot « diplômes » apparaît aussi dans la prose, au-dessus de la rangée
    ancre = next((w for w in m1 if w['text'].isupper() and cle(w['text']).startswith('DIPLOMES')), None)
    if ancre is None:
        raise SystemExit(f'FTP fiche {numero} : rangée DIPLÔMES/PROFIL/ÂGE introuvable')
    rangee = sorted([w for w in m1 if abs(w['top'] - ancre['top']) <= 3.0], key=lambda w: w['x0'])
    colonnes = apparier(rangee, FTP_COLONNES)
    if not colonnes:
        raise SystemExit(f'FTP fiche {numero} : titres de la rangée DIPLÔMES non reconnus')

    bornes = sorted([t for _, _, t, _ in reperes] + [ancre['top']])
    for libelle, _, haut, apres in reperes:
        fin = next((b for b in bornes if b > haut + 1), page1.height)
        if CLES[libelle] == 'etablissements':
            fiche['etablissements'] = liste_par_colonnes(m1, apres, fin, page1.width)
        else:
            ranger(fiche, libelle, texte_de(m1, apres, fin, 0, page1.width))

    xs = [x for _, x, _ in colonnes]
    bas_rangee = min((t for _, _, t, _ in reperes if t > ancre['top']), default=page1.height)
    for i, (libelle, x0, _) in enumerate(colonnes):
        xmax = xs[i + 1] - 3 if i + 1 < len(xs) else page1.width
        ranger(fiche, libelle, texte_de(m1, ancre['top'] + 8, bas_rangee, x0 - 3, xmax))

    m2 = page2.extract_words(extra_attrs=['size'])
    bloc_deb = titres(m2, ['DEBOUCHES'], 13.0)
    deb, deb_apres = (bloc_deb[0][2], bloc_deb[0][3]) if bloc_deb else (page2.height, page2.height)
    gauche = titres([w for w in m2 if w['x0'] < GUTTER_FTP and w['top'] < deb], FTP_GAUCHE)
    droite = titres([w for w in m2 if w['x0'] >= GUTTER_FTP and w['top'] < deb], FTP_DROITE)
    manquantes = set(FTP_GAUCHE) - {g[0] for g in gauche}
    if manquantes:
        raise SystemExit(f'FTP fiche {numero} p. {page2.page_number} : rubriques manquantes {sorted(manquantes)}')
    for i, (libelle, _, _, apres) in enumerate(gauche):
        fin = gauche[i + 1][2] if i + 1 < len(gauche) else deb
        ranger(fiche, libelle, texte_de(m2, apres, fin, 0, GUTTER_FTP))
    for libelle, _, _, apres in droite:
        ranger(fiche, libelle, texte_de(m2, apres, deb, GUTTER_FTP, page2.width))
    if deb < page2.height:
        for xmin, xmax in ((0, GUTTER_DEBOUCHES), (GUTTER_DEBOUCHES, page2.width)):
            ranger(fiche, 'DEBOUCHES', texte_de(m2, deb_apres, page2.height, xmin, xmax))
    fiche['insertion'] = [e for e in fiche.get('insertion', []) if not cle(e).startswith(AMORCE)]
    return fiche


def fiche_lta(page1, page2, numero):
    fiche = {'origine': 'LTA', 'numero': numero, 'pages': [page1.page_number, page2.page_number]}
    m1 = page1.extract_words(extra_attrs=['size'])
    grand = max(w['size'] for w in m1)
    fiche['titre'] = une_ligne(' '.join(w['text'] for w in m1 if w['size'] > grand - 1))

    gauche = titres([w for w in m1 if w['x0'] < GUTTER_LTA_1], LTA_PAGE1, 11.5)
    droite = titres([w for w in m1 if w['x0'] >= GUTTER_LTA_1], LTA_PAGE1, 11.5)
    reperes = sorted(gauche + droite, key=lambda r: (r[2], r[1]))
    manquantes = {'DESCRIPTION', 'PROFIL DE SORTIE'} - {r[0] for r in reperes}
    if manquantes:
        raise SystemExit(f'LTA fiche {numero} : rubriques manquantes {sorted(manquantes)}')

    for i, (libelle, _, _, apres) in enumerate(gauche):
        fin = gauche[i + 1][2] if i + 1 < len(gauche) else page1.height
        ranger(fiche, libelle, texte_de(m1, apres, fin, 0, GUTTER_LTA_1))
    # Colonne de droite : chaque ligne revient au dernier titre situé au-dessus d'elle, toutes
    # colonnes confondues. Un titre de gauche qui partage sa rangée avec un titre de droite est
    # écarté : à cette hauteur, la colonne de droite appartient à ce dernier.
    rangees_droite = {round(r[2]) for r in reperes if r[1] >= GUTTER_LTA_1}
    candidats = [r for r in reperes if r[1] >= GUTTER_LTA_1 or round(r[2]) not in rangees_droite]
    for top, texte in lignes([w for w in m1 if w['x0'] >= GUTTER_LTA_1]):
        retenu = None
        for libelle, x0, haut, apres in candidats:
            if top >= (apres if x0 >= GUTTER_LTA_1 else haut):
                retenu = libelle
        if retenu:
            ranger(fiche, retenu, [texte])

    m2 = page2.extract_words(extra_attrs=['size'])
    for xmin, xmax in ((0, GUTTER_LTA_2), (GUTTER_LTA_2, page2.width)):
        bande = [w for w in m2 if xmin <= w['x0'] < xmax]
        # 11 et non 11,5 : la fiche 10 compose « PARTENARIAT PROFESSIONNEL » un point plus petit
        reperes2 = titres(bande, LTA_PAGE2, 11.0)
        for i, (libelle, _, _, apres) in enumerate(reperes2):
            fin = reperes2[i + 1][2] if i + 1 < len(reperes2) else page2.height
            ranger(fiche, libelle, texte_de(m2, apres, fin, xmin, xmax))
    return fiche


def pages_fiches(pdf, origine):
    """Première page de chaque fiche : le gros numéro (FTP) ou le grand titre (LTA)."""
    debuts = []
    for n, page in enumerate(pdf.pages, start=1):
        chars = [c for c in page.chars if c['text'].strip()]
        if not chars:
            continue
        grand = max(c['size'] for c in chars)
        if origine == 'LTP' and grand > 40:
            debuts.append(n)
        elif origine == 'LTA' and n >= 3 and grand >= 19:
            debuts.append(n)
    return debuts


def extraire(chemin, origine, attendu):
    fiches = []
    with pdfplumber.open(chemin) as pdf:
        debuts = pages_fiches(pdf, origine)
        if len(debuts) != attendu:
            raise SystemExit(f'{chemin} : {len(debuts)} fiches détectées, {attendu} attendues ({debuts})')
        for i, n in enumerate(debuts, start=1):
            if n >= len(pdf.pages):
                raise SystemExit(f'{chemin} : fiche {i} sans seconde page')
            construire = fiche_ftp if origine == 'LTP' else fiche_lta
            fiches.append(construire(pdf.pages[n - 1], pdf.pages[n], i))
    return fiches


def main():
    if len(sys.argv) < 4:
        raise SystemExit(__doc__)
    ftp, lta, sortie = sys.argv[1], sys.argv[2], sys.argv[3]
    metiers = extraire(ftp, 'LTP', 11) + extraire(lta, 'LTA', 10)
    for m in metiers:
        if not m['titre']:
            raise SystemExit(f'Fiche {m["origine"]} {m["numero"]} sans titre')
    json.dump(dict(
        sources=[dict(libelle=SOURCES[o], url=URL_SOURCE, consulteLe=CONSULTE_LE, officielle=True)
                 for o in ('LTP', 'LTA')],
        metiers=metiers,
    ), open(sortie, 'w'), ensure_ascii=False, indent=1)
    print(f'{len(metiers)} fiches métier → {sortie}')
    if '--controle' in sys.argv:
        for m in metiers:
            attendus = (['secteur', 'objectif', 'etablissements', 'diplome', 'profilEntree', 'ageLimite',
                         'conditionsAdmission', 'description', 'missions', 'competences', 'qualites',
                         'insertion', 'debouches'] if m['origine'] == 'LTP' else
                        ['description', 'conditionsAcces', 'criteresAcces', 'profilSortie',
                         'competences', 'debouches', 'secteurs', 'partenariat'])
            absents = [c for c in attendus if not m.get(c)]
            print(f'\n=== {m["origine"]} {m["numero"]:2} p.{m["pages"]} — {m["titre"][:56]}')
            if absents:
                print(f'    !! ABSENTS : {absents}')
            for champ, valeur in m.items():
                if champ in ('origine', 'numero', 'pages', 'titre'):
                    continue
                if isinstance(valeur, list):
                    print(f'    {champ:20} {len(valeur):2} el. | {(valeur[0] if valeur else "")[:54]}')
                else:
                    print(f'    {champ:20} {len(valeur):4} c.  | {valeur[:54]}')


if __name__ == '__main__':
    main()
