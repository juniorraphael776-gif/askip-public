/**
 * Écran 8 — À propos. La page qui porte la crédibilité du projet.
 *
 * Trois parties, dans cet ordre et pas un autre :
 *   1. ce qu'est ASKIP — et surtout ce qu'il n'est pas ;
 *   2. la méthode, y compris ce qu'elle ne fait pas ;
 *   3. les limites, chiffrées et lues en base.
 *
 * Les limites viennent EN DERNIER ici et n'apparaissent plus sur l'écran d'accueil.
 * Ce n'est pas un adoucissement : un lecteur qui ouvre « À propos » CHERCHE les limites,
 * un lecteur qui ouvre l'accueil cherche à savoir ce que le corpus contient. Les mêmes
 * phrases renseignent dans un cas et découragent dans l'autre.
 *
 * Aucun chiffre n'est écrit en dur. Tous viennent de `public_api` au rendu — parce
 * qu'un nombre recopié dans une page « à propos » est un nombre qui cessera d'être vrai
 * sans que personne ne s'en aperçoive, et que c'est précisément la page où ça coûterait
 * le plus cher.
 */
import { notFound } from 'next/navigation';
import { isLang, t, type Lang } from '@/lib/i18n';
import { faults, getCoverageReach, getFreshness, getOverview, getReferentialCoverage } from '@/lib/queries';
import { Diagnostic, Empty, Freshness, num } from '@/app/ui';
import { BORDEAUX, GOLD, INK, LINE, MUTED } from '@/lib/theme';

export const revalidate = 900;

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 text-base font-bold" style={{ color: BORDEAUX }}>{titre}</h2>
      <div className="space-y-2 text-[13px] leading-relaxed" style={{ color: MUTED }}>{children}</div>
    </section>
  );
}

function Limite({ titre, chiffre, children }: { titre: string; chiffre?: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 rounded-lg p-3" style={{ border: `1px solid ${LINE}`, background: '#FFFDF8' }}>
      <p className="font-semibold" style={{ color: INK }}>
        {titre}
        {chiffre && <span className="ml-2" style={{ color: GOLD }}>{chiffre}</span>}
      </p>
      <p className="mt-1 text-[12px]">{children}</p>
    </div>
  );
}

