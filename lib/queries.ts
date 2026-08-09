/**
 * ASKIP public — lectures.
 *
 * RÈGLE : ces fonctions renvoient des COMPTES d'observations. Le type de mesure d'une
 * valeur était inconnu — 9 % seulement des valeurs en '%' sont de vraies prévalences —
 * donc toute agrégation produisait un chiffre faux d'apparence crédible.
 *
 * UNE SEULE EXCEPTION, et elle est conditionnelle : `getBurdenCanonical` expose une
 * médiane. Elle est légitime parce que `burden_canonical` filtre sur
 * `measure_type = 'prevalence_incidence'` ET `measure_subject = 'disease'`, ce qui a
 * produit l'homogénéité d'unité — toutes les observations retenues sont en '%'. La vue
 * porte `n_units` pour que cette condition reste vérifiable : dès qu'elle dépasse 1,
 * la médiane n'a plus de référent et l'écran doit cesser de l'afficher.
 *
 * La règle n'a donc pas été assouplie : la condition qui la justifiait a cessé d'être
 * vraie sur ce périmètre, et elle reste vraie partout ailleurs.
 *
 * Toutes les vues lues vivent dans le schéma public_api (migration 020).
 */
import { cache } from 'react';
import { db } from '@/lib/supabase-public';

export interface OverviewCounts {
  evidences_validated: number; evidences_total: number; countries: number; diseases: number;
  publications: number; publications_with_doi: number; researchers: number;
  observations: number; observations_dated: number; observations_inherited: number;
  evidences_fr: number; evidences_en: number;
}

export interface CountryTotal {
  country: string; iso: string | null; observations: number; diseases_documented: number;
  observations_in_referential: number; diseases_in_referential: number;
}
export interface DiseaseTotal {
  disease: string; in_referential: boolean; observations: number; countries_documented: number;
}
export interface TimelinePoint { year: number; observations: number }
/**
 * Contrat de la migration 043. `disease_is_normalized` a DISPARU — c'était le test faux,
 * qui rendait « normalisé » sur des libellés absents du vocabulaire. `in_referential` le
 * remplace, et il répond à la question posée.
 *
 * ⚠️ La colonne s'appelle `observations` ici et `n_observations` dans `burden_scoped` :
 * le nom change entre la vue interne et la vue exposée. Écrire l'un pour l'autre ne
 * lèverait pas d'erreur — le champ serait simplement `undefined`, donc `NaN` à l'écran.
 */
export interface CountryProfileRow {
  country: string; iso: string | null; disease: string;
  observations: number; n_evidences: number;
  median_pct: number | null; n_units: number;
  first_year: number | null; last_year: number | null; n_dated: number;
  n_inherited: number; n_from_author: number;
  in_referential: boolean;
}
export interface CountryQuality {
  country: string; observations: number; dated: number; location_inherited: number;
  diseases: number; first_year: number | null; last_year: number | null;
}

/* ------------------------------------------------------------------ */
/* Diagnostic : pourquoi il n'y a rien                                  */
/*                                                                      */
/* `safe` rendait `null` pour deux causes opposées et l'écran Knowledge  */
/* Gaps en déduisait toujours la même — « migrations 020 et 021 non      */
/* appliquées ». En production elles l'étaient : la vraie cause était un */
/* dépassement de délai sous charge. Une panne de PERFORMANCE s'affichait*/
/* comme une absence de DONNÉES, sur l'écran justement conçu pour        */
/* distinguer les deux, et le message envoyait réparer ce qui marchait.  */
/*                                                                      */
/* La cause est donc conservée à côté du résultat. Le collecteur passe   */
/* par `cache()`, donc PROPRE À CHAQUE REQUÊTE : un tableau de module    */
/* fuirait d'un visiteur au suivant.                                    */
/* ------------------------------------------------------------------ */
export type FaultKind = 'absent' | 'delai' | 'refuse' | 'echec';
export interface Fault { object: string; kind: FaultKind; detail: string }

const faultStore = cache((): Fault[] => []);

/** Pannes rencontrées pendant CETTE requête. À lire APRÈS les `await`. */
export const faults = (): Fault[] => faultStore();

