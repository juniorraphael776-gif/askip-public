/**
 * Écran 10 — Défis connus / Known challenges.
 *
 * TROIS PARTIES, et l'ordre est le propos :
 *   1. Nos limites actuelles   — ce que le corpus ne sait pas faire, chiffré
 *   2. Ce que nous ignorons    — ce que le corpus ne documente pas, la grille
 *   3. La prochaine étape      — ce qui est en cours, et qui transforme les deux
 *      premières en travail plutôt qu'en constat
 *
 * La troisième est la raison du mot « défis ». Une limite est un état, un défi est un
 * travail : sans la troisième partie, les deux premières se lisent comme un aveu, et
 * le mot ne tient pas sa promesse.
 *
 * ⚠️ LE CONTENU DE LA PARTIE 3 EST ÉCRIT PAR LE POSTE NOYAU. Ce fichier en pose la
 * place et rien d'autre : y mettre un texte d'attente inventé serait pire qu'un vide
 * annoncé — un lecteur ne distingue pas une esquisse d'un engagement.
 *
 * « Ce que nous ignorons » n'est plus une entrée de menu : la grille des manques est
 * la deuxième partie de cette page. Deux portes vers un même sujet font douter qu'il
 * s'agisse du même.
 */
import { notFound } from 'next/navigation';
import { isLang, type Lang } from '@/lib/i18n';
import { CountsDropNotice } from '@/app/notice';
import { ValidationTierNotice } from '@/app/notice-validation';
import { BORDEAUX, GOLD, LINE, MUTED } from '@/lib/theme';

export const revalidate = 900;

function Partie({ n, titre, sous, children }: {
  n: number; titre: string; sous?: string; children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="mb-3 flex items-baseline gap-3 border-b pb-2" style={{ borderColor: LINE }}>
        <span className="text-[13px] font-bold tabular-nums" style={{ color: GOLD }}>{n}</span>
        <h2 className="text-lg font-bold" style={{ color: BORDEAUX }}>{titre}</h2>
      </div>
      {sous && <p className="mb-4 text-[13px]" style={{ color: MUTED }}>{sous}</p>}
      {children}
    </section>
  );
}

export default async function Challenges({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const L = lang as Lang;
  const fr = L === 'fr';

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: BORDEAUX }}>
          {fr ? 'Défis connus' : 'Known challenges'}
        </h1>
        <p className="mt-1 text-sm" style={{ color: MUTED }}>
          {fr
            ? 'Ce que ce corpus ne sait pas encore faire, mesuré et daté. Ce sont des chantiers, pas des renoncements.'
            : 'What this corpus cannot do yet, measured and dated. These are work in progress, not concessions.'}
        </p>
      </header>

      <Partie
        n={1}
        titre={fr ? 'Nos limites actuelles' : 'Our current limitations'}
        sous={fr
          ? 'Ce que le corpus contient, et sous quelles conditions. Chaque chiffre est lu en base au rendu.'
          : 'What the corpus contains, and under what conditions. Every figure is read from the database at render time.'}
      >
        {/* Les deux notes sont reprises MOT POUR MOT. Elles ont été relues et corrigées
            trois fois chacune — une arithmétique fausse en v1, une garde partielle en
            v2, un taux faux pour les deux surfaces. Les paraphraser remettrait ce
            travail à zéro. */}
        <ValidationTierNotice lang={L} />
        <CountsDropNotice lang={L} />
      </Partie>

      <Partie
        n={2}
        titre={fr ? 'Ce que nous ignorons' : 'What we do not know'}
        sous={fr
          ? 'La grille des manques : ce qui n’a été mesuré nulle part, sur un périmètre déclaré. Une case vide dit « aucune observation dans ce corpus », jamais « aucune donnée au monde ».'
          : 'The gaps grid: what has been measured nowhere, over a declared scope. An empty cell says “no observation in this corpus”, never “no data in the world”.'}
      >
        <p className="text-[13px]" style={{ color: MUTED }}>
          {fr ? 'La grille complète, par section et par pays : ' : 'The full grid, by section and country: '}
          <a href={`/${L}/gaps`} className="font-semibold hover:underline" style={{ color: GOLD }}>
            {fr ? 'ouvrir la grille des manques' : 'open the gaps grid'}
          </a>
        </p>
        <p className="mt-2 text-[12px]" style={{ color: MUTED }}>
          {fr
            ? 'Elle reste sur son propre écran : c’est un tableau de 12 pays sur 3 sections qu’on lit en le parcourant, pas en le résumant.'
            : 'It stays on its own screen: a 12-country by 3-section table that is read by scanning it, not by summarising it.'}
        </p>
      </Partie>

      <Partie
        n={3}
        titre={fr ? 'La prochaine étape' : 'What comes next'}
        sous={fr
          ? 'Ce qui est en cours, et qui fait de ce qui précède un travail plutôt qu’un constat.'
          : 'What is under way, and what turns the above into work rather than a verdict.'}
      >
        {/* ⚠️ PLACE RÉSERVÉE, PAS TEXTE D'ATTENTE.
            Le contenu vient du poste noyau. Écrire une esquisse ici serait pire qu'un
            vide annoncé : un lecteur ne distingue pas une intention provisoire d'un
            engagement, et cette page est celle qu'un ministère ouvre en premier. */}
        <p className="rounded-lg p-4 text-[13px]" style={{ border: `1px dashed ${LINE}`, color: MUTED }}>
          {fr
            ? 'Cette section est en cours de rédaction. Elle décrira les chantiers ouverts et leur échéance — pas des intentions, des travaux datés.'
            : 'This section is being written. It will describe the open work and its timeline — not intentions, dated work.'}
        </p>
      </Partie>
    </>
  );
}
