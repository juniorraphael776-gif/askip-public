import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { pickLang } from '@/lib/i18n';

/**
 * Racine : askip.e-shepha.com sert le portail directement.
 *
 * Pas d'écran de choix de langue avant le contenu — on redirige vers la langue
 * du navigateur et le sélecteur reste visible en tête de page. Le rendu est
 * dynamique par nécessité (lecture d'un en-tête de requête) ; les pages de
 * destination, elles, restent prégénérées.
 */
export const dynamic = 'force-dynamic';

export default async function Root() {
  const h = await headers();
  redirect(`/${pickLang(h.get('accept-language'))}`);
}
