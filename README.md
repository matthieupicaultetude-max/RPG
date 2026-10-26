# Auroria

RPG fantasy en pixel art sur navigateur. La vision multijoueur, les rôles, les équipes et les objets sont décrits dans [GAME_DESIGN.md](GAME_DESIGN.md).

## Version actuelle : jardin des essais

Une **zone de développement locale**, pour tester les interfaces et les premières mécaniques avant leur intégration au monde partagé :

- Maison, atelier et aire de combat dans une petite carte top-down.
- Équipe de trois : corps à corps, soutien et distance. Aucun poste flexible.
- **Molette de souris** ou portraits pour sélectionner le principal. Hors ultime, seul ce personnage est présent. **E** déclenche l’ultime : les trois personnages combattent pendant **30 secondes**, avec **5 minutes entre activations**. Les deux compagnons sont pilotés par l’IA pendant l’effet. Ils suivent avec des trajectoires individuelles, contournent la maison et s’espacent naturellement. Le corps à corps engage au contact, le distance garde son recul et le soutien accompagne et soigne. La troupe se regroupe quand le principal s’éloigne.
- Trois bots de promenade identifiés comme tels. Ils ne représentent pas des connexions humaines et ne possèdent pas encore leurs propres équipes.
- Slime, sanglier, luciole ardente et phalène : dégâts, recul, effets, récompenses, réapparition et retour à la maison après défaite complète.
- Sac de test partagé, équipement individuel de 16 emplacements, équipement/retrait d’objets et variantes de loot dans des piles distinctes.
- Outils dev : téléportation, soin/réanimation, XP, génération d’équipements et des quatre variantes de loot, attaque automatique.
- Clavier et commandes tactiles, interface responsive, journal d’événements.

**Pas de serveur multijoueur ni de sauvegarde dans cette zone.** Recharger réinitialise la session. Les règles de contrôle de l’équipe, les statistiques, les probabilités de loot, la capacité du sac et les gains d’XP sont des conventions de test, pas des décisions définitives de game design. Tous les outils sont volontairement accessibles sans limite.

## Démarrer

Prérequis : Node.js 24 et npm.

```sh
npm ci
npm run dev
```

Ouvrir l’adresse affichée par Vite. Cliquer sur la scène pour activer le clavier : flèches, ZQSD ou WASD pour bouger, **clic droit** pour viser et attaquer, **molette** pour changer de personnage, **E** pour activer l’ultime (une pression, sans répétition en maintenant la touche). Le bouton d’attaque reste disponible au tactile ; soin et téléportation sont dans les outils dev. Sélectionner un portrait change le personnage contrôlé. La durée et la recharge de l’ultime sont affichées dans la barre d’actions ; changement de personnage, soin et téléportation ne réinitialisent pas ces délais.

Le jeu remplit la fenêtre, avec portraits, PV et actions en surimpression. **I** ou le bouton **Inventaire** ouvre le panneau d’équipement et de sac ; **I**, **Échap** ou le bouton Fermer le referme. Les anciens raccourcis 1/2/3 sont retirés. La molette dans le panneau fait défiler son contenu sans changer de personnage. Le monde et l’ultime continuent pendant les menus. Un bouton ⛶ active le plein écran natif si disponible.

L’inventaire rassemble l’aperçu du personnage au centre, les **six trophées alignés en bas**, les bijoux à gauche (amulette et deux anneaux), l’arme en bas à gauche et les vêtements à droite (coiffe, cape, ceinture, bottes) et la grille du sac à droite. La fiche de l’objet sélectionné est placée en bas. Le sac propose un filtre Équipements/Ressources ; cliquer sur un objet ne l’équipe pas immédiatement.

Dans **Outils dev**, générer un équipement, puis revenir à **Équipement & sac**, sélectionner l’objet et choisir **Équiper** dans sa fiche. Sélectionner ensuite son emplacement équipé permet de **Retirer** l’objet. Les 16 emplacements comprennent un **bouclier** indépendant de l’arme et un **familier**. Le familier de test est visible dans l’aperçu, sans bonus ni IA propre. Coiffe, cape et bouclier modifient l’apparence ; une arme équipée ajoute 5 dégâts au coup du personnage principal. Les autres bonus restent à concevoir.


## Vérification

```sh
npm test
npm run build
npm run preview
```

Quarante-trois tests couvrent déplacement, composition à trois, variantes de butin, échanges d’équipement, XP, combat/récompenses/respawn, collisions de la maison, soutien IA, retour après défaite, ultime (30 s / 300 s), changements de personnage, filtrage de la molette, ciblage guidé, impacts différés, projectiles, conversion caméra/curseur, contournement de la maison, espacement au repos, recul du distance et regroupement. Les parcours navigateur vérifient également les commandes, les panneaux et le petit écran.

## Organisation

- `index.html` : point d’entrée HTML.
- `src/main.js` : interface de la zone et actions des panneaux.
- `src/game/` : boucle du jeu et déplacement de base.
- `src/dev/sandbox.js` : état et règles provisoires du banc d’essai.
- `src/ai/companions.js` : intentions par rôle, navigation individuelle et mouvement lissé avec séparation.
- `src/input/` : commandes clavier/tactiles et gestion du focus.
- `src/rendering/` : terrain et rendu Canvas des personnages/monstres.
- `src/ui/inventory.js` : disposition de l’inventaire, icônes, aperçu du personnage et fiches d’objet.
- `src/style.css` : interface responsive.
- `tests/` : règles et invariants des essais.
- `.github/workflows/deploy.yml` : publication du client statique sur GitHub Pages.

