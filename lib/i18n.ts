/**
 * ASKIP public — bilingue.
 *
 * L'INTERFACE est traduite à la main : un ensemble fini de chaînes.
 * LES DONNÉES NE LE SONT PAS. Un claim s'affiche dans sa langue d'origine avec
 * son marqueur : traduire ajouterait une couche non vérifiable sur le seul
 * contenu que le projet garantit traçable jusqu'au DOI.
 *
 * Les ENTITÉS (pays, maladies) sont bilingues par CORRESPONDANCE : le canonique
 * français reste la clé, `scope_grid` porte le libellé anglais. Aucune traduction
 * automatique, une table de correspondance.
 */
export const LANGS = ['fr', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const isLang = (x: string): x is Lang => (LANGS as readonly string[]).includes(x);

const DICT = {
  fr: {
    title: 'ASKIP · Connaissance sanitaire africaine',
    tagline: 'Ce que le corpus documente, ce qu\'il ne documente pas, et d\'où vient chaque chiffre.',
    nav_overview: 'Vue d\'ensemble', nav_countries: 'Pays', nav_gaps: 'Ce que nous ignorons',
    nav_explorer: 'Explorer les evidences', nav_researchers: 'Chercheurs',
    kpi_evidences: 'Evidences validées', kpi_countries: 'Pays documentés',
    kpi_diseases: 'Maladies documentées', kpi_publications: 'Publications sources',
    kpi_observations: 'Observations', kpi_researchers: 'Chercheurs identifiés',
    by_country: 'Observations par pays', by_disease: 'Observations par maladie',
    timeline: 'Couverture temporelle', undated: 'observations sans année',
    quality: 'Ce que nous savons avec certitude', dated: 'datées', inherited: 'localisation héritée',
    country_profile: 'Profil du pays', diseases_documented: 'maladies documentées',
    observations: 'observations', see_evidences: 'Voir les evidences',
    method_note: 'Chaque chiffre est un NOMBRE D\'OBSERVATIONS documentées, jamais une prévalence ni un taux. Le corpus ne permet pas encore de qualifier le type de mesure d\'une valeur : additionner deux pourcentages y produirait un chiffre faux. Un pays peu représenté est un pays peu documenté ici, pas un pays épargné.',
    lang_note: 'Les claims ne sont pas traduits : ils s\'affichent dans leur langue d\'origine.',
    generated: 'Données générées le', source: 'Source', back: 'Retour',
    no_data: 'Aucune donnée dans ce corpus.',
    activity_axis: 'activité de recherche documentée',
    gold_tier: 'comptes au palier Gold — le corpus complet en porte davantage',
    unmapped_title: 'Près de la moitié du corpus n’entre dans aucune carte',
    unmapped_body: 'observations ne sont rattachées à aucun pays. Elles sont réelles et validées, mais absentes de toute vue géographique — y compris de la grille des manques ci-dessous. Un pays « vide » peut donc l’être parce que la donnée existe sans localisation exploitable.',
    of: 'sur',
  },
  en: {
    title: 'ASKIP · African health knowledge',
    tagline: 'What the corpus documents, what it does not, and where every figure comes from.',
    nav_overview: 'Overview', nav_countries: 'Countries', nav_gaps: 'What we do not know',
    nav_explorer: 'Explore evidence', nav_researchers: 'Researchers',
    kpi_evidences: 'Validated evidence', kpi_countries: 'Countries documented',
    kpi_diseases: 'Diseases documented', kpi_publications: 'Source publications',
    kpi_observations: 'Observations', kpi_researchers: 'Identified researchers',
    by_country: 'Observations by country', by_disease: 'Observations by disease',
    timeline: 'Temporal coverage', undated: 'observations with no year',
    quality: 'What we know with certainty', dated: 'dated', inherited: 'inherited location',
    country_profile: 'Country profile', diseases_documented: 'diseases documented',
    observations: 'observations', see_evidences: 'See evidence',
    method_note: 'Every figure is a COUNT OF DOCUMENTED OBSERVATIONS, never a prevalence or a rate. The corpus cannot yet qualify what a value measures: adding two percentages would produce a false figure. A country with few observations is under-documented here, not spared.',
    lang_note: 'Claims are not translated: they appear in their original language.',
    generated: 'Data generated on', source: 'Source', back: 'Back',
    no_data: 'No data in this corpus.',
    activity_axis: 'documented research activity',
    gold_tier: 'Gold-tier counts — the full corpus holds more',
    unmapped_title: 'Nearly half the corpus fits no map',
    unmapped_body: 'observations are attached to no country. They are real and validated, but absent from every geographic view — including the gap grid below. An "empty" country may be empty because the data exists without usable location.',
    of: 'of',
  },
} as const;

export type Key = keyof typeof DICT.fr;
export const t = (lang: Lang, key: Key): string => DICT[lang][key];
export const other = (lang: Lang): Lang => (lang === 'fr' ? 'en' : 'fr');
