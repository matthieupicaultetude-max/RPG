# Auroria

RPG fantasy en pixel art sur navigateur. La vision multijoueur, les rôles, les équipes et les objets sont décrits dans [GAME_DESIGN.md](GAME_DESIGN.md).

## Version actuelle : jardin des essais

Une **zone de développement locale**, pour tester les interfaces et les premières mécaniques avant leur intégration au monde partagé :

- Maison, atelier et aire de combat dans une petite carte top-down.
- Équipe de trois : corps à corps, soutien et distance. Aucun poste flexible.
- Touches **1, 2, 3** ou portraits pour sélectionner le principal. Hors ultime, seul ce personnage est présent. **E** déclenche l’ultime : les trois personnages combattent pendant **30 secondes**, avec **5 minutes entre activations**. Les deux compagnons sont pilotés par l’IA pendant l’effet. Ils suivent avec des trajectoires individuelles, contournent la maison et s’espacent naturellement. Le corps à corps engage au contact, le distance garde son recul et le soutien accompagne et soigne. La troupe se regroupe quand le principal s’éloigne.
- Trois bots de promenade identifiés comme tels. Ils ne représentent pas des connexions humaines et ne possèdent pas encore leurs propres équipes.
- Slime et sanglier : dégâts, recul, effets, récompenses, réapparition et retour à la maison après défaite complète.
- Sac de test partagé, équipement individuel de 14 emplacements, équipement/retrait d’objets et variantes de loot dans des piles distinctes.
- Outils dev : téléportation, soin/réanimation, XP, génération d’équipements et des quatre variantes de loot, attaque automatique.
- Clavier et commandes tactiles, interface responsive, journal d’événements.

**Pas de serveur multijoueur ni de sauvegarde dans cette zone.** Recharger réinitialise la session. Les règles de contrôle de l’équipe, les statistiques, les probabilités de loot, la capacité du sac et les gains d’XP sont des conventions de test, pas des décisions définitives de game design. Tous les outils sont volontairement accessibles sans limite.

## Démarrer

Prérequis : Node.js 24 et npm.

```sh
npm ci
npm run dev
```

Ouvrir l’adresse affichée par Vite. Cliquer sur la scène pour activer le clavier : flèches, ZQSD ou WASD pour bouger, Espace pour attaquer le monstre le plus proche à portée, **1, 2, 3** pour changer de personnage, **E** pour activer l’ultime (une pression, sans répétition en maintenant la touche). Les boutons sous la scène permettent d’attaquer, soigner et se téléporter. Sélectionner un portrait change le personnage contrôlé. La durée et la recharge de l’ultime sont affichées sous la scène ; changement de personnage, soin et téléportation ne réinitialisent pas ces délais.

Dans **Outils dev**, générer un équipement puis ouvrir le **Sac** et cliquer sur **Équiper** pour l’attribuer au personnage principal. Le panneau **Personnage** présente ses 14 emplacements ; cliquer sur un objet équipé le remet dans le sac. Coiffe et cape modifient le sprite ; une arme équipée ajoute 5 dégâts au coup du personnage principal. Les autres bonus restent à concevoir.

## Vérification

```sh
npm test
npm run build
npm run preview
```

Dix-huit tests couvrent déplacement, composition à trois, variantes de butin, échanges d’équipement, XP, combat/récompenses/respawn, collisions de la maison, soutien IA, retour après défaite, ultime (30 s / 300 s), changements de personnage, contournement de la maison, espacement au repos, recul du distance et regroupement. Les parcours navigateur vérifient également les commandes, les panneaux et le petit écran.

## Organisation

- `index.html` : point d’entrée HTML.
- `src/main.js` : interface de la zone et actions des panneaux.
- `src/game/` : boucle du jeu et déplacement de base.
- `src/dev/sandbox.js` : état et règles provisoires du banc d’essai.
- `src/ai/companions.js` : intentions par rôle, navigation individuelle et mouvement lissé avec séparation.
- `src/input/` : commandes clavier/tactiles et gestion du focus.
- `src/rendering/` : terrain et rendu Canvas des personnages/monstres.
- `src/style.css` : interface responsive.
- `tests/` : règles et invariants des essais.
- `.github/workflows/deploy.yml` : publication du client statique sur GitHub Pages.

Le code du banc d’essai est isolé pour éviter de confondre ses règles locales avec la future logique serveur. `window.auroria.snapshot()` fournit une copie de l’état pour l’inspection navigateur.

## Publication

Le workflow publie le client après un push sur `main`. GitHub Pages doit utiliser la source **GitHub Actions**. Le serveur multijoueur nécessitera un hébergement distinct.

Zone jouable : https://matthieupicaultetude-max.github.io/RPG/

L’ancienne version du jeu reste accessible dans l’historique Git au commit `6225b31`.