Le code du banc d’essai est isolé pour éviter de confondre ses règles locales avec la future logique serveur. `window.auroria.snapshot()` fournit une copie de l’état pour l’inspection navigateur.

## Publication

Le workflow publie le client après un push sur `main`. GitHub Pages doit utiliser la source **GitHub Actions**. Le serveur multijoueur nécessitera un hébergement distinct.

Zone jouable : https://matthieupicaultetude-max.github.io/RPG/

L’ancienne version du jeu reste accessible dans l’historique Git au commit `6225b31`.

## Attaque et visée

Le **clic droit sur la scène** déclenche une attaque vers le curseur ; le menu contextuel y est désactivé. Le réticule accroche un monstre proche du curseur et distingue cible valide, cible hors portée et obstacle. La visée utilise la même caméra que le rendu, y compris sur mobile et pendant les déplacements. Espace ne déclenche plus d’attaque.

Chaque rôle a son animation : taille d’épée orientée, flèche guidée ou orbe magique. Les dégâts sont appliqués à l’impact après la préparation ou le trajet du projectile. Les coups respectent leur portée, les obstacles et le délai entre attaques. Les compagnons utilisent également ces animations pendant l’ultime. Le bouton Attaquer et l’outil d’attaque automatique conservent une acquisition de cible proche lorsqu’aucun curseur de visée n’est actif.

## Bestiaire

**B**, le bouton Bestiaire en haut ou l’onglet du panneau ouvre les fiches des quatre espèces du jardin. Chaque fiche présente son apparence, son habitat, ses statistiques et ses quatre issues de butin avec leurs probabilités : normal standard 72 %, normal chromatique 8 %, rare standard 18 %, rare chromatique 2 %.

Le curseur de niveau **1 à 100** actualise PV, dégâts, XP et or ; vitesse et délais restent fixes. Il s’agit d’une consultation, qui ne modifie pas les monstres présents. Les statistiques de base et les tables de butin du combat et des fiches proviennent de `src/data/monsters.js`. Les règles de croissance sont provisoires : par niveau supplémentaire, +12 % des PV de base, +8 % des dégâts de base, +10 % de l’XP de base et +5 % de l’or de base, arrondis à l’entier.

**B** ou **Échap** ferme le bestiaire ; **I** revient à l’inventaire. Le monde continue pendant la consultation. Les tests couvrent aussi les bornes de niveau, la progression des statistiques, les probabilités et leur cohérence avec la simulation.

## Panoplies et noyaux

Quatre panoplies débutantes de **niveau 1**, tranche **1–10** : **Ronce** (Terre/Force), **Braise** (Feu/Intelligence), **Brise** (Air/Agilité), **Rosée** (Eau/Chance). Chaque panoplie comprend neuf pièces : coiffe, cape, ceinture, bottes, amulette, deux anneaux distincts, arme et bouclier. Trophées et familiers sont hors de ces panoplies.

Les monstres peuvent donner un noyau en plus de leur ressource : slime → Eau, sanglier → Terre, luciole ardente → Feu, phalène → Air. Taux d’essai : **25 %**, dont 10 % de variantes chromatiques parmi les noyaux obtenus. Le noyau conserve l’élément et la tranche de dix niveaux du monstre.

Revenir au **village, près de la maison**, ouvrir **I**, sélectionner le noyau dans le sac puis cliquer **Ouvrir le noyau**. Un noyau est consommé pour une pièce aléatoire du bon élément et de la bonne tranche ; neuf choix équiprobables, doublons possibles. Un noyau chromatique donne une pièce chromatique avec les mêmes bonus. Les autres tranches n’ont pas encore d’équipements et leurs noyaux ne peuvent pas être consommés.

Les pièces donnent Vitalité et caractéristique élémentaire, sans bonus de panoplie supplémentaire. Dans le prototype, 1 Vitalité donne 1 PV maximum ; le bonus élémentaire de l’arme renforce les dégâts selon la caractéristique correspondante (+1 % par point). Les PV actuels ne sont pas restaurés par un échange d’équipement. Les compétences élémentaires restent à concevoir. Les outils dev proposent les quatre noyaux et la téléportation **Maison**, pour tester sans attendre un drop.

## Direction graphique — premier passage

Le jardin adopte une palette douce et chaleureuse : herbe dorée, chemins de terre aux bordures irrégulières, maison en pierre et colombages avec toit d’ardoise, bouleaux, buissons, fleurs, clôtures et objets de village. Les personnages et les quatre espèces de monstres ont des sprites ombrés et plus détaillés.

Le décor est assemblé dans `src/rendering/environment.js`, à partir des données de carte, des textures et de l’atlas de sprites, puis réutilisé. Les arbres sont triés avec les personnages selon leur profondeur et deviennent partiellement transparents près du principal. Les sprites animés sont isolés dans `src/rendering/actors.js`. La caméra et les règles de déplacement/combat conservent leurs coordonnées actuelles.

## Rendu et carte : base commune

Le terrain, les chemins et les collisions reposent désormais sur les mêmes données dans `src/world/map.js`. Les textures d’herbe, terre, eau et pierre sont périodiques et échantillonnées dans le repère du monde. Les chemins sont fusionnés avant de calculer leurs bords : les intersections ne portent plus les contours des branches superposées.

Les arbres et les autres objets sont vérifiés sur la terre ferme avant le rendu ; les pieds d’arbres et les objets solides bloquent les déplacements. Les sprites sont mis en cache avec un ancrage explicite. La caméra utilise un zoom et une origine entiers pour stabiliser le pixel art. Les points de contrôle et les conventions sont détaillés dans [docs/RENDERING.md](docs/RENDERING.md).
