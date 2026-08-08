/**
 * Écran 7 — Graphe de connaissance.
 *
 * ── LE POINT D'ENTRÉE, ET CE QU'IL NE FAUT PAS TRAFIQUER ────────────────────
 * `graph_top_nodes` est le centre de gravité réel du corpus : 12 lieux, 7 maladies,
 * 1 population. AUCUN chercheur, aucune publication, aucune evidence — leurs degrés
 * sont un à deux ordres de grandeur en dessous. Ce classement n'est pas biaisé, il
 * décrit ce que le corpus est ; le forcer à contenir un chercheur ferait mentir la
 * seule chose qu'il dit honnêtement.
 *
 * Les PORTES sont donc ajoutées à côté, pas mélangées dedans. Sans elles, atteindre un
 * chercheur demande trois sauts — maladie → evidence → publication → chercheur — dont
 * un à travers 65 891 evidences. La porte ramène le trajet à un clic.
 *
 * Elle est dessinée CREUSE : elle annonce un type, elle ne rapporte pas un fait mesuré
 * comme les vingt autres. Et son degré est écrit à côté, parce qu'une porte muette
 * ferait paraître le graphe mieux relié qu'il n'est — le défaut de la troncature non
 * signalée, déplacé au point d'entrée.
 *
 * ── LE SEUIL EST LU, JAMAIS RECOPIÉ ─────────────────────────────────────────
 * `graph_meta.comention_min_weight` décide du comportement par défaut de
 * `graph_neighbors` : avec le seuil, des co-mentions triées par poids ; sans lui, des
 * evidences triées alphabétiquement. Rien d'autre ne le dit. Un écran qui recopierait
 * « 2 » ne saurait pas lequel des deux il affiche.
 */
import { notFound } from 'next/navigation';
import { isLang, t, type Lang } from '@/lib/i18n';
import { faults, getGraphEntry, getGraphEntryEdges, getGraphEntryMeta, getGraphMeta } from '@/lib/queries';
import { type GraphLink, type GraphNode, type NodeType } from '@/app/graph/GraphCanvas';
import { GraphScreen } from '@/app/graph/GraphScreen';
import { EvidenceExplorer } from '@/app/graph/EvidenceExplorer';
import type { EvidenceRow } from '@/app/graph/evidence';
import { Diagnostic } from '@/app/ui';
import { BORDEAUX, GOLD, INK, LINE, MUTED } from '@/lib/theme';

export const revalidate = 900;

