/**
 * Écran 1 — Executive Overview.
 *
 * Répond à « que savons-nous ? » en trois minutes, sans jamais qualifier une
 * mesure. Chaque chiffre est un COMPTE d'observations documentées ; chaque bloc
 * est cliquable et mène aux evidences qu'il agrège — un chiffre non cliquable
 * est un cul-de-sac que le lecteur ne peut ni vérifier ni contester.
 */
import { notFound } from 'next/navigation';
import { DefisConnus } from '@/app/challenges-link';
import { isLang, t, type Lang } from '@/lib/i18n';
import { getCountryTotals, getDiseaseTotals, getFreshness, getOverview, getTimeline } from '@/lib/queries';
import { CountBar, Empty, Freshness, MethodBanner, Note, Section, Stat, Tier, YearBars, num } from '@/app/ui';
import { BORDEAUX, GOLD, INK, LINE, MUTED } from '@/lib/theme';
import { CountsDropNotice } from '@/app/notice';
import { ValidationTierNotice } from '@/app/notice-validation';

export const revalidate = 900;   // portail public : contenu identique pour tous

export default async function Overview({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const L = lang as Lang;

  const [o, countries, diseases, timeline, freshness] = await Promise.all([
    getOverview(), getCountryTotals(12), getDiseaseTotals(20), getTimeline(), getFreshness(),
  ]);
  // `getCoverageReach()` n'est plus appelé : ses deux chiffres — observations sans
  // pays, sans date — sont partis dans Known limitations. La lecture est retirée avec
  // eux plutôt que laissée orpheline : une requête dont personne ne lit le résultat
  // coûte un aller-retour à chaque rendu et se fait oublier au prochain refactor.

  if (!o) {
    return (
      <Empty>
        La surface de lecture publique n&apos;est pas encore en place : appliquer{' '}
        <code>migrations/020_public_api.sql</code> puis <code>021_scope_grid_v1.sql</code>.
      </Empty>
    );
  }

  const undated = o.observations - o.observations_dated;
  const maxC = Math.max(1, ...(countries ?? []).map((c) => c.observations));
  const maxD = Math.max(1, ...(diseases ?? []).map((d) => d.observations));
  const pctFr = Math.round((o.evidences_fr / Math.max(1, o.evidences_fr + o.evidences_en)) * 100);

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: BORDEAUX }}>{t(L, 'title')}</h1>
        <p className="mt-1 text-sm" style={{ color: MUTED }}>{t(L, 'tagline')}</p>
      </header>


      {/* ── LES DEUX `KeyFact` ONT ÉTÉ RETIRÉS D'ICI, PAS SUPPRIMÉS ──────────────
          « 15 472 observations n'entrent dans aucune carte » et « 34 155 ne portent
          aucune date » étaient les deux premiers blocs de l'écran d'accueil. Les
          chiffres sont exacts et le restent : ils vivent maintenant dans Known
          limitations, la page qui existe pour ça et où un lecteur les cherche.

          Ce n'est pas un adoucissement. Un écran d'accueil qui ouvre sur ses manques
          se lit comme un aveu d'échec avant d'avoir rien montré — et le lecteur qui
          part à la deuxième ligne n'apprendra jamais que le corpus documente 2 564
          maladies sur 42 pays. Une limite énoncée avant l'objet qu'elle limite ne
          renseigne personne ; elle décourage.

          Analytique MESURE le corpus : evidences, publications, chercheurs, pays,
          maladies. Ce qui manque a sa page. */}

      <section className="mb-12 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label={t(L, 'kpi_evidences')} value={num(o.evidences_validated, L)} hint={`${num(o.evidences_total, L)} extraites`} />
        <Stat label={t(L, 'kpi_observations')} value={num(o.observations, L)} hint={`${num(o.observations_dated, L)} ${t(L, 'dated')}`} />
        <Stat label={t(L, 'kpi_countries')} value={num(o.countries, L)} />
        <Stat label={t(L, 'kpi_diseases')} value={num(o.diseases, L)} />
        <Stat label={t(L, 'kpi_publications')} value={num(o.publications, L)} hint={`${num(o.publications_with_doi, L)} DOI`} />
        <Stat label={t(L, 'kpi_researchers')} value={num(o.researchers, L)} />
      </section>
      <DefisConnus lang={L} />


      <Section title={t(L, 'by_country')} hint={`${t(L, 'activity_axis')} · ${t(L, 'gold_tier')}`}>
        {(countries ?? []).map((c) => (
          <CountBar key={c.country} label={c.country} value={c.observations} max={maxC} lang={L}
                    href={c.iso ? `/${L}/country/${c.iso}` : undefined} />
        ))}
        <Note>
          {L === 'fr'
            ? 'Ce classement mesure le volume de documentation présent dans le corpus. Il ne dit rien de la charge de morbidité réelle : un pays peu représenté est un pays peu documenté ici.'
            : 'This ranking measures how much documentation the corpus holds. It says nothing about actual disease burden: a country with few observations is under-documented here.'}
        </Note>
      </Section>

      <Section title={t(L, 'by_disease')} hint={`${t(L, 'activity_axis')} · ${t(L, 'gold_tier')}`}>
        {(diseases ?? []).map((d) => (
          <CountBar key={d.disease} label={d.disease} value={d.observations} max={maxD} lang={L} />
        ))}
      </Section>

      <Section title={t(L, 'timeline')}>
        {timeline?.length
          ? <YearBars data={timeline} undated={undated} undatedLabel={t(L, 'undated')} lang={L} />
          : <Empty>{t(L, 'no_data')}</Empty>}
        <Note>
          {L === 'fr'
            ? `Seules ${num(o.observations_dated, L)} observations sur ${num(o.observations, L)} portent une année exploitable. Les autres ne sont pas anciennes : leur date est inconnue, ce qui n'est pas la même chose.`
            : `Only ${num(o.observations_dated, L)} of ${num(o.observations, L)} observations carry a usable year. The rest are not old: their date is unknown, which is not the same thing.`}
        </Note>
      </Section>

      <Section title={t(L, 'quality')}>
        <div className="grid gap-3 md:grid-cols-3">
          <Stat label={t(L, 'dated')} value={`${Math.round((o.observations_dated / Math.max(1, o.observations)) * 100)} %`}
                hint={`${num(o.observations_dated, L)} / ${num(o.observations, L)}`} />
          <Stat label={t(L, 'inherited')} value={`${Math.round((o.observations_inherited / Math.max(1, o.observations)) * 100)} %`}
                hint={L === 'fr' ? 'lieu déduit du contexte d\'étude' : 'location inferred from study context'} />
          <Stat label={L === 'fr' ? 'Langue des claims' : 'Claim language'} value={`${pctFr} % FR`}
                hint={`${100 - pctFr} % EN — ${num(o.evidences_fr, L)} / ${num(o.evidences_en, L)}`} />
        </div>
        <Note>
          {L === 'fr'
            ? 'Une localisation « héritée » signifie que le pays vient du contexte de l\'étude et non du claim lui-même. Ces observations comptent, mais avec une confiance moindre.'
            : 'An "inherited" location means the country comes from the study context, not from the claim itself. These observations count, with lower confidence.'}
        </Note>
      </Section>

      {freshness ? (
        <Freshness lang={L} at={freshness.generated_at} isStale={freshness.is_stale}
                   suffix={`${num(freshness.observations ?? 0, L)} ${t(L, 'observations')} ${L === 'fr' ? 'rattachées à un pays.' : 'attached to a country.'}`} />
      ) : null}

      <p className="text-[12px]" style={{ color: MUTED }}>
        <a href={`/${L}/gaps`} className="font-medium hover:underline" style={{ color: GOLD }}>
          {t(L, 'nav_gaps')} →
        </a>
      </p>
    </>
  );
}
