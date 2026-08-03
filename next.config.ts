import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Portail public : contenu identique pour tous, régénéré périodiquement.
  // Rien n'est personnalisé, donc rien ne justifie un rendu par visiteur.
  experimental: { staleTimes: { dynamic: 300, static: 3600 } },
};

export default nextConfig;
