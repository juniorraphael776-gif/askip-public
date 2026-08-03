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
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm" style={{ color: MUTED }}>
            <a href={`/${L}`} className="hover:underline">{t(L, 'nav_overview')}</a>
            {/* Lien permanent vers les manques : c'est la question qu'on ne pense pas à poser. */}
            <a href={`/${L}/gaps`} className="hover:underline">{t(L, 'nav_gaps')}</a>
            <a href={`/${L}/evidence`} className="hover:underline">{t(L, 'nav_explorer')}</a>
            <a href={`/${L}/researchers`} className="hover:underline">{t(L, 'nav_researchers')}</a>
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
