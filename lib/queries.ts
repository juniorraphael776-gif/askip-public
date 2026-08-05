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

export interface CountryTotal { country: string; iso: string | null; observations: number; diseases_documented: number }
export interface DiseaseTotal { disease: string; observations: number; countries_documented: number }
export interface TimelinePoint { year: number; observations: number }
export interface CountryProfileRow {
  country: string; iso: string | null; disease: string; observations: number;
  years: number[] | null; has_inherited_location: boolean; disease_is_normalized: boolean;
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

export const searchEvidence = (p: {
  q?: string; topic?: string; country?: string; language?: string; section?: string;
  limit?: number; offset?: number;
}) =>
  safe<SearchRow[]>('search_evidence', () => db.rpc('search_evidence', {
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
