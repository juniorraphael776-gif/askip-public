/**
 * Écran 9 — Jeux de données. La data card, et elle est autoportante.
 *
 * ── LES TROIS LIMITES SONT ICI, PAS DERRIÈRE UN LIEN ────────────────────────
 * Quelqu'un qui télécharge depuis Zenodo ou Hugging Face n'ouvrira jamais « À propos ».
 * Il lira la fiche du dépôt, et rien d'autre. Renvoyer les limites vers une autre page
 * revient à ne pas les publier — le lecteur qui en aurait le plus besoin est justement
 * celui qui ne cliquera pas.
 *
 * Elles sont donc répétées ici EN CLAIR, avec leur STATUT : compté, lu, ou transmis.
 * Un chiffre sans son statut se lit comme mesuré, et les trois ne le sont pas au même
 * titre — deux viennent d'un COUNT en base, le troisième nous est donné par la chaîne
 * d'extraction et n'est pas recalculé. Ne pas le dire les mettrait au même niveau de
 * preuve, ce qu'ils ne sont pas.
 *
 * ── LE COMPTE EST DOUBLE, ET C'EST LE POINT ─────────────────────────────────
 * `evidences_validated` ET `evidences_total`. Déposer 63 227 sans dire qu'elles sont
 * extraites de 72 932 laisserait croire que le corpus entier a passé le contrôle.
 * C'est l'erreur que ce projet a commise sur son propre palier de validation, en
 * divisant par un total qui n'en était pas un.
 *
 * ── ET LA VERSION ───────────────────────────────────────────────────────────
 * Un DOI sans version pointe vers un instantané que rien ne date. La version du
 * référentiel et l'horodatage de la dernière matérialisation sont donc affichés
 * ensemble : le premier dit contre quel vocabulaire les libellés sont normalisés, le
 * second dit de quand datent les agrégats.
 */
import { notFound } from 'next/navigation';
import { isLang, t, type Lang } from '@/lib/i18n';
import { faults, getCoverageReach, getFreshness, getOverview, getReferentialCoverage } from '@/lib/queries';
import { Diagnostic, Empty, num } from '@/app/ui';
import { GOLD, INK, LINE, MUTED } from '@/lib/theme';

export const revalidate = 900;

function Champ({ cle, valeur, note }: { cle: string; valeur: React.ReactNode; note?: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 border-b py-2 last:border-b-0" style={{ borderColor: LINE }}>
      <span className="w-56 shrink-0 text-[12px]" style={{ color: MUTED }}>{cle}</span>
      <span className="text-[13px] font-semibold" style={{ color: INK }}>{valeur}</span>
      {note && <span className="text-[11px]" style={{ color: MUTED }}>{note}</span>}
    </div>
  );
}

/**
 * Le statut d'un chiffre. Sans lui, tout se lit comme mesuré.
 *
 * ⚠️ Le badge doit parler la langue de la phrase qui l'explique. Publié une première
 * fois avec des libellés français en dur, il affichait « LU » sur une page anglaise
 * dont le texte annonçait « READ » — le lecteur voyait deux mots différents désigner
 * la même chose, sur la page qui sert à établir la confiance.
 */
function Statut({ k, lang }: { k: 'compte' | 'lu' | 'transmis'; lang: Lang }) {
  const txt = lang === 'fr'
    ? { compte: 'COMPTÉ', lu: 'LU', transmis: 'TRANSMIS' }[k]
    : { compte: 'COUNTED', lu: 'READ', transmis: 'SUPPLIED' }[k];
  const bg = { compte: '#E8F0EA', lu: '#EDEAF5', transmis: '#FBF0DC' }[k];
  return (
    <span className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide"
          style={{ background: bg, color: INK }}>{txt}</span>
  );
}

