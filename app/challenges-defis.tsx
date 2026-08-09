import type { Lang } from '@/lib/i18n';
import { BORDEAUX, GOLD, INK, LINE, MUTED } from '@/lib/theme';

/**
 * Partie 1 de Défis connus — le texte du poste noyau, rendu tel quel.
 *
 * ── LE TABLEAU DES STATUTS VIENT AVANT LES DÉFIS, ET C'EST L'ORDRE QUI COMPTE ──
 * « compté », « estimé », « lu » et « non mesuré » ne se citent pas de la même façon.
 * Sans cette colonne, une lecture de vingt-cinq extraits et un décompte sur 63 227
 * lignes auraient la même autorité apparente. Le tableau est donc posé AVANT le premier
 * chiffre, pas en annexe : une clé de lecture livrée après coup ne relit pas ce qui a
 * déjà été lu.
 *
 * C'est le même partage que COMPTÉ / LU / TRANSMIS sur la fiche de dépôt et que les
 * statuts de durée de la partie 3. Trois surfaces, une seule grammaire.
 */
export type Statut = 'compte' | 'estime' | 'lu' | 'non-mesure' | 'documente';

const LIB: Record<Statut, [string, string]> = {
  compte: ['COMPTÉ', 'COUNTED'], estime: ['ESTIMÉ', 'ESTIMATED'], lu: ['LU', 'READ'],
  'non-mesure': ['NON MESURÉ', 'NOT MEASURED'], documente: ['LIMITE DOCUMENTÉE', 'DOCUMENTED LIMITATION'],
};
const BG: Record<Statut, string> = {
  compte: '#E8F0EA', estime: '#FBF0DC', lu: '#F6E3DC', 'non-mesure': '#EFEAE0', documente: '#EDEAF5',
};

export function Jauge({ k, lang }: { k: Statut; lang: Lang }) {
  return (
    <span className="rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide"
          style={{ background: BG[k], color: INK }}>{LIB[k][lang === 'fr' ? 0 : 1]}</span>
  );
}

