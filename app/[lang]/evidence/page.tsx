/**
 * Écran 3 — Disease Evidence Explorer.
 *
 * « Sur quelles sources puis-je m'appuyer ? » Chaque résultat montre le claim
 * intégral, sa valeur telle qu'elle figure DANS CE CLAIM, sa langue d'origine et
 * son DOI. La valeur n'est jamais présentée comme une donnée du pays : elle
 * appartient à la phrase qui la porte.
 *
 * Les filtres traversent les sections — la séparation maladies / états
 * nutritionnels / indicateurs est une décision de présentation, pas de
 * navigation. Aucun total n'est calculé sur un résultat mêlant des sections.
 */
import { notFound } from 'next/navigation';
import { isLang, t, type Lang } from '@/lib/i18n';
import { faults, getSearchFacets, searchEvidence } from '@/lib/queries';
import { Empty, MethodBanner, Note, Section, num, Diagnostic } from '@/app/ui';
import { BORDEAUX, GOLD, INK, LINE, MUTED, SECTION_TINT } from '@/lib/theme';

export const revalidate = 300;

const SECTION_LABEL: Record<string, { fr: string; en: string }> = {
  maladies:            { fr: 'maladie',           en: 'disease' },
  etats_nutritionnels: { fr: 'état nutritionnel', en: 'nutritional status' },
  indicateurs:         { fr: 'indicateur',        en: 'indicator' },
};

