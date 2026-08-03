/**
 * Écran 4 — Knowledge Gaps. Le plus important, et le plus facile à rater.
 *
 * Un manque ne se déduit pas d'un vide : il se mesure contre un périmètre
 * DÉCLARÉ (scope_grid, migration 021), curé à la main et téléchargeable. Sans
 * cette grille, « il manque X » serait une impression, pas une mesure.
 *
 * TROIS FAMILLES, dont deux seulement sont mesurables aujourd'hui :
 *   COUVERTURE — pays × maladie × période. On compte des observations sans les
 *                qualifier : l'affirmation « ce corpus ne contient rien pour ce
 *                couple » est vérifiable.
 *   INDICATEUR — attend evidences.measure_type. Affiché « en attente » plutôt
 *                que vide : une case vide se lirait comme une absence mesurée.
 *   QUALITÉ    — ce qui est là mais incertain : non daté, localisation héritée.
 *
 * CINQ ÉTATS, dont « période inconnue » qui est indispensable : 69 % des
 * observations n'ont aucune année. Écrire « aucune donnée récente » sur
 * celles-là serait faux — nous ignorons quand elles ont été produites, ce qui
 * n'est pas la même chose qu'être ancien.
 */
import { notFound } from 'next/navigation';
import { isLang, t, type Lang } from '@/lib/i18n';
import { getAllCountryQuality, getCoverageReach, getFreshness, getGaps, getIndicators, getOverview, type GapCell, type GapSection, type GapState } from '@/lib/queries';
import { Empty, KeyFact, MethodBanner, Note, Section, num } from '@/app/ui';
import { GAP_STATE, GOLD, INK, LINE, MUTED } from '@/lib/theme';

export const revalidate = 900;

const ORDER: GapState[] = ['couvert', 'aucune_donnee_recente', 'periode_inconnue', 'aucune_donnee'];
const SECTIONS: GapSection[] = ['maladies', 'etats_nutritionnels', 'indicateurs'];
const SECTION_LABEL: Record<GapSection, { fr: string; en: string }> = {
  maladies:            { fr: 'Maladies',              en: 'Diseases' },
  etats_nutritionnels: { fr: 'États nutritionnels',   en: 'Nutritional status' },
  indicateurs:         { fr: 'Indicateurs suivis',    en: 'Tracked indicators' },
};
const SECTION_HINT: Record<GapSection, { fr: string; en: string }> = {
  maladies:            { fr: 'une condition qu’une personne a', en: 'a condition a person has' },
  etats_nutritionnels: { fr: 'un état mesuré par des indices anthropométriques', en: 'a state measured by anthropometric indices' },
  indicateurs:         { fr: 'une mesure sur une population, pas sur un individu', en: 'a measure over a population, not an individual' },
};
const SECTION_COL: Record<GapSection, { fr: string; en: string }> = {
  maladies:            { fr: 'Maladie',   en: 'Disease' },
  etats_nutritionnels: { fr: 'État',      en: 'Status' },
  indicateurs:         { fr: 'Indicateur', en: 'Indicator' },
};
const LABEL: Record<GapState, { fr: string; en: string }> = {
  couvert:               { fr: 'Couvert',               en: 'Covered' },
  aucune_donnee_recente: { fr: 'Aucune donnée récente', en: 'No recent data' },
  periode_inconnue:      { fr: 'Période inconnue',      en: 'Period unknown' },
  aucune_donnee:         { fr: 'Aucune donnée',         en: 'No data' },
};

const EXPLAIN: Record<GapState, { fr: string; en: string }> = {
  couvert:               { fr: 'au moins une observation postérieure à 2022', en: 'at least one observation after 2022' },
  aucune_donnee_recente: { fr: 'des observations existent, la plus récente est antérieure à 2022', en: 'observations exist, the most recent predates 2022' },
  periode_inconnue:      { fr: 'des observations existent, aucune ne porte d’année — elles ne sont pas anciennes pour autant', en: 'observations exist but none carries a year — that does not make them old' },
  aucune_donnee:         { fr: 'aucune observation dans CE corpus — pas « aucune donnée au monde »', en: 'no observation in THIS corpus — not "no data anywhere"' },
};

