import { GOLD, LINE, MUTED } from '@/lib/theme';
import type { Lang } from '@/lib/i18n';

/**
 * UNE LIGNE, ET TOUT LE DÉTAIL SUR LA PAGE DÉDIÉE.
 *
 * Le portail portait jusqu'ici des blocs entiers en tête d'écran : la note expliquant
 * la baisse des chiffres, le palier de validation, deux `KeyFact` sur les manques, un
 * bandeau méthodologique. Chacun était exact, chacun avait sa raison — et ensemble ils
 * occupaient le premier écran avant que le lecteur ait vu une seule donnée.
 *
 * Le modèle est celui de la ligne sous une zone de saisie : « Claude peut faire des
 * erreurs. Vérifiez les réponses. » Une ligne, discrète, cliquable, et une page
 * d'assistance derrière. Elle est lue par ceux qui la cherchent et n'arrête pas les
 * autres.
 *
 * ── CE N'EST PAS UN ADOUCISSEMENT, ET LA DIFFÉRENCE TIENT À UN POINT ────────
 * Rien n'est retiré : le détail est publié, à une adresse stable, et la ligne y mène
 * depuis chaque écran concerné. Ce qui change est l'ORDRE — la limite après l'objet
 * qu'elle limite, pas avant. Une limite énoncée avant ne renseigne personne ; elle
 * décourage.
 *
 * ── « DÉFIS » ET NON « LIMITES » ────────────────────────────────────────────
 * Le mot appelle la collaboration au lieu de la clore. Une limite est un état, un défi
 * est un travail — et ce corpus est un travail en cours dont les manques sont
 * mesurés, pas subis.
 */
export function DefisConnus({ lang, texte }: { lang: Lang; texte?: string }) {
  const fr = lang === 'fr';
  const defaut = fr
    ? 'Ces chiffres ont des défis connus'
    : 'These figures have known challenges';
  return (
    <p className="mb-6 border-b pb-3 text-[12px]" style={{ borderColor: LINE, color: MUTED }}>
      {texte ?? defaut}
      {' — '}
      <a href={`/${lang}/challenges`} className="hover:underline" style={{ color: GOLD }}>
        {fr ? 'voir Défis connus' : 'see Known challenges'}
      </a>
    </p>
  );
}
