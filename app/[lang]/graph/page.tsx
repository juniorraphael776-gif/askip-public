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
import { faults, getGraphDoors, getGraphMeta, getGraphTopNodes, getSearchFacets, searchEvidence } from '@/lib/queries';
import { type GraphLink, type GraphNode, type NodeType } from '@/app/graph/GraphCanvas';
import { GraphScreen } from '@/app/graph/GraphScreen';
import { EvidenceExplorer } from '@/app/graph/EvidenceExplorer';
import type { EvidenceRow } from '@/app/graph/evidence';
import { Diagnostic } from '@/app/ui';
import { GOLD, INK, LINE, MUTED } from '@/lib/theme';

export const revalidate = 900;

export default async function Graph({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const L = lang as Lang;
  const fr = L === 'fr';

  // L'explorateur est rendu AVEC ses premières lignes : un explorateur qui arrive
  // vide et se remplit après coup se lit comme un corpus vide pendant une seconde —
  // exactement ce que `/fr/evidence` affichait pour de bon avant la 053.
  const [meta, top, portes, evs, facettes] = await Promise.all([
    getGraphMeta(), getGraphTopNodes(), getGraphDoors(),
    searchEvidence({ limit: 15 }), getSearchFacets(),
  ]);
  const pannes = faults();

  if (!top?.length) {
    return (
      <>
        <h1 className="mb-4 text-2xl font-bold" style={{ color: INK }}>{t(L, 'nav_graph')}</h1>
        <Diagnostic lang={L} faults={pannes} />
      </>
    );
  }

  const nodes: GraphNode[] = [
    ...top.map((n) => ({
      id: `${n.node_type}:${n.node_id}`,
      node_type: n.node_type as NodeType,
      node_id: n.node_id,
      label: n.node_label,
      degree_total: n.degree_total,
      // Tous les nœuds du top 20 ont plus de voisins que le graphe n'en montrera :
      // le plus petit est à 1 116 pour une limite de 50. La marque n'est donc pas
      // supposée — elle est déduite d'un degré lu, comparé à la limite lue.
      truncated: n.degree_total > (meta?.default_neighbor_limit ?? 50),
    })),
    ...portes.map((p) => ({
      id: `${p.node_type}:${p.node_id}`,
      node_type: p.node_type as NodeType,
      node_id: p.node_id,
      label: p.node_label,
      degree_total: p.degree_total,
      truncated: p.degree_total > (meta?.default_neighbor_limit ?? 50),
      porte: true,
    })),
  ];

  // AUCUNE arête au départ. Les liens du top 20 existent en base, mais les poser ici
  // demanderait vingt appels à `graph_neighbors` au rendu — et donnerait un écran déjà
  // saturé, où le clic n'aurait plus rien à révéler. Le graphe s'ouvre en constellation
  // et se relie sous le curseur.
  const links: GraphLink[] = [];

  const seuil = meta?.comention_min_weight ?? null;
  const masquees = meta?.comention_pairs_hidden ?? null;
  const gardees = meta?.comention_pairs_kept ?? null;
  const limite = meta?.default_neighbor_limit ?? 50;

  return (
    <>
      <header className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: INK }}>{t(L, 'nav_graph')}</h1>
        <p className="mt-1 text-sm" style={{ color: MUTED }}>
          {fr
            ? 'Les vingt nœuds les plus reliés du corpus. Cliquer pour déplier.'
            : 'The twenty most connected nodes in the corpus. Click to expand.'}
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

        <Note titre={fr ? 'Pourquoi aucun chercheur au centre' : 'Why no researcher at the centre'}>
          {fr
            ? 'La chaîne chercheur → publication → evidence ne couvre que 22,4 % du corpus. Les chercheurs sont donc réellement périphériques, et non masqués : le plus relié en compte '
            : 'The researcher → publication → evidence chain covers only 22.4% of the corpus. Researchers are genuinely peripheral, not hidden: the most connected one has '}
          <strong style={{ color: INK }}>
            {portes.find((p) => p.node_type === 'researcher')?.degree_total.toLocaleString(fr ? 'fr-FR' : 'en') ?? '—'}
          </strong>
          {fr ? ' voisins quand le premier lieu en compte ' : ' neighbours where the top place has '}
          <strong style={{ color: INK }}>{top[0].degree_total.toLocaleString(fr ? 'fr-FR' : 'en')}</strong>
          {fr
            ? '. Les nœuds au contour creux sont des portes vers ces régions du graphe.'
            : '. Hollow-outlined nodes are doors into those regions of the graph.'}
        </Note>
      </section>

      <div className="mb-6">
        <EvidenceExplorer
          lang={L}
          initiales={(evs ?? []) as unknown as EvidenceRow[]}
          initialTotal={evs?.[0]?.total_count ?? 0}
          sections={[...new Set((facettes ?? []).map((f) => f.section))].filter(Boolean).sort()}
        />
      </div>

      {portes.length > 0 && (
        <p className="mt-3 text-[12px]" style={{ color: MUTED }}>
          {fr ? 'Portes ouvertes : ' : 'Doors: '}
          {portes.map((p, i) => (
            <span key={p.node_id}>
              {i > 0 && ' · '}
              <em>{p.node_label}</em>
              {' '}({p.degree_total.toLocaleString(fr ? 'fr-FR' : 'en')}
              {fr ? ` voisins, un ${NOM[p.node_type]?.[0] ?? p.node_type} sur ` : ` neighbours, one ${NOM[p.node_type]?.[1] ?? p.node_type} of `}
              {p.type_count.toLocaleString(fr ? 'fr-FR' : 'en')})
            </span>
          ))}
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