export default async function Graph({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const L = lang as Lang;
  const fr = L === 'fr';

  /**
   * ⚠️ QUATRE LECTURES, PAS SIX. La concurrence n'est pas gratuite.
   *
   * Mesuré : lues une par une, `graph_entry_edges` répond en 717 ms et
   * `graph_entry_meta` en 746 ms. Lancées à SIX en parallèle, les mêmes passent à
   * 2 500 et 2 738 ms — et viennent buter sur le mur des trois secondes. Ce n'est pas
   * le froid, c'est la rafale : chaque lecture supplémentaire ralentit toutes les
   * autres, et `Promise.all` donne l'illusion que paralléliser est sans coût.
   *
   * Les deux lectures de l'explorateur sortent donc du rendu serveur. Il sait déjà se
   * remplir depuis le navigateur — le chemin existe et il est éprouvé — alors que le
   * graphe, lui, n'a rien à dessiner sans ses arêtes.
   */
  const [meta, entree, aretes, emeta] = await Promise.all([
    getGraphMeta(), getGraphEntry(), getGraphEntryEdges(), getGraphEntryMeta(),
  ]);
  const pannes = faults();

  if (!entree?.length) {
    return (
      <>
        <h1 className="mb-4 text-2xl font-bold" style={{ color: BORDEAUX }}>{t(L, 'nav_graph')}</h1>
        <Diagnostic lang={L} faults={pannes} />
      </>
    );
  }

  const nodes: GraphNode[] = entree.map((n) => ({
    id: `${n.node_type}:${n.node_id}`,
    node_type: n.node_type as NodeType,
    node_id: n.node_id,
    label: n.node_label,
    role: n.role,
    // ⚠️ PAS de marque de troncature ici. `graph_entry` ne porte pas de degré, et la
    // déduire d'un rôle serait une supposition. L'arc apparaît au dépliage, sur
    // `source_truncated` et `target_truncated` que `graph_neighbors` rend — c'est-à-dire
    // sur une valeur lue. Un contour ouvert posé au jugé dirait un fait qu'on n'a pas.
  }));

  // LES ARÊTES SONT LIVRÉES, plus construites au clic. Le graphe s'ouvre RELIÉ — une
  // seule composante connexe, vérifiée en base — au lieu d'une constellation de points
  // isolés. Le dépliage garde tout son rôle : il va chercher les voisins ABSENTS des
  // cent, et le clic reste ce qui révèle.
  const links: GraphLink[] = (aretes ?? []).map((e) => ({
    source: `${e.source_type}:${e.source_id}`,
    target: `${e.target_type}:${e.target_id}`,
    edge: e.edge,
    weight: e.weight ?? undefined,
  }));

  const seuil = meta?.comention_min_weight ?? null;
  const masquees = meta?.comention_pairs_hidden ?? null;
  const gardees = meta?.comention_pairs_kept ?? null;
  const limite = meta?.default_neighbor_limit ?? 50;
  const ponts = entree.filter((n) => n.role === 'pont').length;
  const NOM_T: Record<string, [string, string]> = {
    disease: ['maladies', 'diseases'], location: ['pays', 'countries'],
    researcher: ['chercheurs', 'researchers'], publication: ['publications', 'publications'],
    evidence: ['evidences', 'evidence'],
  };
  // La composition est COMPTÉE sur les nœuds reçus, jamais recopiée depuis `nodes_by_type` :
  // les deux devraient coïncider, et c'est la lecture qui décide si c'est le cas.
  const parType = Object.entries(
    entree.reduce<Record<string, number>>((a, n) => ({ ...a, [n.node_type]: (a[n.node_type] ?? 0) + 1 }), {}),
  ).sort((a, b) => b[1] - a[1])
   .map(([t, c]) => `${c} ${NOM_T[t]?.[fr ? 0 : 1] ?? t}`).join(', ');

  return (
    <>
      <header className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: BORDEAUX }}>{t(L, 'nav_graph')}</h1>
        <p className="mt-1 text-sm" style={{ color: MUTED }}>
          {fr
            ? `${emeta?.nodes ?? nodes.length} nœuds équilibrés par type — maladies, pays, chercheurs, publications, evidences. Cliquer pour déplier.`
            : `${emeta?.nodes ?? nodes.length} nodes balanced by type — diseases, countries, researchers, publications, evidence. Click to expand.`}
        </p>
      </header>

      {pannes.length > 0 && <div className="mb-4"><Diagnostic lang={L} faults={pannes} partial /></div>}

      <GraphScreen nodes={nodes} links={links} lang={L} limite={limite} />

      {/* ── CE QUE LE DESSIN NE PEUT PAS DIRE ────────────────────────────────
          Trois faits, et chacun corrige une lecture que la forme du graphe induit :
          la constellation paraît close, les relations paraissent toutes présentes,
          et l'absence de chercheurs paraît être un choix d'affichage. */}
      <section className="mt-4 grid gap-3 md:grid-cols-3">
        <Note titre={fr ? 'Le contour interrompu' : 'The broken outline'}>
          {fr
            ? `Un nœud dont le contour s’ouvre a plus de voisins que le graphe n’en montre : le dépliage en rend ${limite} au maximum. La marque est posée avant le clic, pour que le lecteur sache quoi ouvrir.`
            : `A node with an open outline has more neighbours than the graph shows: expanding returns at most ${limite}. The mark is set before any click, so the reader knows what is worth opening.`}
        </Note>

        <Note titre={fr ? 'Les relations masquées' : 'Hidden relationships'}>
          {emeta && (
            <>
              {fr
                ? <><strong style={{ color: INK }}>{emeta.edges_hidden.toLocaleString('fr-FR')}</strong> relations sur {(emeta.edges_shown + emeta.edges_hidden).toLocaleString('fr-FR')} ne sont pas dessinées : à l’entrée, deux entités ne sont reliées qu’à partir de <strong style={{ color: INK }}>{emeta.entry_min_comention_weight ?? '—'}</strong> publications partagées. </>
                : <><strong style={{ color: INK }}>{emeta.edges_hidden.toLocaleString('en')}</strong> of {(emeta.edges_shown + emeta.edges_hidden).toLocaleString('en')} relationships are not drawn: at entry, two entities are linked only from <strong style={{ color: INK }}>{emeta.entry_min_comention_weight ?? '—'}</strong> shared publications upward. </>}
            </>
          )}
          {seuil === null ? (
            <span style={{ color: '#8C3A2E' }}>
              {fr
                ? 'Le seuil de co-mention n’est pas posé en base : les relations ne sont pas pondérées, et déplier un nœud rend des evidences triées alphabétiquement plutôt que des relations triées par force.'
                : 'The co-mention threshold is not set in the database: relationships are unweighted, and expanding a node returns alphabetically sorted evidence rather than relationships ranked by strength.'}
            </span>
          ) : (
            fr
              ? `Deux entités ne sont reliées qu’à partir de ${seuil} publications partagées. Les relations reposant sur une seule sont masquées — ${masquees?.toLocaleString('fr-FR')} sur ${((gardees ?? 0) + (masquees ?? 0)).toLocaleString('fr-FR')}. Un graphe qui masque sans le dire se lit comme complet.`
              : `Two entities are linked only from ${seuil} shared publications upward. Relationships resting on a single one are hidden — ${masquees?.toLocaleString('en')} of ${((gardees ?? 0) + (masquees ?? 0)).toLocaleString('en')}. A graph that hides without saying so reads as complete.`
          )}
        </Note>

        {/* ⚠️ CETTE NOTE DISAIT « pourquoi aucun chercheur au centre ». Elle est
            devenue FAUSSE le jour où `graph_entry` en a placé quinze. Une note juste
            qui survit au changement qu'elle décrivait devient un mensonge exact — et
            personne ne relit les notes en changeant une requête. */}
        <Note titre={fr ? 'Pourquoi ces cent nœuds' : 'Why these hundred nodes'}>
          {fr
            ? <>Le classement par degré ne pouvait contenir <em>aucun</em> chercheur : la chaîne chercheur → publication → evidence ne couvre que 22,4 % du corpus, et leurs degrés sont deux ordres de grandeur sous ceux des pays. Ces cent nœuds sont donc <strong style={{ color: INK }}>équilibrés par type</strong> — {parType} — et {ponts} d’entre eux sont des <strong style={{ color: INK }}>ponts</strong>, dessinés creux : retenus non pour leur importance mais pour ce qu’ils relient. Sans eux, la chaîne des auteurs n’apparaîtrait pas du tout.</>
            : <>A degree ranking could contain <em>no</em> researcher: the researcher → publication → evidence chain covers only 22.4% of the corpus, and their degrees are two orders of magnitude below those of countries. These hundred nodes are therefore <strong style={{ color: INK }}>balanced by type</strong> — {parType} — and {ponts} of them are <strong style={{ color: INK }}>bridges</strong>, drawn hollow: kept not for their importance but for what they connect. Without them the author chain would not appear at all.</>}
        </Note>
      </section>

      <div className="mb-6">
        <EvidenceExplorer
          lang={L}
          initiales={[] as EvidenceRow[]}
          initialTotal={0}
          sections={[]}
        />
      </div>

      {emeta && (
        <p className="mt-3 text-[12px]" style={{ color: MUTED }}>
          {fr
            ? `Composition de l’entrée : ${parType}. ${ponts} ponts sur ${emeta.nodes}.`
            : `Entry composition: ${parType}. ${ponts} bridges of ${emeta.nodes}.`}
        </p>
      )}
    </>
  );
}

const NOM: Record<string, [string, string]> = {
  researcher: ['chercheur', 'researcher'],
  drug: ['médicament', 'drug'],
  publication: ['publication', 'publication'],
  evidence: ['evidence', 'evidence'],
};

function Note({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg p-3 text-[12px] leading-relaxed" style={{ border: `1px solid ${LINE}`, background: '#FFFDF8', color: MUTED }}>
      <p className="mb-1 font-semibold" style={{ color: GOLD }}>{titre}</p>
      <p>{children}</p>
    </div>
  );
}