export default async function Datasets({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const L = lang as Lang;
  const fr = L === 'fr';

  const [o, reach, ref, fresh] = await Promise.all([
    getOverview(), getCoverageReach(), getReferentialCoverage(), getFreshness(),
  ]);
  const pannes = faults();
  if (!o) return <Empty><Diagnostic lang={L} faults={pannes} /></Empty>;

  const sansDate = reach ? reach.observations_total - reach.observations_dated : null;
  const pct = (a: number, b: number) => `${Math.round((a / Math.max(1, b)) * 100)} %`;
  const dateMaj = fresh
    ? new Date(fresh.generated_at).toLocaleDateString(fr ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: INK }}>{t(L, 'nav_datasets')}</h1>
        <p className="mt-1 text-sm" style={{ color: MUTED }}>
          {fr
            ? 'La fiche du corpus, autoportante : elle se lit sans ouvrir aucune autre page.'
            : 'The corpus data card, self-contained: it reads without opening any other page.'}
        </p>
      </header>

      {pannes.length > 0 && <div className="mb-4"><Diagnostic lang={L} faults={pannes} partial /></div>}

      <section className="mb-8 rounded-lg p-4" style={{ border: `1px solid ${LINE}`, background: '#FFFDF8' }}>
        <h2 className="mb-2 text-sm font-bold" style={{ color: INK }}>
          {fr ? 'Identification' : 'Identification'}
        </h2>
        <Champ cle={fr ? 'Nom' : 'Name'} valeur="ASKIP — African Science Knowledge & Insight Platform" />
        {/* ⚠️ UN ZÉRO AFFICHÉ EST UNE AFFIRMATION, UNE ABSENCE ANNONCÉE N'EN EST PAS
            UNE. Quand `referential_coverage` expire — troisième chemin froid observé,
            et le premier qui produit un CHIFFRE FAUX plutôt qu'un vide — cette ligne
            affichait « — , 0 concepts », ce qui se lit comme un référentiel vide et
            non comme une panne. Le bandeau de diagnostic le disait ; un lecteur qui
            ne le lit pas voyait un fait. */}
        <Champ
          cle={fr ? 'Version du référentiel' : 'Referential version'}
          valeur={ref
            ? <code>{ref.referential_version}</code>
            : <span style={{ color: '#8C3A2E', fontWeight: 400 }}>
                {fr ? 'non lue — dépassement du délai serveur' : 'not read — server timeout'}
              </span>}
          note={ref
            ? (fr ? 'vocabulaire contre lequel les libellés de maladie sont normalisés' : 'vocabulary the disease labels are normalised against')
            : (fr ? 'la version existe, elle n’a pas pu être lue à temps' : 'the version exists, it could not be read in time')}
        />
        <Champ
          cle={fr ? 'Agrégats matérialisés le' : 'Aggregates materialised on'}
          valeur={dateMaj}
          note={fr ? 'un DOI sans cette date pointe vers un instantané que rien ne situe' : 'a DOI without this date points to a snapshot nothing places in time'}
        />
        <Champ
          cle={fr ? 'Evidences validées' : 'Validated evidence'}
          valeur={num(o.evidences_validated, L)}
          note={fr ? `extraites de ${num(o.evidences_total, L)} — le contrôle en a écarté ${num(o.evidences_total - o.evidences_validated, L)}` : `extracted from ${num(o.evidences_total, L)} — the check rejected ${num(o.evidences_total - o.evidences_validated, L)}`}
        />
        <Champ cle={fr ? 'Observations' : 'Observations'} valeur={num(o.observations, L)} />
        <Champ cle={fr ? 'Publications sources' : 'Source publications'} valeur={num(o.publications, L)} note={`${num(o.publications_with_doi, L)} DOI`} />
        <Champ cle={fr ? 'Pays documentés' : 'Countries documented'} valeur={num(o.countries, L)} />
        <Champ cle={fr ? 'Libellés de maladie' : 'Disease labels'} valeur={num(o.diseases, L)} />
        <Champ cle={fr ? 'Chercheurs identifiés' : 'Researchers identified'} valeur={num(o.researchers, L)} />
        <Champ cle={fr ? 'Langues' : 'Languages'} valeur={`${num(o.evidences_en, L)} EN · ${num(o.evidences_fr, L)} FR`} />
        <Champ cle={fr ? 'Licence' : 'Licence'} valeur="CC BY 4.0" note={fr ? 'attribution requise, usage commercial permis' : 'attribution required, commercial use permitted'} />
      </section>

      {/* ── LES TROIS LIMITES, EN CLAIR ET SUR CETTE PAGE ─────────────────────
          Voir l'en-tête du fichier : un lecteur venu de Zenodo n'ouvrira pas
          « À propos ». Ce qui n'est pas ici n'est pas publié pour lui. */}
      <section className="mb-8">
        <h2 className="mb-1 text-sm font-bold" style={{ color: INK }}>
          {fr ? 'Les trois limites à connaître avant d’utiliser ces données' : 'The three limitations to know before using this data'}
        </h2>
        <p className="mb-3 text-[12px]" style={{ color: MUTED }}>
          {fr
            ? 'Elles ne sont pas au même niveau de preuve, et leur statut est marqué : COMPTÉ vient d’un décompte en base, LU d’une vue publiée, TRANSMIS de la chaîne d’extraction sans recalcul ici.'
            : 'They do not carry the same weight of proof, and their status is marked: COUNTED comes from a database count, READ from a published view, SUPPLIED from the extraction chain without recomputation here.'}
        </p>

        {reach && (
          <div className="mb-3 rounded-lg p-4" style={{ border: `1px solid ${GOLD}`, background: '#FFF9EE' }}>
            <p className="font-semibold" style={{ color: INK }}>
              1. {fr ? 'Près d’un tiers des observations n’a aucun pays' : 'Nearly a third of observations have no country'}
              <Statut k="lu" lang={L} />
            </p>
            <p className="mt-1 text-[13px]" style={{ color: INK }}>
              <strong style={{ color: GOLD }}>{num(reach.observations_unlocated, L)} / {num(reach.observations_total, L)}</strong>
              {' '}({pct(reach.observations_unlocated, reach.observations_total)})
            </p>
            <p className="mt-1 text-[12px]" style={{ color: MUTED }}>
              {fr
                ? 'Toute agrégation géographique porte sur les autres. Un pays absent de ces données n’est pas un pays sans problème de santé : c’est un pays dont la localisation n’a pas pu être extraite. Lu dans public_api.coverage_reach.'
                : 'Any geographic aggregation covers the rest. A country missing from this data is not a country without health problems: it is a country whose location could not be extracted. Read from public_api.coverage_reach.'}
            </p>
          </div>
        )}

        {sansDate !== null && reach && (
          <div className="mb-3 rounded-lg p-4" style={{ border: `1px solid ${GOLD}`, background: '#FFF9EE' }}>
            <p className="font-semibold" style={{ color: INK }}>
              2. {fr ? 'Deux tiers des observations n’ont aucune date exploitable' : 'Two thirds of observations have no usable date'}
              <Statut k="compte" lang={L} />
            </p>
            <p className="mt-1 text-[13px]" style={{ color: INK }}>
              <strong style={{ color: GOLD }}>{num(sansDate, L)} / {num(reach.observations_total, L)}</strong>
              {' '}({pct(sansDate, reach.observations_total)})
            </p>
            <p className="mt-1 text-[12px]" style={{ color: MUTED }}>
              {fr
                ? 'Leur période est INCONNUE, pas ancienne. Aucune série temporelle, aucune comparaison avant/après, aucune notion de « donnée récente » ne s’applique à cette part. Obtenu par différence entre deux comptes lus : observations totales moins observations datées.'
                : 'Their period is UNKNOWN, not old. No time series, no before/after comparison, no notion of “recent data” applies to this share. Obtained by difference between two read counts: total observations minus dated observations.'}
            </p>
          </div>
        )}

        <div className="mb-3 rounded-lg p-4" style={{ border: `1px solid ${GOLD}`, background: '#FFF9EE' }}>
          <p className="font-semibold" style={{ color: INK }}>
            3. {fr ? 'Aucune relecture humaine, et la chaîne d’auteurs est partielle' : 'No human review, and the author chain is partial'}
            <Statut k="transmis" lang={L} />
          </p>
          <p className="mt-1 text-[13px]" style={{ color: INK }}>
            <strong style={{ color: GOLD }}>{fr ? '22,4 %' : '22.4%'}</strong>{' '}
            {fr ? 'du corpus remonte jusqu’à un auteur identifié' : 'of the corpus traces back to an identified author'}
          </p>
          <p className="mt-1 text-[12px]" style={{ color: MUTED }}>
            {fr
              ? <><strong style={{ color: INK }}>« Validée » signifie « a franchi un contrôle automatique de forme et de plausibilité », jamais « vérifiée par un expert ».</strong> Une assertion peut être bien formée, plausible, correctement citée — et fausse. Le taux de 22,4 % nous est transmis par la chaîne d’extraction et n’est pas recalculé sur cette page ; il est donné pour ce qu’il est.</>
              : <><strong style={{ color: INK }}>“Validated” means “passed an automatic check of form and plausibility”, never “verified by an expert”.</strong> An assertion can be well-formed, plausible, correctly quoted — and wrong. The 22.4% figure is supplied by the extraction chain and is not recomputed on this page; it is given for what it is.</>}
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-bold" style={{ color: INK }}>{fr ? 'Citer ce corpus' : 'Citing this corpus'}</h2>
        <pre className="overflow-x-auto rounded p-3 text-[12px]" style={{ background: '#FFF9EE', border: `1px solid ${LINE}`, color: INK }}>
{fr
  ? `ASKIP — African Science Knowledge & Insight Platform.
E-Shepha Hub. Référentiel ${ref?.referential_version ?? '[version non lue]'}, agrégats du ${dateMaj}.
${num(o.evidences_validated, L)} evidences validées sur ${num(o.evidences_total, L)} extraites.
Licence CC BY 4.0. https://askip.e-shepha.com`
  : `ASKIP — African Science Knowledge & Insight Platform.
E-Shepha Hub. Referential ${ref?.referential_version ?? '[version not read]'}, aggregates of ${dateMaj}.
${num(o.evidences_validated, L)} validated evidence items of ${num(o.evidences_total, L)} extracted.
Licence CC BY 4.0. https://askip.e-shepha.com`}
        </pre>
        <p className="mt-2 text-[12px]" style={{ color: MUTED }}>
          {fr
            ? 'La version du référentiel et la date des agrégats font partie de la citation : sans elles, la référence désigne un état du corpus que rien ne permet de retrouver.'
            : 'The referential version and the aggregate date are part of the citation: without them, the reference points to a corpus state nothing allows you to recover.'}
        </p>
      </section>

      <p className="border-t pt-4 text-[12px]" style={{ borderColor: LINE, color: MUTED }}>
        {fr
          ? 'Les dépôts Zenodo et Hugging Face ne sont pas encore ouverts. Cette fiche décrit le corpus servi par ce portail.'
          : 'The Zenodo and Hugging Face deposits are not open yet. This card describes the corpus served by this portal.'}
      </p>
    </>
  );
}