export function LectureDesChiffres({ lang }: { lang: Lang }) {
  const fr = lang === 'fr';
  const lignes: [Statut, string, string][] = [
    ['compte', 'une requête sur l’ensemble concerné. Exact à sa date.', 'a query over the whole set concerned. Exact at its date.'],
    ['estime', 'un échantillon tiré au sort et relu, avec son intervalle de confiance.', 'a random sample, re-read, with its confidence interval.'],
    ['lu', 'quelqu’un a lu des extraits et jugé. Aucun tiers n’a contrôlé. Statut le plus faible, signalé partout où il s’applique.', 'someone read excerpts and judged. No third party checked. Weakest status, flagged wherever it applies.'],
    ['non-mesure', 'la question se pose et nous n’y avons pas répondu.', 'the question exists and we have not answered it.'],
  ];
  return (
    <div className="mb-6 rounded-lg p-4" style={{ border: `1px solid ${LINE}`, background: '#FFFDF8' }}>
      <p className="mb-3 text-[13px] font-semibold" style={{ color: BORDEAUX }}>
        {fr ? 'Comment lire les chiffres de cette page' : 'How to read the figures on this page'}
      </p>
      <dl className="text-[12px]">
        {lignes.map(([k, f, e]) => (
          <div key={k} className="flex flex-wrap items-baseline gap-x-3 border-b py-1.5 last:border-b-0" style={{ borderColor: LINE }}>
            <dt className="w-44 shrink-0"><Jauge k={k} lang={lang} /></dt>
            <dd style={{ color: MUTED }}>{fr ? f : e}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[12px]" style={{ color: INK }}>
        {fr
          ? <><strong>Un chiffre « lu » et un chiffre « compté » ne se citent pas de la même façon.</strong> Sans cette colonne, une lecture de vingt-cinq extraits et un décompte sur 63 227 lignes auraient la même autorité apparente.</>
          : <><strong>A “read” figure and a “counted” figure cannot be cited the same way.</strong> Without this column, twenty-five re-read excerpts and a count over 63,227 rows would carry the same apparent authority.</>}
      </p>
      <p className="mt-2 text-[12px]" style={{ color: MUTED }}>
        {fr
          ? <><strong style={{ color: INK }}>Le corpus, compté</strong> : 72 932 observations extraites de 9 199 publications, dont 63 227 validées, 9 549 en attente de relecture et 156 contestées. La carte de morbidité en affiche 4 043 — les prévalences et incidences, sur maladie, avec pays.</>
          : <><strong style={{ color: INK }}>The corpus, counted</strong>: 72,932 observations extracted from 9,199 publications — 63,227 validated, 9,549 pending review, 156 disputed. The disease map shows 4,043 of them: prevalences and incidences, on a disease, with a country.</>}
      </p>
    </div>
  );
}

function Defi({ n, titre, statut, lang, savons, pourquoi, faudrait, bloc }: {
  n: number; titre: string; statut: Statut; lang: Lang;
  savons: React.ReactNode; pourquoi: React.ReactNode; faudrait: React.ReactNode; bloc?: string;
}) {
  const fr = lang === 'fr';
  return (
    <article className="mb-6 rounded-lg p-5" style={{ border: `1px solid ${LINE}`, background: '#FFFDF8' }}>
      <h3 className="mb-2 text-[15px] font-bold" style={{ color: BORDEAUX }}>
        <span className="mr-2 tabular-nums" style={{ color: GOLD }}>{n}.</span>{titre}
      </h3>
      <div className="space-y-2.5 text-[13px] leading-relaxed">
        <p>
          <span className="mr-2 font-semibold" style={{ color: INK }}>{fr ? 'Ce que nous savons' : 'What we know'}</span>
          <Jauge k={statut} lang={lang} />
        </p>
        {bloc && (
          <pre className="overflow-x-auto rounded p-3 text-[11px] leading-relaxed"
               style={{ background: '#F1EADD', color: INK }}>{bloc}</pre>
        )}
        <p>{savons}</p>
        <p><strong style={{ color: INK }}>{fr ? 'Pourquoi ce n’est pas corrigé.' : 'Why it is not fixed.'}</strong> {pourquoi}</p>
        <p><strong style={{ color: INK }}>{fr ? 'Ce qu’il faudrait pour le relever.' : 'What it would take.'}</strong> {faudrait}</p>
      </div>
    </article>
  );
}

export function HuitDefis({ lang }: { lang: Lang }) {
  const fr = lang === 'fr';
  return (
    <>
      <p className="mb-4 text-[13px] leading-relaxed">
        {fr
          ? <>Cette page est publique pour une raison simple : <strong>une infrastructure de connaissance qui ne publie pas ses défauts n’est pas auditable.</strong> Un chiffre dont on ignore la marge d’erreur ne se vérifie pas — il se croit ou se rejette. Nous préférons qu’il se vérifie.</>
          : <>This page is public for a simple reason: <strong>a knowledge infrastructure that does not publish its defects cannot be audited.</strong> A figure whose margin of error is unknown cannot be verified — it can only be believed or dismissed. We would rather it were verified.</>}
      </p>
      <p className="mb-5 text-[13px] leading-relaxed" style={{ color: MUTED }}>
        {fr
          ? 'Chaque défi est présenté en trois parties : ce que nous savons, avec le statut de la mesure · pourquoi ce n’est pas corrigé, sans détour · ce qu’il faudrait pour le relever, et qui pourrait le faire. La troisième est la raison d’être de cette page. Plusieurs de ces défis ne demandent pas de moyens, mais un relecteur — et ce relecteur existe probablement quelque part.'
          : 'Each challenge has three parts: what we know, with the status of the measurement · why it is not fixed, without evasion · what it would take to fix it, and who could do it. The third part is why this page exists. Several of these challenges need no funding — they need a reader, and that reader probably exists somewhere.'}
      </p>

      <LectureDesChiffres lang={lang} />

      <p className="mb-4 text-[13px] font-semibold" style={{ color: BORDEAUX }}>
        {fr ? 'Les défis, du plus lourd au plus léger' : 'The challenges, heaviest first'}
      </p>

      <Defi n={1} lang={lang} statut="lu"
        titre={fr ? 'Des valeurs qui ne sont pas de la grandeur annoncée' : 'Values that are not of the quantity announced'}
        bloc={fr
          ? '« most regions in Somalia were at least 70% likely to be below 5% prevalence »\n                                              -> valeur retenue : 70'
          : '"most regions in Somalia were at least 70% likely to be below 5% prevalence"\n                                              -> value kept: 70'}
        savons={fr
          ? <>Ce <strong>70</strong> est une <em>probabilité</em> affichée comme une <em>prévalence</em>. Vingt-cinq observations relues à la main, sept portaient ce défaut : <strong>ordre de grandeur ~190 observations</strong> sur la carte. <strong style={{ color: BORDEAUX }}>C’est le défaut le plus grave que nous connaissions</strong>, malgré son ampleur modeste : un lecteur n’a aucun moyen de le repérer. Une valeur mal rattachée affiche au moins la bonne grandeur ; celle-ci non.</>
          : <>That <strong>70</strong> is a <em>probability</em> displayed as a <em>prevalence</em>. Twenty-five observations re-read by hand, seven carried this defect: <strong>order of magnitude ~190 observations</strong> on the map. <strong style={{ color: BORDEAUX }}>It is the most serious defect we know of</strong>, despite its modest extent: a reader has no way to spot it. A misattached value at least shows the right quantity; this one does not.</>}
        pourquoi={fr
          ? 'Distinguer une prévalence d’une probabilité, d’une fraction attribuable ou d’une part de cas demande de comprendre la phrase, pas d’y repérer un motif. Nos détecteurs lexicaux échouent : celui que nous avons construit pour un défaut voisin atteignait 53 % de précision, et un marquage faux une fois sur deux n’est plus lu.'
          : 'Telling a prevalence from a probability, an attributable fraction or a share of cases requires understanding the sentence, not matching a pattern. Our lexical detectors fail: the one we built for a neighbouring defect reached 53% precision, and a flag that is wrong one time in two stops being read.'}
        faudrait={fr
          ? <>Un jeu annoté de 300 observations, étiquetées par grandeur. Le protocole d’échantillonnage existe et a déjà servi trois fois ; le calibrage coûte moins d’un dollar. <strong>Ce qui manque est l’annotateur</strong> : un épidémiologiste ou un biostatisticien, environ deux jours de travail. Avec ce jeu, un classifieur devient mesurable — et s’il n’atteint pas une précision suffisante, nous le dirons plutôt que de l’expédier.</>
          : <>An annotated set of 300 observations, labelled by quantity. The sampling protocol exists and has been used three times; the calibration costs under a dollar. <strong>What is missing is the annotator</strong>: an epidemiologist or biostatistician, about two days’ work. With that set, a classifier becomes measurable — and if it does not reach sufficient precision, we will say so rather than ship it.</>}
      />

      <Defi n={2} lang={lang} statut="estime"
        titre={fr ? 'Des valeurs qui ne mesurent pas la maladie sous laquelle elles sont classées' : 'Values that do not measure the disease they are filed under'}
        bloc={fr
          ? '12,1 % à 14,1 % de la carte    IC 95 % [5,7 – 21,0]    soit ~490 à 570 observations'
          : '12.1% to 14.1% of the map    95% CI [5.7 – 21.0]    roughly 490 to 570 observations'}
        savons={fr
          ? <>Une prévalence de neuropathie <em>chez les diabétiques</em> est rangée sous « diabète ». La valeur est réelle et correctement extraite ; <strong>c’est son rattachement qui est faux.</strong> Cent observations tirées au sort, classées par un modèle dont la précision mesurée est de 71 à 82 %, puis relues par <strong>une seule personne, sans contrôle par un tiers</strong>.</>
          : <>A prevalence of neuropathy <em>among diabetics</em> is filed under “diabetes”. The value is real and correctly extracted; <strong>its attachment is wrong.</strong> One hundred observations sampled at random, classified by a model whose measured precision is 71–82%, then re-read by <strong>one person, with no third-party check</strong>.</>}
        pourquoi={fr
          ? 'Un marquage automatique se tromperait environ une fois sur quatre. Et une marque de jugement fausse ne se distingue pas d’une vraie sans relecture — elle est donc pire qu’une absence de marque, qui laisse au moins le lecteur en alerte.'
          : 'Automatic flagging would be wrong about one time in four. And a false judgement flag is indistinguishable from a true one without re-reading — it is therefore worse than no flag, which at least keeps the reader alert.'}
        faudrait={fr
          ? <>Qu’un clinicien relise 500 observations et tranche, pour chacune, si la maladie affichée est le sujet de la mesure ou la population étudiée. Nous avons le protocole, l’échantillon et le classifieur qui prépare le travail — <strong>il manque le relecteur</strong>. Cinq cents jugements, à raison d’une dizaine de secondes chacun, représentent moins de deux heures pour quelqu’un du métier.</>
          : <>A clinician re-reading 500 observations and deciding, for each, whether the displayed disease is the subject of the measurement or the population studied. We have the protocol, the sample and the classifier that prepares the work — <strong>the reader is what is missing</strong>. Five hundred judgements, at roughly ten seconds each, is under two hours for someone in the field.</>}
      />

      <Defi n={3} lang={lang} statut="lu"
        titre={fr ? 'Des valeurs qui ont perdu la population sur laquelle elles portent' : 'Values that have lost the population they apply to'}
        bloc={fr
          ? '« Malaria prevalence was higher in males (57.7%) than females (47.2%) »\n        -> 57,7 est affiché comme LA prévalence du paludisme'
          : '"Malaria prevalence was higher in males (57.7%) than females (47.2%)"\n        -> 57.7 is displayed as THE prevalence of malaria'}
        savons={fr
          ? <>La valeur est <strong>vraie</strong> ; sa qualification a disparu — un sous-groupe présenté comme l’ensemble. Environ <strong>490 observations</strong>, mêmes vingt-cinq lectures que ci-dessus.</>
          : <>The value is <strong>true</strong>; its qualification has disappeared — a subgroup presented as the whole. About <strong>490 observations</strong>, from the same twenty-five readings.</>}
        pourquoi={fr
          ? 'À la différence du défi 1, la valeur n’est pas fausse : elle est incomplète. La réparer demande de récupérer le qualificatif — « chez les hommes », « en milieu rural », « en 2019 » — qui existe dans la phrase mais n’a pas été extrait. C’est un changement du schéma d’extraction, pas une correction de données.'
          : 'Unlike challenge 1, the value is not wrong: it is incomplete. Repairing it means recovering the qualifier — “among men”, “in rural areas”, “in 2019” — which exists in the sentence but was not extracted. That is a change to the extraction schema, not a data fix.'}
        faudrait={fr
          ? <>Ajouter un champ <code>strate</code> au schéma, puis ré-extraire le sous-ensemble concerné. Le coût de calcul est faible — nos passes sur 40 000 observations coûtent une dizaine de dollars. <strong>Le travail préalable est de définir un vocabulaire de strates</strong> qui ne devienne pas un champ libre : sexe, milieu, tranche d’âge, période.</>
          : <>Add a <code>stratum</code> field to the schema, then re-extract the affected subset. Compute cost is small — our passes over 40,000 observations cost around ten dollars. <strong>The prior work is defining a stratum vocabulary</strong> that does not become a free-text field: sex, setting, age band, period.</>}
      />

      <Defi n={4} lang={lang} statut="compte"
        titre={fr ? 'Deux tiers des localisations ne viennent pas du texte' : 'Two thirds of locations do not come from the text'}
        bloc={fr
          ? '46 539   observations portent un pays\n34 035   dont le pays est DÉDUIT, non écrit dans la phrase\n11 848   dont il vient de l’affiliation des auteurs'
          : '46,539   observations carry a country\n34,035   of which the country is INFERRED, not written in the sentence\n11,848   of which it comes from the authors’ affiliation'}
        savons={fr
          ? <>Un article signé depuis Lagos n’étudie pas nécessairement le Nigeria. Le champ <code>inherited</code> le signale ligne à ligne, et les observations concernées peuvent être écartées d’une requête.</>
          : <>A paper signed from Lagos does not necessarily study Nigeria. The <code>inherited</code> field flags this row by row, and the affected observations can be excluded with one query.</>}
        pourquoi={fr
          ? <>Ce n’est pas un défaut mais un arbitrage : sans cette déduction, deux observations sur trois n’auraient aucun pays et la carte serait vide. Le problème n’est pas la déduction, <strong>c’est que nous ne savons pas à quel point elle se trompe.</strong> Nous savons seulement que le taux d’erreur dépasse 6 %.</>
          : <>This is not a defect but a trade-off: without the inference, two observations in three would have no country and the map would be empty. The problem is not the inference — <strong>it is that we do not know how often it is wrong.</strong> We only know the error rate exceeds 6%.</>}
        faudrait={fr
          ? <>Deux cents observations dont le pays est déduit, vérifiées contre le lieu d’étude réel. C’est de la lecture de résumés — <strong>aucune expertise clinique n’est requise</strong>. Un stagiaire, un bibliothécaire, un étudiant en master peut le faire en une journée. <strong style={{ color: BORDEAUX }}>C’est, de tous les défis de cette page, celui dont le rapport valeur/effort est le meilleur</strong> : deux cents lectures transforment une inconnue en intervalle de confiance, sur un champ qui concerne 34 035 observations.</>
          : <>Two hundred observations whose country is inferred, checked against the paper’s actual study site. This is abstract reading — <strong>no clinical expertise required</strong>. An intern, a librarian, a master’s student can do it in a day. <strong style={{ color: BORDEAUX }}>Of every challenge on this page, this has the best value-to-effort ratio</strong>: two hundred readings turn an unknown into a confidence interval, on a field that affects 34,035 observations.</>}
      />

      <Defi n={5} lang={lang} statut="compte"
        titre={fr ? 'Le type de mesure n’est déterminé que sur les pourcentages' : 'Measure type is determined only on percentages'}
        bloc={fr
          ? '42 886   observations portent un type de mesure    (unité = %)\n26 810   en effectifs        -> aucun type\n 3 118   en taux             -> aucun type'
          : '42,886   observations carry a measure type    (unit = %)\n26,810   count-based        -> none\n 3,118   rate-based         -> none'}
        savons={fr
          ? <>Sans type de mesure, une observation <strong>ne peut pas atteindre la carte</strong>, quel que soit son contenu. Ce n’est pas un filtre de qualité : c’est le périmètre d’un traitement qui n’a pas été étendu.</>
          : <>Without a measure type, an observation <strong>cannot reach the map</strong>, whatever it contains. This is not a quality filter: it is the scope of a treatment that has not been extended.</>}
        pourquoi={fr
          ? <>Parce qu’étendre le classifieur ferait entrer un défaut connu avec lui. Parmi les observations en effectifs, environ <strong>290 portent plusieurs valeurs pour une seule retenue</strong> — « 120 enfants, 55 avaient une suppression virale durable, 65 un échec », où la valeur conservée est <strong>la taille de l’échantillon</strong>.</>
          : <>Because extending the classifier would bring a known defect with it. Among count-based observations, roughly <strong>290 carry several values for one kept</strong> — “120 children, 55 had durable viral suppression, 65 failed”, where the value kept is <strong>the sample size</strong>.</>}
        faudrait={fr
          ? 'Dans l’ordre : reprendre l’extraction des claims à valeurs multiples, puis étendre le classifieur. Le second point coûte environ 0,30 $ de calcul et une journée de calibrage. Le premier demande une décision de modèle — une observation peut-elle porter plusieurs valeurs ? — et c’est cette décision, pas le calcul, qui bloque.'
          : 'In order: revisit extraction for multi-value claims, then extend the classifier. The second costs about $0.30 of compute and a day of calibration. The first requires a model decision — can one observation carry several values? — and it is that decision, not the compute, that blocks.'}
      />

      <Defi n={6} lang={lang} statut="compte"
        titre={fr ? 'Une observation sur neuf porte sur plusieurs maladies à la fois' : 'One observation in nine covers several diseases at once'}
        savons={fr
          ? <>Quand un article mesure une co-infection — « prévalence de la triple infection VIH/VHB/VHC : 0,64 % » — cette valeur apparaît sous chacune des trois maladies : <strong>11,1 % des observations de la carte</strong>, 16,4 % des profils pays. Ces lignes sont exactes, mais <strong>elles ne s’additionnent pas</strong>.</>
          : <>When a paper measures a co-infection — “prevalence of HIV/HBV/HCV triple infection: 0.64%” — that value appears under each of the three diseases: <strong>11.1% of map observations</strong>, 16.4% of country-profile ones. These rows are accurate but <strong>do not add up</strong>.</>}
        pourquoi={fr
          ? 'Deux cas très différents se ressemblent : une co-infection mesurée conjointement, où la valeur vaut pour chaque maladie, et une duplication, où une seule maladie est mesurée et l’autre n’est que le contexte. Les distinguer demande le même jugement que le défi 2.'
          : 'Two very different cases look alike: a co-infection measured jointly, where the value holds for each disease, and a duplication, where only one disease is measured and the other is context. Telling them apart requires the same judgement as challenge 2.'}
        faudrait={fr
          ? <>Rien de nouveau : <strong>le travail du défi 2 résout celui-ci gratuitement.</strong> Un seul relecteur débloque les deux.</>
          : <>Nothing new: <strong>the work of challenge 2 solves this one for free.</strong> One reader unblocks both.</>}
      />

      <Defi n={7} lang={lang} statut="compte"
        titre={fr ? 'Le graphe ne relie pas les institutions, et relie peu les chercheurs' : 'The graph does not connect institutions, and barely connects researchers'}
        bloc={fr
          ? '   0 / 80   chercheurs rattachés à une institution en base\n22,4 %      des observations ont un chemin vers un chercheur'
          : '   0 / 80   researchers linked to an institution in the database\n22.4%       of observations have a path to a researcher'}
        savons={fr
          ? 'Les 43 institutions du corpus n’apparaissent pas dans le graphe. Nous les avons retirées plutôt que d’afficher 34 points isolés : un rapprochement par nom d’établissement atteignait 9 correspondances sur 80.'
          : 'The corpus’s 43 institutions do not appear in the graph. We removed them rather than display 34 isolated points: name matching reached 9 correspondences out of 80.'}
        pourquoi={fr
          ? 'Le lien chercheur → institution n’existe pas dans nos données, et le déduire d’un champ d’affiliation en texte libre produirait un rattachement faux neuf fois sur dix. Nous ne publions pas un lien que nous ne pouvons pas justifier.'
          : 'The researcher → institution link does not exist in our data, and inferring it from a free-text affiliation field would produce a wrong attachment nine times in ten. We do not publish a link we cannot justify.'}
        faudrait={fr
          ? <>Rattacher 80 chercheurs à leur institution, à la main, en s’appuyant sur les identifiants ROR — que nous avons déjà. <strong>Quatre-vingts décisions : une après-midi.</strong> C’est le défi le plus court de cette page, et il ouvre une lecture entière du corpus.</>
          : <>Linking 80 researchers to their institution by hand, using ROR identifiers — which we already hold. <strong>Eighty decisions: one afternoon.</strong> It is the shortest challenge on this page, and it opens up a whole reading of the corpus.</>}
      />

      <Defi n={8} lang={lang} statut="documente"
        titre={fr ? 'Les concepts n’ont pas tous la même granularité' : 'Concepts do not all have the same granularity'}
        savons={fr
          ? <>Certains concepts distinguent leur forme sévère par un concept séparé — <code>pneumonie</code> et <code>pneumonie sévère</code> — quand d’autres l’absorbent : <code>paludisme</code> couvre le paludisme grave. <strong>Deux taux ne sont donc pas toujours comparables entre concepts.</strong> Certains concepts sont volontairement imprécis, et ce n’est pas un défaut : sur trente observations de « diabète (non précisé) » relues, <strong>une seule</strong> permettait de distinguer le type 1 du type 2. L’imprécision est dans les publications, pas dans notre vocabulaire.</>
          : <>Some concepts separate their severe form into a distinct concept — <code>pneumonia</code> and <code>severe pneumonia</code> — while others absorb it: <code>malaria</code> covers severe malaria. <strong>Two rates are therefore not always comparable across concepts.</strong> Some concepts are deliberately imprecise, and that is not a defect: of thirty re-read observations of “diabetes (unspecified)”, <strong>one</strong> allowed type 1 to be told from type 2. The imprecision is in the papers, not in our vocabulary.</>}
        pourquoi={fr
          ? 'Uniformiser la convention touche paludisme, le premier concept du corpus. Le scinder sans avoir mesuré ce que cela déplace serait précisément le risque que ce projet cherche à éviter — nous l’avons fait une fois pour pneumonie, à petite échelle, et cela a suffi à en mesurer le coût.'
          : 'Unifying the convention touches malaria, the corpus’s first concept. Splitting it without measuring what that moves would be exactly the risk this project exists to avoid — we did it once for pneumonia, at small scale, and that was enough to measure the cost.'}
        faudrait={fr
          ? <>Une convention explicite — la sévérité est-elle un concept ou un attribut ? — puis une scission mesurée avant application. Le travail est le nôtre ; <strong>ce qui aiderait est un avis clinique</strong> sur les cas où la distinction change la lecture d’un chiffre.</>
          : <>An explicit convention — is severity a concept or an attribute? — then a split measured before it is applied. The work is ours; <strong>what would help is a clinical opinion</strong> on the cases where the distinction changes how a figure reads.</>}
      />
    </>
  );
}

/**
 * Les sept limites non mesurées.
 *
 * ⚠️ Cette section n'est pas un appendice de prudence. Une limite TUE est plus
 * dangereuse qu'une limite chiffrée : le lecteur qui ne la voit pas la compte pour
 * zéro. Chaque point ci-dessous est une question posée et sans réponse — et le dire
 * coûte moins cher que de laisser croire qu'elle ne se pose pas.
 */
export function NonMesure({ lang }: { lang: Lang }) {
  const fr = lang === 'fr';
  const pts: [string, string][] = [
    ['Le rappel de l’extraction. Nous ne savons pas combien d’affirmations chiffrées d’une publication n’ont PAS été extraites. Tous les taux de cette page portent sur ce qui a été extrait, jamais sur ce qui a été manqué.',
     'Extraction recall. We do not know how many numerical claims in a paper were NOT extracted. Every rate on this page concerns what was extracted, never what was missed.'],
    ['Le taux d’erreur de la localisation déduite. Connu supérieur à 6 %, jamais mesuré.',
     'The error rate of inferred locations. Known to exceed 6%, never measured.'],
    ['Les 9 549 observations en attente de relecture. Aucune échéance n’est promise.',
     'The 9,549 observations pending review. No deadline is promised.'],
    ['La couverture géographique et thématique. 39 pays apparaissent sur la carte ; nous n’avons pas mesuré si l’absence des autres traduit un corpus lacunaire ou une recherche inexistante.',
     'Geographic and thematic coverage. 39 countries appear on the map; we have not measured whether the absence of others reflects a gap in the corpus or a gap in the research.'],
    ['La précision de l’extraction elle-même. Aucune campagne d’annotation humaine n’a été conduite sur un échantillon aléatoire du corpus entier.',
     'The precision of extraction itself. No human annotation campaign has been run on a random sample of the whole corpus.'],
    ['La transportabilité des trois premiers défis. Ils sont mesurés sur 4 043 observations, soit 6,4 % du corpus publié. Rien n’établit qu’ils valent pour le reste.',
     'The transportability of the first three challenges. They are measured on 4,043 observations — 6.4% of the published corpus. Nothing establishes they hold for the rest.'],
    ['La co-signature entre chercheurs. Les listes d’auteurs existent sur 9 189 publications sur 9 199 et ne sont pas exploitées.',
     'Co-authorship between researchers. Author lists exist on 9,189 of 9,199 publications and are not exploited.'],
  ];
  return (
    <div className="mt-8 rounded-lg p-5" style={{ border: `1px solid ${LINE}`, background: '#FFFDF8' }}>
      <p className="mb-1 text-[15px] font-bold" style={{ color: BORDEAUX }}>
        {fr ? 'Ce que nous n’avons pas mesuré' : 'What we have not measured'}
      </p>
      <p className="mb-3 flex flex-wrap items-baseline gap-2 text-[12px]" style={{ color: MUTED }}>
        <Jauge k="non-mesure" lang={lang} />
        {fr
          ? 'par définition — et c’est pourquoi cette section existe. Une limite tue est plus dangereuse qu’une limite chiffrée.'
          : 'by definition — which is why this section exists. A silent limitation is more dangerous than a quantified one.'}
      </p>
      <ol className="ml-4 list-decimal space-y-1.5 text-[13px] leading-relaxed">
        {pts.map(([f, e]) => <li key={f.slice(0, 20)}>{fr ? f : e}</li>)}
      </ol>
    </div>
  );
}

/** Les contributions, classées par EFFORT et non par importance : la question du
 *  lecteur qui arrive ici est « qu'est-ce que je peux faire », pas « qu'est-ce qui
 *  compte le plus ». */
export function Contribuer({ lang }: { lang: Lang }) {
  const fr = lang === 'fr';
  const l: [string, string, string, string, string, string][] = [
    ['Rattacher 80 chercheurs à leur institution', 'Link 80 researchers to their institution', 'toute personne à l’aise avec ROR', 'anyone comfortable with ROR', 'une après-midi', 'one afternoon'],
    ['Vérifier 200 localisations déduites', 'Check 200 inferred locations', 'lecture de résumés, sans expertise clinique', 'abstract reading, no clinical expertise', 'une journée', 'one day'],
    ['Relire 500 observations sujet/population', 'Re-read 500 observations, subject vs population', 'clinicien, épidémiologiste, interne en santé publique', 'clinician, epidemiologist, public-health resident', 'deux heures', 'two hours'],
    ['Annoter 300 observations par grandeur', 'Annotate 300 observations by quantity', 'épidémiologiste ou biostatisticien', 'epidemiologist or biostatistician', 'deux jours', 'two days'],
    ['Un avis clinique sur la granularité des concepts', 'A clinical opinion on concept granularity', 'clinicien', 'clinician', 'une conversation', 'one conversation'],
  ];
  return (
    <section className="mt-12 border-t pt-6" style={{ borderColor: LINE }}>
      <h2 className="mb-2 text-lg font-bold" style={{ color: BORDEAUX }}>{fr ? 'Contribuer' : 'Contributing'}</h2>
      <p className="mb-4 text-[13px]">
        {fr
          ? <>Ce projet est publié sous <strong>CC BY 4.0</strong>, corpus et méthode compris — <a href="https://doi.org/10.5281/zenodo.21794559" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: GOLD }}>10.5281/zenodo.21794559</a>.</>
          : <>This project is published under <strong>CC BY 4.0</strong>, corpus and method alike — <a href="https://doi.org/10.5281/zenodo.21794559" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: GOLD }}>10.5281/zenodo.21794559</a>.</>}
      </p>
      <p className="mb-2 text-[13px] font-semibold" style={{ color: INK }}>
        {fr ? 'Ce qui aiderait le plus, dans l’ordre :' : 'What would help most, in order:'}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ color: MUTED }}>
              <th className="border-b py-1.5 text-left font-normal" style={{ borderColor: LINE }}>{fr ? 'ce dont nous avons besoin' : 'what we need'}</th>
              <th className="border-b py-1.5 text-left font-normal" style={{ borderColor: LINE }}>{fr ? 'qui peut le faire' : 'who can do it'}</th>
              <th className="border-b py-1.5 text-left font-normal" style={{ borderColor: LINE }}>{fr ? 'effort' : 'effort'}</th>
            </tr>
          </thead>
          <tbody>
            {l.map((r) => (
              <tr key={r[0]}>
                <td className="border-b py-1.5 pr-3" style={{ borderColor: LINE, color: INK }}>{fr ? r[0] : r[1]}</td>
                <td className="border-b py-1.5 pr-3" style={{ borderColor: LINE, color: MUTED }}>{fr ? r[2] : r[3]}</td>
                <td className="border-b py-1.5 whitespace-nowrap" style={{ borderColor: LINE, color: GOLD }}>{fr ? r[4] : r[5]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-[13px] leading-relaxed">
        {fr
          ? <><strong>Signaler une erreur est aussi une contribution</strong>, et la plus rapide : une observation dont la valeur, le pays ou la maladie vous paraît fausse nous intéresse plus qu’un accord général. Chaque observation porte un identifiant et un lien vers sa publication d’origine.</>
          : <><strong>Reporting an error is a contribution too</strong>, and the fastest one: an observation whose value, country or disease looks wrong to you interests us more than general agreement. Every observation carries an identifier and a link to its source publication.</>}
      </p>
      <p className="mt-3 text-[13px]">
        <a href="mailto:contact@e-shepha.com" className="font-semibold hover:underline" style={{ color: GOLD }}>contact@e-shepha.com</a>
      </p>
      <p className="mt-3 text-[12px]" style={{ color: MUTED }}>
        {fr
          ? 'Nous répondons aux signalements, et nous corrigeons en public : les chiffres de cette page changent, et leur date de mesure est écrite à côté d’eux.'
          : 'We answer reports, and we correct in public: the figures on this page change, and their measurement date is written beside them.'}
      </p>
    </section>
  );
}
