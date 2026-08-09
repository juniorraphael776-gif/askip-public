/**
 * Écran 5 — Researchers.
 *
 * BIBLIOGRAPHIQUE UNIQUEMENT. Aucun croisement chercheur × maladie × pays classé
 * par volume : ce serait asserter askip:producesKnowledgeOn, que le graphe RDF
 * refuse d'écrire et que GRAPH_DATA_CARD déclare non assertée. Publier ici ce que
 * le graphe s'abstient d'affirmer rendrait la data card fausse.
 *
 * Ce qui est montré : ce qu'une personne a publié — un fait vérifiable, avec son
 * DOI. Et, séparément, un agrégat NON NOMINATIF disant d'où vient la production
 * documentée, qui est plus utile à un décideur qu'une liste de noms.
 *
 * L'écran ne s'appelle pas « Researchers and Institutions » : les affiliations
 * sont du texte libre non normalisé. Nommer un écran d'après une donnée qu'on n'a
 * pas est la même faute que d'afficher une prévalence qu'on ne sait pas qualifier.
 */
import { notFound } from 'next/navigation';
import { DefisConnus } from '@/app/challenges-link';
import { isLang, t, type Lang } from '@/lib/i18n';
import { faults, getEvidenceOrigin, getResearchers } from '@/lib/queries';
import { CountBar, Diagnostic, Empty, MethodBanner, Note, Section, Stat, num } from '@/app/ui';
import { BORDEAUX, GOLD, INK, LINE, MUTED } from '@/lib/theme';

export const revalidate = 900;

