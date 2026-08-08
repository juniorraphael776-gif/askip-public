/**
 * Écran 10 — Défis connus / Known challenges.
 *
 * ⚠️ LE CORPS DE CETTE PAGE EST RÉÉCRIT PAR LE POSTE NOYAU. Ce fichier existe pour
 * que les liens « voir Défis connus » posés sur cinq écrans mènent à quelque chose dès
 * maintenant : un lien vers un 404 coûte plus cher que le bloc qu'il remplace.
 *
 * En attendant, il RASSEMBLE ce qui était dispersé — la note sur la baisse des chiffres
 * et le palier de validation, mot pour mot, sans réécriture. Ce sont les mêmes textes,
 * relus et corrigés trois fois chacun ; les paraphraser ici les remettrait à zéro.
 *
 * « DÉFIS » et non « limites » : le mot appelle la collaboration au lieu de la clore.
 * Une limite est un état, un défi est un travail — et les manques de ce corpus sont
 * mesurés, pas subis.
 */
import { notFound } from 'next/navigation';
import { isLang, type Lang } from '@/lib/i18n';
import { CountsDropNotice } from '@/app/notice';
import { ValidationTierNotice } from '@/app/notice-validation';
import { BORDEAUX, LINE, MUTED } from '@/lib/theme';

export const revalidate = 900;

export default async function Challenges({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const L = lang as Lang;
  const fr = L === 'fr';

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: BORDEAUX }}>
          {fr ? 'Défis connus' : 'Known challenges'}
        </h1>
        <p className="mt-1 text-sm" style={{ color: MUTED }}>
          {fr
            ? 'Ce que ce corpus ne sait pas encore faire, mesuré et daté. Ce sont des chantiers, pas des renoncements.'
            : 'What this corpus cannot do yet, measured and dated. These are work in progress, not concessions.'}
        </p>
      </header>

      <ValidationTierNotice lang={L} />
      <CountsDropNotice lang={L} />

      <p className="mt-8 border-t pt-4 text-[12px]" style={{ borderColor: LINE, color: MUTED }}>
        {fr
          ? 'Les défis chiffrés du corpus — observations sans pays, sans date, chaîne d’auteurs partielle — sont détaillés sur À propos et sur la fiche Jeux de données.'
          : 'The corpus’s quantified challenges — observations without country, without date, partial author chain — are detailed on About and on the Datasets card.'}
      </p>
    </>
  );
}
