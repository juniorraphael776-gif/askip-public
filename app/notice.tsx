/**
 * Note au lecteur — pourquoi les comptes du profil pays ont baissé.
 *
 * Rédigée par le poste noyau, publiée ici VERBATIM. Elle doit être en ligne AVANT la
 * migration 043 : un lecteur qui revient et voit ses chiffres divisés par six sans un
 * mot lit une régression là où il y a une correction.
 *
 * ── CE QUE LE TEXTE DISTINGUE, ET QU'IL NE FAUT PAS FUSIONNER ──────────────
 * Deux natures de limite, et c'est le point du texte :
 *
 *   27 851 observations RETIRÉES du décompte — elles ne répondent pas à la même
 *          question. Elles restent dans le corpus, consultables ailleurs.
 *    1 600 observations SIGNALÉES et conservées — exactes mais mal rangées, marquées
 *          `in_referential = false`. Les masquer effacerait la trace de ce qui reste
 *          à faire, et la somme affichée cesserait de retomber sur ses pieds.
 *
 * Écrire « retirées » pour les deux aurait donné un texte plus simple et un lecteur
 * incapable de retrouver ses comptes : le total resterait 5 885, pas 4 285.
 *
 * Les trois pays sont NOMMÉS. Un pays qui disparaît sans être nommé fait douter de
 * tous les autres.
 */
import type { Lang } from '@/lib/i18n';
import { GOLD, INK, LINE } from '@/lib/theme';

export function CountsDropNotice({ lang }: { lang: Lang }) {
  const fr = lang === 'fr';
  return (
    <aside
      className="mb-10 rounded-lg p-5 text-[13px] leading-relaxed"
      style={{ background: '#FFF4E0', border: `1px solid ${GOLD}`, color: INK }}
    >
      <h2 className="mb-2 text-sm font-bold">
        {fr ? 'Pourquoi ces chiffres ont baissé' : 'Why these figures went down'}
      </h2>

      <p className="mb-2">
        {fr
          ? 'Le 5 août 2026, le profil pays a cessé d’additionner des mesures qui ne se comparent pas.'
          : 'On 5 August 2026, the country profile stopped adding up measurements that cannot be compared.'}
      </p>

      <p className="mb-2">
        {fr
          ? 'Jusqu’à cette date, la colonne « observations » mêlait des prévalences, des sensibilités de test, des taux de guérison et des variations d’une année sur l’autre. '
          : 'Until then, the “observations” column mixed prevalences, diagnostic test sensitivities, cure rates and year-on-year changes. '}
        <strong>
          {fr
            ? 'Additionner une sensibilité de test et une prévalence produit un nombre qui ne désigne rien.'
            : 'Adding a test sensitivity to a prevalence produces a number that means nothing.'}
        </strong>
      </p>

      <p className="mb-2">
        <strong>
          {fr
            ? '27 851 observations ont donc été retirées de ce décompte.'
            : '27,851 observations have therefore been removed from this count.'}
        </strong>{' '}
        {fr
          ? 'Elles n’ont pas disparu du corpus : elles ne répondent simplement pas à la même question, et elles sont consultables ailleurs. Ce qui reste — '
          : 'They have not disappeared from the corpus: they simply answer a different question, and remain available elsewhere. What is left — '}
        <strong>
          {fr ? '5 885 observations sur 39 pays' : '5,885 observations across 39 countries'}
        </strong>
        {fr
          ? ' — ne contient que des prévalences et des incidences, qui se comparent entre elles.'
          : ' — contains only prevalences and incidences, which can be compared with one another.'}
      </p>

      <p className="mb-2">
        <strong>
          {fr ? 'Une seconde limite, de nature différente.' : 'A second limitation, of a different kind.'}
        </strong>{' '}
        {fr ? 'Parmi ces 5 885, ' : 'Of those 5,885, '}
        <strong>
          {fr
            ? '1 600 portent un libellé qui n’est pas encore normalisé'
            : '1,600 carry a label that has not yet been normalised'}
        </strong>
        {fr
          ? ' : « asymptomatic malaria » apparaît à côté de « paludisme » au lieu d’y être rattaché. Ces lignes sont exactes — elles sont mal rangées. '
          : ': “asymptomatic malaria” appears alongside “malaria” instead of being mapped onto it. These rows are accurate — they are misfiled. '}
        <strong>
          {fr
            ? 'Elles restent affichées et sont signalées comme telles'
            : 'They remain visible and are flagged as such'}
        </strong>
        {fr
          ? ', parce que les masquer effacerait aussi la trace de ce qui reste à faire.'
          : ', because hiding them would also hide the evidence of what is still undone.'}
      </p>

      <p className="mb-2">
        {fr
          ? 'Trois pays — Djibouti, Égypte, Guinée équatoriale — n’apparaissent plus dans ce décompte : le corpus ne contient, à ce jour, aucune prévalence ni incidence de maladie les concernant.'
          : 'Three countries — Djibouti, Egypt, Equatorial Guinea — no longer appear in this count: the corpus currently holds no disease prevalence or incidence for them.'}
      </p>

      <p className="mt-3 border-t pt-3 font-semibold" style={{ borderColor: LINE }}>
        {fr
          ? 'Ce n’est pas une perte de données. C’est la fin d’un calcul qui n’en était pas un.'
          : 'This is not a loss of data. It is the end of a calculation that was never one.'}
      </p>
    </aside>
  );
}
