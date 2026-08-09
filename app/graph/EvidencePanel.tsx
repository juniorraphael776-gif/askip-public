'use client';

/**
 * ASKIP — le panneau attaché au graphe. Ce que dit CE nœud-là.
 *
 * C'est ce qui distingue ASKIP d'un outil de visualisation sémantique : le nœud
 * « paludisme » n'est pas un mot-clé, ce sont 9 001 evidences validées avec leur
 * provenance. Le panneau MONTRE, il ne paraphrase pas — pas de compteur, pas de
 * résumé du nœud, la matière elle-même.
 *
 * ── LE PONT NE COUVRE QUE DEUX TYPES SUR SEPT, ET IL FAUT LE DIRE ───────────
 * `search_evidence` filtre par `p_topic` et `p_country`, qui correspondent aux nœuds
 * `disease` et `location`. Mesuré : `topic='paludisme'` rend 9 391 lignes dans
 * `evidence_topic`, `country='Nigeria'` en rend 9 915 — mais
 * `topic='antiretroviral therapy'` en rend ZÉRO, et `topic='children'` aussi.
 *
 * Les médicaments, les populations, les chercheurs, les publications et les evidences
 * elles-mêmes ne sont PAS atteignables par ce chemin. Un panneau vide sur un nœud
 * `drug` se lirait « ce médicament n'a pas d'evidence », ce qui est faux : il en a, le
 * pont ne sait simplement pas les retrouver. La distinction est écrite à l'écran,
 * parce que c'est exactement le genre d'absence qu'on lit comme un fait.
 */
import { useEffect } from 'react';
import type { GraphNode } from '@/app/graph/GraphCanvas';
import { ListeEvidences, useEvidences } from '@/app/graph/evidence';
import { BORDEAUX, GOLD, INK, LINE, MUTED } from '@/lib/theme';

/** Les deux seuls types que `search_evidence` sait filtrer. Vérifié en base. */
function pont(n: GraphNode): { topic?: string; country?: string } | null {
  if (n.node_type === 'disease') return { topic: n.node_id };
  if (n.node_type === 'location') return { country: n.node_id };
  return null;
}

const TYPE_FR: Record<string, string> = {
  drug: 'médicament', population: 'population', researcher: 'chercheur',
  publication: 'publication', evidence: 'evidence',
};
const TYPE_EN: Record<string, string> = {
  drug: 'drug', population: 'population', researcher: 'researcher',
  publication: 'publication', evidence: 'evidence',
};

export function EvidencePanel({ noeud, lang }: { noeud: GraphNode | null; lang: 'fr' | 'en' }) {
  const fr = lang === 'fr';
  const { etat, lignes, total, chercher } = useEvidences(lang);
  const p = noeud ? pont(noeud) : null;

  useEffect(() => {
    chercher(p ? { ...p, limit: 12 } : null);
    // `p` est recalculé à chaque rendu ; c'est l'identité du NŒUD qui décide.
  }, [noeud?.id, chercher]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section
      /* ⚠️ HAUTEUR BORNÉE À TOUTES LES LARGEURS, pas seulement en `lg`.
         La rangée de grille fixe la hauteur sur grand écran ; en dessous, les blocs
         s'empilent et le panneau reprenait sa hauteur naturelle — douze evidences,
         parfois des claims entiers pour un nœud `evidence` — puis débordait par-dessus
         les notes et l'explorateur. Deux couches se superposaient et plus rien ne se
         lisait. `max-h` borne la boîte ; c'est à la LISTE de défiler, jamais au bloc
         de s'étendre. */
      className="flex h-full max-h-[620px] flex-col overflow-hidden rounded-lg p-4"
      style={{ border: `1px solid ${LINE}`, background: '#FFFDF8' }}
    >
      <header className="mb-2 border-b pb-2" style={{ borderColor: LINE }}>
        {noeud ? (
          <>
            <h2 className="text-sm font-bold" style={{ color: BORDEAUX }}>{noeud.label}</h2>
            <p className="text-[11px]" style={{ color: MUTED }}>
              {p
                ? (fr
                    ? `evidences validées portant sur ce ${noeud.node_type === 'disease' ? 'sujet' : 'pays'}`
                    : `validated evidence on this ${noeud.node_type === 'disease' ? 'topic' : 'country'}`)
                : (fr ? 'nœud sélectionné' : 'selected node')}
            </p>
          </>
        ) : (
          <>
            <h2 className="text-sm font-bold" style={{ color: BORDEAUX }}>
              {fr ? 'Evidences du nœud' : 'Evidence for the node'}
            </h2>
            <p className="text-[11px]" style={{ color: MUTED }}>
              {fr ? 'cliquer un nœud du graphe' : 'click a node in the graph'}
            </p>
          </>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {noeud && !p ? (
          /* Le nœud existe, le pont ne l'atteint pas. Un panneau muet dirait
             « pas d'evidence » ; ce serait faux. */
          <p className="py-6 text-[13px]" style={{ color: MUTED }}>
            {fr
              ? <>Les evidences ne sont pas encore rattachables à un nœud de type <strong style={{ color: GOLD }}>{TYPE_FR[noeud.node_type] ?? noeud.node_type}</strong>. Ce n’est pas qu’il n’en a pas : le rattachement n’existe que pour les maladies et les pays. Le graphe le relie, la table qui porte les evidences ne le sait pas encore.</>
              : <>Evidence cannot yet be attached to a <strong style={{ color: GOLD }}>{TYPE_EN[noeud.node_type] ?? noeud.node_type}</strong> node. It is not that it has none: the link exists only for diseases and countries. The graph connects it; the table holding the evidence does not know it yet.</>}
          </p>
        ) : (
          <ListeEvidences
            etat={noeud ? etat : 'vide'}
            lignes={lignes}
            total={total}
            lang={lang}
            vide={noeud
              ? (fr ? 'Aucune evidence validée pour ce nœud.' : 'No validated evidence for this node.')
              : (fr ? 'Aucun nœud sélectionné. L’explorateur ci-dessous reste interrogeable.' : 'No node selected. The explorer below stays searchable.')}
          />
        )}
      </div>
    </section>
  );
}