/** Le code fait foi : le message seul ne distingue pas une vue absente d'une vue lente. */
function classify(code: string | undefined, message: string): FaultKind {
  if (code === '42P01' || code === '42883' || code === 'PGRST202' || code === 'PGRST205') return 'absent';
  if (code === '57014' || /statement timeout|canceling statement/i.test(message)) return 'delai';
  if (code === '42501' || code === 'PGRST106' || code === 'PGRST301') return 'refuse';
  return 'echec';
}

/** null = la lecture n'a pas abouti. La CAUSE est dans `faults()` — l'appelant ne la devine pas. */
// Le builder Supabase est « thenable », pas une Promise : PromiseLike, pas Promise.
async function safe<T>(
  object: string,
  run: () => PromiseLike<{ data: T | null; error: { message: string; code?: string } | null }>,
): Promise<T | null> {
  const { data, error } = await run();
  if (error) {
    const kind = classify(error.code, error.message);
    console.error(`[public_api] ${object} — ${kind} — ${error.code ?? '?'} — ${error.message}`);
    faultStore().push({ object, kind, detail: error.message });
    return null;
  }
  return data;
}

export const getOverview = () =>
  safe<OverviewCounts[]>('overview_counts', () => db.from('overview_counts').select('*').limit(1)).then((r) => r?.[0] ?? null);

export const getCountryTotals = (limit = 12) =>
  safe<CountryTotal[]>('country_totals', () => db.from('country_totals').select('*').order('observations', { ascending: false }).limit(limit));

export const getDiseaseTotals = (limit = 20) =>
  safe<DiseaseTotal[]>('disease_totals', () => db.from('disease_totals').select('*').order('observations', { ascending: false }).limit(limit));

export const getTimeline = () =>
  safe<TimelinePoint[]>('timeline', () => db.from('timeline').select('*').order('year', { ascending: true }));

export const getCountryProfile = (iso: string) =>
  safe<CountryProfileRow[]>('country_profile', () => db.from('country_profile').select('*').eq('iso', iso).order('observations', { ascending: false }));

export const getCountryQuality = (country: string) =>
  safe<CountryQuality[]>('country_quality', () => db.from('country_quality').select('*').eq('country', country).limit(1)).then((r) => r?.[0] ?? null);

/** Liste des pays de la grille, pour la navigation. */
export const getGridCountries = () =>
  safe<{ country_iso: string; country_fr: string; country_en: string }[]>('scope_grid', () =>
    db.from('scope_grid').select('country_iso, country_fr, country_en').eq('grid_version', 'v1'),
  ).then((rows) => {
    if (!rows) return null;
    const seen = new Map<string, { iso: string; fr: string; en: string }>();
    for (const r of rows) if (!seen.has(r.country_iso)) seen.set(r.country_iso, { iso: r.country_iso, fr: r.country_fr, en: r.country_en });
    return [...seen.values()].sort((a, b) => a.fr.localeCompare(b.fr));
  });

/* ------------------------------------------------------------------ */
/* Knowledge Gaps                                                       */
/* ------------------------------------------------------------------ */

export type GapState = 'couvert' | 'aucune_donnee_recente' | 'periode_inconnue' | 'aucune_donnee';

export type GapSection = 'maladies' | 'etats_nutritionnels' | 'indicateurs';

export interface GapCell {
  grid_version: string; section: GapSection;
  country_iso: string; country_fr: string; country_en: string;
  disease_canonical: string; disease_en: string; rationale: string;
  /** Portée par l'ENTITÉ (unit_hint), jamais recopiée dans la grille. */
  unit_hint: string | null;
  observations_inherited: number;
  observations: number; years: number[] | null; state: GapState;
}

export interface Freshness {
  name: string; item_count: number; unit: string; generated_at: string;
  observations: number | null; is_stale: boolean;
}

export const getGaps = () =>
  safe<GapCell[]>('coverage_gaps', () => db.from('coverage_gaps').select('*').eq('grid_version', 'v1'));

