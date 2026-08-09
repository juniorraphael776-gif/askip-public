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

/**
 * Les libellés de `recoupement` viennent de la BASE, en français, explication comprise :
 * « indécidable — fiche ORCID sans travaux déclarés ». On les rend tels quels en
 * français, et on les traduit ici pour l'anglais — sans les raccourcir.
 *
 * ⚠️ « Indécidable » ne dit pas un doute sur la PERSONNE. C'est un silence de la
 * SOURCE : la fiche ORCID elle-même ne déclare aucun travail, donc le second test n'a
 * rien à comparer. Raccourcir en « non vérifié » ferait porter au chercheur une
 * incertitude qui appartient à sa fiche.
 */
const RECOUP_EN: Record<string, string> = {
  'confirmé — nom ET travaux': 'confirmed — name AND works',
  'indécidable — fiche ORCID sans travaux déclarés': 'undecidable — ORCID record declares no works',
  'divergent — un test contredit l’autre': 'divergent — one test contradicts the other',
  "divergent — un test contredit l'autre": 'divergent — one test contradicts the other',
  'sans identifiant': 'no identifier',
};

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
   * TROIS GROUPES, sur `identification` — la relecture INTERNE.
   *
   * Le troisième n'existait pas : la vue filtrait `WHERE orcid IS NOT NULL` et
   * masquait seize personnes. J'avais conclu qu'aucune n'était sans identifiant, en
   * mesurant une surface qui les excluait par construction. Parmi elles, Akintunde
   * Sowunmi porte 242 publications — le troisième rang du corpus.
   *
   * L'ordre va du plus établi au moins établi, et le dernier groupe porte l'appel :
   * c'est celui dont les membres peuvent nous donner ce qui manque.
   */
  const GROUPES = [
    { cle: 'identifiant vérifié',     fr: 'Identifiant vérifié',      en: 'Verified identifier' },
    { cle: 'identifiant à confirmer', fr: 'Identifiant à confirmer',  en: 'Identifier to be confirmed' },
    { cle: 'sans identifiant',        fr: 'Sans identifiant',         en: 'No identifier' },
  ];
  const groupes = GROUPES.map((g) => ({
    ...g,
    gens: people.filter((p) => p.identification === g.cle),
  }));
  // Filet : une valeur d'`identification` inconnue ne doit pas faire disparaître
  // quelqu'un de l'écran sans le dire.
  const orphelins = people.filter((p) => !GROUPES.some((g) => g.cle === p.identification));

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
        {/* Le sous-titre disait « ORCID ». Il était vrai quand la vue filtrait dessus ;
            depuis la 060 elle expose aussi les seize qui n'en ont pas. */}
        <Stat label={t(L, 'kpi_researchers')} value={num(people.length, L)}
              hint={L === 'fr' ? `${num(people.filter((p) => p.orcid).length, L)} avec ORCID` : `${num(people.filter((p) => p.orcid).length, L)} with ORCID`} />
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
        {/* ── DEUX COLONNES, ET ELLES NE SE RECOUVRENT PAS ─────────────────────
            `identification` dit qui a été relu par un humain CHEZ NOUS ; `recoupement`
            dit ce qu'une source EXTERNE confirme. Vingt personnes sont « à confirmer »
            chez nous mais recoupées dehors ; trois sont « vérifiées » chez nous et
            indécidables dehors. Les fondre en un seul statut affirmerait que l'une vaut
            l'autre.

            Et « indécidable » ne porte AUCUN doute sur la personne : c'est la fiche
            ORCID elle-même qui ne déclare aucun travail, donc le second test n'a rien à
            comparer. Un silence de la source, pas une réserve sur le chercheur. Le dire
            ici, parce qu'un lecteur qui rencontre le mot dans un tableau lui prêtera le
            sens ordinaire. */}
        <div className="mb-5 rounded-lg p-3 text-[12px] leading-relaxed"
             style={{ border: `1px solid ${LINE}`, background: '#FFFDF8', color: MUTED }}>
          <p>
            {L === 'fr'
              ? <><strong style={{ color: INK }}>Deux statuts, deux sources.</strong> Les groupes ci-dessous disent qui a été <strong>relu par un humain de notre côté</strong>. La colonne « recoupement externe » dit, elle, ce qu’<strong>une source tierce confirme</strong>, à la date indiquée. Les deux ne coïncident pas : vingt personnes sont « à confirmer » chez nous mais recoupées dehors, trois sont « vérifiées » chez nous et indécidables dehors.</>
              : <><strong style={{ color: INK }}>Two statuses, two sources.</strong> The groups below say who has been <strong>reviewed by a human on our side</strong>. The “external cross-check” column says what <strong>a third-party source confirms</strong>, at the date shown. The two do not coincide: twenty people are “to be confirmed” on our side but cross-checked outside, three are “verified” on our side and undecidable outside.</>}
          </p>
          <p className="mt-2">
            {L === 'fr'
              ? <><strong style={{ color: INK }}>« Indécidable » ne met pas la personne en doute.</strong> Cela signifie que sa fiche ORCID ne déclare aucun travail : le recoupement n’a rien à comparer. C’est un silence de la source, pas une réserve sur le chercheur.</>
              : <><strong style={{ color: INK }}>“Undecidable” casts no doubt on the person.</strong> It means their ORCID record declares no works: the cross-check has nothing to compare. It is a silence in the source, not a reservation about the researcher.</>}
          </p>
        </div>
        {groupes.map((g) => g.gens.length === 0 ? null : (
        <div key={g.cle} className="mb-8">
          <p className="mb-1 text-[13px] font-semibold" style={{ color: BORDEAUX }}>
            {L === 'fr' ? g.fr : g.en}{' '}
            <span className="tabular-nums" style={{ color: GOLD }}>{num(g.gens.length, L)}</span>
          </p>

          {g.cle === 'sans identifiant' ? (
            /* L'APPEL EST ICI, PAS EN NOTE DE BAS DE PAGE. Ces seize personnes sont les
               seules que la page peut réellement atteindre : elles ont un nom, des
               publications, et il leur manque exactement une chose qu'elles seules
               peuvent donner. */
            <p className="mb-3 rounded-lg p-3 text-[12px] leading-relaxed"
               style={{ border: `1px solid ${GOLD}`, background: '#FBF3E2', color: INK }}>
              {L === 'fr'
                ? <>Ces personnes sont rattachées à des publications du corpus mais n’ont pas d’ORCID en base. <strong>Si vous figurez ici, un message à <a href="mailto:contact@e-shepha.com" className="underline" style={{ color: GOLD }}>contact@e-shepha.com</a> suffit</strong> — votre identifiant relie vos travaux dans le graphe et rend vos publications retrouvables.</>
                : <>These people are linked to publications in the corpus but have no ORCID on record. <strong>If you appear here, one message to <a href="mailto:contact@e-shepha.com" className="underline" style={{ color: GOLD }}>contact@e-shepha.com</a> is enough</strong> — your identifier links your work in the graph and makes your publications findable.</>}
            </p>
          ) : (
            <p className="mb-2 text-[12px]" style={{ color: MUTED }}>
              {g.cle === 'identifiant vérifié'
                ? (L === 'fr' ? 'ORCID relu et confirmé par un humain de notre côté.' : 'ORCID read and confirmed by a human on our side.')
                : (L === 'fr' ? 'ORCID documenté, pas encore relu de notre côté. La colonne « recoupement » dit ce qu’une source externe en pense.' : 'ORCID on record, not yet reviewed on our side. The “cross-check” column says what an external source makes of it.')}
            </p>
          )}

          <div className="overflow-x-auto rounded-lg" style={{ border: `1px solid ${LINE}`, background: '#fff' }}>
            <table className="w-full min-w-[680px] border-collapse text-[13px]">
              <thead>
                <tr style={{ color: MUTED }}>
                  <th className="px-3 py-2 text-left" style={{ borderBottom: `1px solid ${LINE}` }}>{L === 'fr' ? 'Nom' : 'Name'}</th>
                  <th className="px-3 py-2 text-left" style={{ borderBottom: `1px solid ${LINE}` }}>{L === 'fr' ? 'Rattachement' : 'Affiliation'}</th>
                  <th className="px-3 py-2 text-right" style={{ borderBottom: `1px solid ${LINE}` }}>{L === 'fr' ? 'Publications' : 'Publications'}</th>
                  <th className="px-3 py-2 text-left" style={{ borderBottom: `1px solid ${LINE}` }}>ORCID</th>
                  <th className="px-3 py-2 text-left" style={{ borderBottom: `1px solid ${LINE}` }}>{L === 'fr' ? 'Recoupement externe' : 'External cross-check'}</th>
                </tr>
              </thead>
              <tbody>
                {g.gens.map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-1.5" style={{ borderBottom: `1px solid ${LINE}`, color: INK }}>{p.full_name}</td>
                    <td className="px-3 py-1.5" style={{ borderBottom: `1px solid ${LINE}`, color: MUTED }}>
                      {[p.city, p.country].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums" style={{ borderBottom: `1px solid ${LINE}` }}>{num(p.publications, L)}</td>
                    <td className="px-3 py-1.5" style={{ borderBottom: `1px solid ${LINE}` }}>
                      {/* ⚠️ `orcid` PEUT ÊTRE NUL depuis la 060. Composer l'adresse sans
                          ce test produirait `orcid.org/null` sur seize lignes — un lien
                          mort, plus mauvais qu'une absence, parce qu'il promet. */}
                      {p.orcid
                        ? <a href={`https://orcid.org/${p.orcid}`} target="_blank" rel="noreferrer"
                             className="hover:underline" style={{ color: MUTED }}>{p.orcid}</a>
                        : <span style={{ color: MUTED, opacity: 0.6 }}>—</span>}
                    </td>
                    <td className="px-3 py-1.5 text-[12px]" style={{ borderBottom: `1px solid ${LINE}`, color: MUTED }}>
                      {p.recoupement === 'sans identifiant'
                        ? '—'
                        : <>{L === 'fr' ? p.recoupement : (RECOUP_EN[p.recoupement ?? ''] ?? p.recoupement)}
                            {p.recoupement_le && (
                              <span className="ml-1" style={{ opacity: 0.7 }}>
                                · {new Date(p.recoupement_le).toLocaleDateString(L === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        ))}

        {orphelins.length > 0 && (
          <p className="mb-4 text-[12px]" style={{ color: '#8C3A2E' }}>
            {L === 'fr'
              ? `${orphelins.length} chercheur(s) portent une valeur d’identification inattendue et n’apparaissent dans aucun groupe ci-dessus.`
              : `${orphelins.length} researcher(s) carry an unexpected identification value and appear in no group above.`}
          </p>
        )}

        <Note>
          {L === 'fr'
            ? "Le rattachement vient du champ pays du chercheur, pas d'une institution normalisée : les affiliations sont du texte libre, elles ne sont ni dédupliquées ni comptables. C'est pourquoi cet écran ne prétend pas parler d'institutions."
            : 'Affiliation comes from the researcher country field, not from a normalised institution: affiliations are free text, neither deduplicated nor countable. Hence this screen does not claim to cover institutions.'}
        </Note>
      </Section>
    </>
  );
}
