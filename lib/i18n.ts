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
    nav_burden: 'Charge documentée',
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
    undated_title: 'Deux tiers du corpus ne portent aucune date',
    undated_body: 'observations n’ont pas d’année exploitable. Elles ne sont pas anciennes : leur période est inconnue. Aucune lecture temporelle — « données récentes », « aucune donnée depuis 2022 » — ne porte sur cette part du corpus.',
    reach_title: 'Ce que cette grille peut mesurer',
    scope_line: 'La grille déclare {cs} pays sur les {cc} que documente le corpus, et {ts} sujets sur {tc}. Une cellule vide dit qu’il n’y a rien pour ce couple DANS CE PÉRIMÈTRE — pas qu’il n’y a rien.',
    in_scope_of: 'dans le périmètre, sur',
    in_corpus: 'dans le corpus',
    unlocated_section: 'sans portée nationale',
    unlocated_section_body: 'evidences valides dont la portée est supra-nationale ou hors périmètre géographique — « 11 % des décès maternels en Afrique subsaharienne » n’a jamais eu de pays à perdre. Comptées à part, jamais additionnées aux cellules.',
    of: 'sur',
  },
  en: {
    title: 'ASKIP · African health knowledge',
    tagline: 'What the corpus documents, what it does not, and where every figure comes from.',
    nav_overview: 'Overview', nav_countries: 'Countries', nav_gaps: 'What we do not know',
    nav_burden: 'Documented burden',
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
    undated_title: 'Two thirds of the corpus carries no date',
    undated_body: 'observations have no usable year. They are not old: their period is unknown. No temporal reading — "recent data", "nothing since 2022" — applies to this share of the corpus.',
    reach_title: 'What this grid can measure',
    scope_line: 'The grid declares {cs} countries of the {cc} the corpus documents, and {ts} topics of {tc}. An empty cell says there is nothing for that pair WITHIN THIS SCOPE — not that there is nothing.',
    in_scope_of: 'within scope, out of',
    in_corpus: 'in the corpus',
    unlocated_section: 'with no national scope',
    unlocated_section_body: 'valid evidence whose scope is supra-national or outside the geographic perimeter — "11% of maternal deaths in sub-Saharan Africa" never had a country to lose. Counted separately, never added to the cells.',
    of: 'of',
  },
} as const;

export type Key = keyof typeof DICT.fr;
export const t = (lang: Lang, key: Key): string => DICT[lang][key];
export const other = (lang: Lang): Lang => (lang === 'fr' ? 'en' : 'fr');

/**
 * Langue de départ, depuis l'en-tête Accept-Language du navigateur.
 *
 * Le portail est atteint depuis LinkedIn ou un courriel : un écran de choix de
 * langue entre le clic et le contenu fait perdre du monde. On redirige donc vers
 * la langue du navigateur, et le sélecteur reste visible pour en changer — la
 * détection propose, elle n'enferme pas.
 *
 * `fr` par défaut : le portail sert d'abord des institutions francophones, et le
 * corpus est à 27 % en français alors que l'interface l'est entièrement.
 */
export function pickLang(acceptLanguage: string | null | undefined): Lang {
  if (!acceptLanguage) return 'fr';
  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.find((p) => p.trim().startsWith('q='));
      return { tag: (tag ?? '').trim().toLowerCase(), q: q ? Number(q.split('=')[1]) || 0 : 1 };
    })
    .filter((x) => x.tag)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split('-')[0];          // « en-GB » -> « en »
    if (base && isLang(base)) return base;
  }
  return 'fr';
}
