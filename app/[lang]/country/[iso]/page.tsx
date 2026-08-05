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
import { faults, getCountryProfile, getCountryQuality, getGridCountries } from '@/lib/queries';
import { CountBar, Empty, MethodBanner, Note, Section, Stat, num, Diagnostic } from '@/app/ui';
import { GOLD, INK, LINE, MUTED } from '@/lib/theme';

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
  const [quality, gridCountries] = await Promise.all([getCountryQuality(country), getGridCountries()]);

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

            AUCUN CHIFFRE ICI, DÉLIBÉRÉMENT. La première version portait « 10 681 sur
            47 752 », tapé à la main. Il aurait été juste au moment de l'écriture et faux
            au premier rechargement d'entités — la note aurait alors commis exactement le
            défaut qu'elle corrige, un cran plus loin. Le chiffre revient le jour où le
            test d'appartenance vit en base et peut être lu, pas recopié. */}
        <Note>
          {L === 'fr'
            ? 'Une ligne sans mention signifie qu’une forme canonique a été produite pour ce libellé — pas qu’elle appartient au vocabulaire de référence. Une part notable du corpus porte un libellé hors des concepts de référence : le même paludisme peut y figurer sous plusieurs écritures. La part exacte n’est pas affichée ici parce qu’elle n’est pas encore calculable en base, et un chiffre recopié à la main deviendrait faux au prochain chargement d’entités.'
            : 'A row without a note means a canonical form was produced for that label — not that it belongs to the reference vocabulary. A sizeable share of the corpus carries labels outside the reference concepts: the same malaria may appear under several spellings. The exact share is not shown here because it is not yet computable in the database, and a hand-copied figure would go stale at the next entity load.'}
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