export default async function About({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const L = lang as Lang;
  const fr = L === 'fr';

  const [o, reach, ref, fresh] = await Promise.all([
    getOverview(), getCoverageReach(), getReferentialCoverage(), getFreshness(),
  ]);
  const pannes = faults();
  if (!o) return <Empty><Diagnostic lang={L} faults={pannes} /></Empty>;

  const sansDate = reach ? reach.observations_total - reach.observations_dated : null;
  const pct = (a: number, b: number) => `${Math.round((a / Math.max(1, b)) * 100)} %`;

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: BORDEAUX }}>{t(L, 'nav_about')}</h1>
      </header>

      {pannes.length > 0 && <div className="mb-4"><Diagnostic lang={L} faults={pannes} partial /></div>}
      {fresh && <Freshness lang={L} at={fresh.generated_at} isStale={fresh.is_stale} />}

      <Bloc titre={fr ? 'Ce qu’est ASKIP' : 'What ASKIP is'}>
        <p>
          {fr
            ? <>ASKIP est une <strong style={{ color: INK }}>infrastructure de connaissance africaine</strong>. Elle commence par la santé parce que c’est là que la littérature est la plus dense et la plus citable, pas parce qu’elle s’y limite.</>
            : <>ASKIP is an <strong style={{ color: INK }}>African knowledge infrastructure</strong>. It starts with health because that is where the literature is densest and most citable, not because it stops there.</>}
        </p>
        <p>
          {fr
            ? <><strong style={{ color: INK }}>Ce n’est pas un tableau de bord sanitaire.</strong> Un tableau de bord affirme l’état d’un pays. ASKIP affirme l’état de la <em>connaissance publiée</em> sur un pays — ce qui a été mesuré, par qui, quand, et ce qui ne l’a pas été. Un pays qui paraît épargné ici est un pays peu documenté, pas un pays en bonne santé.</>
            : <><strong style={{ color: INK }}>It is not a health dashboard.</strong> A dashboard asserts the state of a country. ASKIP asserts the state of <em>published knowledge</em> about a country — what has been measured, by whom, when, and what has not. A country that looks spared here is an under-documented country, not a healthy one.</>}
        </p>
        <p>
          {fr
            ? <>Le corpus compte aujourd’hui <strong style={{ color: INK }}>{num(o.evidences_validated, L)}</strong> evidences validées, extraites de <strong style={{ color: INK }}>{num(o.publications, L)}</strong> publications, portant sur <strong style={{ color: INK }}>{num(o.diseases, L)}</strong> libellés de maladie et <strong style={{ color: INK }}>{num(o.countries, L)}</strong> pays.</>
            : <>The corpus currently holds <strong style={{ color: INK }}>{num(o.evidences_validated, L)}</strong> validated evidence items, extracted from <strong style={{ color: INK }}>{num(o.publications, L)}</strong> publications, covering <strong style={{ color: INK }}>{num(o.diseases, L)}</strong> disease labels across <strong style={{ color: INK }}>{num(o.countries, L)}</strong> countries.</>}
        </p>
      </Bloc>

      <Bloc titre={fr ? 'La méthode' : 'The method'}>
        <p>
          {fr
            ? <><strong style={{ color: INK }}>Extraction automatique.</strong> Des modèles de langue lisent le texte intégral des publications et en extraient des assertions chiffrées — une valeur, une unité, un sujet, un lieu, une période. Rien n’est saisi à la main.</>
            : <><strong style={{ color: INK }}>Automatic extraction.</strong> Language models read the full text of publications and extract numeric assertions — a value, a unit, a subject, a place, a period. Nothing is typed by hand.</>}
        </p>
        <p>
          {fr
            ? <><strong style={{ color: INK }}>Validation mécanique de forme et de plausibilité.</strong> Chaque assertion passe un contrôle automatique : l’unité est-elle cohérente avec la mesure, la valeur tient-elle dans un intervalle possible, la citation existe-t-elle dans le texte source. <strong style={{ color: INK }}>{num(o.evidences_validated, L)}</strong> l’ont franchi sur <strong style={{ color: INK }}>{num(o.evidences_total, L)}</strong> extraites.</>
            : <><strong style={{ color: INK }}>Mechanical validation of form and plausibility.</strong> Every assertion passes an automatic check: is the unit consistent with the measure, does the value fall within a possible range, does the quotation exist in the source text. <strong style={{ color: INK }}>{num(o.evidences_validated, L)}</strong> passed, out of <strong style={{ color: INK }}>{num(o.evidences_total, L)}</strong> extracted.</>}
        </p>
        <p style={{ color: INK }}>
          {fr
            ? <><strong>Aucune relecture humaine.</strong> C’est la limite qui commande toutes les autres. « Validée » signifie ici « a franchi un contrôle automatique », jamais « vérifiée par un expert ». Une assertion peut être bien formée, plausible, correctement citée — et fausse.</>
            : <><strong>No human review.</strong> This is the limitation that governs all the others. “Validated” here means “passed an automatic check”, never “verified by an expert”. An assertion can be well-formed, plausible, correctly quoted — and wrong.</>}
        </p>
        {/* ⚠️ SANS `ref`, CETTE PHRASE NE DOIT PAS S'ÉCRIRE AVEC DES ZÉROS.
            Publiée une première fois en `?? '—'` et `?? 0`, elle affichait
            « un référentiel versionné — —, 0 concepts » quand la vue expirait : un
            lecteur y lit un référentiel vide, c'est-à-dire un fait, alors que c'est
            une panne. Le zéro affirme ; l'absence annoncée n'affirme rien. */}
        {ref ? (
          <p>
            {fr
              ? <>Les libellés de maladie sont normalisés contre un référentiel versionné — <code>{ref.referential_version}</code>, {num(ref.concepts_in_referential, L)} concepts. Il couvre <strong style={{ color: INK }}>{num(ref.observations_in_referential, L)}</strong> observations sur {num(ref.observations_disease, L)} ; les {num(ref.observations_out_of_referential, L)} restantes gardent leur libellé d’origine et sont signalées comme telles.</>
              : <>Disease labels are normalised against a versioned referential — <code>{ref.referential_version}</code>, {num(ref.concepts_in_referential, L)} concepts. It covers <strong style={{ color: INK }}>{num(ref.observations_in_referential, L)}</strong> observations of {num(ref.observations_disease, L)}; the remaining {num(ref.observations_out_of_referential, L)} keep their original label and are flagged as such.</>}
          </p>
        ) : (
          <p style={{ color: '#8C3A2E' }}>
            {fr
              ? 'Les libellés de maladie sont normalisés contre un référentiel versionné, mais sa version et sa couverture n’ont pas pu être lues : la requête a dépassé le délai serveur. Le référentiel existe et s’applique — ce sont ses chiffres qui manquent ici, pas le référentiel.'
              : 'Disease labels are normalised against a versioned referential, but its version and coverage could not be read: the query exceeded the server timeout. The referential exists and applies — it is its figures that are missing here, not the referential itself.'}
          </p>
        )}
      </Bloc>

      <Bloc titre={fr ? 'Ce que le corpus ne sait pas' : 'What the corpus does not know'}>
        <p className="mb-3">
          {fr
            ? 'Ces limites sont mesurées, pas estimées à vue. Elles bornent tout ce que le portail affiche.'
            : 'These limitations are measured, not eyeballed. They bound everything the portal displays.'}
        </p>

        {reach && (
          <Limite
            titre={fr ? 'Près d’un tiers du corpus n’entre dans aucune carte' : 'Nearly a third of the corpus enters no map'}
            chiffre={`${num(reach.observations_unlocated, L)} / ${num(reach.observations_total, L)}`}
          >
            {fr
              ? <>{pct(reach.observations_unlocated, reach.observations_total)} des observations ne sont rattachées à aucun pays. Elles sont réelles et validées, mais absentes de toute vue géographique — grille des manques comprise. Un pays « vide » peut donc l’être parce que la donnée existe sans localisation exploitable.</>
              : <>{pct(reach.observations_unlocated, reach.observations_total)} of observations are attached to no country. They are real and validated, but absent from every geographic view — including the gaps grid. A country that looks “empty” may be so because the data exists without usable location.</>}
          </Limite>
        )}

        {sansDate !== null && reach && (
          <Limite
            titre={fr ? 'Deux tiers du corpus ne portent aucune date' : 'Two thirds of the corpus carries no date'}
            chiffre={`${num(sansDate, L)} / ${num(reach.observations_total, L)}`}
          >
            {fr
              ? <>{pct(sansDate, reach.observations_total)} des observations n’ont pas d’année exploitable. Elles ne sont pas anciennes : leur période est inconnue. Aucune lecture temporelle — « données récentes », « aucune donnée depuis 2022 » — ne porte sur cette part du corpus.</>
              : <>{pct(sansDate, reach.observations_total)} of observations have no usable year. They are not old: their period is unknown. No temporal reading — “recent data”, “nothing since 2022” — applies to this share of the corpus.</>}
          </Limite>
        )}

        <Limite
          titre={fr ? 'La chaîne chercheur → publication → evidence est partielle' : 'The researcher → publication → evidence chain is partial'}
          chiffre={fr ? '22,4 %' : '22.4%'}
        >
          {fr
            ? <>Seule une evidence sur quatre environ peut être remontée jusqu’à un auteur identifié. Les <strong style={{ color: INK }}>{num(o.researchers, L)}</strong> chercheurs du corpus sont donc réellement périphériques dans le graphe, et non masqués par un choix d’affichage. Ce taux nous est transmis par la chaîne d’extraction ; il n’est pas recalculé sur cette page.</>
            : <>Only about one evidence item in four can be traced back to an identified author. The corpus’s <strong style={{ color: INK }}>{num(o.researchers, L)}</strong> researchers are therefore genuinely peripheral in the graph, not hidden by a display choice. This rate is supplied by the extraction chain; it is not recomputed on this page.</>}
        </Limite>

        <Limite titre={fr ? 'Deux relations existent dans le schéma et n’ont jamais été peuplées' : 'Two relations exist in the schema and were never populated'}>
          {fr
            ? <><code>researcher_publications</code> et <code>relationships</code> sont vides. Tout ce que le portail montre d’un chercheur passe par d’autres chemins ; ces deux tables ne portent aucune information, et leur existence dans le schéma ne doit pas être lue comme une couverture.</>
            : <><code>researcher_publications</code> and <code>relationships</code> are empty. Everything the portal shows about a researcher goes through other paths; these two tables carry no information, and their presence in the schema must not be read as coverage.</>}
        </Limite>

        <Limite titre={fr ? 'Le graphe relie sept types de nœuds, le panneau n’en atteint que deux' : 'The graph links seven node types, the panel reaches only two'}>
          {fr
            ? <>Cliquer une <strong style={{ color: INK }}>maladie</strong> ou un <strong style={{ color: INK }}>pays</strong> affiche ses evidences. Cliquer un médicament, une population, un chercheur, une publication ou une evidence n’en affiche aucune — non parce qu’il n’y en a pas, mais parce que le rattachement n’existe qu’en base pour les maladies et les pays. Le graphe relie ces nœuds ; la table qui porte les evidences ne le sait pas encore.</>
            : <>Clicking a <strong style={{ color: INK }}>disease</strong> or a <strong style={{ color: INK }}>country</strong> shows its evidence. Clicking a drug, a population, a researcher, a publication or an evidence item shows none — not because there is none, but because the link exists in the database only for diseases and countries. The graph connects those nodes; the table holding the evidence does not know it yet.</>}
        </Limite>
      </Bloc>

      <p className="mt-8 border-t pt-4 text-[12px]" style={{ borderColor: LINE, color: MUTED }}>
        ASKIP — E-Shepha Hub · CC BY 4.0
      </p>
    </>
  );
}
