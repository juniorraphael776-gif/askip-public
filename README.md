# ASKIP — portail public

Portail open data à `askip.e-shepha.com`. Accès libre, sans jeton, bilingue FR/EN.
Cinq écrans : Executive Overview, Country Intelligence, Disease Evidence Explorer,
Knowledge Gaps, Researchers.

En trois minutes, un décideur doit pouvoir répondre : que sait-on, que ne sait-on
pas, où sont les priorités, sur quelles sources s'appuyer.

---

## Ce portail ne sert pas des données en direct

**Tout ce qu'il affiche vient d'agrégats matérialisés, calculés à un instant donné et
figés jusqu'au rafraîchissement suivant.** Une evidence ingérée ce matin n'apparaît
nulle part tant que `refresh_burden_view()` n'a pas été appelé. Ce n'est pas un défaut :
c'est ce qui permet aux huit chiffres d'un même écran de désigner le même corpus, et
c'est ce qui a réparé la panne du 1ᵉʳ août — quatre requêtes annulées par dépassement
de délai, parce que chaque visite reconstruisait 48 288 lignes par jointure latérale
sur du JSONB.

Sept objets sont matérialisés :

| Objet | Ce qu'il porte |
|---|---|
| `mv_burden_by_country` | couples pays × maladie, comptes seulement |
| `mv_public_counters` | compteurs de l'accueil et portée du corpus |
| `public_api.coverage_gaps` | état de chaque cellule du périmètre |
| `public_api.topic_reach` | dénominateurs par sujet |
| `public_api.scope_reach` | portée du périmètre face au corpus |
| `public_api.unlocated_by_section` | evidences sans portée nationale, par section |
| `public_api.country_quality` | datation et héritage de localisation, par pays |
| `public_api.evidence_origin_totals` | production documentée par pays de rattachement |

**La date de ces données est affichée en bas de Knowledge Gaps**, lue dans
`data_freshness` — c'est la date du `refresh`, jamais l'heure du rendu. Si elle
vieillit, ce n'est pas le portail qui est en retard, c'est le rafraîchissement qui n'a
pas été appelé.

Deux vues restent en lecture directe, parce qu'elles sont paramétrées par l'URL et ne
peuvent pas être figées : la recherche (`public_api.search_evidence`, une RPC) et le
profil pays. Elles répondent respectivement en ~1,2 s et ~0,6 s en production.

---

## ⚠️ À lire avant de modifier la grille de référence

**`public_api.coverage_gaps` est une vue MATÉRIALISÉE (migration 030). Elle ne suit
plus `scope_grid` en direct.**

Toute modification du périmètre — ajouter un pays, une maladie, un indicateur,
changer une étiquette — reste **invisible sur le portail** tant que ce n'est pas
exécuté :

```sql
SELECT refresh_burden_view();
```

Le même appel rafraîchit les six agrégats du portail, la charge par pays et les
compteurs, puis date l'opération dans `artifacts`. Un seul appel, parce que tous les
chiffres d'un écran doivent dater du même moment : un compteur d'aujourd'hui à côté
d'une grille d'hier serait faux sans qu'aucun chiffre ne le soit.

À appeler après **toute extraction, renormalisation, ou modification de
`scope_grid`**.

La date affichée en bas de Knowledge Gaps vient de `data_freshness`, c'est-à-dire de
ce `refresh` — pas de l'heure du rendu. Si elle vieillit, c'est le refresh qui manque.

---

## Trois règles que le code applique, et qu'il ne faut pas défaire

**1. Aucune valeur n'est agrégée, jamais.** Le portail compte des observations. Il ne
calcule ni moyenne, ni médiane, ni somme de `numeric_value`. Mesure faite : seules 9 %
des valeurs en `numeric_unit='%'` sont de vraies prévalences. Une moyenne de ces
valeurs produirait un chiffre faux d'apparence parfaitement crédible.

**2. Trois formes visuelles sont proscrites** — voir l'en-tête de `app/ui.tsx` :
carte choroplèthe colorée par une valeur, courbe de tendance, classement « pays les
plus touchés ». Le corpus mesure la documentation disponible, pas la charge de
morbidité. La protection contre la surinterprétation est le choix des formes, pas la
note de bas de page.

**3. Une lecture incomplète ne doit jamais ressembler à une lecture réussie.**
Trois occurrences de ce défaut ont été trouvées et corrigées :

| Défaut | Ce qui s'affichait | Correction |
|---|---|---|
| Plafond PostgREST à 1 000 lignes sur `topic_reach` (3 388 lignes) | aucun dénominateur, sans erreur | filtre `.in('topic', topics)` |
| `evidence_origin_by_country` lue à 400 lignes sur 1 350, agrégée côté interface, evidences multi-maladies comptées plusieurs fois | des parts de production fausses, sans signal | agrégat `evidence_origin_totals` calculé en base sur la totalité |
| `safe()` rendant `null` pour « objet absent » comme pour « délai dépassé » | « migrations non appliquées » alors qu'elles l'étaient | `FaultKind` classé sur le code SQL, composant `Diagnostic` |

**Conséquence pratique : avant de servir une vue, vérifier son nombre de lignes.**
Au-delà de mille, il faut un filtre, une pagination explicite, ou un agrégat en base.
Le plafond ne lève pas d'erreur — il tronque.

Et **mesurer sous charge**, avec plusieurs rechargements successifs : les quatre
requêtes qui ont causé la panne du 1ᵉʳ août passaient toutes isolément, et tombaient
toutes lancées ensemble.

---

## Sécurité

`lib/supabase-public.ts` **refuse de démarrer** si la clé fournie n'est pas une clé
publishable : un `service_role` ou une clé `eyJ…` lève une exception au chargement.
Ce projet est public ; il ne doit recevoir que `sb_publishable_…`.

Le schéma `public` est révoqué pour le rôle anonyme (migration 020). Le portail ne lit
que `public_api`, en lecture seule. Le schéma doit rester exposé dans Supabase :
Settings → API → Exposed schemas.

Variables d'environnement requises :

```
NEXT_PUBLIC_SUPABASE_URL=https://<projet>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
```

---

## Développement

```bash
npm install
npm run dev            # http://localhost:3000
npm run build && npx next start
```

Déploiement : `vercel deploy --prod` depuis ce répertoire (projet `askip-public`,
région `iad1`). Pas de dépôt GitHub rattaché — le déploiement se fait depuis le
disque.

Les écrans Overview, Knowledge Gaps et Researchers sont en ISR (`revalidate = 900`) :
un visiteur ne paie jamais le rendu, la régénération se fait en arrière-plan. Country
et Evidence sont rendus à la demande, l'un et l'autre paramétrés par l'URL.
