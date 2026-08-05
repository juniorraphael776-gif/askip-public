/**
 * ASKIP public — primitives d'affichage.
 *
 * CE QUI N'EXISTE PAS ICI, ET N'EXISTERA PAS :
 *   - carte choroplèthe colorée par une valeur  (serait lue comme une carte épidémiologique)
 *   - courbe de tendance                        (suggérerait une évolution de la maladie)
 *   - classement « pays les plus touchés »      (le corpus mesure la documentation, pas la charge)
 *
 * Ce qui existe : des comptes, des listes, des liens vers les sources. La
 * protection contre la surinterprétation n'est pas la note de bas de page,
 * c'est le choix des formes.
 */
import type { ReactNode } from 'react';
import type { Lang } from '@/lib/i18n';
import { CARD, GOLD, GREEN, INK, LINE, MUTED } from '@/lib/theme';

export const num = (v: number | null | undefined, lang: 'fr' | 'en' = 'fr'): string =>
  v === null || v === undefined ? '—' : v.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US').replace(/ | /g, ' ');

export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="mb-1 text-lg font-semibold" style={{ color: INK }}>{title}</h2>
      {hint ? <p className="mb-4 text-[13px]" style={{ color: MUTED }}>{hint}</p> : <div className="mb-4" />}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-lg p-4" style={{ background: CARD, border: `1px solid ${LINE}` }}>
      <div className="text-[11px] uppercase tracking-wide" style={{ color: MUTED }}>{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums" style={{ color: INK }}>{value}</div>
      {hint ? <div className="mt-0.5 text-[11px]" style={{ color: MUTED }}>{hint}</div> : null}
    </div>
  );
}

/** Barre de COMPTE. L'axe dit ce qu'il mesure — jamais « charge » ni « prévalence ». */
export function CountBar({ label, value, max, href, lang = 'fr' }: { label: string; value: number; max: number; href?: string; lang?: 'fr' | 'en' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const inner = (
    <>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="h-2 w-28 shrink-0 overflow-hidden rounded-full sm:w-48" style={{ background: '#EFECE3' }}>
        <i className="block h-full rounded-full" style={{ width: `${pct}%`, background: GREEN }} />
      </span>
      <span className="w-20 shrink-0 text-right tabular-nums" style={{ color: MUTED }}>{num(value, lang)}</span>
    </>
  );
  return href
    ? <a href={href} className="flex items-center gap-3 py-1.5 text-sm hover:underline" style={{ color: INK }}>{inner}</a>
    : <div className="flex items-center gap-3 py-1.5 text-sm">{inner}</div>;
}

/** Histogramme de comptes par année. Ce n'est pas une courbe : des barres discrètes. */
export function YearBars({ data, undated, undatedLabel, lang }: { data: { year: number; observations: number }[]; undated: number; undatedLabel: string; lang: 'fr' | 'en' }) {
  const max = Math.max(1, ...data.map((d) => d.observations));
  return (
    <div>
      <div className="flex items-end gap-[3px] overflow-x-auto pb-1" style={{ height: 120 }}>
        {data.map((d) => (
          <div key={d.year} className="flex w-6 shrink-0 flex-col items-center justify-end gap-1" title={`${d.year} : ${num(d.observations, lang)}`}>
            <i className="w-full rounded-t" style={{ height: `${Math.max(2, (d.observations / max) * 96)}px`, background: GREEN }} />
            <span className="text-[9px] tabular-nums" style={{ color: MUTED }}>{String(d.year).slice(2)}</span>
          </div>
        ))}
      </div>
      {/* La part non datée est affichée À CÔTÉ, jamais fondue dans l'histogramme :
          69 % des observations n'ont pas d'année, les inclure fausserait la lecture. */}
      <div className="mt-3 rounded-lg px-3 py-2 text-[13px]" style={{ background: '#F5F2EA', border: `1px solid ${LINE}`, color: MUTED }}>
        <strong style={{ color: GOLD }}>{num(undated, lang)}</strong> {undatedLabel}
      </div>
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-[12px] leading-relaxed" style={{ color: MUTED }}>{children}</p>;
}

/** Bandeau méthodologique — permanent, pas repliable. */
export function MethodBanner({ text }: { text: string }) {
  return (
    <aside className="mb-10 rounded-lg p-4 text-[13px] leading-relaxed" style={{ background: '#F5F2EA', border: `1px solid ${LINE}`, color: INK }}>
      {text}
    </aside>
  );
}

/**
 * Fait structurant mis en évidence, pas en note. Sert au chiffre des observations
 * sans pays : un décideur qui lit « 112 cellules vides » doit savoir que près de
 * la moitié du corpus n'a pas pu entrer dans la grille du tout.
 */
export function KeyFact({ title, value, body }: { title: string; value: string; body: string }) {
  return (
    <aside className="rounded-lg p-5" style={{ background: '#FFF4E0', border: `1px solid ${GOLD}` }}>
      <div className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: GOLD }}>{title}</div>
      <div className="mt-1 text-3xl font-bold tabular-nums" style={{ color: INK }}>{value}</div>
      <p className="mt-2 max-w-3xl text-[13px] leading-relaxed" style={{ color: INK }}>{body}</p>
    </aside>
  );
}

/** Palier sur lequel porte un chiffre — affiché partout où l'écart existe. */
export function Tier({ children }: { children: ReactNode }) {
  return <span className="text-[11px] italic" style={{ color: MUTED }}>{children}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm" style={{ color: MUTED }}>{children}</p>;
}

