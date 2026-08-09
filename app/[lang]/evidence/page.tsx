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
import { faults, getProvenance, getSearchFacets, searchEvidence } from '@/lib/queries';
import { Empty, MethodBanner, Note, num, Diagnostic } from '@/app/ui';
import { LigneEvidence, type EvidenceRow } from '@/app/graph/evidence';
import { BORDEAUX, GOLD, INK, LINE, MUTED } from '@/lib/theme';

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

  /**
   * ⚠️ CET ÉCRAN AVAIT SON PROPRE RENDU DE LIGNE, et il portait donc encore les fautes
   * corrigées ailleurs : pas de `source_url` — donc aucun chemin vers la source pour
   * les 45,3 % d'evidences sans DOI ni PMID — pas de granularité, et le lien réduit à
   * la mention « DOI ». C'est l'écran vers lequel un relecteur est envoyé.
   *
   * Il passe sur `LigneEvidence`, le rendu commun. Trois surfaces le partagent
   * maintenant : cet explorateur, le panneau du graphe et l'explorateur du bas. Une
   * quatrième copie aurait divergé comme les trois `displaySource` avant elle.
   */
  const prov = await getProvenance(rows.map((r) => r.evidence_id));
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
        <div className="rounded-lg px-4" style={{ background: '#fff', border: `1px solid ${LINE}` }}>
          {rows.map((r) => (
            <LigneEvidence key={r.evidence_id} e={r as unknown as EvidenceRow} lang={L}
                           prov={prov.get(r.evidence_id)} />
          ))}
        </div>
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
          ? "Chaque ligne mène à son document source. Le nombre indiqué est celui des observations VALIDÉES qu'il porte, jamais celui des observations extraites : les deux diffèrent sur la plupart des documents. L'extrait exact du texte source n'est pas publié, par contrainte de droit d'auteur."
          : 'Every row leads to its source document. The figure shown counts the VALIDATED observations it carries, never the extracted ones: the two differ on most documents. The exact source excerpt is not published, due to copyright constraints.'}
      </Note>
    </>
  );
}
