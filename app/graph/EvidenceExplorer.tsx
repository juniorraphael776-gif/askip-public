'use client';

/**
 * ASKIP — l'explorateur du bas. Le corpus entier, AUTONOME.
 *
 * Il ne se filtre PAS au clic sur le graphe. C'est la décision de conception : le
 * visiteur doit avoir les deux échelles en même temps — ce qu'il regarde, et ce qui
 * existe. Une version antérieure filtrait l'explorateur au clic ; le global
 * disparaissait au moment précis où le lecteur se concentrait, et il perdait la seule
 * chose qui lui disait de quoi son nœud était un échantillon.
 *
 * Il reste donc interrogeable quoi qu'on fasse au-dessus.
 */
import { useEffect, useState } from 'react';
import { ListeEvidences, useEvidences, type EvidenceRow } from '@/app/graph/evidence';
import { db } from '@/lib/supabase-public';
import { BORDEAUX, GOLD, INK, LINE, MUTED, PAPER } from '@/lib/theme';

export function EvidenceExplorer({
  lang, initiales, initialTotal, sections,
}: {
  lang: 'fr' | 'en';
  initiales: EvidenceRow[];
  initialTotal: number;
  sections: string[];
}) {
  const fr = lang === 'fr';
  const { etat, lignes, total, prov, chercher } = useEvidences(lang);
  const [q, setQ] = useState('');
  const [section, setSection] = useState<string | null>(null);
  // Tant que personne n'a rien demandé, on montre ce que le serveur a déjà rendu.
  // Refaire l'appel au montage coûterait un aller-retour pour le même résultat.
  // SAUF si le serveur n'a rien rendu — voir le rattrapage ci-dessous.
  const [vierge, setVierge] = useState(initiales.length > 0);

  /**
   * RATTRAPAGE CÔTÉ CLIENT QUAND LE RENDU SERVEUR A ÉCHOUÉ.
   *
   * `search_evidence` met 3,5 s sur le domaine au premier accès — les vues sont
   * matérialisées et le rendu ISR touche des pages froides. Constaté en production le
   * 8 août 2026 : l'explorateur s'affichait vide avec « la lecture n'a pas abouti ».
   * Le message était exact et l'écran était mort.
   *
   * Le second appel, lui, est rapide : le premier a réchauffé le cache. On rejoue donc
   * depuis le navigateur. Ce n'est PAS masquer l'échec — si la reprise échoue aussi,
   * l'état `panne` s'affiche et dit toujours que le corpus compte 63 227 evidences.
   * C'est reconnaître qu'un échec à froid n'est pas un échec durable.
   */
  useEffect(() => {
    if (initiales.length === 0) chercher({ limit: 15 });
  }, [initiales.length, chercher]);

  /**
   * Les sections viennent du navigateur quand le serveur ne les a pas fournies.
   * `search_facets` met 3,6 s à elle seule — elle expire au rendu ISR — et un menu
   * déroulant vide sans explication se lit comme « ce corpus n'a pas de sections ».
   * En cas d'échec ici aussi, `sectionsKO` le dit à côté du menu.
   */
  const [sect, setSect] = useState<string[]>(sections);
  const [sectionsKO, setSectionsKO] = useState(false);
  useEffect(() => {
    if (sections.length) return;
    db.from('search_facets').select('section').then(({ data, error }) => {
      if (error || !data) { setSectionsKO(true); return; }
      setSect([...new Set(data.map((f) => f.section))].filter(Boolean).sort());
    });
  }, [sections.length]);

  useEffect(() => {
    if (vierge) return;
    // Le délai évite un appel par frappe. 350 ms : au-delà l'attente se sent, en
    // deçà on lance des requêtes que la suivante rend caduques.
    const t = setTimeout(() => chercher({ q, section, limit: 15 }), 350);
    return () => clearTimeout(t);
  }, [q, section, vierge, chercher]);

  const affichees = vierge ? initiales : lignes;
  const compte = vierge ? initialTotal : total;

  return (
    <section className="rounded-lg p-4" style={{ border: `1px solid ${LINE}`, background: '#FFFFFF' }}>
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b pb-3" style={{ borderColor: LINE }}>
        <div>
          <h2 className="text-sm font-bold" style={{ color: BORDEAUX }}>
            {fr ? 'Explorer le corpus' : 'Explore the corpus'}
          </h2>
          <p className="text-[11px]" style={{ color: MUTED }}>
            {fr
              ? 'Indépendant du graphe : ce qui existe, quoi qu’on regarde au-dessus.'
              : 'Independent of the graph: what exists, whatever you look at above.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => { setVierge(false); setQ(e.target.value); }}
            placeholder={fr ? 'chercher dans les claims…' : 'search claims…'}
            className="rounded px-2 py-1 text-[13px] outline-none"
            style={{ border: `1px solid ${LINE}`, color: INK, minWidth: '16rem', background: PAPER }}
          />
          <select
            value={section ?? ''}
            onChange={(e) => { setVierge(false); setSection(e.target.value || null); }}
            className="rounded px-2 py-1 text-[12px]"
            style={{ border: `1px solid ${LINE}`, color: MUTED, background: PAPER }}
          >
            <option value="">{fr ? 'toutes sections' : 'all sections'}</option>
            {sect.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {sectionsKO && (
            <span className="text-[11px]" style={{ color: '#8C3A2E' }}>
              {fr ? 'sections non lues' : 'sections not read'}
            </span>
          )}
          {!vierge && (
            <button
              onClick={() => { setQ(''); setSection(null); setVierge(true); }}
              className="text-[12px] hover:underline"
              style={{ color: GOLD }}
            >
              {fr ? 'réinitialiser' : 'reset'}
            </button>
          )}
        </div>
      </header>

      <ListeEvidences
        etat={vierge ? 'ok' : etat}
        lignes={affichees}
        total={compte}
        prov={prov}
        lang={lang}
        vide={fr
          ? 'Aucune evidence validée ne correspond. Le terme est cherché dans le texte du claim, pas dans les libellés normalisés.'
          : 'No validated evidence matches. The term is searched in the claim text, not in normalised labels.'}
      />
    </section>
  );
}
