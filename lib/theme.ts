/**
 * ASKIP public — la palette de la charte.
 *
 * Quatre couleurs, et une seule source : la planche d'identité. Le portail portait
 * auparavant un vert profond hérité de Tower ; il n'appartenait à aucune charte et ne
 * se retrouvait nulle part ailleurs. Un site et un logo qui ne partagent pas leurs
 * couleurs font deux objets, comme un dépôt et un site qui ne partagent pas leur nom.
 *
 *   bordeaux profond  #5A0F16   titres, en-tête, aplats — la couleur du A
 *   or ocre           #C49A2C   ACCENT : liens, valeurs mises en avant, états actifs
 *   ivoire chaud      #F7F4EF   fond
 *   anthracite        #1A1A1A   texte courant
 *
 * THÈME CLAIR, et ça ne change pas : ce portail est lu, imprimé et projeté par des
 * décideurs. Le sombre de Tower est un choix d'outil de supervision.
 *
 * ⚠️ `INK` reste le nom du texte principal pour ne pas réécrire quarante fichiers, mais
 * il ne désigne plus un vert. Le bordeaux des TITRES est `BORDEAUX` — les deux sont
 * distincts, et les confondre mettrait du bordeaux sur des paragraphes entiers.
 */
export const BORDEAUX = '#5A0F16'; // titres, en-tête — la couleur du A
export const GOLD = '#C49A2C';     // accent : liens, valeurs, états actifs
export const PAPER = '#F7F4EF';    // ivoire chaud
export const INK = '#1A1A1A';      // anthracite — texte courant
export const CARD = '#FFFFFF';
export const LINE = '#E5DED2';     // filet, dérivé de l'ivoire et non du vert
export const MUTED = '#6B635A';    // gris chaud, accordé à l'ivoire

/** États de la matrice de couverture — jamais un dégradé de valeurs. */
export const GAP_STATE: Record<string, { bg: string; fg: string }> = {
  couvert:               { bg: '#5A0F16', fg: '#F7F4EF' },
  aucune_donnee_recente: { bg: '#C49A2C', fg: '#1A1A1A' },
  periode_inconnue:      { bg: '#9A9086', fg: '#FFFFFF' },
  aucune_donnee:         { bg: '#EFEAE0', fg: '#6B635A' },
};

/** Teintes de section — distinguent les registres sans jamais suggérer qu'ils s'additionnent. */
export const SECTION_TINT: Record<string, string> = {
  maladies:            '#F3EAEA',
  etats_nutritionnels: '#F8F1E2',
  indicateurs:         '#EFEDE8',
};
