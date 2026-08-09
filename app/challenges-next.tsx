import type { Lang } from '@/lib/i18n';
import { BORDEAUX, GOLD, INK, LINE, MUTED } from '@/lib/theme';

/**
 * La partie 3 de Défis connus — les quatre chantiers, écrits par le poste noyau et
 * rendus tels quels.
 *
 * ── LE STATUT DES DURÉES EST DANS LE TABLEAU, PAS EN NOTE ───────────────────
 * « compté » et « estimé » ne se citent pas de la même façon, et un lecteur qui
 * planifie un engagement doit voir lequel des deux il lit AU MOMENT où il lit l'heure.
 * Une note de bas de page qui dirait « certaines durées sont estimées » laisserait
 * chacun deviner lesquelles — c'est le même partage que compté/lu/transmis sur la
 * fiche de dépôt, et il vaut ici pour les mêmes raisons.
 *
 * Deux chantiers portent « estimé, aucune cadence observée ». Ce n'est pas une nuance
 * de prudence : c'est la différence entre une durée dérivée d'un travail déjà fait sur
 * ce corpus et une durée avancée sans précédent.
 */
type Statut = 'compte' | 'estime' | 'sans-cadence' | 'non-mesure';

function Jauge({ k, lang }: { k: Statut; lang: Lang }) {
  const fr = lang === 'fr';
  const txt: Record<Statut, [string, string]> = {
    compte:        ['COMPTÉ', 'COUNTED'],
    estime:        ['ESTIMÉ', 'ESTIMATED'],
    'sans-cadence':['ESTIMÉ · AUCUNE CADENCE OBSERVÉE', 'ESTIMATED · NO OBSERVED RATE'],
    'non-mesure':  ['NON MESURÉ', 'NOT MEASURED'],
  };
  const bg: Record<Statut, string> = {
    compte: '#E8F0EA', estime: '#FBF0DC', 'sans-cadence': '#F6E3DC', 'non-mesure': '#EFEAE0',
  };
  return (
    <span className="rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide"
          style={{ background: bg[k], color: INK }}>
      {txt[k][fr ? 0 : 1]}
    </span>
  );
}

function Chantier({
  n, titre, lang, statut, heures, competences, acces, children,
}: {
  n: number; titre: string; lang: Lang; statut: Statut;
  heures: React.ReactNode; competences: string; acces: string; children: React.ReactNode;
}) {
  const fr = lang === 'fr';
  return (
    <article className="mb-8 rounded-lg p-5" style={{ border: `1px solid ${LINE}`, background: '#FFFDF8' }}>
      <h3 className="mb-3 text-[15px] font-bold" style={{ color: BORDEAUX }}>
        <span className="mr-2 tabular-nums" style={{ color: GOLD }}>{n}.</span>{titre}
      </h3>
      <div className="space-y-3 text-[13px] leading-relaxed">{children}</div>

      <dl className="mt-4 border-t pt-3 text-[12px]" style={{ borderColor: LINE }}>
        <div className="flex flex-wrap items-baseline gap-x-3 py-1">
          <dt className="w-28 shrink-0" style={{ color: MUTED }}>{fr ? 'heures' : 'hours'}</dt>
          <dd className="flex flex-wrap items-baseline gap-2" style={{ color: INK }}>
            <Jauge k={statut} lang={lang} />{heures}
          </dd>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-3 py-1">
          <dt className="w-28 shrink-0" style={{ color: MUTED }}>{fr ? 'compétences' : 'skills'}</dt>
          <dd style={{ color: INK }}>{competences}</dd>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-3 py-1">
          <dt className="w-28 shrink-0" style={{ color: MUTED }}>{fr ? 'accès' : 'access'}</dt>
          <dd style={{ color: INK }}>{acces}</dd>
        </div>
      </dl>
    </article>
  );
}