export const getIndicators = () =>
  safe<{ indicator: string; label_fr: string; label_en: string; status: string; note: string }[]>('scope_indicators', () =>
    db.from('scope_indicators').select('*'));

export interface CoverageReach {
  observations_total: number; observations_located: number;
  observations_unlocated: number; observations_dated: number;
}

/** Portée réelle : le compte des observations hors carte vient de la BASE. */
export const getCoverageReach = () =>
  safe<CoverageReach[]>('coverage_reach', () => db.from('coverage_reach').select('*').limit(1)).then((r) => r?.[0] ?? null);

/** Date de la DONNÉE, pas du rendu : la vue matérialisée ne suit pas le corpus toute seule. */
export const getFreshness = () =>
  safe<Freshness[]>('data_freshness', () => db.from('data_freshness').select('*').limit(1)).then((r) => r?.[0] ?? null);

/** Qualité par pays, pour l'onglet Qualité. */
export const getAllCountryQuality = () =>
  safe<CountryQuality[]>('country_quality', () => db.from('country_quality').select('*').order('observations', { ascending: false }));

/* ------------------------------------------------------------------ */
/* Disease Explorer + Researchers                                       */
/* ------------------------------------------------------------------ */

export interface SearchRow {
  evidence_id: string; claim: string; numeric_value: number | null; numeric_unit: string | null;
  temporal_context: string | null; language: string; evidence_type: string;
  topics: string[]; countries: string[]; sections: string[];
  origin: string | null; source: string | null; doi: string | null; pmid: string | null;
  publication_title: string | null; journal: string | null; publication_year: number | null;
  total_count: number;
}

/**
 * ⚠️ RÉESSAI SUR LE CHEMIN FROID, ET SEULEMENT SUR LUI.
 *
 * `search_evidence` met 1,4 à 3,7 s au premier accès — les vues sont matérialisées et
 * le rendu ISR touche des pages froides. Sans reprise, la page est GELÉE sur son
 * diagnostic jusqu'à la prochaine régénération, soit un quart d'heure : constaté sur
 * `/fr/evidence`, l'écran vers lequel un relecteur est envoyé, qui affichait « cet
 * écran n'a pas pu être affiché » sur un corpus de 63 227 evidences.
 *
 * L'explorateur du graphe avait déjà cette reprise, côté client ; celui-ci est rendu
 * par le serveur et n'en avait aucune. Le même défaut, sur deux chemins différents.
 *
 * TROIS tentatives, pas deux. Avec une seule reprise, deux expirations consécutives
 * suffisaient encore à geler l'écran — constaté au navigateur alors que `curl` passait.
 * Chaque tentative réchauffe un peu plus les pages ; la troisième est celle qui tient.
 *
 * On ne réessaie QUE sur `57014` : un réessai sur une vue absente ou un droit refusé
 * doublerait l'attente sans rien changer, et masquerait la cause derrière une lenteur.
 */
async function reessaiFroid<T>(
  nom: string,
  run: () => PromiseLike<{ data: T | null; error: { message: string; code?: string } | null }>,
  essais = 3,
) {
  let dernier = await run();
  for (let i = 1; i < essais; i++) {
    const froid = dernier.error
      && (dernier.error.code === '57014' || /statement timeout|canceling statement/i.test(dernier.error.message));
    // On ne réessaie QUE sur un dépassement de délai. Sur une vue absente ou un droit
    // refusé, réessayer doublerait l'attente sans rien changer.
    if (!froid) break;
    dernier = await run();
  }
  return safe<T>(nom, () => Promise.resolve(dernier));
}

export const searchEvidence = (p: {
  q?: string; topic?: string; country?: string; language?: string; section?: string;
  limit?: number; offset?: number;
}) =>
  reessaiFroid<SearchRow[]>('search_evidence', () => db.rpc('search_evidence', {
    p_q: p.q || null, p_topic: p.topic || null, p_country: p.country || null,
    p_language: p.language || null, p_section: p.section || null,
    p_limit: p.limit ?? 25, p_offset: p.offset ?? 0,
  }));