/**
 * Âge des chiffres, en toutes lettres.
 *
 * Ce portail ne sert pas des données en direct : tout vient d'agrégats matérialisés,
 * figés jusqu'au prochain `refresh_burden_view()`. L'âge se disait par une COULEUR —
 * la date passait au rouge au-delà de sept jours. Une couleur ne dit rien : un lecteur
 * voit une date rouge sans savoir qu'elle signifie « ces chiffres ont plus d'une
 * semaine ». Le même défaut que tous les autres corrigés ici — le signal existait,
 * il n'était pas lisible.
 *
 * La phrase accuse le rafraîchissement, jamais le portail : ce n'est pas l'écran qui
 * est en retard, c'est l'opération qui n'a pas été lancée.
 */
export function Freshness({ lang, at, isStale, suffix }: {
  lang: Lang; at: string; isStale: boolean; suffix?: ReactNode;
}) {
  const fr = lang === 'fr';
  const day = 86_400_000;
  const days = Math.max(0, Math.floor((Date.now() - new Date(at).getTime()) / day));
  const date = new Date(at).toLocaleDateString(fr ? 'fr-FR' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const age = fr
    ? (days === 0 ? "aujourd'hui" : days === 1 ? 'hier' : `il y a ${days} jours`)
    : (days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`);

  return (
    <p className="mb-4 text-[12px] leading-relaxed"
       style={{ color: isStale ? '#B04A2F' : MUTED }}>
      {fr
        ? <>Ces chiffres datent du <strong>{date}</strong> ({age}).</>
        : <>These figures date from <strong>{date}</strong> ({age}).</>}
      {isStale
        ? (fr
            ? ' Ils ont plus d’une semaine : le rafraîchissement des agrégats n’a pas été lancé depuis. Ce n’est pas le portail qui est en retard, ce sont les données qu’il sert.'
            : ' They are more than a week old: the aggregate refresh has not been run since. It is not the portal that is behind, it is the data it serves.')
        : (fr
            ? ' Le portail sert des agrégats figés, pas des données en direct.'
            : ' The portal serves frozen aggregates, not live data.')}
      {suffix ? <> {suffix}</> : null}
    </p>
  );
}

/**
 * Panne de lecture, nommée par sa vraie cause.
 *
 * Cet écran affichait « migrations/020 et 021 non appliquées » quelle que soit la
 * raison. En production elles l'étaient : quatre requêtes dépassaient le délai sous
 * charge. Le portail diagnostiquait donc mal sa propre panne et envoyait réparer une
 * chose en place — sur l'écran conçu, précisément, pour distinguer « on ne sait pas »
 * de « on n'a pas pu lire ».
 *
 * Une donnée absente et une lecture ratée ne se disent pas de la même façon.
 */
export function Diagnostic({ lang, faults, partial = false }: {
  lang: Lang;
  faults: { object: string; kind: string; detail: string }[];
  /** L'écran s'affiche quand même : dire ce qui MANQUE dedans, pas qu'il est vide. */
  partial?: boolean;
}) {
  const fr = lang === 'fr';
  const say: Record<string, [string, string]> = {
    absent: ['objet absent en base — la migration correspondante n’est pas appliquée',
             'object missing in the database — the matching migration has not been applied'],
    delai:  ['requête trop lente — dépassement du délai serveur. La donnée existe, elle n’a pas pu être lue à temps',
             'query too slow — server timeout. The data exists; it could not be read in time'],
    refuse: ['lecture refusée — droits ou schéma non exposé',
             'read refused — privileges or schema not exposed'],
    echec:  ['échec de la requête', 'query failed'],
  };
  return (
    <section className="rounded-lg p-4 text-sm"
             style={{ border: `1px solid ${partial ? GOLD : LINE}`, color: INK, background: partial ? '#FFF4E0' : '#fff' }}>
      <p className="font-semibold">
        {partial
          ? (fr ? 'Cet écran est incomplet.' : 'This screen is incomplete.')
          : (fr ? 'Cet écran n’a pas pu être affiché.' : 'This screen could not be displayed.')}
      </p>
      <p className="mt-1" style={{ color: MUTED }}>
        {partial
          ? (fr
              ? 'Une partie des lectures a échoué. Les chiffres affichés restent justes, mais ce qui manque ci-dessous manque par panne, pas par absence de donnée.'
              : 'Some reads failed. The figures shown remain correct, but what is missing below is missing through failure, not through absent data.')
          : (fr
              ? 'Ce n’est pas un constat sur les données : c’est une panne de lecture. Ce que le corpus contient reste inconnu depuis cette page.'
              : 'This is not a statement about the data: it is a read failure. What the corpus holds is unknown from this page.')}
      </p>
      {faults.length === 0 ? (
        <p className="mt-3" style={{ color: MUTED }}>
          {fr ? 'Aucune cause remontée — vérifier les journaux du serveur.' : 'No cause reported — check the server logs.'}
        </p>
      ) : (
        <ul className="mt-3 space-y-1">
          {faults.map((f, i) => (
            <li key={`${f.object}-${i}`} style={{ color: MUTED }}>
              <code style={{ color: INK }}>{f.object}</code> — {say[f.kind]?.[fr ? 0 : 1] ?? f.kind}
              <span className="block text-[11px] opacity-70">{f.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
