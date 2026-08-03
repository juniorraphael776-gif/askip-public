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
import { isLang, t, type Lang } from '@/lib/i18n';
import { getEvidenceOrigin, getResearchers } from '@/lib/queries';
import { CountBar, Empty, MethodBanner, Note, Section, Stat, num } from '@/app/ui';
import { INK, LINE, MUTED } from '@/lib/theme';

export const revalidate = 900;

export default async function Researchers({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const L = lang as Lang;

  const [people, origin] = await Promise.all([getResearchers(), getEvidenceOrigin()]);
  if (!people) return <Empty>migrations/020 non appliquée.</Empty>;

  // Agrégat non nominatif : part de la production documentée par pays de
  // RATTACHEMENT de l'auteur identifié. Ne dit rien d'une expertise individuelle.
  const byCountry = new Map<string, number>();
  for (const r of origin ?? []) byCountry.set(r.researcher_country, (byCountry.get(r.researcher_country) ?? 0) + r.evidences);
  const ranked = [...byCountry.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  const maxC = Math.max(1, ...ranked.map(([, n]) => n));
  const totalOrigin = [...byCountry.values()].reduce((s, n) => s + n, 0);
  const withPubs = people.filter((p) => p.publications > 0).length;

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: INK }}>{t(L, 'nav_researchers')}</h1>
        <p className="mt-1 text-sm" style={{ color: MUTED }}>
          {L === 'fr'
            ? 'Chercheurs identifiés par ORCID vérifié, et publications qui leur sont rattachées.'
            : 'Researchers identified by verified ORCID, and the publications attributed to them.'}
        </p>
      </header>

      <MethodBanner text={
        L === 'fr'
          ? "Cette page est bibliographique : elle montre ce qu'une personne a publié, pas ce qu'elle « sait ». ASKIP n'affirme pas qu'un chercheur produit de la connaissance sur telle maladie dans tel pays — le graphe de connaissance s'en abstient explicitement, et cette page s'aligne."
          : 'This page is bibliographic: it shows what a person has published, not what they “know”. ASKIP does not assert that a researcher produces knowledge on a given disease in a given country — the knowledge graph explicitly abstains, and this page follows.'
      } />

      <section className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label={t(L, 'kpi_researchers')} value={num(people.length, L)} hint="ORCID" />
        <Stat label={L === 'fr' ? 'Avec publications rattachées' : 'With linked publications'} value={num(withPubs, L)} />
        <Stat label={L === 'fr' ? 'Pays de rattachement' : 'Countries of affiliation'} value={num(new Set(people.map((p) => p.country).filter(Boolean)).size, L)} />
      </section>

      <Section title={L === 'fr' ? "D'où vient la production documentée" : 'Where documented output comes from'}
               hint={L === 'fr' ? 'agrégat non nominatif, par pays de rattachement de l’auteur identifié' : 'non-nominative aggregate, by country of affiliation of the identified author'}>
        {ranked.length === 0 ? <Empty>{t(L, 'no_data')}</Empty> : ranked.map(([c, n]) => (
          <CountBar key={c} label={`${c} — ${Math.round((n / Math.max(1, totalOrigin)) * 100)} %`} value={n} max={maxC} lang={L} />
        ))}
        <Note>
          {L === 'fr'
            ? 'Se lit : « telle part des evidences provient de publications dont l’auteur identifié est rattaché à ce pays ». C’est une mesure de la production documentée, pas d’une expertise ni d’une qualité.'
            : 'Reads as: “this share of evidence comes from publications whose identified author is affiliated to this country”. It measures documented output, not expertise or quality.'}
        </Note>
      </Section>

      <Section title={L === 'fr' ? 'Chercheurs' : 'Researchers'}
               hint={L === 'fr' ? 'classés par nombre de publications rattachées' : 'ranked by number of linked publications'}>
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
              {people.map((p) => (
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
        <Note>
          {L === 'fr'
            ? "Le rattachement vient du champ pays du chercheur, pas d'une institution normalisée : les affiliations sont du texte libre, elles ne sont ni dédupliquées ni comptables. C'est pourquoi cet écran ne prétend pas parler d'institutions."
            : 'Affiliation comes from the researcher country field, not from a normalised institution: affiliations are free text, neither deduplicated nor countable. Hence this screen does not claim to cover institutions.'}
        </Note>
      </Section>
    </>
  );
}
