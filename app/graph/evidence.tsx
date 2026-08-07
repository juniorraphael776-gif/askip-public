'use client';

/**
 * ASKIP — la matière : une evidence telle qu'elle est en base.
 *
 * Ce fichier porte le TYPE, l'APPEL et le RENDU d'une ligne d'evidence, parce que le
 * panneau attaché au graphe et l'explorateur du bas montrent la même chose et ne
 * doivent pas diverger. Trois copies de `SRC_MAP` et trois de `displaySource` ont déjà
 * coûté à ce projet ; deux rendus d'evidence coûteraient pareil.
 *
 * ── CE QUE CETTE LIGNE NE FOND PAS ──────────────────────────────────────────
 * `publication_year` est l'année de l'ARTICLE. `temporal_context` est la période
 * OBSERVÉE, en texte libre. « publié en 2022 » et « observé en 2019 » ne sont pas la
 * même information : la première date la source, la seconde date le fait. Les fondre
 * en une « année » ferait croire qu'une mesure de 2019 est une mesure de 2022.
 *
 * Elles sont donc affichées séparément, nommées, et l'absence de l'une n'est jamais
 * comblée par l'autre. `temporal_context` est nul sur une bonne part du corpus — les
 * chiffres du portail le disent : 15 356 observations datées sur 49 511.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '@/lib/supabase-public';
import { GOLD, INK, LINE, MUTED } from '@/lib/theme';

export interface EvidenceRow {
  evidence_id: string;
  claim: string;
  numeric_value: number | null;
  numeric_unit: string | null;
  /** Période OBSERVÉE, texte libre. Jamais confondue avec publication_year. */
  temporal_context: string | null;
  language: string;
  evidence_type: string;
  topics: string[];
  countries: string[];
  sections: string[];
  origin: string | null;
  source: string | null;
  doi: string | null;
  pmid: string | null;
  publication_title: string | null;
  journal: string | null;
  /** Année de l'ARTICLE. Jamais confondue avec temporal_context. */
  publication_year: number | null;
  total_count: number;
}

export interface Recherche {
  q?: string | null;
  topic?: string | null;
  country?: string | null;
  section?: string | null;
  limit?: number;
  offset?: number;
}

/**
 * Appelle `search_evidence`. UN SEUL RÉESSAI, et seulement sur un dépassement de délai.
 *
 * La fonction est `SECURITY DEFINER` depuis la 053 : avant, elle lisait `evidences` et
 * `evidence_validation` dans le schéma `public`, où `anon` n'a aucun droit, et la RLS
 * rendait ZÉRO LIGNE SANS ERREUR. L'écran `/fr/evidence` affichait « Aucune donnée dans
 * ce corpus » en production sur un corpus de 63 227 evidences. C'est le motif dominant
 * du projet : l'échec avait la forme exacte d'un corpus vide.
 *
 * Elle filtre sur `validation_status = 'VALIDATED'`. Tout ce qui sort d'ici a franchi
 * le même contrôle que les chiffres de la carte et des profils pays — les deux écrans
 * comptent donc pareil, et il n'y a pas d'incohérence à signaler au lecteur.
 */
export async function chercherEvidences(
  p: Recherche,
): Promise<{ ok: true; lignes: EvidenceRow[]; total: number } | { ok: false; froid: boolean; detail: string }> {
  for (let essai = 0; essai < 2; essai++) {
    const { data, error } = await db.rpc('search_evidence', {
      p_q: p.q || null, p_topic: p.topic || null, p_country: p.country || null,
      p_language: null, p_section: p.section || null,
      p_limit: p.limit ?? 12, p_offset: p.offset ?? 0,
    });
    if (!error) {
      const lignes = (data ?? []) as EvidenceRow[];
      return { ok: true, lignes, total: lignes[0]?.total_count ?? 0 };
    }
    const froid = error.code === '57014' || /statement timeout|canceling statement/i.test(error.message);
    if (!froid || essai === 1) return { ok: false, froid, detail: `${error.code ?? '?'} ${error.message}` };
  }
  return { ok: false, froid: true, detail: 'délai dépassé deux fois' };
}

const SRC: Record<string, string> = {
  pubmed: 'PubMed', europepmc: 'Europe PMC', hal: 'HAL', crossref: 'Crossref',
  openalex: 'OpenAlex', orcid: 'ORCID', doaj: 'DOAJ',
};
/** Le libellé de source est normalisé À L'AFFICHAGE, jamais en base. */
export const sourceLisible = (s: string | null) =>
  !s ? null : (SRC[s.toLowerCase()] ?? s.replace(/^hal\s+/i, 'HAL · '));