export function ProchaineEtape({ lang }: { lang: Lang }) {
  const fr = lang === 'fr';
  return (
    <>
      <p className="mb-2 text-[13px] leading-relaxed">
        {fr
          ? 'Cette section décrit ce que le projet fera, et ce que chaque chantier demande — en heures, en compétences, en accès. Les quatre sont indépendants : aucun n’attend les autres.'
          : 'This section sets out what the project will do, and what each piece of work requires — in hours, skills and access. The four are independent: none waits on the others.'}
      </p>
      <p className="mb-6 text-[13px] leading-relaxed" style={{ color: MUTED }}>
        {fr
          ? 'Les durées sont dérivées de cadences déjà observées sur ce corpus, pas estimées à vue. Là où aucune cadence n’existe, c’est écrit.'
          : 'Durations are derived from rates already observed on this corpus, not estimated by eye. Where no rate exists, it says so.'}
      </p>

      <Chantier
        n={1} lang={lang} statut="compte"
        titre={fr ? 'La relecture experte, et ce qu’elle change au corpus' : 'Expert review, and what it changes in the corpus'}
        heures={fr
          ? <>~39 h de relecture, à la cadence observée de 500 observations en deux heures. L’analyse des désaccords, ~15 h, est <em>estimée</em>.</>
          : <>~39 h of review, at the observed rate of 500 observations in two hours. Analysing disagreements, ~15 h, is <em>estimated</em>.</>}
        competences={fr ? 'clinicien, épidémiologiste, ou interne en santé publique' : 'clinician, epidemiologist, or public-health resident'}
        acces={fr ? 'aucun — l’interface et le jeu sont publics' : 'none — the interface and the dataset are public'}
      >
        <p>
          {fr
            ? <><strong>9 705 observations attendent une relecture humaine</strong> — 9 549 en attente, 156 contestées. Aucune des 63 227 observations publiées n’a été lue par un humain : la validation est mécanique, elle certifie la forme et la plausibilité, jamais la véracité.</>
            : <><strong>9,705 observations await human review</strong> — 9,549 pending, 156 disputed. None of the 63,227 published observations has been read by a human: validation is mechanical, it certifies form and plausibility, never truth.</>}
        </p>
        <p>
          {fr
            ? 'À la cadence du tableau de contribution — 500 observations en deux heures pour quelqu’un du métier — l’ensemble représente environ 39 heures d’expertise clinique ou épidémiologique. Réparties sur dix relecteurs, c’est une journée chacun.'
            : 'At the rate given in the contribution table — 500 observations in two hours for someone in the field — the whole set represents about 39 hours of clinical or epidemiological expertise. Spread across ten reviewers, that is a day each.'}
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>{fr
            ? <><strong>Un taux d’erreur mesuré.</strong> Aujourd’hui, notre meilleure approximation vient d’un contrôle interne : moins de 3,9 % des affirmations ne se retrouvent pas dans leur texte source. C’est une borne, pas une mesure.</>
            : <><strong>A measured error rate.</strong> Today our best approximation comes from an internal check: fewer than 3.9% of claims cannot be found in their source text. That is a bound, not a measurement.</>}</li>
          <li>{fr
            ? <><strong>Le premier chiffre de rappel du projet.</strong> Nous savons ce que l’extraction a produit ; nous ne savons pas ce qu’elle a manqué.</>
            : <><strong>The project’s first recall figure.</strong> We know what extraction produced; we do not know what it missed.</>}</li>
          <li>{fr
            ? <><strong>Des cas d’école pour l’extraction.</strong> Chaque désaccord relecteur/machine documente un motif d’erreur, et les motifs se corrigent en amont, pas ligne à ligne.</>
            : <><strong>Worked examples for extraction.</strong> Every reviewer/machine disagreement documents an error pattern, and patterns are fixed upstream, not row by row.</>}</li>
        </ul>
      </Chantier>

      <Chantier
        n={2} lang={lang} statut="sans-cadence"
        titre={fr ? 'L’extension à d’autres domaines que la santé' : 'Extension beyond health'}
        heures={fr
          ? '~3 semaines pour un premier domaine, dont l’essentiel en construction du référentiel. Le nôtre a demandé onze passes de curation sur quatre mois, mais il a été construit en même temps que la chaîne.'
          : '~3 weeks for a first domain, most of it building the reference table. Ours took eleven curation passes over four months, but it was built alongside the chain.'}
        competences={fr ? 'un expert du domaine visé, plus un développeur pour les prompts' : 'an expert in the target domain, plus a developer for the prompts'}
        acces={fr ? 'un corpus de publications accessibles et une licence qui en permette l’extraction' : 'a corpus of reachable publications and a licence that permits extraction'}
      >
        <p>
          {fr
            ? <>La chaîne — collecte, découpage, extraction, normalisation, validation, publication — <strong>ne contient rien de sanitaire</strong>. Ce qui est spécifique au domaine tient dans deux objets : le référentiel — 487 maladies, 74 indicateurs, 32 mesures anthropométriques, 32 facteurs de risque, 247 règles de contexte — et les deux prompts d’extraction, un par langue.</>
            : <>The chain — collection, chunking, extraction, normalisation, validation, publication — <strong>contains nothing medical</strong>. What is domain-specific sits in two objects: the reference table — 487 diseases, 74 indicators, 32 anthropometric measures, 32 risk factors, 247 context rules — and the two extraction prompts, one per language.</>}
        </p>
        <p>
          {fr
            ? 'Tout le reste — la pagination, le calcul de validation, l’héritage de localisation, le graphe, le dépôt — est indifférent au sujet.'
            : 'Everything else — pagination, validation computation, location inheritance, the graph, the deposit — is indifferent to subject matter.'}
        </p>
        <p style={{ color: BORDEAUX }}>
          {fr
            ? 'Nous ne l’avons pas fait, donc nous ne l’affirmons pas : la portabilité est déduite de la structure du code, jamais éprouvée sur un second domaine. Le premier essai dira ce qui, dans la chaîne, était sanitaire sans que nous l’ayons vu. C’est la raison de le faire.'
            : 'We have not done it, so we do not claim it: portability is inferred from the structure of the code, never tested on a second domain. The first attempt will reveal what in the chain was medical without our noticing. That is the reason to do it.'}
        </p>
      </Chantier>

      <Chantier
        n={3} lang={lang} statut="sans-cadence"
        titre={fr ? 'L’orchestration autonome' : 'Autonomous orchestration'}
        heures={fr
          ? '~2 semaines, dont la moitié en reprises de contrôles pour qu’ils bloquent au lieu d’alerter.'
          : '~2 weeks, half of it reworking checks so they block rather than warn.'}
        competences={fr ? 'un développeur familier des files de travaux et des reprises sur échec' : 'a developer familiar with job queues and failure recovery'}
        acces={fr ? 'un ordonnanceur et un budget d’appels de modèle borné par passe' : 'a scheduler, and a model-call budget bounded per run'}
      >
        <p>
          {fr
            ? <><strong>Aujourd’hui, chaque étape est lancée à la main.</strong> Le dépôt compte 25 commandes ; la chaîne complète en enchaîne huit. Entre deux, un humain lit une sortie et décide de continuer.</>
            : <><strong>Today every step is launched by hand.</strong> The repository holds 25 commands; a full run chains eight of them. Between each, a human reads an output and decides to continue.</>}
        </p>
        <p>
          {fr
            ? 'Ce n’est pas un défaut d’ingénierie : c’est un choix qui a tenu tant que le corpus doublait tous les mois et que chaque passe révélait un motif d’erreur nouveau. Une chaîne autonome qui propage une erreur de normalisation sur 70 000 observations coûte plus cher que huit commandes tapées.'
            : 'This is not an engineering failing: it was a choice that held while the corpus doubled monthly and every pass revealed a new error pattern. An autonomous chain that propagates a normalisation error across 70,000 observations costs more than eight typed commands.'}
        </p>
        <p>
          {fr
            ? <>Ce qui a changé : les motifs se sont stabilisés, les contrôles sont désormais mécaniques, et chaque étape sait dire si elle a réussi. <strong>L’orchestration devient possible parce que les contrôles existent</strong>, pas l’inverse.</>
            : <>What changed: the patterns have settled, the checks are now mechanical, and each step can say whether it succeeded. <strong>Orchestration becomes possible because the checks exist</strong>, not the other way round.</>}
        </p>
      </Chantier>

      <Chantier
        n={4} lang={lang} statut="estime"
        titre={fr ? 'Les 9 189 publications dont les auteurs ne sont pas extraits' : 'The 9,189 publications whose authors are not extracted'}
        heures={fr
          ? <>~1 semaine pour le découpage et le rapprochement par identifiant. Le taux de fusion correcte est <strong>non mesuré</strong>, et c’est lui qui décidera du reste.</>
          : <>~1 week for splitting and identifier matching. The correct-merge rate is <strong>unmeasured</strong>, and it is what will decide the rest.</>}
        competences={fr ? 'un développeur, plus un avis bibliométrique sur le seuil de fusion' : 'a developer, plus a bibliometric opinion on the merge threshold'}
        acces={fr ? 'les API ORCID et OpenAlex, toutes deux publiques et gratuites' : 'the ORCID and OpenAlex APIs, both public and free'}
      >
        <p>
          {fr
            ? <>Les listes d’auteurs existent sur <strong>9 189 publications sur 9 199</strong> : 108 402 mentions d’auteur, 11,8 par publication en moyenne. Elles sont stockées <strong>en une seule chaîne de caractères</strong> — <code>Adegnika AA, Verweij JJ, Agnandji ST, …</code> — jamais découpées en personnes.</>
            : <>Author lists exist on <strong>9,189 publications out of 9,199</strong>: 108,402 author mentions, 11.8 per publication on average. They are stored <strong>as a single string</strong> — <code>Adegnika AA, Verweij JJ, Agnandji ST, …</code> — never split into people.</>}
        </p>
        <p>
          {fr
            ? <>Le découpage est mécanique. <strong>La difficulté est ailleurs</strong> : <code>Adegnika AA</code> et <code>Adegnika Ayola A.</code> sont la même personne, et un rapprochement naïf par nom fusionnerait des homonymes. Un comptage brut donne 45 412 noms distincts ; le nombre de personnes réelles est inférieur, et nous ne savons pas de combien.</>
            : <>Splitting the string is mechanical. <strong>The difficulty is elsewhere</strong>: <code>Adegnika AA</code> and <code>Adegnika Ayola A.</code> are the same person, and naive name matching would merge homonyms. A raw count gives 45,412 distinct names; the number of real people is lower, and we do not know by how much.</>}
        </p>
        <p style={{ color: BORDEAUX }}>
          {fr
            ? 'Ce chantier n’est donc pas « parser 9 189 chaînes ». C’est : découper, puis rapprocher d’ORCID et d’OpenAlex quand un identifiant existe, puis laisser non fusionné ce qui n’est pas établi — un chercheur en double est réparable, deux chercheurs fusionnés à tort ne se détectent plus.'
            : 'So this work is not “parse 9,189 strings”. It is: split, then match against ORCID and OpenAlex where an identifier exists, then leave unmerged whatever is not established — a duplicated researcher is repairable, two researchers wrongly merged can no longer be detected.'}
        </p>
      </Chantier>
    </>
  );
}