export const getSearchFacets = () =>
  safe<{ section: string; topic: string; evidences: number; countries: number }[]>('search_facets', () =>
    db.from('search_facets').select('*').order('evidences', { ascending: false }));

export interface Researcher {
  id: string; full_name: string; country: string | null; city: string | null;
  domain: string | null; orcid: string; verified_status: string | null; publications: number;
}

export const getResearchers = () =>
  safe<Researcher[]>('researcher', () => db.from('researcher').select('*').order('publications', { ascending: false }));

export const getResearcherPublications = (researcherId: string) =>
  safe<{ publication_id: string; title: string; journal: string | null; publication_year: number | null; doi: string | null; pmid: string | null; external_source: string | null }[]>('researcher_publications', () =>
    db.from('researcher_publications').select('*').eq('researcher_id', researcherId).order('publication_year', { ascending: false }));

/**
 * Agrégat NON NOMINATIF : d'où vient la production documentée, sans nommer personne.
 *
 * L'agrégation par pays se fait EN BASE (030). Elle se faisait ici, sur les 400 premières
 * des 1 350 lignes de `evidence_origin_by_country` : les pays à faible volume tombaient
 * sous la coupe et leur part affichée était fausse, sans erreur ni signal. Sommer des
 * comptes par maladie double-comptait de surcroît les evidences portant plusieurs
 * maladies ; la vue compte des evidences DISTINCTES.
 */
export const getEvidenceOrigin = () =>
  safe<{ researcher_country: string; evidences: number; topics: number }[]>('evidence_origin_totals', () =>
    db.from('evidence_origin_totals').select('*').order('evidences', { ascending: false }));

/* ------------------------------------------------------------------ */
/* Dénominateurs : ce que le périmètre voit, ce que le corpus porte     */
/* ------------------------------------------------------------------ */

export interface TopicReach {
  topic: string; section: string;
  evidences_corpus: number; evidences_located: number;
  evidences_in_scope: number; evidences_unlocated: number;
}

export interface ScopeReach {
  countries_in_scope: number; countries_in_corpus: number;
  topics_in_scope: number; topics_in_corpus: number; cells: number;
  observations_unlocated: number; observations_total: number;
}

/**
 * UNIQUEMENT les sujets du périmètre. `topic_reach` porte 3 388 lignes — toute la
 * longue traîne du corpus — et PostgREST en renvoie mille au plus : un select
 * sans filtre ramenait des sujets quelconques et jamais ceux de la grille, donc
 * aucun dénominateur ne s'affichait. Le plafond ne lève pas d'erreur, il tronque.
 */
export const getTopicReach = (topics: string[]) =>
  topics.length === 0
    ? Promise.resolve([] as TopicReach[])
    : safe<TopicReach[]>('topic_reach', () => db.from('topic_reach').select('*').in('topic', topics));

export const getScopeReach = () =>
  safe<ScopeReach[]>('scope_reach', () => db.from('scope_reach').select('*').limit(1)).then((r) => r?.[0] ?? null);

export const getUnlocatedBySection = () =>
  safe<{ section: string; evidences_unlocated: number; evidences_total: number }[]>('unlocated_by_section', () =>
    db.from('unlocated_by_section').select('*'));

/* ------------------------------------------------------------------ */
/* Charge de morbidité — la seule surface où une VALEUR est agrégée    */
/* ------------------------------------------------------------------ */

export interface BurdenRow {
  iso: string; country: string; disease: string;
  n_observations: number; n_evidences: number;
  median_pct: number | null; n_units: number;
  first_year: number | null; last_year: number | null;
  n_dated: number; n_inherited: number; n_from_author: number;
}

/**
 * `burden_canonical` — charge filtrée sur `prevalence_incidence × disease` ET
 * restreinte aux concepts du référentiel PAR JOINTURE EN BASE (migration 040).
 *
 * Aucune liste de canoniques n'est recopiée ici, et c'est la raison d'être de la 040 :
 * la même liste dans deux dépôts finit par diverger sans que rien ne le signale. Le
 * portail ne sait pas ce qu'est un concept canonique, il lit une vue qui le sait.
 *
 * La vue rend ZÉRO ligne si le référentiel n'est pas chargé en base. C'est voulu :
 * une carte vide se remarque, une carte silencieusement non filtrée ne se remarque pas.
 */
