/**
 * ASKIP public — lectures.
 *
 * RÈGLE UNIQUE ET NON NÉGOCIABLE : ces fonctions renvoient des COMPTES
 * d'observations. Aucune ne calcule de moyenne, de médiane ou de somme de
 * numeric_value. Le type de mesure d'une valeur est inconnu (9 % seulement des
 * valeurs en '%' sont de vraies prévalences), donc toute agrégation de valeurs
 * produirait un chiffre faux d'apparence crédible.
 *
 * Toutes les vues lues vivent dans le schéma public_api (migration 020).
 */
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

/** null = la surface publique n'est pas encore en place (migration 020 non appliquée). */
// Le builder Supabase est « thenable », pas une Promise : PromiseLike, pas Promise.
async function safe<T>(run: () => PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T | null> {
  const { data, error } = await run();
  if (error) { console.error('[public_api]', error.message); return null; }
  return data;
}

export const getOverview = () =>
  safe<OverviewCounts[]>(() => db.from('overview_counts').select('*').limit(1)).then((r) => r?.[0] ?? null);

export const getCountryTotals = (limit = 12) =>
  safe<CountryTotal[]>(() => db.from('country_totals').select('*').order('observations', { ascending: false }).limit(limit));

export const getDiseaseTotals = (limit = 20) =>
  safe<DiseaseTotal[]>(() => db.from('disease_totals').select('*').order('observations', { ascending: false }).limit(limit));

export const getTimeline = () =>
  safe<TimelinePoint[]>(() => db.from('timeline').select('*').order('year', { ascending: true }));

export const getCountryProfile = (iso: string) =>
  safe<CountryProfileRow[]>(() => db.from('country_profile').select('*').eq('iso', iso).order('observations', { ascending: false }));

export const getCountryQuality = (country: string) =>
  safe<CountryQuality[]>(() => db.from('country_quality').select('*').eq('country', country).limit(1)).then((r) => r?.[0] ?? null);

/** Liste des pays de la grille, pour la navigation. */
export const getGridCountries = () =>
  safe<{ country_iso: string; country_fr: string; country_en: string }[]>(() =>
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
  disease_canonical: string; disease_en: string; unit: string | null; rationale: string;
  observations: number; years: number[] | null; state: GapState;
}

export interface Freshness {
  name: string; item_count: number; unit: string; generated_at: string;
  observations: number | null; is_stale: boolean;
}

export const getGaps = () =>
  safe<GapCell[]>(() => db.from('coverage_gaps').select('*').eq('grid_version', 'v1'));

export const getIndicators = () =>
  safe<{ indicator: string; label_fr: string; label_en: string; status: string; note: string }[]>(() =>
    db.from('scope_indicators').select('*'));

/** Date de la DONNÉE, pas du rendu : la vue matérialisée ne suit pas le corpus toute seule. */
export const getFreshness = () =>
  safe<Freshness[]>(() => db.from('data_freshness').select('*').limit(1)).then((r) => r?.[0] ?? null);

/** Qualité par pays, pour l'onglet Qualité. */
export const getAllCountryQuality = () =>
  safe<CountryQuality[]>(() => db.from('country_quality').select('*').order('observations', { ascending: false }));