export default async function Researchers({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const L = lang as Lang;

  const [people, origin] = await Promise.all([getResearchers(), getEvidenceOrigin()]);
  if (!people) return <Diagnostic lang={L} faults={faults()} />;

  // Agrégat non nominatif : part de la production documentée par pays de
  // RATTACHEMENT de l'auteur identifié. Ne dit rien d'une expertise individuelle.
  // Le total et le classement viennent de la base sur la TOTALITÉ des lignes.
  const ranked: [string, number][] = (origin ?? []).map((r) => [r.researcher_country, r.evidences]);
  const top = ranked.slice(0, 12);
  const maxC = Math.max(1, ...top.map(([, n]) => n));
  const totalOrigin = ranked.reduce((s, [, n]) => s + n, 0);
  const withPubs = people.filter((p) => p.publications > 0).length;

  /**
   * Deux groupes, dans cet ordre : les fiches confirmées d'abord, celles en attente
   * ensuite. L'ordre inverse ferait ouvrir la liste sur ce qui est incertain.
   */
  const groupes = [
    {
      cle: 'verifies',
      titre: L === 'fr' ? 'Identifiant vérifié' : 'Verified identifier',
      sous: L === 'fr'
        ? 'ORCID confirmé par une vérification humaine.'
        : 'ORCID confirmed by human verification.',
      gens: people.filter((p) => p.verified_status === 'human_verified'),
    },
    {
      cle: 'attente',
      titre: L === 'fr' ? 'Identifiant à confirmer' : 'Identifier to be confirmed',
      sous: L === 'fr'
        ? 'ORCID documenté mais non confirmé. Si vous figurez ici, un message à contact@e-shepha.com suffit à le confirmer ou à le corriger.'
        : 'ORCID documented but not confirmed. If you appear here, one message to contact@e-shepha.com is enough to confirm or correct it.',
      gens: people.filter((p) => p.verified_status !== 'human_verified'),
    },
  ];

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: BORDEAUX }}>{t(L, 'nav_researchers')}</h1>
        <p className="mt-1 text-sm" style={{ color: MUTED }}>
          {L === 'fr'
            ? 'Chercheurs identifiés par ORCID vérifié, et publications qui leur sont rattachées.'
            : 'Researchers identified by verified ORCID, and the publications attributed to them.'}
        </p>
      </header>

      <DefisConnus lang={L} />

      <section className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label={t(L, 'kpi_researchers')} value={num(people.length, L)} hint="ORCID" />
        <Stat label={L === 'fr' ? 'Avec publications rattachées' : 'With linked publications'} value={num(withPubs, L)} />
        <Stat label={L === 'fr' ? 'Pays de rattachement' : 'Countries of affiliation'} value={num(new Set(people.map((p) => p.country).filter(Boolean)).size, L)} />
      </section>

      <Section title={L === 'fr' ? "D'où vient la production documentée" : 'Where documented output comes from'}
               hint={L === 'fr' ? 'agrégat non nominatif, par pays de rattachement de l’auteur identifié' : 'non-nominative aggregate, by country of affiliation of the identified author'}>
        {top.length === 0 ? <Empty>{t(L, 'no_data')}</Empty> : top.map(([c, n]) => (
          <CountBar key={c} label={`${c} — ${Math.round((n / Math.max(1, totalOrigin)) * 100)} %`} value={n} max={maxC} lang={L} />
        ))}
        <Note>
          {L === 'fr'
            ? 'Se lit : « telle part des evidences provient de publications dont l’auteur identifié est rattaché à ce pays ». C’est une mesure de la production documentée, pas d’une expertise ni d’une qualité.'
            : 'Reads as: “this share of evidence comes from publications whose identified author is affiliated to this country”. It measures documented output, not expertise or quality.'}
        </Note>
      </Section>

      {/* ── DEUX GROUPES, ET CE N'EST PAS CELUI QU'ON ATTENDAIT ────────────────
          La demande était « ceux avec ORCID d'un côté, ceux sans de l'autre ».
          Mesuré : les 65 chercheurs exposés ont TOUS un ORCID au format valide. Le
          groupe « sans » serait vide, et une table vide sous un titre affirmerait
          quelque chose de faux.

          La distinction qui existe réellement est `verified_status` : 38 vérifiés par
          un humain, 27 dont l'identifiant est documenté mais pas encore confirmé.
          C'est celle-là qui porte l'intention — un chercheur qui voit son nom dans le
          second groupe peut confirmer son identifiant. */}
      <Section title={L === 'fr' ? 'Chercheurs' : 'Researchers'}
               hint={L === 'fr' ? 'classés par nombre de publications rattachées' : 'ranked by number of linked publications'}>
        {/* ⚠️ 65 EXPOSÉS, 80 COMPTÉS. `overview_counts` en annonce 80, `public_api.researcher`
            en rend 65, et le graphe en connaît 77. Trois comptes pour une même notion :
            les taire laisserait croire que cette liste est complète. */}
        <p className="mb-4 text-[12px]" style={{ color: MUTED }}>
          {L === 'fr'
            ? <>Cette liste en montre <strong style={{ color: INK }}>{num(people.length, L)}</strong>. Le corpus en compte <strong style={{ color: INK }}>80</strong> : les autres sont rattachés à des publications sans que leur fiche soit publiée. L’écart est connu et n’est pas résorbé.</>
            : <>This list shows <strong style={{ color: INK }}>{num(people.length, L)}</strong>. The corpus counts <strong style={{ color: INK }}>80</strong>: the others are linked to publications without their record being published. The gap is known and not yet closed.</>}
        </p>
        {groupes.map(({ cle, titre, sous, gens }) => gens.length === 0 ? null : (
        <div key={cle} className="mb-6">
        <p className="mb-1 text-[13px] font-semibold" style={{ color: BORDEAUX }}>
          {titre} <span className="tabular-nums" style={{ color: GOLD }}>{num(gens.length, L)}</span>
        </p>
        <p className="mb-2 text-[12px]" style={{ color: MUTED }}>{sous}</p>
        <div className="overflow-x-auto rounded-lg" style={{ border: `1px solid ${LINE}`, background: '#fff' }}>
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead>
              <tr style={{ color: MUTED }}>
                <th className="px-3 py-2 text-left" style={{ borderBottom: `1px solid ${LINE}` }}>{L === 'fr' ? 'Nom' : 'Name'}</th>
                <th className="px-3 py-2 text-left" style={{ borderBottom: `1px solid ${LINE}` }}>{L === 'fr' ? 'Rattachement' : 'Affiliation'}</th>
                <th className="px-3 py-2 text-left" style={{ borderBottom: `1px solid ${LINE}` }}>{L === 'fr' ? 'Domaine' : 'Field'}</th>
                <th className="px-3 py-2 text-right" style={{ borderBottom: `1px solid ${LINE}` }}>{L === 'fr' ? 'Publications' : 'Publications'}</th>
                <th className="px-3 py-2 text-left" style={{ borderBottom: `1px solid ${LINE}` }}>ORCID</th>
              </tr>
            </thead>
            <tbody>
              {gens.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-1.5" style={{ borderBottom: `1px solid ${LINE}`, color: INK }}>{p.full_name}</td>
                  <td className="px-3 py-1.5" style={{ borderBottom: `1px solid ${LINE}`, color: MUTED }}>
                    {[p.city, p.country].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-3 py-1.5" style={{ borderBottom: `1px solid ${LINE}`, color: MUTED }}>{p.domain ?? '—'}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums" style={{ borderBottom: `1px solid ${LINE}` }}>{num(p.publications, L)}</td>
                  <td className="px-3 py-1.5" style={{ borderBottom: `1px solid ${LINE}` }}>
                    <a href={`https://orcid.org/${p.orcid}`} target="_blank" rel="noreferrer"
                       className="hover:underline" style={{ color: MUTED }}>{p.orcid}</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
        ))}
        <Note>
          {L === 'fr'
            ? "Le rattachement vient du champ pays du chercheur, pas d'une institution normalisée : les affiliations sont du texte libre, elles ne sont ni dédupliquées ni comptables. C'est pourquoi cet écran ne prétend pas parler d'institutions."
            : 'Affiliation comes from the researcher country field, not from a normalised institution: affiliations are free text, neither deduplicated nor countable. Hence this screen does not claim to cover institutions.'}
        </Note>
      </Section>
    </>
  );
}