export const getBurdenCanonical = () =>
  safe<BurdenRow[]>('burden_canonical', () =>
    db.from('burden_canonical').select('*').order('n_observations', { ascending: false }));

export interface ReferentialCoverage {
  observations_disease: number;
  observations_in_referential: number;
  observations_out_of_referential: number;
  concepts_in_referential: number;
  referential_version: string;
}

/**
 * Part du corpus portant un libellé hors du vocabulaire de référence.
 *
 * Cette vue existe pour qu'un chiffre publié soit LU et non recopié. La note du profil
 * pays a porté trois formulations : un chiffre tapé à la main — juste à l'écriture,
 * périmable au premier rechargement d'entités —, puis l'aveu qu'il n'était pas
 * calculable, et enfin celle-ci. La version du référentiel est rendue avec le chiffre :
 * une part n'a de sens que rapportée à ce contre quoi elle a été mesurée.
 */
export const getReferentialCoverage = () =>
  safe<ReferentialCoverage[]>('referential_coverage', () =>
    db.from('referential_coverage').select('*').limit(1)).then((r) => r?.[0] ?? null);

/* ------------------------------------------------------------------ */
/* Knowledge Graph                                                      */
/*                                                                      */
/* Trois lectures, et la troisième n'est pas décorative.                */
/*                                                                      */
/* `graph_meta` porte le SEUIL de co-mention. Il est LU, jamais recopié :*/
/* si le bloc C n'est pas appliqué, `comention_min_weight` vaut NULL,    */
/* `graph_neighbors` sans `p_edge` rend des evidences triées            */
/* alphabétiquement au lieu de co-mentions triées par poids, et rien     */
/* d'autre ne le dit. Un écran qui ne lit pas cette colonne ne peut pas  */
/* savoir lequel des deux comportements il affiche.                     */
/*                                                                      */
/* `graph_top_nodes` est le centre de gravité du corpus : 12 lieux,      */
/* 7 maladies, 1 population. AUCUN chercheur, aucune publication, aucune */
/* evidence — leurs degrés sont un à deux ordres de grandeur en dessous. */
/*                                                                      */
/* D'où les PORTES. Sans elles, atteindre un chercheur depuis l'écran    */
/* d'accueil demande trois sauts, dont un à travers 65 891 evidences.    */
/* La porte est le nœud le plus connecté d'un type que le top 20 ne      */
/* contient pas ; elle ramène le trajet à un clic.                      */
/*                                                                      */
/* ⚠️ Elle ne corrige RIEN. Le premier chercheur du corpus est à 466     */
/* voisins quand Nigeria est à 15 219 — un facteur 33, qui est la        */
/* couverture de 22,4 % de la chaîne chercheur rendue géométrique. La    */
/* porte rend ce nœud atteignable ; l'écran doit dire qu'il est loin.    */
/* Une porte sans son degré ferait paraître le graphe mieux relié qu'il  */
/* n'est — le même défaut que la troncature non signalée, déplacé au     */
/* point d'entrée.                                                      */
/* ------------------------------------------------------------------ */

export interface GraphMeta {
  comention_min_weight: number | null;
  comention_pairs_kept: number | null;
  comention_pairs_hidden: number | null;
  default_neighbor_limit: number | null;
  node_types: string[];
  edge_types: string[];
  comention_excluded_types: string[];
  neighbors_default_dominant_edge: string | null;
}

export interface GraphTopNode {
  rank: number;
  node_type: string;
  node_id: string;
  node_label: string;
  degree_total: number;
  degree_co_mention: number;
  degree_mentionne: number;
}

export const getGraphMeta = () =>
  safe<GraphMeta[]>('graph_meta', () => db.from('graph_meta').select('*').limit(1)).then((r) => r?.[0] ?? null);

export const getGraphTopNodes = () =>
  safe<GraphTopNode[]>('graph_top_nodes', () => db.from('graph_top_nodes').select('*').order('rank'));

