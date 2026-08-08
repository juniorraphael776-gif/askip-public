'use client';

/**
 * ASKIP — rendu et exploration du graphe. PREMIER composant client du portail.
 *
 * Tout le reste du site est en Server Components : les écrans lisent `public_api` au
 * rendu et n'expédient aucun JavaScript. `react-force-graph-2d` s'appuie sur `window`
 * et sur un `<canvas>`, donc il ne peut pas être rendu côté serveur — d'où le
 * `dynamic(..., { ssr: false })`, qui n'est autorisé que dans un composant client.
 *
 * ── LA MARQUE DE TRONCATURE, ET POURQUOI ELLE EST DANS LE DESSIN ────────────
 * `graph_neighbors` plafonne les voisins. Un nœud qui en a 13 845 en montre 50, et sans
 * marque le lecteur voit une constellation CLOSE : rien ne l'invite à chercher un
 * compteur, parce que rien n'a l'air manquant.
 *
 * Une note se lit, un graphe se regarde. « 50 sur 13 845 » en légende serait exact et
 * sans effet — le défaut de la note transposé au visuel, où il est plus grave parce que
 * l'image affirme sa complétude par sa forme même.
 *
 * La marque est un ARC OUVERT plutôt qu'un halo ou une couleur : un cercle interrompu
 * se lit comme « ça continue ailleurs » sans convention à apprendre, il tient en
 * niveaux de gris comme à faible zoom, la couleur est déjà prise par le type de nœud et
 * un halo se confondrait avec la surbrillance de survol.
 *
 * Elle est posée sur DEUX sources distinctes, et c'est délibéré :
 *   — `source_truncated`, quand on a déplié le nœud et que la réponse en cachait ;
 *   — `target_truncated`, rendu par la fonction pour chaque voisin AVANT tout clic.
 * Un nœud jamais déplié porte donc déjà sa marque. C'est la seule façon qu'a le lecteur
 * de savoir qu'un nœud vaut le clic sans avoir à le tenter.
 *
 * ── LE PIÈGE DE LA BIBLIOTHÈQUE ─────────────────────────────────────────────
 * `react-force-graph` MUTE le tableau `links` : `link.source` cesse d'être la chaîne
 * fournie et devient l'objet nœud. Voir `bout()` — le comptage affichait « 0 sur
 * 13 845 » et n'avait pas échoué, il avait répondu. Ne jamais comparer un identifiant à
 * `l.source` sans passer par `bout()`.
 */
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { db } from '@/lib/supabase-public';
import { GOLD, INK, LINE, MUTED, PAPER } from '@/lib/theme';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export type NodeType =
  | 'disease' | 'location' | 'population' | 'drug'
  | 'researcher' | 'publication' | 'evidence';

/**
 * Pourquoi ce nœud est à l'écran.
 *   `degre` — il est là parce qu'il est très relié : c'est un sujet du corpus.
 *   `pont`  — il est là parce qu'il RELIE : sans lui, la chaîne chercheur →
 *             publication → evidence n'apparaîtrait pas, puisqu'elle ne couvre que
 *             22,4 % du corpus et qu'aucun de ses nœuds n'entrerait par le degré.
 * Les deux ne se dessinent pas pareil : un pont annonce une fonction, pas une
 * importance, et le confondre avec un sujet ferait croire que le corpus documente
 * autant les auteurs que les maladies.
 */
export type NodeRole = 'degre' | 'pont';

export interface GraphNode {
  role?: NodeRole;
  /** `${node_type}:${node_id}` — les identifiants ne sont uniques que par type. */
  id: string;
  node_type: NodeType;
  node_id: string;
  label: string;
  degree_total?: number;
  /** Plus de voisins que le graphe n'en montre. Posé avant tout clic. */
  truncated?: boolean;
  /** Nœud d'entrée d'un type absent du top 20 — dessiné à part. */
  porte?: boolean;
  /** Déplié au moins une fois : on cesse de proposer le clic. */
  deplie?: boolean;
  x?: number; y?: number;
}
export interface GraphLink { source: string; target: string; edge?: string; weight?: number }

