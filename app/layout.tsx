import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ASKIP — Connaissance sanitaire africaine',
  description:
    "Portail ouvert : ce que le corpus ASKIP documente sur la santé en Afrique, ce qu'il ne documente pas, et la source de chaque chiffre.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
