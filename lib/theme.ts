/**
 * ASKIP public — palette.
 *
 * Identité ASKIP (vert profond + or), mais en THÈME CLAIR : ce portail est lu
 * par des décideurs, imprimé, projeté en réunion. Le sombre de Tower est un
 * choix d'outil de supervision, pas de document institutionnel.
 */
export const INK = '#061C15';      // vert profond — texte et aplats
export const PAPER = '#FBFAF7';    // fond, chaud plutôt que blanc pur
export const CARD = '#FFFFFF';
export const GOLD = '#B8860B';     // or assombri pour tenir le contraste sur fond clair
export const GREEN = '#2F6B57';    // vert secondaire
export const LINE = '#E4E0D6';
export const MUTED = '#5B6660';

/** États de la matrice de couverture — jamais un dégradé de valeurs. */
export const GAP_STATE: Record<string, { bg: string; fg: string }> = {
  couvert:               { bg: '#2F6B57', fg: '#FFFFFF' },
  aucune_donnee_recente: { bg: '#B8860B', fg: '#FFFFFF' },
  periode_inconnue:      { bg: '#8C8577', fg: '#FFFFFF' },
  aucune_donnee:         { bg: '#F0EDE5', fg: '#5B6660' },
};

/** Teintes de section — distinguent les registres sans jamais suggérer qu'ils s'additionnent. */
export const SECTION_TINT: Record<string, string> = {
  maladies:            '#EAF1EE',
  etats_nutritionnels: '#F5EFE2',
  indicateurs:         '#ECEFF3',
};
