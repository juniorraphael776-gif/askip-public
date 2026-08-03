import { redirect } from 'next/navigation';

/** Racine : le choix de langue se fait par l'URL, /fr par défaut. */
export default function Root() { redirect('/fr'); }