/**
 * Lit l'identifiant d'un bout de lien.
 *
 * `react-force-graph` MUTE le tableau qu'on lui passe : dès l'initialisation de la
 * simulation, `link.source` cesse d'être la chaîne fournie et devient l'objet nœud.
 * Une comparaison `l.source === id` reste syntaxiquement valide — le type déclaré
 * décrit l'entrée, pas l'état après — et rend silencieusement `false` pour tous les
 * liens.
 *
 * Ça s'est vu sur le compteur de voisins montrés, qui affichait « 0 sur 13 845 » : un
 * nombre plausible, dans la seule légende dont l'exactitude est le sujet. Le comptage
 * n'a pas échoué, il a répondu.
 */
function bout(v: unknown): string {
  return typeof v === 'string' ? v : ((v as { id?: string } | null)?.id ?? '');
}

/**
 * Les types se distinguent dans la FAMILLE de la charte : bordeaux et or en sont les
 * deux pôles, le reste sont des tons dérivés. Une palette d'arc-en-ciel séparerait
 * mieux sept types — et ferait un graphe qui n'appartient plus au site.
 */
const COULEUR: Record<NodeType, string> = {
  disease:     '#5A0F16',  // bordeaux — la maladie est le sujet du corpus
  location:    '#C49A2C',  // or — l'accent de la charte
  researcher:  '#8C3A44',  // bordeaux clairci
  publication: '#A8762E',  // or assombri
  evidence:    '#7A5B52',  // brun neutre : le pont, jamais le sujet
  population:  '#9A8B6E',
  drug:        '#B08542',
};

const RAYON: Record<NodeType, number> = {
  location: 6, disease: 6, population: 5, drug: 5,
  researcher: 5, publication: 4, evidence: 4,
};

const NOM_TYPE_FR: Record<NodeType, string> = {
  disease: 'maladie', location: 'lieu', population: 'population', drug: 'médicament',
  researcher: 'chercheur', publication: 'publication', evidence: 'evidence',
};
const NOM_TYPE_EN: Record<NodeType, string> = {
  disease: 'disease', location: 'place', population: 'population', drug: 'drug',
  researcher: 'researcher', publication: 'publication', evidence: 'evidence',
};

/** Une ligne rendue par `graph_neighbors`. */
interface Voisin {
  source_type: NodeType; source_id: string; source_label: string;
  source_total_neighbors: number; source_truncated: boolean;
  edge: string | null;
  target_type: NodeType | null; target_id: string | null; target_label: string | null;
  target_total_neighbors: number | null; target_truncated: boolean | null;
  weight: number | null;
}

/**
 * Déplie un nœud. UN SEUL RÉESSAI, et seulement sur un dépassement de délai.
 *
 * Les vues du graphe sont matérialisées : le premier accès après un `REFRESH` lit des
 * pages froides. Mesuré le 7 août 2026 depuis un poste, les deux premiers appels ont
 * expiré à ~3 s — le timeout du rôle `anon` — puis les mêmes appels ont rendu en 340 et
 * 510 ms. La panne n'est donc pas « c'est lent », c'est « le premier visiteur après le
 * rafraîchissement ne voit rien ».
 *
 * On ne réessaie QUE sur `57014`. Un réessai sur une vue absente ou un droit refusé
 * doublerait l'attente sans rien changer, et masquerait la cause derrière une lenteur.
 */
async function deplier(t: NodeType, id: string, limite: number): Promise<
  { ok: true; lignes: Voisin[]; reessai: boolean } | { ok: false; froid: boolean; detail: string }
> {
  for (let essai = 0; essai < 2; essai++) {
    const { data, error } = await db.rpc('graph_neighbors', {
      p_node_type: t, p_node_id: id, p_limit: limite, p_edge: null,
    });
    if (!error) return { ok: true, lignes: (data ?? []) as Voisin[], reessai: essai > 0 };
    const froid = error.code === '57014' || /statement timeout|canceling statement/i.test(error.message);
    if (!froid || essai === 1) return { ok: false, froid, detail: `${error.code ?? '?'} ${error.message}` };
  }
  return { ok: false, froid: true, detail: 'délai dépassé deux fois' };
}

