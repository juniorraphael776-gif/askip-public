/**
 * Note au lecteur — la carte applique enfin le palier de validation.
 *
 * Rédigée par le poste noyau, publiée ici VERBATIM. En ligne AVANT la migration 048 :
 * un lecteur qui revient et voit ses chiffres baisser sans un mot lit une régression
 * là où il y a une correction.
 *
 * ── TROISIÈME VERSION, ET LES DEUX PREMIÈRES AVAIENT ÉTÉ RELUES ─────────────
 * v1 : « 457 retirées » et « 20 doubles comptes » dans la même arithmétique. 457 est
 *      le chiffre des PROFILS, 20 celui de la CARTE. Un lecteur des profils posant
 *      5 885 − 457 − 20 obtenait 5 408 quand le site affiche 5 407.
 * v2 : sépare 20 et 21, garde 457 pour les deux surfaces. Un lecteur de la carte
 *      posant 4 460 − 457 − 20 obtenait 3 983 quand la carte affiche 4 035.
 * v3 : deux blocs séparés, chacun avec son total, ses retraits et sa décomposition.
 *
 * Et un troisième nombre était faux sans que personne ne l'ait relevé : le taux de
 * valeur partagée annoncé à 12 % ne valait pour AUCUNE des deux surfaces — 11,1 % sur
 * la carte, 16,4 % sur les profils.
 *
 * ── CE QUE LE TEXTE SÉPARE, ET QU'IL NE FAUT JAMAIS FONDRE ──────────────────
 * Deux surfaces, deux décomptes, et l'un ne se déduit pas de l'autre : la carte ne
 * montre que les maladies au vocabulaire de référence, les profils les montrent
 * toutes. Les deux décompositions diffèrent — 403 en attente sur la carte, 455 sur
 * les profils — et les deux « 2 contestées » sont les MÊMES observations, la carte
 * étant un sous-ensemble strict des profils. Le texte le dit plutôt que de laisser
 * deux nombres égaux sans raison.
 *
 * ── IL N'Y A PAS DE GARDE SUR LE COMPTE DE PAYS ─────────────────────────────
 * Une première version refusait d'afficher la note si le compte descendait sous 39.
 * Elle ne protégeait que `/burden`, seul écran où ce compte est calculé — deux écrans
 * sur trois auraient continué d'affirmer le contraire. Une garde partielle qu'on
 * croira générale est pire que pas de garde.
 *
 * Retirée plutôt qu'étendue, et le chiffre est DATÉ dans le texte à la place. Dater
 * une affirmation coûte un fragment de phrase et remplace une surveillance
 * permanente : la garde demandait deux lectures à chaque rendu pour vérifier un fait
 * qui ne bouge qu'avec le corpus.
 */
import type { Lang } from '@/lib/i18n';
import { GOLD, INK, LINE, MUTED } from '@/lib/theme';