export default async function Gaps({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const L = lang as Lang;

  const [cells, indicators, freshness, quality, overview] = await Promise.all([
    getGaps(), getIndicators(), getFreshness(), getAllCountryQuality(), getOverview(),
  ]);
  const reach = await getCoverageReach();

  if (!cells) return <Empty>migrations/020 et 021 non appliquées.</Empty>;
  if (cells.length === 0) return <Empty>La grille de référence est vide : appliquer migrations/021_scope_grid_v1.sql.</Empty>;

  const countries = [...new Map(cells.map((c) => [c.country_iso, c])).values()]
    .sort((a, b) => (L === 'fr' ? a.country_fr.localeCompare(b.country_fr) : a.country_en.localeCompare(b.country_en)));

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: INK }}>{t(L, 'nav_gaps')}</h1>
        <p className="mt-1 text-sm" style={{ color: MUTED }}>
          {L === 'fr'
            ? `Mesuré contre un périmètre déclaré de ${countries.length} pays, curé à la main, en trois sections qui ne s’additionnent pas.`
            : `Measured against a declared scope of ${countries.length} countries, curated by hand, in three sections that do not add up.`}
        </p>
      </header>

      {/* EN TÊTE, avant la grille : une cellule vide peut l'être parce que la donnée
          existe sans localisation exploitable. Le lecteur doit le savoir d'abord. */}
      {reach ? (
        <KeyFact
          title={t(L, 'unmapped_title')}
          value={`${num(reach.observations_unlocated, L)} ${t(L, 'of')} ${num(reach.observations_total, L)}`}
          body={`${Math.round((reach.observations_unlocated / Math.max(1, reach.observations_total)) * 100)} % ${t(L, 'unmapped_body')}`}
        />
      ) : null}

      <MethodBanner text={
        L === 'fr'
          ? "Une cellule vide signifie « aucune observation dans ce corpus », jamais « aucune donnée au monde ». Le périmètre est une décision publiée : ce qui n'y figure pas n'est pas un manque, c'est un choix. Les manques d'INDICATEUR (prévalence, couverture vaccinale…) ne sont pas mesurables aujourd'hui — voir plus bas."
          : "An empty cell means “no observation in this corpus”, never “no data anywhere”. The scope is a published decision: what is not in it is not a gap, it is a choice. INDICATOR gaps (prevalence, vaccination coverage…) cannot be measured yet — see below."
      } />

      {freshness ? (
        <p className="mb-6 text-[12px]" style={{ color: freshness.is_stale ? '#B04A2F' : MUTED }}>
          {t(L, 'generated')} {freshness.generated_at.slice(0, 10)}
          {freshness.is_stale
            ? (L === 'fr' ? ' — données de plus de sept jours, un rafraîchissement est dû.' : ' — data older than seven days, a refresh is due.')
            : ''}
        </p>
      ) : null}

      {/* ---------- Onglet 1 : COUVERTURE ---------- */}
      <Section title={L === 'fr' ? '1. Couverture' : '1. Coverage'}
               hint={`${L === 'fr' ? 'mesurable aujourd’hui — des comptes d’observations, sans qualification' : 'measurable today — observation counts, unqualified'} · ${t(L, 'gold_tier')}`}>
        {SECTIONS.map((sec) => {
          const rows = cells.filter((c) => c.section === sec);
          if (!rows.length) return null;
          const topics = [...new Map(rows.map((c) => [c.disease_canonical, c])).values()]
            .sort((a, b) => a.disease_canonical.localeCompare(b.disease_canonical));
          const idx = new Map(rows.map((c) => [`${c.country_iso}|${c.disease_canonical}`, c]));
          const per = ORDER.map((s) => ({ s, n: rows.filter((c) => c.state === s).length }));

          return (
            <div key={sec} className="mb-8">
              <h3 className="mb-1 text-[13px] font-semibold uppercase tracking-wide" style={{ color: INK }}>
                {SECTION_LABEL[sec][L]}
              </h3>
              <p className="mb-2 text-[11px]" style={{ color: MUTED }}>{SECTION_HINT[sec][L]}</p>

              {/* Total BORNÉ à cette section. Il n'existe aucun total transversal :
                  additionner une condition individuelle et une mesure de population
                  produirait un nombre qui ne désigne rien. */}
              <p className="mb-2 text-[11px]" style={{ color: MUTED }}>
                {per.map(({ s, n }) => `${n} ${LABEL[s][L].toLowerCase()}`).join(' · ')}
                {' · '}{rows.length} {L === 'fr' ? 'cellules dans cette section' : 'cells in this section'}
              </p>

              <div className="overflow-x-auto rounded-lg" style={{ border: `1px solid ${LINE}`, background: '#fff' }}>
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr>
                      <th className="sticky left-0 bg-white px-3 py-2 text-left" style={{ borderBottom: `1px solid ${LINE}` }}>
                        {SECTION_COL[sec][L]}
                      </th>
                      {countries.map((c) => (
                        <th key={c.country_iso} className="px-1 py-2 text-center font-medium"
                            style={{ borderBottom: `1px solid ${LINE}`, color: MUTED }}>{c.country_iso}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topics.map((d) => (
                      <tr key={d.disease_canonical}>
                        <td className="sticky left-0 bg-white px-3 py-1.5" style={{ borderBottom: `1px solid ${LINE}` }}>
                          {L === 'fr' ? d.disease_canonical : d.disease_en}
                          {/* unité portée par l'en-tête de ligne, quand le sujet en appelle une */}
                          {d.unit_hint ? <span className="ml-1 text-[10px]" style={{ color: MUTED }}>({d.unit_hint})</span> : null}
                        </td>
                        {countries.map((c) => {
                          const cell = idx.get(`${c.country_iso}|${d.disease_canonical}`);
                          const st = (cell?.state ?? 'aucune_donnee') as GapState;
                          const sty = GAP_STATE[st]!;
                          const title = `${L === 'fr' ? c.country_fr : c.country_en} · ${L === 'fr' ? d.disease_canonical : d.disease_en}\n${LABEL[st][L]} — ${EXPLAIN[st][L]}\n${num(cell?.observations ?? 0, L)} ${t(L, 'observations')}`;
                          return (
                            <td key={c.country_iso} className="p-[3px] text-center" style={{ borderBottom: `1px solid ${LINE}` }}>
                              <a href={`/${L}/evidence?country=${encodeURIComponent(c.country_fr)}&topic=${encodeURIComponent(d.disease_canonical)}`}
                                 title={title} className="block rounded py-1 text-[10px] font-semibold"
                                 style={{ background: sty.bg, color: sty.fg }}>
                                {cell?.observations ? num(cell.observations, L) : '·'}
                              </a>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        <div className="mt-3 flex flex-wrap gap-3 text-[11px]">
          {ORDER.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <i className="inline-block h-3 w-3 rounded" style={{ background: GAP_STATE[s]!.bg }} />
              <span style={{ color: MUTED }}>{LABEL[s][L]}</span>
            </span>
          ))}
        </div>

        <Note>
          {L === 'fr'
            ? 'Les trois sections ne s’additionnent pas : une maladie est une condition qu’une personne a, un indicateur une mesure sur une population. Aucun total transversal n’est proposé — la recherche et les filtres, eux, traversent tout.'
            : 'The three sections do not add up: a disease is a condition a person has, an indicator is a measure over a population. No cross-section total is offered — search and filters, however, span everything.'}
        </Note>
      </Section>

      {/* ---------- Onglet 2 : INDICATEURS ---------- */}
      <Section title={L === 'fr' ? '2. Indicateurs' : '2. Indicators'}
               hint={L === 'fr' ? 'non mesurable aujourd’hui — instrumentation en attente' : 'not measurable today — instrumentation pending'}>
        <div className="rounded-lg p-4" style={{ background: '#FFF9E8', border: `1px solid ${LINE}` }}>
          <p className="mb-3 text-[13px]" style={{ color: INK }}>
            {L === 'fr'
              ? "Dire « il manque une prévalence » suppose de reconnaître une prévalence présente. Le corpus ne le permet pas : 9 % seulement des valeurs en pourcentage sont de vraies prévalences de maladie, le reste mêle sensibilités de test, taux de guérison et fréquences génotypiques. Ces lignes attendent le champ measure_type."
              : "Saying “a prevalence is missing” requires recognising a prevalence when present. The corpus cannot: only 9 % of percentage values are true disease prevalences, the rest mixes test sensitivities, cure rates and genotype frequencies. These rows await the measure_type field."}
          </p>
          <ul className="flex flex-col gap-2">
            {(indicators ?? []).map((i) => (
              <li key={i.indicator} className="flex flex-wrap items-baseline gap-2 text-[13px]">
                <span className="font-medium" style={{ color: INK }}>{L === 'fr' ? i.label_fr : i.label_en}</span>
                <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase" style={{ background: '#E8E3D5', color: MUTED }}>
                  {L === 'fr' ? 'en attente' : 'pending'}
                </span>
                <span className="min-w-0 flex-1 text-[11px]" style={{ color: MUTED }}>{i.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ---------- Onglet 3 : QUALITÉ ---------- */}
      <Section title={L === 'fr' ? '3. Qualité' : '3. Quality'}
               hint={L === 'fr' ? 'ce qui est là, mais avec quelle confiance' : 'what is there, and how confident we are'}>
        <div className="overflow-x-auto rounded-lg" style={{ border: `1px solid ${LINE}`, background: '#fff' }}>
          <table className="w-full min-w-[520px] border-collapse text-[13px]">
            <thead>
              <tr style={{ color: MUTED }}>
                <th className="px-3 py-2 text-left" style={{ borderBottom: `1px solid ${LINE}` }}>{L === 'fr' ? 'Pays' : 'Country'}</th>
                <th className="px-3 py-2 text-right" style={{ borderBottom: `1px solid ${LINE}` }}>{t(L, 'observations')}</th>
                <th className="px-3 py-2 text-right" style={{ borderBottom: `1px solid ${LINE}` }}>{t(L, 'dated')}</th>
                <th className="px-3 py-2 text-right" style={{ borderBottom: `1px solid ${LINE}` }}>{t(L, 'inherited')}</th>
              </tr>
            </thead>
            <tbody>
              {(quality ?? []).slice(0, 20).map((q) => (
                <tr key={q.country}>
                  <td className="px-3 py-1.5" style={{ borderBottom: `1px solid ${LINE}` }}>{q.country}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums" style={{ borderBottom: `1px solid ${LINE}` }}>{num(q.observations, L)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums" style={{ borderBottom: `1px solid ${LINE}`, color: MUTED }}>
                    {Math.round((q.dated / Math.max(1, q.observations)) * 100)} %
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums" style={{ borderBottom: `1px solid ${LINE}`, color: MUTED }}>
                    {Math.round((q.location_inherited / Math.max(1, q.observations)) * 100)} %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note>
          {L === 'fr'
            ? 'Une localisation héritée signifie que le pays vient du contexte de l’étude, pas du claim. Ces observations comptent, avec une confiance moindre — et le savoir vaut mieux que l’ignorer.'
            : 'An inherited location means the country comes from the study context, not the claim. These observations count, with lower confidence — knowing it is better than not.'}
        </Note>
      </Section>

      <p className="text-[12px]">
        <a href={`/${L}`} className="hover:underline" style={{ color: GOLD }}>← {t(L, 'nav_overview')}</a>
      </p>
    </>
  );
}
