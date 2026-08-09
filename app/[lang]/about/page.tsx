/**
 * Écran 8 — À propos.
 *
 * ⚠️ TEXTE FOURNI, RENDU TEL QUEL. Le français est celui du porteur du projet, repris
 * mot pour mot ; l'anglais en est une traduction fidèle, pas une réécriture. Aucune
 * phrase n'est reformulée « pour le web », aucun chiffre n'est ajouté : cette page dit
 * ce qu'est ASKIP, et les chiffres vivent sur Jeux de données et Défis connus.
 *
 * La version précédente portait une section de limites. Elle est retirée d'ici : les
 * limites ont désormais leur page, en trois parties, et les laisser en double aurait
 * fait douter qu'il s'agisse des mêmes.
 */
import { notFound } from 'next/navigation';
import { isLang, t, type Lang } from '@/lib/i18n';
import { BORDEAUX, GOLD, LINE, MUTED } from '@/lib/theme';

export const revalidate = 900;

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-lg font-bold" style={{ color: BORDEAUX }}>{titre}</h2>
      <div className="space-y-3 text-[14px] leading-relaxed">{children}</div>
    </section>
  );
}

export default async function About({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const L = lang as Lang;
  const fr = L === 'fr';

  /** La chaîne, rendue comme une suite d'étapes et non comme une phrase : c'est un
   *  schéma, et l'aligner en texte courant lui ferait perdre sa lecture. */
  const chaine = fr
    ? ['Documents', 'Extraction', 'Entités & concepts', 'Relations', 'Provenance', 'Knowledge Graph', 'Applications']
    : ['Documents', 'Extraction', 'Entities & concepts', 'Relations', 'Provenance', 'Knowledge Graph', 'Applications'];

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: BORDEAUX }}>{t(L, 'nav_about')}</h1>
      </header>

      <Bloc titre={fr ? 'Ce qu’est ASKIP' : 'What ASKIP is'}>
        <p>
          {fr
            ? <>ASKIP — African Sovereign Knowledge Infrastructure Program — est une infrastructure autonome conçue pour transformer des milliers de documents scientifiques et institutionnels en connaissances structurées, interrogeables et exploitables.</>
            : <>ASKIP — African Sovereign Knowledge Infrastructure Program — is an autonomous infrastructure designed to turn thousands of scientific and institutional documents into structured, queryable and usable knowledge.</>}
        </p>
        <p>
          {fr
            ? 'Elle collecte, extrait, normalise et relie les connaissances dispersées dans la littérature scientifique et institutionnelle afin de construire une infrastructure de connaissance africaine utilisable par les chercheurs, les institutions publiques et les systèmes d’intelligence artificielle.'
            : 'It collects, extracts, normalises and links knowledge scattered across the scientific and institutional literature, in order to build an African knowledge infrastructure usable by researchers, public institutions and artificial intelligence systems.'}
        </p>
        <p>
          {fr
            ? 'ASKIP commence par la santé, avec l’ambition d’étendre progressivement cette architecture à d’autres domaines stratégiques de connaissance.'
            : 'ASKIP begins with health, with the ambition of gradually extending this architecture to other strategic domains of knowledge.'}
        </p>
      </Bloc>

      <Bloc titre={fr ? 'Notre mission' : 'Our mission'}>
        <p>
          {fr
            ? 'Une grande partie de la connaissance produite sur l’Afrique existe sous une forme fragmentée : articles scientifiques, rapports institutionnels, dépôts universitaires, bases documentaires et archives dispersées.'
            : 'A large part of the knowledge produced about Africa exists in fragmented form: scientific articles, institutional reports, university repositories, document databases and scattered archives.'}
        </p>
        <p style={{ color: BORDEAUX, fontWeight: 600 }}>
          {fr
            ? 'ASKIP transforme cette information fragmentée en infrastructure.'
            : 'ASKIP turns that fragmented information into infrastructure.'}
        </p>
        <p>
          {fr
            ? 'L’objectif n’est pas simplement de rassembler davantage de documents, mais de permettre aux connaissances qu’ils contiennent d’être retrouvées, reliées, interrogées, comparées et réutilisées.'
            : 'The aim is not simply to gather more documents, but to allow the knowledge they contain to be found, linked, queried, compared and reused.'}
        </p>
      </Bloc>

      <Bloc titre={fr ? 'Comment ASKIP fonctionne' : 'How ASKIP works'}>
        <p>
          {fr
            ? 'ASKIP construit une chaîne allant du document à la connaissance structurée :'
            : 'ASKIP builds a chain from the document to structured knowledge:'}
        </p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 py-1 text-[13px]">
          {chaine.map((e, i) => (
            <span key={e} className="flex items-center gap-2">
              {i > 0 && <span style={{ color: GOLD }}>→</span>}
              <span className="rounded px-2 py-1" style={{ background: '#F1EADD', color: BORDEAUX }}>{e}</span>
            </span>
          ))}
        </p>
        <p>
          {fr
            ? 'Chaque connaissance structurée conserve un lien avec sa source afin que l’utilisateur puisse remonter de l’information présentée jusqu’au document dont elle provient.'
            : 'Every piece of structured knowledge keeps a link to its source, so that the user can trace the information presented back to the document it comes from.'}
        </p>
        <p>
          {fr
            ? 'Le Knowledge Graph permet ensuite de connecter progressivement maladies, pays, chercheurs, institutions, publications, observations et autres entités scientifiques au sein d’une même infrastructure.'
            : 'The Knowledge Graph then makes it possible to gradually connect diseases, countries, researchers, institutions, publications, observations and other scientific entities within a single infrastructure.'}
        </p>
      </Bloc>

      <Bloc titre={fr ? 'Une infrastructure pour la connaissance africaine' : 'An infrastructure for African knowledge'}>
        <p>
          {fr
            ? 'ASKIP est conçu autour d’un principe simple : la connaissance sur l’Afrique doit pouvoir être structurée, reliée et mobilisée comme une infrastructure stratégique.'
            : 'ASKIP is built around a simple principle: knowledge about Africa must be able to be structured, linked and mobilised as a strategic infrastructure.'}
        </p>
        <p>
          {fr
            ? 'Une telle infrastructure peut soutenir la recherche scientifique, en facilitant la découverte et la connexion des connaissances existantes ; les politiques publiques, en donnant accès à des connaissances structurées et traçables ; et l’intelligence artificielle africaine, en créant des bases de connaissances exploitables par de futurs systèmes d’IA.'
            : 'Such an infrastructure can support scientific research, by making existing knowledge easier to discover and connect; public policy, by giving access to structured and traceable knowledge; and African artificial intelligence, by creating knowledge bases usable by future AI systems.'}
        </p>
      </Bloc>

      <Bloc titre={fr ? 'De l’information à l’intelligence' : 'From information to intelligence'}>
        <p>
          {fr
            ? 'ASKIP ne cherche pas à devenir une bibliothèque supplémentaire. Une bibliothèque conserve des documents. ASKIP cherche à représenter ce qu’ils contiennent et les relations entre ces connaissances.'
            : 'ASKIP does not seek to become one more library. A library keeps documents. ASKIP seeks to represent what they contain, and the relations between those pieces of knowledge.'}
        </p>
        <p>
          {fr
            ? 'À mesure que de nouvelles publications, institutions, chercheurs et jeux de données rejoignent l’infrastructure, le graphe peut s’enrichir et faire émerger de nouvelles connexions entre les connaissances africaines.'
            : 'As new publications, institutions, researchers and datasets join the infrastructure, the graph can grow richer and bring out new connections between African knowledge.'}
        </p>
      </Bloc>

      <section className="mt-12 border-t pt-6" style={{ borderColor: LINE }}>
        <p className="text-lg font-bold" style={{ color: BORDEAUX }}>
          {fr ? 'Structurer. Relier. Interroger. Construire.' : 'Structure. Link. Query. Build.'}
        </p>
        <p className="mt-2 max-w-3xl text-[14px] leading-relaxed">
          {fr
            ? 'ASKIP transforme la connaissance africaine dispersée en infrastructure exploitable pour la recherche, la décision publique et l’intelligence artificielle.'
            : 'ASKIP turns scattered African knowledge into infrastructure usable for research, public decision-making and artificial intelligence.'}
        </p>
        <p className="mt-6 text-[12px]" style={{ color: MUTED }}>
          {fr
            ? <>Ce que ce corpus ne sait pas encore faire est publié à part, chiffré et daté — <a href={`/${L}/challenges`} className="hover:underline" style={{ color: GOLD }}>Défis connus</a>.</>
            : <>What this corpus cannot do yet is published separately, quantified and dated — <a href={`/${L}/challenges`} className="hover:underline" style={{ color: GOLD }}>Known challenges</a>.</>}
        </p>
      </section>
    </>
  );
}
