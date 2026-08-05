/**
 * Écran 2 — Country Intelligence.
 *
 * « Que savons-nous de ce pays ? » — et surtout avec quelle confiance. La ligne
 * de qualité (part datée, part héritée) est affichée AVANT les maladies : un
 * décideur doit savoir sur quoi repose ce qu'il lit avant de le lire.
 *
 * Aucune maladie n'est présentée comme « la plus fréquente » : seulement « la
 * plus documentée ». La distinction est tout le projet.
 */
import { notFound } from 'next/navigation';
import { isLang, t, type Lang } from '@/lib/i18n';
import { faults, getCountryProfile, getCountryQuality, getGridCountries, getReferentialCoverage } from '@/lib/queries';
import { CountBar, Empty, MethodBanner, Note, Section, Stat, num, Diagnostic } from '@/app/ui';
import { GOLD, INK, LINE, MUTED } from '@/lib/theme';
import { CountsDropNotice } from '@/app/notice';

export const revalidate = 900;

export default async function Country({ params }: { params: Promise<{ lang: string; iso: string }> }) {
  const { lang, iso } = await params;
  if (!isLang(lang)) notFound();
  const L = lang as Lang;
  const ISO = iso.toUpperCase();

  const rows = await getCountryProfile(ISO);
  if (!rows) return <Diagnostic lang={L} faults={faults()} />;
  if (rows.length === 0) return <Empty>{t(L, 'no_data')}</Empty>;

  const country = rows[0]!.country;
  const [quality, gridCountries, coverage] = await Promise.all([
    getCountryQuality(country), getGridCountries(), getReferentialCoverage(),
  ]);

  const total = rows.reduce((s, r) => s + r.observations, 0);
  const maxD = Math.max(1, ...rows.map((r) => r.observations));
  const years = rows.flatMap((r) => r.years ?? []);
  const span = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : null;
  const pctDated = quality ? Math.round((quality.dated / Math.max(1, quality.observations)) * 100) : null;
  const pctInherited = quality ? Math.round((quality.location_inherited / Math.max(1, quality.observations)) * 100) : null;

  return (
    <>
      <p className="mb-2 text-[13px]">
        <a href={`/${L}`} className="hover:underline" style={{ color: MUTED }}>← {t(L, 'back')}</a>
      </p>
      <header className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: INK }}>{country}</h1>
        <p className="mt-1 text-sm" style={{ color: MUTED }}>
          {t(L, 'country_profile')} · {num(total, L)} {t(L, 'observations')} · {rows.length} {t(L, 'diseases_documented')}
          {span ? ` · ${span}` : ''}
        </p>
      </header>

      <MethodBanner text={t(L, 'method_note')} />

      {/* La confiance AVANT le contenu. */}
      {quality ? (
        <Section title={t(L, 'quality')}>
          <div className="grid gap-3 md:grid-cols-3">
            <Stat label={t(L, 'dated')} value={`${pctDated} %`} hint={`${num(quality.dated, L)} / ${num(quality.observations, L)}`} />
            <Stat label={t(L, 'inherited')} value={`${pctInherited} %`}
                  hint={L === 'fr' ? 'lieu déduit du contexte' : 'location inferred from context'} />
            <Stat label={L === 'fr' ? 'Période couverte' : 'Period covered'}
                  value={quality.first_year && quality.last_year ? `${quality.first_year}–${quality.last_year}` : '—'}
                  hint={L === 'fr' ? 'sur les seules observations datées' : 'across dated observations only'} />
          </div>
          <Note>
            {L === 'fr'
              ? `${100 - (pctDated ?? 0)} % des observations de ce pays n'ont aucune année : leur période est inconnue, elles ne sont pas anciennes pour autant.`
              : `${100 - (pctDated ?? 0)} % of this country's observations carry no year: their period is unknown, which does not make them old.`}
          </Note>
        </Section>
      ) : null}
      <CountsDropNotice lang={L} />


      <Section title={L === 'fr' ? 'Maladies documentées' : 'Documented diseases'} hint={t(L, 'activity_axis')}>
        {rows.map((r) => (
          <div key={r.disease}>
            <CountBar label={r.disease} value={r.observations} max={maxD} lang={L}
                      href={`/${L}/evidence?country=${encodeURIComponent(country)}&disease=${encodeURIComponent(r.disease)}`} />
            {r.has_inherited_location || !r.disease_is_normalized ? (
              <div className="mb-1 pl-1 text-[11px]" style={{ color: MUTED }}>
                {r.has_inherited_location ? (L === 'fr' ? '· localisation partiellement héritée' : '· partly inherited location') : ''}
                {/* Ce drapeau teste UNIQUEMENT la présence d'une forme canonique produite
                    par la passe de normalisation. Il ne dit RIEN de son appartenance au
                    vocabulaire de référence. « libellé non normalisé » laissait entendre
                    que son absence certifiait un libellé de référence — ce qu'elle ne fait
                    pas, et 10 681 observations sur 47 752 portent un libellé hors des 70
                    concepts canoniques tout en étant marquées normalisées. */}
                {!r.disease_is_normalized
                  ? (L === 'fr' ? ' · libellé brut, aucune forme canonique produite'
                                : ' · raw label, no canonical form produced')
                  : ''}
              </div>
            ) : null}
          </div>
        ))}
        <Note>
          {L === 'fr'
            ? 'Classement par volume de documentation, pas par fréquence de la maladie. Cliquer une ligne ouvre les evidences correspondantes, avec leur source.'
            : 'Ranked by documentation volume, not by disease frequency. Click a row to open the underlying evidence with its source.'}
        </Note>
        {/* L'ABSENCE de mention ne certifie rien, et c'est ce qu'il faut écrire.
            Un affichage silencieux et un affichage qui garantit sont indistinguables
            pour un lecteur : il faut donc dire ce que le silence ne couvre pas.

            TROISIÈME VERSION DE CETTE PHRASE, ET LA PREMIÈRE QUI SOIT VRAIE.
            La première portait « 10 681 sur 47 752 » tapé à la main : juste à l'écriture,
            périmable au premier rechargement d'entités. La deuxième disait que le chiffre
            n'était pas calculable — vrai à ce moment-là, faux dès la migration 040.
            Celle-ci le LIT depuis public_api.referential_coverage.

            La version du référentiel est rendue avec le chiffre : une part n'a de sens
            que rapportée à ce contre quoi elle a été mesurée. Un lecteur qui voit 22 %
            doit pouvoir savoir que c'est contre v3.7 et non contre une v4 plus large.

            Si la vue est illisible, la note dit que la part n'a pas pu être lue — elle
            ne retombe pas sur une valeur par défaut. */}
        <Note>
          {L === 'fr'
            ? coverage
              ? `Une ligne sans mention signifie qu’une forme canonique a été produite pour ce libellé — pas qu’elle appartient au vocabulaire de référence. Sur l’ensemble du corpus, ${num(coverage.observations_out_of_referential, L)} observations de maladie sur ${num(coverage.observations_disease, L)} portent un libellé absent des ${num(coverage.concepts_in_referential, L)} concepts de référence, soit ${Math.round((coverage.observations_out_of_referential / Math.max(1, coverage.observations_disease)) * 100)} % : le même paludisme peut y figurer sous plusieurs écritures. Mesuré contre le référentiel ${coverage.referential_version}.`
              : 'Une ligne sans mention signifie qu’une forme canonique a été produite pour ce libellé — pas qu’elle appartient au vocabulaire de référence. La part du corpus concernée n’a pas pu être lue.'
            : coverage
              ? `A row without a note means a canonical form was produced for that label — not that it belongs to the reference vocabulary. Across the corpus, ${num(coverage.observations_out_of_referential, L)} disease observations out of ${num(coverage.observations_disease, L)} carry a label absent from the ${num(coverage.concepts_in_referential, L)} reference concepts, i.e. ${Math.round((coverage.observations_out_of_referential / Math.max(1, coverage.observations_disease)) * 100)}%: the same malaria may appear under several spellings. Measured against referential ${coverage.referential_version}.`
              : 'A row without a note means a canonical form was produced for that label — not that it belongs to the reference vocabulary. The share of the corpus concerned could not be read.'}
        </Note>
      </Section>

      {gridCountries?.length ? (
        <Section title={L === 'fr' ? 'Autres pays' : 'Other countries'}>
          <div className="flex flex-wrap gap-2">
            {gridCountries.filter((c) => c.iso !== ISO).map((c) => (
              <a key={c.iso} href={`/${L}/country/${c.iso}`}
                 className="rounded px-2.5 py-1 text-[13px] hover:underline"
                 style={{ border: `1px solid ${LINE}`, color: INK }}>
                {L === 'fr' ? c.fr : c.en}
              </a>
            ))}
          </div>
        </Section>
      ) : null}

      <p className="text-[12px]">
        <a href={`/${L}/gaps?country=${ISO}`} className="font-medium hover:underline" style={{ color: GOLD }}>
          {L === 'fr' ? `Ce que nous ignorons sur ${country}` : `What we do not know about ${country}`} →
        </a>
      </p>
    </>
  );
}