function Bloc({ titre, lignes }: { titre: string; lignes: string[] }) {
  return (
    <div className="mb-3">
      <p className="mb-1 font-semibold">{titre}</p>
      <pre
        className="overflow-x-auto rounded px-3 py-2 text-[12px] leading-relaxed"
        style={{ background: '#FFF9EE', border: `1px solid ${LINE}`, color: INK }}
      >
        {lignes.join('\n')}
      </pre>
    </div>
  );
}

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

      <p className="mb-3">
        {fr
          ? 'Chaque observation de ce corpus passe par un contrôle qui lui attribue un statut : validée, en attente de relecture, ou contestée. Les écrans de recherche n’affichaient déjà que les observations '
          : 'Every observation in this corpus goes through a check that assigns it a status: validated, pending review, or disputed. The search screens already showed '}
        <strong>{fr ? 'validées' : 'validated'}</strong>
        {fr
          ? '. La carte, elle, les affichait toutes — non par choix, mais parce que le filtre y manquait.'
          : ' observations only. The map showed all of them — not by design, but because the filter was missing.'}
      </p>

      <p className="mb-3">
        <strong>
          {fr
            ? 'Deux écrans, deux décomptes, et l’un ne se déduit pas de l’autre.'
            : 'Two screens, two counts, and neither follows from the other.'}
        </strong>{' '}
        {fr
          ? 'La carte ne montre que les maladies dont le nom est normalisé ; les profils pays les montrent toutes. Chacun a donc son propre total, et les chiffres ci-dessous ne sont pas interchangeables.'
          : 'The map shows only diseases whose name has been normalised; the country profiles show them all. Each therefore has its own total, and the figures below are not interchangeable.'}
      </p>

      <Bloc
        titre={fr ? 'Sur la carte des maladies' : 'On the disease map'}
        lignes={fr ? [
          '4 460 observations  →  4 035',
          '  −405  non validées : 403 en attente de relecture, 2 contestées',
          '  − 20  comptées deux fois, sur 8 cases',
          '',
          '392 couples pays × maladie  →  386',
          '39 pays  →  39',
        ] : [
          '4,460 observations  →  4,035',
          '  −405  not validated: 403 pending review, 2 disputed',
          '  − 20  counted twice, across 8 cells',
          '',
          '392 country × disease pairs  →  386',
          '39 countries  →  39',
        ]}
      />

      <Bloc
        titre={fr ? 'Sur les profils pays' : 'On the country profiles'}
        lignes={fr ? [
          '5 885 observations  →  5 407',
          '  −457  non validées : 455 en attente de relecture, 2 contestées',
          '  − 21  comptées deux fois, sur 9 cases',
          '',
          '1 257 couples pays × maladie  →  1 233',
          '39 pays  →  39',
        ] : [
          '5,885 observations  →  5,407',
          '  −457  not validated: 455 pending review, 2 disputed',
          '  − 21  counted twice, across 9 cells',
          '',
          '1,257 country × disease pairs  →  1,233',
          '39 countries  →  39',
        ]}
      />

      <p className="mb-2">
        {fr
          ? 'Les deux observations contestées sont les mêmes des deux côtés. Aucune observation n’a disparu du corpus : celles qui sont retirées de ces deux écrans n’ont simplement pas encore franchi le contrôle que les autres chiffres du site ont franchi.'
          : 'The two disputed observations are the same on both sides. Nothing has disappeared from the corpus: what is removed from these two screens simply has not yet passed the check that every other figure on the site has passed.'}
      </p>

      <p className="mb-2">
        <strong>{fr ? 'Aucun pays ne disparaît' : 'No country disappears'}</strong>
        {fr ? ', sur aucun des deux écrans — 39 avant, 39 après, mesuré le 6 août 2026.'
            : ', on either screen — 39 before, 39 after, measured on 6 August 2026.'}
      </p>

      <p className="mb-2">
        <strong>
          {fr ? 'Le double compte, deuxième correction.' : 'Double counting, the second correction.'}
        </strong>{' '}
        {fr
          ? 'Lorsqu’un article mentionne « P. falciparum » et « P. ovale », les deux deviennent « paludisme » et la même mesure était comptée deux fois dans la même case ; de même lorsqu’un article cite « Nigeria » et « Lagos ». Deux cases étaient nettement touchées, et elles apparaissent sur les deux écrans : le choléra en République démocratique du Congo affichait 4 observations pour 2, le paludisme en Somalie 8 pour 5. Les profils pays comptent une case de plus que la carte, dont le libellé n’est pas encore normalisé.'
          : 'When a paper mentions both “P. falciparum” and “P. ovale”, both become “malaria” and the same measurement was counted twice in the same cell; likewise when a paper cites both “Nigeria” and “Lagos”. Two cells were markedly affected, and they appear on both screens: cholera in the Democratic Republic of the Congo showed 4 observations instead of 2, malaria in Somalia 8 instead of 5. The country profiles hold one cell more than the map, whose label is not yet normalised.'}
      </p>

      <p className="mb-2">
        <strong>
          {fr ? 'Une limite qui reste, et qui est désormais signalée.' : 'A limitation that remains, and is now flagged.'}
        </strong>{' '}
        {fr
          ? 'Quand un article mesure une co-infection — « prévalence de la triple infection VIH/VHB/VHC : 0,64 % » — cette valeur apparaît sous chacune des trois maladies. Cela concerne '
          : 'When a paper measures a co-infection — “prevalence of HIV/HBV/HCV triple infection: 0.64%” — that value appears under each of the three diseases. This affects '}
        <strong>{fr ? '11,1 % des observations de la carte' : '11.1% of observations on the map'}</strong>
        {fr ? ' et ' : ' and '}
        <strong>{fr ? '16,4 % de celles des profils pays' : '16.4% of those in the country profiles'}</strong>
        {fr
          ? ' : l’écart tient à ce que les profils affichent aussi des libellés non normalisés, souvent cités aux côtés d’une maladie connue. Ces lignes sont exactes, mais elles ne s’additionnent pas : les additionner reviendrait à compter la même mesure plusieurs fois. Elles restent visibles et portent désormais une marque indiquant le nombre de maladies concernées, parce que les masquer effacerait aussi la trace de ce qui reste à faire.'
          : ': the difference is because the profiles also display non-normalised labels, often cited alongside a known disease. These rows are accurate, but they do not add up: summing them would count the same measurement several times. They remain visible and now carry a marker giving the number of diseases involved, because hiding them would also hide the evidence of what is still undone.'}
      </p>

      <p className="mt-3 border-t pt-3 font-semibold" style={{ borderColor: LINE }}>
        {fr
          ? 'Ce n’est pas une perte de données. Ce sont deux chiffres qui cessent d’être plus larges que ce qu’ils annonçaient.'
          : 'This is not a loss of data. These are two figures that stop being broader than they claimed to be.'}
      </p>

      <p className="mt-2 text-[11px]" style={{ color: MUTED }}>
        {fr ? 'Relevé du 6 août 2026.' : 'Measured 6 August 2026.'}
      </p>
    </aside>
  );
}
