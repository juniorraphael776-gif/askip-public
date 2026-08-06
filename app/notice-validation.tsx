/**
 * Note au lecteur — la carte applique enfin le palier de validation.
 *
 * Rédigée par le poste noyau, publiée ici VERBATIM. En ligne AVANT la migration 048 :
 * un lecteur qui revient et voit 457 observations de moins sans un mot lit une
 * régression là où il y a une correction.
 *
 * ── CE QUE LE TEXTE SÉPARE, ET QU'IL NE FAUT PAS FONDRE ─────────────────────
 *   455 en attente de relecture   une file d'attente
 *     2 contestées                un désaccord
 * « Non validées » aurait été plus court et moins vrai : les deux n'appellent pas la
 * même lecture.
 *
 * Le premier fait énoncé est qu'AUCUN PAYS NE DISPARAÎT — 39 avant, 39 après. C'est
 * la question qu'un lecteur de carte se pose en premier.
 *
 * ── IL N'Y A PAS DE GARDE SUR CE CHIFFRE, ET C'EST ÉCRIT ICI POUR QU'ON LE SACHE ──
 * Une première version refusait d'afficher la note si le compte de pays descendait
 * sous 39. Elle ne protégeait que `/burden`, seul écran où ce compte est calculé :
 * l'accueil ne dispose que des douze premiers pays, le profil pays d'aucun total.
 * Deux écrans sur trois auraient donc continué d'affirmer le contraire.
 *
 * Une garde partielle qu'on croira générale est pire que pas de garde. Elle a été
 * retirée plutôt qu'étendue : payer une lecture supplémentaire sur deux écrans pour
 * surveiller un fait stable était disproportionné.
 *
 * À la place, le chiffre est DATÉ dans le texte. Un lecteur de 2027 verra « mesuré le
 * 6 août 2026 » et saura que c'est un relevé, pas une propriété permanente du corpus.
 * C'est le seul écart au verbatim du poste noyau, fait sur instruction.
 *
 * Trois choses ne sont PAS mentionnées, délibérément : le chiffre de 405 — celui de la
 * carte au référentiel, quand le lecteur verra bouger 457 —, et deux défauts connus
 * mais non circonscrits. Annoncer un défaut qu'on ne sait pas borner fait douter de
 * tous les chiffres sans donner de quoi trier.
 */
import type { Lang } from '@/lib/i18n';
import { GOLD, INK, LINE } from '@/lib/theme';

export function ValidationTierNotice({ lang }: { lang: Lang }) {
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
          ? 'Le 6 août 2026, la carte a commencé à appliquer le même niveau de validation que le reste du site.'
          : 'On 6 August 2026, the map began applying the same level of validation as the rest of the site.'}
      </p>

      <p className="mb-2">
        {fr
          ? 'Chaque observation de ce corpus passe par un contrôle qui lui attribue un statut : validée, en attente de relecture, ou contestée. Les écrans de recherche n’affichaient déjà que les observations '
          : 'Every observation in this corpus goes through a check that assigns it a status: validated, pending review, or disputed. The search screens already showed '}
        <strong>{fr ? 'validées' : 'validated'}</strong>
        {fr
          ? '. La carte, elle, les affichait toutes — non par choix, mais parce que le filtre y manquait.'
          : ' observations only. The map showed all of them — not by design, but because the filter was missing.'}
      </p>

      <p className="mb-2">
        <strong>
          {fr
            ? '457 observations ont donc été retirées de la carte et des profils pays : 455 étaient en attente de relecture, 2 étaient contestées.'
            : '457 observations have therefore been removed from the map and the country profiles: 455 were pending review, 2 were disputed.'}
        </strong>{' '}
        {fr
          ? 'Elles n’ont pas disparu du corpus. Elles n’ont simplement pas encore franchi le contrôle que les autres chiffres du site ont franchi.'
          : 'They have not disappeared from the corpus. They simply have not yet passed the check that every other figure on the site has passed.'}
      </p>

      <p className="mb-2">
        <strong>{fr ? 'Aucun pays ne disparaît.' : 'No country disappears.'}</strong>{' '}
        {fr
          ? 'Les 39 pays documentés le restent — 39 avant, 39 après, mesuré le 6 août 2026. 24 couples pays × maladie cessent d’être affichés, faute d’une observation validée pour les soutenir.'
          : 'All 39 documented countries remain — 39 before, 39 after, measured on 6 August 2026. 24 country × disease pairs stop being displayed, for want of a validated observation to support them.'}
      </p>

      <p className="mb-2">
        <strong>
          {fr
            ? 'Une seconde correction, plus petite et de nature différente.'
            : 'A second, smaller correction of a different kind.'}
        </strong>{' '}
        {fr
          ? '20 observations étaient comptées deux fois. Lorsqu’un article mentionne « P. falciparum » et « P. ovale », les deux deviennent « paludisme » et la même mesure était comptée deux fois dans la même case ; de même lorsqu’un article cite « Nigeria » et « Lagos ». Huit cases étaient concernées, dont deux nettement : le choléra en République démocratique du Congo affichait 4 observations pour 2, le paludisme en Somalie 8 pour 5.'
          : '20 observations were being counted twice. When a paper mentions both “P. falciparum” and “P. ovale”, both become “malaria” and the same measurement was counted twice in the same cell; likewise when a paper cites both “Nigeria” and “Lagos”. Eight cells were affected, two of them markedly: cholera in the Democratic Republic of the Congo showed 4 observations instead of 2, malaria in Somalia 8 instead of 5.'}
      </p>

      <p className="mb-2">
        <strong>
          {fr
            ? 'Une limite qui reste, et qui est désormais signalée.'
            : 'A limitation that remains, and is now flagged.'}
        </strong>{' '}
        {fr
          ? 'Quand un article mesure une co-infection — « prévalence de la triple infection VIH/VHB/VHC : 0,64 % » — cette valeur apparaît sous chacune des trois maladies. C’est le cas de '
          : 'When a paper measures a co-infection — “prevalence of HIV/HBV/HCV triple infection: 0.64%” — that value appears under each of the three diseases. This is the case for '}
        <strong>{fr ? '12 % des observations de la carte' : '12% of the observations on the map'}</strong>
        {fr
          ? '. Ces lignes sont exactes, mais elles ne s’additionnent pas : les additionner reviendrait à compter la même mesure plusieurs fois. Elles restent visibles et portent désormais une marque indiquant le nombre de maladies concernées, parce que les masquer effacerait aussi la trace de ce qui reste à faire.'
          : '. These rows are accurate, but they do not add up: summing them would count the same measurement several times. They remain visible and now carry a marker giving the number of diseases involved, because hiding them would also hide the evidence of what is still undone.'}
      </p>

      <p className="mt-3 border-t pt-3 font-semibold" style={{ borderColor: LINE }}>
        {fr
          ? 'Ce n’est pas une perte de données. C’est un chiffre qui cesse d’être plus large que ce qu’il annonçait.'
          : 'This is not a loss of data. It is a figure that stops being broader than it claimed to be.'}
      </p>
    </aside>
  );
}
