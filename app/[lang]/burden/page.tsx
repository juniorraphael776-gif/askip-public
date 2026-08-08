/**
 * Écran 6 — Charge de morbidité documentée.
 *
 * LE PREMIER ÉCRAN DU PORTAIL QUI AFFICHE UNE VALEUR, et il a fallu trois migrations
 * pour qu'il en ait le droit. `mv_burden_by_country` additionnait des prévalences, des
 * sensibilités de test diagnostique et des taux de guérison parce qu'ils portent tous
 * le signe « % ». La 039 filtre sur `measure_type = 'prevalence_incidence'` et
 * `measure_subject = 'disease'` ; la 040 restreint aux concepts du référentiel par
 * jointure en base. Ce qui reste — 366 couples — porte une unité homogène, et c'est
 * la seule raison pour laquelle une médiane y est publiable.
 *
 * CE QUI N'EST PAS ICI, ET N'Y SERA PAS : aucune carte choroplèthe colorée par la
 * médiane. Les règles de `app/ui.tsx` valent ici plus qu'ailleurs — une valeur
 * agrégée coloriant un pays serait lue comme une mesure épidémiologique, alors que
 * c'est une médiane de ce que le corpus a documenté.
 *
 * Le mot « carte » désigne l'écran, pas une projection géographique.
 */
import { notFound } from 'next/navigation';
import { DefisConnus } from '@/app/challenges-link';
import { isLang, t, type Lang } from '@/lib/i18n';
import { faults, getBurdenCanonical, getFreshness } from '@/lib/queries';
import { CountBar, Diagnostic, Empty, Freshness, MethodBanner, Note, Section, Stat, num } from '@/app/ui';
import { BORDEAUX, GOLD, INK, LINE, MUTED } from '@/lib/theme';
import { ValidationTierNotice } from '@/app/notice-validation';

export const revalidate = 900;

