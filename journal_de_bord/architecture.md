# Architecture - AURA CHECK

## Stack Technique
- **Frontend** : Next.js (App Router), React, TailwindCSS, Framer Motion.
- **Backend** : Next.js API Routes.
- **IA** : Google Generative AI (Gemini 1.5 Flash) pour Vision et analyse de texte.
- **Traitement d'image** : Aucun détourage (utilisation du contexte total de la photo).

## Flux de données
1. L'utilisateur prend/upload une photo.
2. La photo est envoyée au backend.
3. L'image entière est envoyée à Gemini 1.5 Flash pour analyse (Couleur, Score, Description sarcastique incluant le décor).
4. Le backend renvoie les données à l'application.
5. Le frontend applique un effet d'aura dynamique (glow CSS) sur la photo originale.

## Structure des composants (Prévisionnel)
- `Home` : Écran d'accueil avec bouton d'upload.
- `Loading` : Animation de scan avec textes dynamiques.
- `Result` : Affichage de l'aura et bouton de partage.
- `AuraCanvas` : Composant pour générer l'image de partage.
