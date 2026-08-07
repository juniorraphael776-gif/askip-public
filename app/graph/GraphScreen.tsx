'use client';

/**
 * ASKIP — les trois zones, et pourquoi elles sont trois et non deux.
 *
 *   GRAPHE      en haut, un tiers. Il sert à ENTRER, pas à impressionner.
 *   PANNEAU     à droite du graphe. Ce que dit CE nœud-là : les evidences réelles.
 *   EXPLORATEUR en bas, autonome. Le corpus entier, quoi qu'on fasse au-dessus.
 *
 * Une version antérieure fondait le panneau et l'explorateur : cliquer un nœud
 * filtrait l'explorateur. Le global disparaissait alors au moment précis où le
 * visiteur se concentrait — et il perdait la seule chose qui lui disait de quoi son
 * nœud était un échantillon. Les deux échelles doivent tenir ENSEMBLE : ce qu'on
 * regarde, et ce qui existe.
 */
import { useCallback, useState } from 'react';
import { GraphCanvas, type GraphLink, type GraphNode } from '@/app/graph/GraphCanvas';
import { EvidencePanel } from '@/app/graph/EvidencePanel';

export function GraphScreen({
  nodes, links, lang, limite,
}: { nodes: GraphNode[]; links: GraphLink[]; lang: 'fr' | 'en'; limite: number }) {
  const [choisi, setChoisi] = useState<GraphNode | null>(null);
  // Référence stable : sans `useCallback`, l'effet qui remonte la sélection dans
  // GraphCanvas se redéclencherait à chaque rendu du parent.
  const surSelection = useCallback((n: GraphNode | null) => setChoisi(n), []);

  return (
    <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <GraphCanvas nodes={nodes} links={links} lang={lang} limite={limite} onSelect={surSelection} />
      <EvidencePanel noeud={choisi} lang={lang} />
    </div>
  );
}
