/**
 * ASKIP public — accès aux données.
 *
 * CLÉ PUBLISHABLE, JAMAIS LA SERVICE_ROLE. Ce projet est servi sans
 * authentification : la clé qu'il embarque atteint le navigateur. Elle ne donne
 * accès qu'au schéma `public_api` (migration 020), dont chaque vue expose
 * exactement ce que le dashboard affiche déjà. Le pire cas d'une fuite est la
 * divulgation de contenu public.
 *
 * Le rôle anonyme n'a AUCUN droit sur le schéma `public` : ni evidences, ni
 * publications, ni researchers en accès direct.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL manquant');
if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY manquant');
if (/^eyJ|service_role|sb_secret_/.test(key)) {
  throw new Error('Clé interdite : ce projet est public, il ne doit recevoir que la clé publishable.');
}

export const db = createClient(url, key, {
  auth: { persistSession: false },
  db: { schema: 'public_api' },
});
