'use client';

/**
 * La barre de navigation, et le trait sous l'onglet actif.
 *
 * ── POURQUOI UN COMPOSANT CLIENT POUR SIX LIENS ─────────────────────────────
 * Savoir où l'on est demande de lire l'adresse courante. `usePathname` est un hook
 * client ; le reste du portail est en Server Components et le restera. On isole donc
 * la barre, et elle seule, plutôt que de rendre tout le gabarit client.
 *
 * ── LA CORRESPONDANCE N'EST PAS UNE ÉGALITÉ ─────────────────────────────────
 * `/fr/burden` doit allumer « Analytique », et `/fr/gaps` doit allumer « Défis
 * connus » : un onglet couvre parfois plusieurs adresses. Chaque entrée déclare donc
 * les chemins qu'elle revendique. Sans ça, un visiteur sur `/burden` verrait une barre
 * où rien n'est actif — l'écran lui dirait qu'il n'est nulle part.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BORDEAUX, GOLD, MUTED } from '@/lib/theme';
import { t, type Lang } from '@/lib/i18n';

export function Nav({ lang }: { lang: Lang }) {
  const chemin = usePathname() ?? '';
  const fr = lang === 'fr';

  /**
   * SIX ENTRÉES. « Ce que nous ignorons » a fusionné dans « Défis connus » : les deux
   * disaient la même chose sous deux noms, et un menu qui propose deux portes vers un
   * même sujet fait douter qu'il s'agisse du même.
   */
  const entrees: { href: string; label: string; couvre: string[] }[] = [
    { href: `/${lang}/graph`,      label: t(lang, 'nav_graph'),       couvre: ['/graph'] },
    { href: `/${lang}/evidence`,   label: t(lang, 'nav_evidence'),    couvre: ['/evidence'] },
    { href: `/${lang}/researchers`,label: t(lang, 'nav_researchers'), couvre: ['/researchers'] },
    { href: `/${lang}/datasets`,   label: t(lang, 'nav_datasets'),    couvre: ['/datasets'] },
    { href: `/${lang}`,            label: t(lang, 'nav_analytics'),   couvre: ['/country'] },
    { href: `/${lang}/challenges`, label: fr ? 'Défis connus' : 'Known challenges', couvre: ['/challenges', '/gaps'] },
    { href: `/${lang}/about`,      label: t(lang, 'nav_about'),       couvre: ['/about'] },
  ];

  const actif = (e: { href: string; couvre: string[] }) => {
    // L'accueil est le seul chemin qui exige l'égalité : sans ça il serait actif partout.
    if (e.href === `/${lang}`) return chemin === `/${lang}` || e.couvre.some((c) => chemin.startsWith(`/${lang}${c}`));
    return chemin.startsWith(e.href) || e.couvre.some((c) => chemin.startsWith(`/${lang}${c}`));
  };

  return (
    <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm" style={{ color: MUTED }}>
      {entrees.map((e, i) => {
        const on = actif(e);
        return (
          <Link
            key={e.href}
            href={e.href}
            aria-current={on ? 'page' : undefined}
            className="pb-1 hover:underline"
            style={{
              color: on ? BORDEAUX : MUTED,
              fontWeight: on ? 600 : 400,
              // Le trait est posé sur l'entrée active seulement. Une bordure
              // transparente sur les autres évite que la ligne de base ne saute.
              borderBottom: `2px solid ${on ? GOLD : 'transparent'}`,
            }}
          >
            {e.label}
          </Link>
        );
      })}

      {/* `/burden` GARDE UN ACCÈS. Il vivait en second rang sous « Analytique » ; en
          refaisant la barre je l'avais perdu, et un écran retiré du menu est un écran
          qu'on croit supprimé. `/gaps`, lui, a bien fusionné : son contenu devient la
          deuxième partie de « Défis connus ». */}
      <Link
        href={`/${lang}/burden`}
        className="pb-1 text-[12px] hover:underline"
        style={{
          color: chemin.startsWith(`/${lang}/burden`) ? BORDEAUX : MUTED,
          opacity: 0.85,
          borderBottom: `2px solid ${chemin.startsWith(`/${lang}/burden`) ? GOLD : 'transparent'}`,
        }}
      >
        {t(lang, 'nav_burden')}
      </Link>
    </div>
  );
}