export default async function Explorer({
  params, searchParams,
}: { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const L = lang as Lang;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const size = 25;

  const [rows, facets] = await Promise.all([
    searchEvidence({ q: sp.q, topic: sp.topic, country: sp.country, language: sp.language,
                     section: sp.section, limit: size, offset: (page - 1) * size }),
    getSearchFacets(),
  ]);

  if (!rows) return <Diagnostic lang={L} faults={faults()} />;
  const total = rows.length ? Number(rows[0]!.total_count) : 0;
  const pages = Math.max(1, Math.ceil(total / size));
  const qs = (over: Record<string, string | number | undefined>) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...over })) if (v !== undefined && v !== '') u.set(k, String(v));
    return `/${L}/evidence?${u}`;
  };

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: BORDEAUX }}>{t(L, 'nav_explorer')}</h1>
        <p className="mt-1 text-sm" style={{ color: MUTED }}>
          {L === 'fr'
            ? 'Palier Gold : evidences validées mécaniquement, avec leur source primaire.'
            : 'Gold tier: mechanically validated evidence, with its primary source.'}
        </p>
      </header>

      <MethodBanner text={
        L === 'fr'
          ? "La valeur affichée appartient au claim qui la porte, jamais au pays : le corpus ne sait pas encore dire si un pourcentage est une prévalence, une sensibilité de test ou une fréquence génotypique. Les claims ne sont pas traduits — ils s'affichent dans leur langue d'origine."
          : "The value shown belongs to the claim that carries it, never to the country: the corpus cannot yet tell whether a percentage is a prevalence, a test sensitivity or a genotype frequency. Claims are not translated — they appear in their original language."
      } />

      <form className="mb-5 flex flex-wrap gap-2" action={`/${L}/evidence`}>
        <input name="q" defaultValue={sp.q ?? ''}
               placeholder={L === 'fr' ? 'chercher dans les claims…' : 'search claims…'}
               className="min-w-[220px] flex-1 rounded-lg px-3 py-2 text-sm"
               style={{ background: '#fff', border: `1px solid ${LINE}`, color: INK }} />
        <select name="topic" defaultValue={sp.topic ?? ''} className="rounded-lg px-2 py-2 text-sm"
                style={{ background: '#fff', border: `1px solid ${LINE}`, color: INK }}>
          <option value="">{L === 'fr' ? 'tous sujets' : 'all topics'}</option>
          {(facets ?? []).map((f) => (
            <option key={`${f.section}|${f.topic}`} value={f.topic}>
              {f.topic} — {SECTION_LABEL[f.section]?.[L] ?? f.section} ({f.evidences})
            </option>
          ))}
        </select>
        <select name="language" defaultValue={sp.language ?? ''} className="rounded-lg px-2 py-2 text-sm"
                style={{ background: '#fff', border: `1px solid ${LINE}`, color: INK }}>
          <option value="">{L === 'fr' ? 'toutes langues' : 'all languages'}</option>
          <option value="fr">français</option><option value="en">english</option>
        </select>
        <button type="submit" className="rounded-lg px-4 py-2 text-sm font-semibold"
                style={{ background: GOLD, color: '#fff' }}>
          {L === 'fr' ? 'Chercher' : 'Search'}
        </button>
      </form>

      <p className="mb-3 text-[12px]" style={{ color: MUTED }}>
        {num(total, L)} {L === 'fr' ? 'evidences' : 'evidence items'} · {L === 'fr' ? 'page' : 'page'} {page} / {pages}
      </p>

      {rows.length === 0 ? <Empty>{t(L, 'no_data')}</Empty> : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.evidence_id} className="rounded-lg p-4" style={{ background: '#fff', border: `1px solid ${LINE}` }}>
              <p className="text-[14px] leading-relaxed" style={{ color: INK }}>{r.claim}</p>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                {r.numeric_value !== null ? (
                  <span className="font-semibold" style={{ color: GOLD }}>
                    {r.numeric_value}{r.numeric_unit ? ` ${r.numeric_unit}` : ''}
                  </span>
                ) : null}
                <span className="rounded px-1.5 py-0.5 uppercase" style={{ background: '#F0EDE5', color: MUTED }}>{r.language}</span>
                {r.topics.slice(0, 4).map((tp, i) => (
                  <span key={tp} className="rounded px-1.5 py-0.5"
                        style={{ background: SECTION_TINT[r.sections[i] ?? 'maladies'] ?? '#F0EDE5', color: MUTED }}>{tp}</span>
                ))}
                {r.countries.slice(0, 4).map((c) => (
                  <span key={c} className="rounded px-1.5 py-0.5" style={{ background: '#F0EDE5', color: MUTED }}>{c}</span>
                ))}
                {r.temporal_context ? <span style={{ color: MUTED }}>{r.temporal_context}</span> : null}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]" style={{ color: MUTED }}>
                {r.publication_title ? <span className="max-w-full truncate">{r.publication_title}</span> : null}
                {r.journal ? <span>· {r.journal}</span> : null}
                {r.publication_year ? <span>· {r.publication_year}</span> : null}
                {r.source ? <span>· {r.source}</span> : null}
                {r.doi ? (
                  <a href={`https://doi.org/${r.doi}`} target="_blank" rel="noreferrer"
                     className="font-medium hover:underline" style={{ color: GOLD }}>· DOI {r.doi}</a>
                ) : r.pmid ? (
                  <a href={`https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`} target="_blank" rel="noreferrer"
                     className="font-medium hover:underline" style={{ color: GOLD }}>· PMID {r.pmid}</a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 ? (
        <div className="mt-5 flex items-center justify-center gap-3 text-sm">
          {page > 1 ? <a href={qs({ page: page - 1 })} className="hover:underline" style={{ color: GOLD }}>← {L === 'fr' ? 'précédent' : 'previous'}</a> : null}
          <span style={{ color: MUTED }}>{page} / {pages}</span>
          {page < pages ? <a href={qs({ page: page + 1 })} className="hover:underline" style={{ color: GOLD }}>{L === 'fr' ? 'suivant' : 'next'} →</a> : null}
        </div>
      ) : null}

      <Note>
        {L === 'fr'
          ? "La vérification se fait en ouvrant le DOI : l'extrait exact du texte source (source_span) n'est pas publié, par contrainte de droit d'auteur."
          : 'Verification is done by opening the DOI: the exact source excerpt (source_span) is not published, due to copyright constraints.'}
      </Note>
    </>
  );
}