/** Une porte : le nœud le plus connecté d'un type absent du top 20. */
export interface GraphDoor {
  node_type: string;
  node_id: string;
  node_label: string;
  degree_total: number;
  /** Nombre de nœuds de ce type dans le corpus — la porte en représente UN. */
  type_count: number;
}

/**
 * `graph_node_degree` classe par degré mais NE PORTE PAS `node_label` — les
 * libellés ne vivent que dans `graph_top_nodes`, qui par construction ne
 * contient aucun de ces types. Le libellé est donc résolu par un appel à
 * `graph_neighbors` avec `p_limit: 1`, dont `source_label` le rend.
 *
 * Deux allers-retours par porte. C'est le prix d'un libellé lisible pour un
 * `node_id` qui est un UUID ; à `revalidate = 900`, il est payé quatre fois
 * par quart d'heure.
 */
async function porte(type: string): Promise<GraphDoor | null> {
  // Le plus connecté du type, et combien il y en a — indépendants, donc en parallèle.
  const [tete, compte] = await Promise.all([
    safe<{ node_id: string; degree_total: number }[]>(`graph_node_degree(${type})`, () =>
      db.from('graph_node_degree').select('node_id, degree_total')
        .eq('node_type', type).order('degree_total', { ascending: false }).limit(1)),
    db.from('graph_node_degree').select('*', { count: 'exact', head: true })
      .eq('node_type', type).then((r) => r.count),
  ]);
  if (!tete?.length) return null;
  const n = tete[0];

  const v = await safe<{ source_label: string }[]>(`graph_neighbors(${type} libellé)`, () =>
    db.rpc('graph_neighbors', { p_node_type: type, p_node_id: n.node_id, p_limit: 1, p_edge: null }));

  // Sans libellé, la porte serait un UUID nu. On la retire plutôt que de l'afficher
  // illisible : un point d'entrée qu'on ne peut pas nommer n'en est pas un.
  const label = v?.[0]?.source_label;
  if (!label) return null;

  return {
    node_type: type, node_id: n.node_id, node_label: label,
    degree_total: n.degree_total, type_count: compte ?? 0,
  };
}

/**
 * Les portes, pour les types que le top 20 n'atteint pas.
 *
 * `evidence` et `publication` en sont EXCLUS volontairement : leurs degrés
 * plafonnent à 22 et 43, et il y en a 65 891 et 8 216. Un exemplaire tiré au
 * degré n'y représente rien — et les deux sont déjà à un clic de n'importe
 * quelle maladie par `p_edge = 'MENTIONNE'`. Une porte ne se justifie que là
 * où le trajet est autrement long.
 */
export const getGraphDoors = () =>
  Promise.all([porte('researcher'), porte('drug')]).then((d) => d.filter((x): x is GraphDoor => x !== null));

/* ------------------------------------------------------------------ */
/* Graphe — le point d'entrée à 100 nœuds                              */
/*                                                                      */
/* `graph_entry` remplace `graph_top_nodes` : 100 nœuds ÉQUILIBRÉS par  */
/* type — 30 maladies, 25 pays, 15 chercheurs, 15 publications, 15      */
/* evidences — au lieu de 20 nœuds classés par degré, qui ne pouvaient  */
/* par construction contenir aucun chercheur.                           */
/*                                                                      */
/* ⚠️ `graph_entry` NE PORTE PAS DE LIBELLÉ. Trois colonnes :           */
/* node_type, node_id, role. Pour une maladie ou un pays, `node_id` EST */
/* le libellé ; pour un chercheur, une publication ou une evidence,     */
/* c'est un UUID. Les libellés viennent de `graph_node` (99 687 lignes),*/
/* joints sur le COUPLE (type, id) — `node_id` n'est unique que par     */
/* type, et joindre sur l'id seul ramènerait le mauvais libellé le jour */
/* où deux types partagent une valeur.                                  */
/*                                                                      */
/* `role` vaut `degre` (70) ou `pont` (30) : pourquoi ce nœud est là.   */
/* Un pont n'est pas retenu pour son importance mais pour ce qu'il      */
/* relie — c'est ce qui permet à la chaîne chercheur → publication →    */
/* evidence d'exister à l'écran alors qu'elle ne couvre que 22,4 % du   */
/* corpus.                                                              */
/* ------------------------------------------------------------------ */