export default async function Burden({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const L = lang as Lang;
  const fr = L === 'fr';

  const [rows, freshness] = await Promise.all([getBurdenCanonical(), getFreshness()]);
  if (!rows) return <Diagnostic lang={L} faults={faults()} />;

  // Zéro ligne n'est PAS une absence de données : c'est le référentiel non chargé en
  // base. La vue est construite pour rendre vide plutôt que non filtré — le dire.
  if (rows.length === 0) {
    return (
      <Empty>
        {fr
          ? 'Aucun couple à afficher. La vue burden_canonical est vide, ce qui signifie que le référentiel de concepts n’est pas chargé en base — pas que le corpus ne documente rien.'
          : 'No pairs to display. The burden_canonical view is empty, which means the concept referential is not loaded in the database — not that the corpus documents nothing.'}
      </Empty>
    );
  }

  const obs = rows.reduce((s, r) => s + r.n_observations, 0);
  const countries = new Set(rows.map((r) => r.iso)).size;
  const diseases = new Set(rows.map((r) => r.disease)).size;
  const single = rows.filter((r) => r.n_observations === 1).length;
  const below = rows.filter((r) => r.n_observations < 3).length;
  const maxObs = Math.max(1, ...rows.map((r) => r.n_observations));
  // n_units > 1 signifierait que l'unité a cessé d'être homogène et que la médiane
  // n'a plus de référent. On cesse alors de l'afficher plutôt que de la commenter.
  const unitsOk = rows.every((r) => r.n_units <= 1);

  const byDisease = new Map<string, typeof rows>();
  for (const r of rows) { const g = byDisease.get(r.disease) ?? []; g.push(r); byDisease.set(r.disease, g); }
  const diseasesRanked = [...byDisease.entries()]
    .map(([d, g]) => ({ d, g: g.sort((a, b) => b.n_observations - a.n_observations),
                        tot: g.reduce((s, r) => s + r.n_observations, 0) }))
    .sort((a, b) => b.tot - a.tot);

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: BORDEAUX }}>
          {fr ? 'Charge de morbidité documentée' : 'Documented disease burden'}
        </h1>
        <p className="mt-1 text-sm" style={{ color: MUTED }}>
          {fr
            ? 'Uniquement les mesures classées « prévalence ou incidence » portant sur une maladie, et dont le libellé appartient au vocabulaire de référence.'
            : 'Only measures classified as “prevalence or incidence” about a disease, whose label belongs to the reference vocabulary.'}
        </p>
      </header>

      {/* BANDEAU PERMANENT. Il nomme les quatre mécanismes plutôt que de parler
          d'« héritage » en bloc : une première rédaction attribuait à l'affiliation
          d'auteur un héritage produit majoritairement par l'indexation MeSH, ce qui
          rendait la carte moins solide qu'elle n'est. */}
      <MethodBanner text={
        fr
          ? 'Ces cartes disent où la recherche se fait, autant que où la maladie est. Le pays d’une observation vient soit du texte de l’étude, soit d’un rattachement déduit — indexation MeSH, contexte du document, ou affiliation des auteurs. Cette dernière est la moins sûre. Chaque cellule affiche le rapport exact : un pays très présent ici est un pays où l’on publie, pas nécessairement un pays plus touché.'
          : 'These maps show where research happens as much as where disease is. A country comes either from the study text or from an inferred link — MeSH indexing, document context, or author affiliation. The last is the least reliable. Each cell shows the exact ratio: a country that stands out here is one that publishes, not necessarily one that is more affected.'
      } />

      <DefisConnus lang={L} texte={fr ? 'Ce que cette carte ne dit pas' : 'What this map does not say'} />

      <section className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={fr ? 'Couples pays × maladie' : 'Country × disease pairs'} value={num(rows.length, L)} />
        <Stat label={fr ? 'Observations' : 'Observations'} value={num(obs, L)} />
        <Stat label={fr ? 'Maladies' : 'Diseases'} value={num(diseases, L)} hint={fr ? 'du vocabulaire de référence' : 'from the reference vocabulary'} />
        <Stat label={fr ? 'Pays' : 'Countries'} value={num(countries, L)} />
      </section>

      {freshness ? <Freshness lang={L} at={freshness.generated_at} isStale={freshness.is_stale} /> : null}

      {!unitsOk ? (
        <div className="mb-8 rounded-lg p-4 text-sm" style={{ border: `1px solid ${GOLD}`, background: '#FFF4E0', color: INK }}>
          {fr
            ? 'Les médianes ne sont plus affichées : plusieurs unités de mesure coexistent désormais dans ce périmètre, et une médiane sur des unités mélangées ne désigne rien.'
            : 'Medians are no longer shown: several measurement units now coexist in this scope, and a median across mixed units means nothing.'}
        </div>
      ) : null}

      <Section
        title={fr ? 'Par maladie, puis par pays' : 'By disease, then by country'}
        hint={fr ? 'classé par volume d’observations documentées' : 'ranked by volume of documented observations'}
      >
        {diseasesRanked.map(({ d, g, tot }) => (
          <div key={d} className="mb-7">
            <div className="mb-1 flex items-baseline justify-between">
              <h3 className="text-sm font-semibold" style={{ color: INK }}>{d}</h3>
              <span className="text-[11px]" style={{ color: MUTED }}>
                {num(tot, L)} {fr ? 'observations' : 'observations'} · {g.length} {fr ? 'pays' : 'countries'}
              </span>
            </div>
            {g.map((r) => (
              <div key={`${r.iso}-${r.disease}`}>
                {/* SEUIL À TROIS OBSERVATIONS.
                    « Somalie — choléra, médiane 77 % » sur UNE observation trompe le
                    lecteur par un mot, pas par un chiffre : « médiane » donne à une
                    valeur isolée l'allure d'un résumé statistique. Une médiane sur un
                    point n'est pas une médiane, c'est la valeur elle-même déguisée en
                    agrégat. Même raisonnement que n_units : on cesse d'afficher quand
                    la condition qui justifie l'affichage n'est plus remplie.
                    Sous le seuil, le compte prend la place — il dit ce qu'on a. */}
                <CountBar
                  label={`${r.country ?? r.iso}${
                    unitsOk && r.median_pct !== null && r.n_observations >= 3
                      ? ` — ${fr ? 'médiane' : 'median'} ${Number(r.median_pct).toFixed(1).replace('.', fr ? ',' : '.')} %`
                      : ` — ${r.n_observations} ${fr ? (r.n_observations > 1 ? 'observations, trop peu pour une médiane' : 'observation, trop peu pour une médiane') : (r.n_observations > 1 ? 'observations, too few for a median' : 'observation, too few for a median')}`
                  }`}
                  value={r.n_observations} max={maxObs} lang={L}
                  href={`/${L}/evidence?country=${encodeURIComponent(r.country ?? '')}&disease=${encodeURIComponent(r.disease)}`}
                />
                {/* LE RAPPORT NU, JAMAIS LE POURCENTAGE SEUL. « 44 % héritées » cache
                    son dénominateur ; « 111/255 » le porte, et se vérifie. */}
                <div className="mb-1 pl-1 text-[11px]" style={{ color: MUTED }}>
                  {r.n_from_author}/{r.n_observations} {fr ? 'localisées par affiliation d’auteur' : 'located by author affiliation'}
                  {' · '}
                  {r.n_dated}/{r.n_observations} {fr ? 'datées' : 'dated'}
                  {r.first_year ? ` (${r.first_year}–${r.last_year})` : ''}
                  {r.n_evidences !== r.n_observations
                    ? ` · ${num(r.n_evidences, L)} ${fr ? 'evidences distinctes' : 'distinct evidence items'}`
                    : ''}
                </div>
              </div>
            ))}
          </div>
        ))}

        <Note>
          {fr
            ? `La médiane porte sur les valeurs en pourcentage des observations retenues, et sur elles seules. Elle ne remplace pas une prévalence nationale : elle résume ce que ce corpus a documenté. Sous trois observations elle n'est pas affichée — ${below} des ${rows.length} couples sont dans ce cas, dont ${single} qui ne reposent que sur une observation.`
            : `The median covers percentage values of the retained observations, and those only. It does not stand in for a national prevalence: it summarises what this corpus documented. Below three observations it is not shown — ${below} of the ${rows.length} pairs are in that case, ${single} of them resting on a single observation.`}
        </Note>
      </Section>
    </>
  );
}