export function LigneEvidence({ e, lang }: { e: EvidenceRow; lang: 'fr' | 'en' }) {
  const fr = lang === 'fr';
  const src = sourceLisible(e.source);
  const lien = e.doi ? `https://doi.org/${e.doi}` : e.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${e.pmid}/` : null;

  return (
    <article className="border-b py-3 last:border-b-0" style={{ borderColor: LINE }}>
      <p className="text-[13px] leading-relaxed" style={{ color: INK }}>
        {e.numeric_value !== null && (
          <strong className="mr-2 whitespace-nowrap" style={{ color: GOLD }}>
            {e.numeric_value.toLocaleString(fr ? 'fr-FR' : 'en')}
            {e.numeric_unit ? ` ${e.numeric_unit}` : ''}
          </strong>
        )}
        {e.claim}
      </p>

      <p className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[11px]" style={{ color: MUTED }}>
        {e.countries?.length > 0 && <span>{e.countries.join(' · ')}</span>}
        {e.topics?.length > 0 && <span style={{ opacity: 0.85 }}>{e.topics.join(' · ')}</span>}

        {/* DEUX DATES, NOMMÉES. Voir l'en-tête : les fondre serait le défaut du jour. */}
        {e.temporal_context && <span>{fr ? 'observé' : 'observed'} {e.temporal_context}</span>}
        {e.publication_year && <span>{fr ? 'publié' : 'published'} {e.publication_year}</span>}

        {(e.journal || e.publication_title) && (
          <span className="italic" style={{ maxWidth: '32rem' }}>
            {(e.journal ?? e.publication_title)!.slice(0, 90)}
          </span>
        )}
        {src && <span style={{ opacity: 0.8 }}>{src}</span>}
        {lien && (
          <a href={lien} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: GOLD }}>
            {e.doi ? 'DOI' : 'PMID'}
          </a>
        )}
      </p>
    </article>
  );
}

/**
 * Liste d'evidences, avec ses trois états explicites.
 *
 * « en cours », « aucune ligne » et « la lecture a échoué » ne se ressemblent pas ici,
 * parce qu'ils ne se ressemblaient PAS en base et que les confondre est ce qui a laissé
 * `/fr/evidence` afficher « aucune donnée » pendant que le corpus en portait 63 227.
 */
export function ListeEvidences({
  etat, lignes, total, lang, vide,
}: {
  etat: 'vide' | 'chargement' | 'ok' | 'panne';
  lignes: EvidenceRow[];
  total: number;
  lang: 'fr' | 'en';
  vide: string;
}) {
  const fr = lang === 'fr';
  if (etat === 'chargement') {
    return (
      <p className="py-6 text-[13px]" style={{ color: MUTED, animation: 'askip-pulse 1.1s ease-in-out infinite' }}>
        {fr ? 'Lecture des evidences…' : 'Reading evidence…'}
      </p>
    );
  }
  if (etat === 'panne') {
    return (
      <p className="py-6 text-[13px]" style={{ color: '#8C3A2E' }}>
        {fr
          ? 'La lecture n’a pas abouti. Ce n’est pas une absence de données : le corpus en compte 63 227.'
          : 'The read did not complete. This is not an absence of data: the corpus holds 63,227.'}
      </p>
    );
  }
  if (etat === 'vide' || lignes.length === 0) {
    return <p className="py-6 text-[13px]" style={{ color: MUTED }}>{vide}</p>;
  }
  return (
    <>
      <p className="mb-1 text-[11px]" style={{ color: MUTED }}>
        {fr
          ? `${lignes.length} affichées sur ${total.toLocaleString('fr-FR')}`
          : `${lignes.length} shown of ${total.toLocaleString('en')}`}
      </p>
      {lignes.map((e) => <LigneEvidence key={e.evidence_id} e={e} lang={lang} />)}
    </>
  );
}

/** Hook partagé : une recherche annulable, dont le dernier appel gagne. */
export function useEvidences(lang: 'fr' | 'en') {
  const [etat, setEtat] = useState<'vide' | 'chargement' | 'ok' | 'panne'>('vide');
  const [lignes, setLignes] = useState<EvidenceRow[]>([]);
  const [total, setTotal] = useState(0);
  // Le jeton évite qu'une réponse lente écrase une réponse plus récente : sur un
  // corpus où un appel varie de 150 ms à 3,7 s, l'ordre d'arrivée n'est pas l'ordre
  // de départ, et le dernier clic doit gagner.
  const jeton = useRef(0);

  const chercher = useCallback(async (p: Recherche | null) => {
    const mien = ++jeton.current;
    if (!p) { setEtat('vide'); setLignes([]); setTotal(0); return; }
    setEtat('chargement');
    const r = await chercherEvidences(p);
    if (mien !== jeton.current) return;
    if (!r.ok) { setEtat('panne'); setLignes([]); setTotal(0); return; }
    setEtat('ok'); setLignes(r.lignes); setTotal(r.total);
  }, []);

  useEffect(() => () => { jeton.current++; }, []);
  return { etat, lignes, total, chercher, lang };
}