export interface GraphEntryNode {
  node_type: string; node_id: string; role: 'degre' | 'pont'; node_label: string;
}
export interface GraphEntryEdge {
  source_type: string; source_id: string; edge: string;
  target_type: string; target_id: string; weight: number | null;
}
export interface GraphEntryMeta {
  nodes: number; edges_shown: number; edges_hidden: number;
  entry_min_comention_weight: number | null;
  nodes_by_type: Record<string, number>;
}

export const getGraphEntryMeta = () =>
  safe<GraphEntryMeta[]>('graph_entry_meta', () => db.from('graph_entry_meta').select('*').limit(1))
    .then((r) => r?.[0] ?? null);

export const getGraphEntryEdges = () =>
  safe<GraphEntryEdge[]>('graph_entry_edges', () => db.from('graph_entry_edges').select('*'));

/** Les 100 nœuds, libellés résolus. Rend `null` si la lecture n'aboutit pas. */
export async function getGraphEntry(): Promise<GraphEntryNode[] | null> {
  const socle = await safe<{ node_type: string; node_id: string; role: 'degre' | 'pont' }[]>(
    'graph_entry', () => db.from('graph_entry').select('*'));
  if (!socle?.length) return null;

  const labels = await safe<{ node_type: string; node_id: string; node_label: string }[]>(
    'graph_node', () => db.from('graph_node').select('node_type, node_id, node_label')
      .in('node_id', [...new Set(socle.map((n) => n.node_id))]));

  // Clé COMPOSITE : le type ET l'id. Voir l'en-tête — c'est le seul appariement sûr.
  const carte = new Map((labels ?? []).map((r) => [`${r.node_type}:${r.node_id}`, r.node_label]));
  return socle.map((n) => ({
    ...n,
    // Un libellé manquant retombe sur l'id : illisible pour un UUID, mais JAMAIS vide.
    // Un nœud sans nom ne se clique pas — on ne désigne pas ce qu'on ne peut pas nommer.
    node_label: carte.get(`${n.node_type}:${n.node_id}`) ?? n.node_id,
  }));
}

/**
 * Provenance d'un lot d'evidences — `public_api.evidence_source`, 72 932 lignes.
 *
 * Le pendant SERVEUR de la jointure que `chercherEvidences` fait côté client. Les deux
 * lisent la même vue et rendent la même forme ; ce qui diffère est seulement d'où part
 * l'appel. `LigneEvidence` reçoit le résultat des deux, donc le rendu ne peut pas
 * diverger — c'est la raison d'être du fichier commun.
 */
export interface Provenance {
  evidence_id: string;
  source_url: string | null;
  source_path: string | null;
  /**
   * ⚠️ CE DOI N'EST PAS CELUI DE `search_evidence`.
   * Celui-ci vient de `evidence_source` ; l'autre vient de la table `publications` par
   * jointure, et il est NUL sur des lignes où celui-ci est renseigné — constaté sur
   * `10.1038/oby.2009.73`, dont la ligne n'affichait aucun identifiant alors qu'elle
   * en a un. Deux champs du même nom, deux origines, deux contenus.
   */
  doi: string | null;
  /** Observations PRODUITES par le document. Ne jamais afficher — voir le champ gold. */
  n_evidences: number | null;
  /** Observations VALIDÉES du document : les seules que le portail montre. */
  n_evidences_gold: number | null;
}

export const getProvenance = (ids: string[]) =>
  ids.length === 0
    ? Promise.resolve(new Map<string, Provenance>())
    : reessaiFroid<Provenance[]>('evidence_source', () =>
        db.from('evidence_source')
          .select('evidence_id, source_url, source_path, doi, n_evidences, n_evidences_gold')
          .in('evidence_id', ids),
      ).then((r) => new Map((r ?? []).map((x) => [x.evidence_id, x])));