export function GraphCanvas({
  nodes: nodesInit, links: linksInit, lang, limite, onSelect,
}: {
  nodes: GraphNode[]; links: GraphLink[]; lang: 'fr' | 'en'; limite: number;
  /** Remonte le nœud choisi : le panneau d'evidences vit à côté du canvas, pas dedans. */
  onSelect?: (n: GraphNode | null) => void;
}) {
  const fr = lang === 'fr';
  const TYPE = fr ? NOM_TYPE_FR : NOM_TYPE_EN;

  const boite = useRef<HTMLDivElement>(null);
  const fg = useRef<any>(null);
  const [largeur, setLargeur] = useState(900);
  /**
   * 340 px suffisaient à vingt nœuds. À cent, ils produisent une pelote : la surface
   * disponible par nœud décide de la lisibilité bien avant les forces. 460 reste le
   * tiers haut d'un écran de portable et laisse la matière sous la ligne de flottaison.
   */
  const hauteur = 460;
  const [nodes, setNodes] = useState<GraphNode[]>(nodesInit);
  const [links, setLinks] = useState<GraphLink[]>(linksInit);
  const [choisi, setChoisi] = useState<GraphNode | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [panne, setPanne] = useState<{ froid: boolean; detail: string } | null>(null);
  /** Passe à vrai après une seconde d'attente : au-delà, le silence doit s'expliquer. */
  const [lent, setLent] = useState(false);
  const [total, setTotal] = useState<Record<string, number>>({});

  /**
   * Nombre de nœuds au dernier cadrage. Voir `onEngineStop` : c'est le garde-fou qui
   * empêche `zoomToFit` de relancer la simulation qu'il vient d'attendre.
   */
  const cadre = useRef(-1);

  // Effet plutôt qu'appel dans le gestionnaire : `choisi` change aussi quand le
  // dépliage se termine (il gagne `deplie` et `truncated`), et le panneau doit voir
  // la version à jour, pas celle du clic.
  useEffect(() => { onSelect?.(choisi); }, [choisi, onSelect]);


  /**
   * QUI GARDE SON NOM À TOUTE ÉCHELLE.
   *
   * La règle était « tous les nœuds d'entrée ». Elle tenait à vingt ; à cent elle
   * produit un mur de texte, parce que les quinze evidences ont pour libellé une
   * PHRASE ENTIÈRE — « The pooled prevalence of radiological… » — et que quinze
   * phrases superposées effacent les cinquante-cinq noms courts qui, eux, se lisaient.
   *
   * On ne nomme donc d'emblée que les maladies et les pays : leurs libellés sont des
   * noms, pas des énoncés. Les chercheurs, publications et evidences gardent le leur
   * dès qu'on les sélectionne, qu'on les déplie, ou qu'on zoome — rien ne disparaît du
   * dessin, c'est le TEXTE qui attend d'avoir la place.
   */
  const ancres = useRef(new Set(
    nodesInit.filter((n) => n.node_type === 'disease' || n.node_type === 'location').map((n) => n.id),
  )).current;

  useEffect(() => {
    if (!enCours) { setLent(false); return; }
    const t = setTimeout(() => setLent(true), 1000);
    return () => clearTimeout(t);
  }, [enCours]);

  useEffect(() => {
    const mesure = () => setLargeur(boite.current?.clientWidth ?? 900);
    mesure();
    window.addEventListener('resize', mesure);
    return () => window.removeEventListener('resize', mesure);
  }, []);

  /**
   * Les forces par défaut de d3 sont réglées pour une dizaine de nœuds. Au premier
   * dépliage, cinquante voisins arrivent d'un coup et le graphe rend une TACHE : les
   * disques se recouvrent, les libellés se superposent, et l'écran cesse d'être
   * explorable au moment précis où il vient de gagner de l'information.
   *
   * Deux réglages, et aucun n'est cosmétique :
   *   charge   la répulsion doit tenir à 70 nœuds, pas à 10 ;
   *   link     une distance fixe, sinon les voisins lourds collent à leur source.
   *
   * Il manque `forceCollide`, qui garantirait qu'aucun disque n'en recouvre un autre.
   * `d3-force` n'est pas une dépendance directe du portail — seulement une dépendance
   * transitive de `react-force-graph`, donc non résolvable à l'import. L'ajouter pour
   * cette seule garantie ne se justifie pas tant que la répulsion suffit ; si le
   * recouvrement réapparaît sur un nœud très dense, c'est le premier recours.
   */
  useEffect(() => {
    const g = fg.current;
    if (!g) return;
    // ⚠️ La force NE PEUT PAS être réglée pour le graphe déplié seul. Au départ il n'y
    // a AUCUNE arête : rien ne retient les nœuds, et une répulsion calibrée pour
    // soixante-dix voisins reliés les éjecte tous hors du cadre. Vu à l'écran — canvas
    // vide, sans erreur, sans rien dans la console. Le réglage doit tenir les deux
    // régimes, et c'est le cadrage automatique qui rattrape l'étendue.
    // Réglé pour CENT nœuds et six cent quarante arêtes, plus pour vingt-deux sans
    // aucune. Les arêtes rapprochent : la répulsion doit monter avec elles, sinon le
    // graphe s'effondre en pelote — ce qu'il a fait au premier essai.
    g.d3Force('charge')?.strength(-380).distanceMax(420);
    g.d3Force('link')?.distance((l: any) => (l.edge === 'CO_MENTION' ? 70 : 38)).strength(0.4);
    // La force de centrage tire TOUT vers le milieu et, sans arête, c'est elle qui
    // gagne : les vingt-deux nœuds d'entrée se recouvraient d'autant plus que la
    // simulation tournait longtemps. On l'affaiblit pour que la répulsion décide de
    // l'étendue, et `zoomToFit` s'occupe du cadre.
    // ⚠️ 0,05 convenait à vingt-deux nœuds TOUS reliés. Ici, une partie des cent n'a
    // aucune arête dans les six cent quarante livrées : rien ne les retient, la
    // répulsion les éjecte, et `zoomToFit` — qui les inclut — RÉTRÉCIT tout le reste
    // pour les contenir. Le graphe paraissait tassé alors qu'il était étalé : c'est le
    // cadrage qui rendait compte d'une dispersion invisible.
    g.d3Force('center')?.strength(0.28);
    g.d3ReheatSimulation?.();
  }, []);

  const auClic = useCallback(async (brut: unknown) => {
    const n = brut as GraphNode;
    setChoisi(n);
    if (n.deplie || enCours) return;
    setEnCours(n.id);
    setPanne(null);

    const r = await deplier(n.node_type, n.node_id, limite);
    setEnCours(null);
    if (!r.ok) { setPanne({ froid: r.froid, detail: r.detail }); return; }

    // Une ligne aux cibles nulles = « ce nœud existe et n'a aucun voisin ». Il reste
    // dessiné, seul. Zéro ligne = nœud introuvable. Les deux ne se confondent pas, et
    // c'est le contrat que la fonction garantit.
    const utiles = r.lignes.filter((l) => l.target_id !== null && l.target_type !== null);
    const src = r.lignes[0];

    setNodes((prev) => {
      const vus = new Map(prev.map((p) => [p.id, p]));
      const moi = vus.get(n.id);
      if (moi) {
        moi.deplie = true;
        if (src) moi.truncated = src.source_truncated;
      }
      for (const l of utiles) {
        const id = `${l.target_type}:${l.target_id}`;
        if (vus.has(id)) {
          // Déjà présent : on ne remplace pas l'objet — la simulation tient ses
          // positions dedans, le recréer ferait sauter le nœud à l'écran.
          const e = vus.get(id)!;
          if (l.target_truncated !== null) e.truncated = l.target_truncated;
          continue;
        }
        vus.set(id, {
          id, node_type: l.target_type!, node_id: l.target_id!,
          label: l.target_label ?? l.target_id!,
          degree_total: l.target_total_neighbors ?? undefined,
          truncated: l.target_truncated ?? false,
        });
      }
      return [...vus.values()];
    });

    setLinks((prev) => {
      const cle = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
      const vus = new Set(prev.map((l) => cle(bout(l.source), bout(l.target))));
      const neufs: GraphLink[] = [];
      for (const l of utiles) {
        const tid = `${l.target_type}:${l.target_id}`;
        if (vus.has(cle(n.id, tid))) continue;
        vus.add(cle(n.id, tid));
        neufs.push({ source: n.id, target: tid, edge: l.edge ?? undefined, weight: l.weight ?? undefined });
      }
      return [...prev, ...neufs];
    });

    if (src) setTotal((t) => ({ ...t, [n.id]: src.source_total_neighbors }));
    setChoisi((c) => (c && c.id === n.id ? { ...c, deplie: true, truncated: src?.source_truncated ?? c.truncated } : c));

  }, [enCours, limite, nodes.length]);

  /**
   * LE VOISINAGE ÉCLAIRÉ — le nœud choisi et ses voisins DIRECTS.
   *
   * Sans ça, un graphe déplié est décoratif : soixante-dix disques et deux cents
   * arêtes où le lecteur ne peut plus dire lesquelles partent du nœud qu'il vient de
   * cliquer. L'information est présente et illisible, ce qui revient au même.
   *
   * ⚠️ TROISIÈME ENDROIT OÙ `bout()` DÉCIDE DE LA JUSTESSE. Comparer `l.source` à un
   * identifiant sans lui rend un ensemble VIDE — donc tout s'assombrit sauf le nœud
   * cliqué, ce qui ressemble à un filtrage réussi sur un nœud isolé. Le même défaut
   * que « 0 sur 13 845 » : la panne prend la forme d'un résultat plausible.
   *
   * Calculé une fois par rendu, jamais dans la fonction de dessin — celle-ci tourne
   * une fois par nœud et par image.
   */
  const voisinage = useMemo(() => {
    if (!choisi) return null;
    const s = new Set<string>([choisi.id]);
    for (const l of links) {
      const a = bout(l.source), b = bout(l.target);
      if (a === choisi.id) s.add(b);
      else if (b === choisi.id) s.add(a);
    }
    return s;
  }, [choisi, links]);

  const montres = voisinage ? voisinage.size - 1 : 0;

  /**
   * LE NOYAU RELIÉ — les nœuds qui portent au moins une arête.
   *
   * `graph_entry` livre cent nœuds ; les six cent quarante arêtes n'en touchent pas la
   * totalité. Ceux qui restent sans lien ne sont retenus par rien et la répulsion les
   * éloigne — puis `zoomToFit`, qui les inclut, RÉTRÉCIT tout le reste pour les
   * contenir. Le graphe s'affichait au tiers de la place ; la disposition était bonne,
   * c'est le cadre qui rendait compte d'une dispersion qu'on ne voyait même pas.
   *
   * On cadre donc sur le noyau. Les isolés restent DESSINÉS — ils ne disparaissent
   * pas — ils cessent seulement de commander l'échelle de lecture des autres.
   */
  const noyau = useMemo(() => {
    const s = new Set<string>();
    for (const l of links) { s.add(bout(l.source)); s.add(bout(l.target)); }
    return s;
  }, [links]);

  /**
   * ⚠️ L'OBJET PASSÉ À `graphData` DOIT GARDER SON IDENTITÉ ENTRE DEUX RENDUS.
   *
   * Écrit `graphData={{ nodes, links }}`, il est reconstruit à CHAQUE rendu — et
   * `react-force-graph` traite une nouvelle référence comme un nouveau jeu de données :
   * il réinitialise la simulation. Un clic déclenche cinq changements d'état
   * (`choisi`, `nodes`, `links`, `total`, `enCours`), donc cinq relances de la
   * physique, chacune repartant pour 200 ticks.
   *
   * Mesuré : après un dépliage, `onEngineStop` ne se déclenchait PLUS DU TOUT —
   * plusieurs minutes sans arrêt. Ce n'est pas une lenteur, c'est une simulation qui
   * ne converge jamais parce qu'on la redémarre plus vite qu'elle ne finit.
   *
   * C'est la cause principale des 7 à 40 secondes. Le cycle en trop de `zoomToFit`,
   * corrigé plus haut, n'en était qu'une part — et il masquait celle-ci, puisqu'un
   * second arrêt observé donnait l'impression que la simulation s'arrêtait.
   */
  const donnees = useMemo(() => ({ nodes, links }), [nodes, links]);

  return (
    <div ref={boite} className="w-full overflow-hidden rounded-lg" style={{ border: `1px solid ${LINE}`, background: PAPER }}>
      <style>{'@keyframes askip-pulse{0%,100%{opacity:1}50%{opacity:.45}}'}</style>
      <ForceGraph2D
        ref={fg}
        graphData={donnees}
        width={largeur}
        height={hauteur}
        backgroundColor={PAPER}
        linkColor={(l: any) =>
          !voisinage ? '#CFC8BA'
            : (bout(l.source) === choisi!.id || bout(l.target) === choisi!.id) ? '#8C8579' : '#EDE9E0'}
        linkWidth={(l: any) => (l.weight && l.weight > 1 ? Math.min(0.5 + Math.log10(l.weight), 3) : 0.6)}
        /* 140 ticks ≈ 1 400 ms. Mesuré à trois valeurs, sur 50 voisins de paludisme :
             60  →  646 ms   anneau serré, disques qui se touchent, libellés illisibles
            140  → ~1 400 ms  l'anneau s'est relâché, les libellés se lisent
            200  → 1 998 ms   à peine mieux que 140, pour 600 ms de plus
           Le coût est linéaire — environ 9,7 ms par tick — donc le réglage se choisit
           à l'œil, pas au calcul. 140 est le point où la lisibilité cesse de progresser
           assez pour payer l'attente. */
        cooldownTicks={140}
        onEngineStop={() => {
          if (cadre.current === nodes.length) return;
          cadre.current = nodes.length;
          // CADRER SUR LE VOISINAGE, PAS SUR TOUT LE GRAPHE.
          //
          // `zoomToFit` sans filtre englobe les nœuds ÉTEINTS restés au large : après
          // un dépliage, les cinquante voisins se retrouvaient en amas illisible au
          // centre pendant que vingt et un nœuds à 15 % d'opacité tenaient les bords.
          // Le cadre était juste — il contenait tout — et il ne montrait rien.
          //
          // Le troisième argument de `zoomToFit` est un filtre de nœuds. On y met ce
          // que le visiteur vient de demander. Il est SÛR ici parce que le cadrage
          // n'arrive qu'à l'arrêt de la simulation, donc après l'arrivée des voisins —
          // vérifié : « cadrage à 22 nœuds » puis « cadrage à 64 nœuds », jamais un
          // cadrage sur le seul nœud cliqué.
          const v = voisinage;
          const filtre = v && v.size > 1
            ? (n: any) => v.has(n.id)
            : (noyau.size > 1 ? (n: any) => noyau.has(n.id) : undefined);
          fg.current?.zoomToFit?.(500, 40, filtre);
          /**
           * SECOND CADRAGE, 500 ms PLUS TARD, ET UNE SEULE FOIS.
           *
           * `onEngineStop` se déclenche au tick 200 ; à cet instant les nœuds occupent
           * encore une étendue plus large que celle où ils finissent. Le cadre était
           * donc calculé sur une dispersion transitoire, et le graphe s'affichait au
           * tiers de la place disponible — la disposition était bonne, c'est la MESURE
           * de son étendue qui était prématurée.
           *
           * Le garde `cadre.current` est déjà posé plus haut : ce second appel ne peut
           * pas se répéter, et il ne relance pas la simulation puisqu'il ne fait que
           * déplacer la caméra.
           */
          setTimeout(() => fg.current?.zoomToFit?.(400, 40, filtre), 500);
        }}
        onNodeClick={auClic}
        nodeCanvasObject={(brut: any, ctx: CanvasRenderingContext2D, echelle: number) => {
          const n = brut as GraphNode & { x: number; y: number };

          /**
           * ⚠️ AUX PREMIÈRES IMAGES, UN NŒUD N'A PAS ENCORE DE COORDONNÉES.
           *
           * La simulation les assigne au premier tick ; avant, `n.x` et `n.y` valent
           * `undefined`. `ctx.arc(NaN, …)` ne dit rien — il ne dessine simplement pas —
           * mais `createRadialGradient(NaN, …)` LÈVE, et le halo a fait planter le
           * canvas entier au montage. Le même appel invalide était déjà là avant, muet.
           *
           * Le garde n'est donc pas une précaution : c'est la reconnaissance qu'une
           * API tolérante masquait une valeur invalide que la suivante refuse.
           */
          if (!Number.isFinite(n.x) || !Number.isFinite(n.y)) return;

          const r = RAYON[n.node_type] ?? 5;
          const c = COULEUR[n.node_type] ?? '#888';

          // ASSOMBRISSEMENT. `globalAlpha` porte sur TOUT ce qui suit — disque, arc de
          // troncature, libellé — donc une seule ligne éteint le nœud entier et rien
          // ne peut être oublié au fil des ajouts.
          //
          // ⚠️ Le contexte canvas est PARTAGÉ entre les nœuds : react-force-graph
          // appelle cette fonction en boucle sans le réinitialiser. Un `globalAlpha`
          // laissé à 0,15 éteindrait tous les nœuds dessinés ensuite. Il est restauré
          // en fin de fonction, et c'est pour ça qu'il n'y a aucun `return` anticipé
          // après cette ligne.
          const eteint = voisinage !== null && !voisinage.has(n.id);
          ctx.globalAlpha = eteint ? 0.15 : 1;

          // HALO — un disque diffus sous le nœud. Il donne de la présence sans ajouter
          // de sens : il ne code AUCUNE valeur, contrairement à un rayon ou une teinte.
          // Sur un graphe qui refuse les dégradés de valeur, c'est la seule façon
          // d'imposer au regard sans mentir sur ce qu'on mesure.
          if (!eteint) {
            const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, (RAYON[n.node_type] ?? 5) * 2.6);
            g.addColorStop(0, `${c}33`);
            g.addColorStop(1, `${c}00`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(n.x, n.y, (RAYON[n.node_type] ?? 5) * 2.6, 0, 2 * Math.PI);
            ctx.fill();
          }

          // Une porte est CREUSE : elle annonce un type, pas un fait mesuré sur ce
          // nœud-là. Le disque plein est réservé à ce que le corpus a réellement mis
          // au centre.
          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, 2 * Math.PI);
          if (n.porte || n.role === 'pont') {
            // Creux : « j'annonce une fonction, je ne rapporte pas un fait mesuré ».
            // Même grammaire que les portes du point d'entrée précédent.
            ctx.fillStyle = PAPER; ctx.fill();
            ctx.strokeStyle = c; ctx.lineWidth = 2 / echelle; ctx.stroke();
          } else {
            ctx.fillStyle = c; ctx.fill();
          }

          // ARC OUVERT : le contour s'interrompt sur un quart de tour. Le nœud cesse
          // d'être un disque fermé, et cela se voit sans être cliqué ni survolé.
          if (n.truncated) {
            ctx.beginPath();
            ctx.arc(n.x, n.y, r + 3, 0.35 * Math.PI, 1.9 * Math.PI);
            ctx.strokeStyle = c;
            // Divisé par l'échelle : le canvas est déjà transformé, donc une largeur
            // constante en unités de graphe ÉPAISSIT le trait quand on zoome.
            ctx.lineWidth = 1.6 / echelle;
            ctx.stroke();
          }

          if (choisi?.id === n.id) {
            ctx.beginPath();
            ctx.arc(n.x, n.y, r + 6, 0, 2 * Math.PI);
            ctx.strokeStyle = INK; ctx.lineWidth = 1 / echelle; ctx.stroke();
          }
          if (enCours === n.id) {
            ctx.beginPath();
            ctx.arc(n.x, n.y, r + 9, 0, 2 * Math.PI);
            ctx.strokeStyle = GOLD; ctx.lineWidth = 2 / echelle; ctx.stroke();
          }

          // LE LIBELLÉ EST HIÉRARCHISÉ, PAS SUPPRIMÉ.
          //
          // Après un dépliage, soixante-dix libellés se recouvrent et aucun n'est
          // lisible : trop de texte rend exactement le même service que pas de texte.
          // Mais en masquer par densité ferait disparaître des nœuds à l'œil, et un
          // nœud sans nom n'est pas explorable — on ne clique pas ce qu'on ne peut pas
          // désigner.
          //
          // Le compromis : les points d'ancrage — entrée, porte, sélection, déplié —
          // gardent leur nom à toute échelle. Les voisins ramenés par un clic ne
          // l'affichent qu'à partir d'un zoom où il y a la place. Rien ne disparaît du
          // dessin ; c'est le TEXTE qui attend qu'on s'approche.
          const ancre = n.porte || n.deplie || choisi?.id === n.id || ancres.has(n.id);
          // Un voisin du nœud choisi est nommé quelle que soit l'échelle : c'est
          // précisément ce que le lecteur vient de demander à voir.
          const nomme = ancre || (voisinage !== null && voisinage.has(n.id)) || echelle >= 1.4;

          // PAS de `return` ici : `globalAlpha` doit être restauré plus bas, et le
          // contexte est partagé avec tous les nœuds dessinés ensuite.
          if (nomme) {
            const taille = Math.max(10 / echelle, 2.5);
            ctx.font = `${n.porte ? 'italic ' : ''}${taille}px ui-sans-serif, system-ui`;
            ctx.textAlign = 'center';
            const txt = n.label.length > 26 ? `${n.label.slice(0, 25)}…` : n.label;
            // Fond derrière le texte : sur un graphe dense, un libellé posé sur une
            // arête ou sur un autre libellé devient illisible sans qu'on sache pourquoi.
            if (ancre || voisinage?.has(n.id)) {
              const l = ctx.measureText(txt).width;
              ctx.fillStyle = 'rgba(247,244,239,0.85)';
              ctx.fillRect(n.x - l / 2 - 1, n.y + r + 2, l + 2, taille + 2);
            }
            ctx.fillStyle = ancre ? INK : MUTED;
            ctx.fillText(txt, n.x, n.y + r + taille + 2);
          }

          ctx.globalAlpha = 1;
        }}
        nodePointerAreaPaint={(brut: any, couleur: string, ctx: CanvasRenderingContext2D) => {
          const n = brut as GraphNode & { x: number; y: number };
          ctx.fillStyle = couleur;
          ctx.beginPath();
          // Zone de clic plus large que le disque : les nœuds font 4 à 6 unités et
          // rater sa cible est le premier échec d'exploration.
          ctx.arc(n.x, n.y, (RAYON[n.node_type] ?? 5) + 4, 0, 2 * Math.PI);
          ctx.fill();
        }}
      />

      <div className="border-t px-3 py-2 text-[12px]" style={{ borderColor: LINE, color: MUTED, minHeight: '2.4rem' }}>
        {panne ? (
          <span style={{ color: '#8C3A2E' }}>
            {panne.froid
              ? (fr ? 'Le graphe n’a pas répondu à temps, deux fois. Recliquer le nœud.'
                    : 'The graph did not answer in time, twice. Click the node again.')
              : (fr ? `Lecture refusée — ${panne.detail}` : `Read failed — ${panne.detail}`)}
          </span>
        ) : enCours ? (
          /* ── L'ATTENTE DOIT TENIR TROIS SECONDES ────────────────────────────
             Mesuré : 145 à 220 ms quand le nœud a déjà été lu, mais 1 353 ms au
             premier accès — les vues sont matérialisées et la première lecture d'un
             nœud touche des pages froides. T2 ne corrigera pas ça d'ici dimanche.

             Un « Dépliage… » figé pendant trois secondes se lit comme un écran mort,
             et le visiteur reclique — ce qui n'accélère rien et brouille l'état. Donc
             trois choses : le NOM du nœud, pour que l'attente soit attribuée à ce
             qu'on a demandé ; une pulsation, parce qu'un texte qui bouge dit que le
             programme n'est pas arrêté ; et, passé une seconde, une phrase qui dit
             POURQUOI c'est long. Annoncer la lenteur avant qu'elle ne soit pénible
             coûte moins cher que de l'expliquer après. */
          <span className="inline-flex items-baseline gap-2">
            <span style={{ animation: 'askip-pulse 1.1s ease-in-out infinite' }}>
              {fr ? 'Dépliage de' : 'Expanding'}{' '}
              <strong style={{ color: INK }}>
                {nodes.find((x) => x.id === enCours)?.label ?? ''}
              </strong>
              {' '}…
            </span>
            {lent && (
              <span style={{ opacity: 0.75 }}>
                {fr
                  ? '— première lecture de ce nœud, elle est plus lente que les suivantes.'
                  : '— first read of this node, slower than subsequent ones.'}
              </span>
            )}
          </span>
        ) : choisi ? (
          <span>
            <strong style={{ color: COULEUR[choisi.node_type] }}>{choisi.label}</strong>
            <span className="mx-1.5" style={{ opacity: 0.5 }}>·</span>
            <span>{TYPE[choisi.node_type]}</span>
            <span className="mx-1.5" style={{ opacity: 0.5 }}>·</span>
            {/* Le compteur qui rendait 0 : voir bout(). Il est confronté au total rendu
                par la fonction, jamais déduit du dessin seul. */}
            <span>
              {fr ? 'voisins montrés ' : 'neighbours shown '}
              <strong style={{ color: INK }}>{montres}</strong>
              {(() => {
                const t = total[choisi.id] ?? choisi.degree_total;
                return t !== undefined
                  ? <> {fr ? 'sur' : 'of'} <strong style={{ color: INK }}>{t.toLocaleString(fr ? 'fr-FR' : 'en')}</strong></>
                  : null;
              })()}
            </span>
            {!choisi.deplie && (
              <>
                <span className="mx-1.5" style={{ opacity: 0.5 }}>·</span>
                <span style={{ color: GOLD }}>{fr ? 'recliquer pour déplier' : 'click again to expand'}</span>
              </>
            )}
          </span>
        ) : (
          <span style={{ opacity: 0.75 }}>
            {fr ? 'Cliquer un nœud pour le déplier. Le contour interrompu signale un nœud qui a plus de voisins que le graphe n’en montre.'
                : 'Click a node to expand it. A broken outline marks a node with more neighbours than the graph shows.'}
          </span>
        )}
      </div>
    </div>
  );
}
