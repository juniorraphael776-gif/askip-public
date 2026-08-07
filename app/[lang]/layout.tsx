import { notFound } from 'next/navigation';
import { isLang, other, t, type Lang } from '@/lib/i18n';
import { GOLD, INK, LINE, MUTED } from '@/lib/theme';

export async function generateStaticParams() { return [{ lang: 'fr' }, { lang: 'en' }]; }

export default async function LangLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const L = lang as Lang;

  return (
    <div className="min-h-screen">
      <nav className="border-b" style={{ borderColor: LINE }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-baseline gap-x-6 gap-y-2 px-5 py-4">
          <a href={`/${L}`} className="text-base font-bold" style={{ color: INK }}>
            ASKIP<span style={{ color: GOLD }}>.</span>
          </a>
          {/* OSSATURE. Le premier mot rencontré est « Graphe de connaissance » : c'est
              ce que le portail donne à voir, et l'ordre le dit avant tout texte.
              L'ancien tableau de bord devient « Analytique », avant-dernier — il ne
              disparaît pas, il cesse de prétendre mesurer la santé des pays pour
              mesurer le corpus.

              Deux destinations n'existent pas encore. Elles sont rendues INERTES
              plutôt qu'en lien mort : un lien qui mène à un 404 en production coûte
              plus cher qu'un mot grisé qui annonce ce qui vient.

              `/burden` et `/gaps` NE DISPARAISSENT PAS — ils passent sous Analytique.
              Un écran retiré du menu est un écran qu'on croit supprimé : la carte de
              charge documentée et la carte des manques restent les deux mesures les
              plus citables du corpus, et elles gardent leurs URL. */}
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm" style={{ color: MUTED }}>
            <a href={`/${L}/graph`} className="hover:underline" style={{ color: INK }}>
              {t(L, 'nav_graph')}
            </a>
            <a href={`/${L}/evidence`} className="hover:underline">{t(L, 'nav_evidence')}</a>
            <a href={`/${L}/researchers`} className="hover:underline">{t(L, 'nav_researchers')}</a>
            <span className="cursor-default" style={{ color: MUTED, opacity: 0.55 }}>
              {t(L, 'nav_datasets')}
              <span className="ml-1 text-[10px] uppercase tracking-wide">{t(L, 'nav_bientot')}</span>
            </span>
            <span className="inline-flex items-baseline gap-x-2">
              <a href={`/${L}`} className="hover:underline">{t(L, 'nav_analytics')}</a>
              <span className="text-[12px]" style={{ opacity: 0.8 }}>
                <a href={`/${L}/burden`} className="hover:underline">{t(L, 'nav_burden')}</a>
                <span className="mx-1.5" style={{ opacity: 0.5 }}>·</span>
                <a href={`/${L}/gaps`} className="hover:underline">{t(L, 'nav_gaps')}</a>
              </span>
            </span>
            <span className="cursor-default" style={{ color: MUTED, opacity: 0.55 }}>
              {t(L, 'nav_about')}
              <span className="ml-1 text-[10px] uppercase tracking-wide">{t(L, 'nav_bientot')}</span>
            </span>
          </div>
          <div className="ml-auto text-sm">
            <a href={`/${other(L)}`} className="rounded px-2 py-1 hover:underline" style={{ color: GOLD }}>
              {other(L).toUpperCase()}
            </a>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
      <footer className="mt-16 border-t" style={{ borderColor: LINE }}>
        <div className="mx-auto max-w-6xl px-5 py-6 text-[12px]" style={{ color: MUTED }}>
          ASKIP — E-Shepha Hub · CC BY 4.0 · {t(L, 'lang_note')}
        </div>
      </footer>
    </div>
  );
}
