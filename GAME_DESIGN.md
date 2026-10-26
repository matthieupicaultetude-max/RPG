# Auroria — Game design du MVP

Statut : proposition de référence pour la reconstruction. Ce document décrit la cible à implémenter ; la base actuelle ne contient encore que le déplacement dans une clairière.

## 1. Intention et périmètre

Un petit RPG fantasy coloré en pixel art, jouable dans un navigateur. Le joueur quitte un village sûr, affronte des créatures dans une forêt, rapporte leurs ressources et améliore son équipement.

La première boucle complète doit se découvrir en **10 à 15 minutes**. Les quantités ci-dessous sont des plafonds de contenu pour le MVP.

| Élément | Contenu du MVP |
| --- | --- |
| Classe jouable | 1 : guerrier |
| Zones | 1 village et 1 forêt attenante |
| Monstres | 2 espèces : slime et sanglier |
| Équipements | 3 objets : épée usée, épée de fer, tunique de cuir |
| Quête | 1 : « Sécuriser le sentier » |
| Personnages non joueurs | 2 : garde et marchand |
| Joueurs par zone | 1, expérience solo locale |
| PvP | Aucun |

Les valeurs chiffrées sont des réglages initiaux. Elles pourront évoluer après un premier essai jouable sans ajouter de systèmes ni de contenu.

## 2. Vue et direction visuelle

- Vue **top-down en 2D**, sans perspective isométrique, saut ni étages jouables.
- Pixel art lisible : grille de terrain de 16 × 16 pixels, personnages d’environ 16 × 24 pixels, agrandissement entier et sans lissage.
- Quatre orientations visuelles : haut, bas, gauche, droite. Les mouvements diagonaux utilisent l’orientation de l’axe dominant ; à égalité, l’axe vertical.
- Caméra centrée sur le joueur et limitée aux bords de la carte.
- Village chaleureux et clair, forêt verte avec quelques espaces ouverts. Les silhouettes et animations permettent de distinguer les dangers sans dépendre uniquement des couleurs.
- Terrains raccordables, collisions cohérentes avec les éléments visibles, arbres et toits triés selon leur position verticale.

## 3. Monde et nombre de joueurs

**Un joueur par zone et par partie.** Aucun serveur, compte, lobby, chat ou synchronisation réseau dans le MVP. Chaque navigateur possède sa propre partie ; deux personnes ouvrant le lien ne se rencontrent pas.

Une petite carte contient deux espaces reliés par un seul sentier :

- **Village** : point d’apparition, garde, marchand, quelques maisons et une sortie vers la forêt. Aucun monstre ne peut y entrer. Les portes des bâtiments ne sont pas interactives.
- **Forêt** : clairières de combat, arbres infranchissables, deux groupes de slimes près de l’entrée et deux sangliers plus loin. Maximum de six monstres vivants : quatre slimes et deux sangliers.

Le trajet du village au fond de la forêt prend environ 30 secondes sans combat. Aucun chargement entre les deux zones. Les monstres restent dans la forêt et ne poursuivent pas le joueur jusqu’au village.

## 4. Déplacement et commandes

Déplacement libre dans huit directions, sans navigation au clic. Vitesse initiale : **80 pixels par seconde**, identique en diagonale. Le joueur glisse le long des obstacles, reste dans les limites de la carte et ne traverse ni arbres ni maisons. Les PNJ ne bloquent pas les passages.

| Action | Clavier / souris | Tactile |
| --- | --- | --- |
| Se déplacer | Flèches, ZQSD ou WASD | Croix directionnelle |
| Attaquer | Espace | Bouton Attaque |
| Interagir | E | Bouton Interaction |
| Ouvrir l’inventaire | I | Bouton Sac |
| Fermer un panneau | Échap ou bouton Fermer | Bouton Fermer |

L’interaction concerne le PNJ le plus proche dans un rayon de 24 pixels. L’attaque suit l’orientation du personnage ; aucun ciblage à la souris dans le MVP. Les actions de jeu sont désactivées lorsque les commandes du navigateur ou un champ de saisie ont le focus.

## 5. Combat : temps réel

Le combat est **en temps réel**, sans tours, jauge d’initiative ni pause tactique. Les ennemis bougent et attaquent pendant que le joueur agit.

- Une seule action offensive : le coup d’épée, sans mana, endurance, combo ni compétence spéciale.
- Une pression lance un coup ; maintenir la touche répète les coups dès que leur délai est écoulé.
- Portée : 24 pixels, dans un arc de 90° devant le personnage. Le coup peut toucher les ennemis présents dans cet arc, une seule fois chacun.
- Préparation visible de 0,12 seconde, puis impact ; délai entre deux débuts d’attaque : 0,6 seconde. L’orientation du coup est fixée au lancement. Le mouvement reste possible.
- Un obstacle bloque les coups : impossible de frapper à travers un arbre ou une maison.
- Dégâts reçus : `max(1, attaque adverse − armure)` ; aucun critique, esquive aléatoire ou variation aléatoire.
- Après un coup reçu, le joueur bénéficie de 0,6 seconde d’invulnérabilité, signalée par un clignotement. Aucun dégât différé pendant cette période.
- Chaque impact produit un bref recul limité par les collisions, quelques particules, un nombre de dégâts et un son discret. Le son peut être coupé.

Ouvrir un dialogue, la boutique ou l’inventaire **met toute la simulation en pause**, de même que quitter l’onglet. La reprise ne rattrape pas le temps écoulé. Les panneaux n’offrent aucun soin et ne réinitialisent pas les délais d’attaque.

## 6. Classe et progression

Une seule classe : **guerrier**, combattant de mêlée accessible. Un seul personnage contrôlé, aucun compagnon ni composition d’équipe dans ce MVP.

| Niveau | XP à gagner depuis le niveau précédent | PV maximum | Attaque de base |
| --- | --- | --- | --- |
| 1 | Départ | 40 | 6 |
| 2 | 30 XP | 50 | 7 |
| 3 | 60 XP supplémentaires | 60 | 8 |

Le niveau 3 est le plafond. L’XP cumulée nécessaire est donc de 30 pour le niveau 2 et de 90 pour le niveau 3. L’XP excédentaire est ignorée au plafond. Une montée de niveau restaure les PV et affiche un message. Pas de points à répartir, arbre de talents, spécialisation ni niveaux d’objets.

Le personnage commence niveau 1, avec 40 PV, 0 pièce d’or, une épée usée équipée et aucun vêtement équipé.

## 7. Monstres et comportement

| Espèce | PV | Attaque | Délai entre attaques | Détection | Vitesse | XP | Butin garanti |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Slime | 18 | 4 | 1,5 s | 64 px | 34 px/s | 5 | 1 gelée et 2 pièces |
| Sanglier | 30 | 7 | 1,8 s | 80 px | 50 px/s | 10 | 1 défense et 4 pièces |

Les ennemis patrouillent autour de leur point d’origine, alternant de courtes marches et des pauses. Ils détectent le joueur à portée si aucun obstacle ne coupe la vue, le poursuivent puis attaquent à moins de 18 pixels. Chaque attaque comporte un avertissement visible de 0,3 seconde ; sortir de portée ou rompre la ligne de vue avant l’impact évite le coup.

À plus de 128 pixels de leur origine, ou si le joueur quitte la forêt, ils abandonnent la poursuite et rentrent. Pendant le retour, ils n’attaquent pas et ne peuvent pas être touchés ; ils retrouvent tous leurs PV en atteignant leur origine. Ils contournent les obstacles simples et ne traversent aucun obstacle.

Un monstre vaincu disparaît puis réapparaît après 15 secondes à son point d’origine. Si le joueur est à moins de 48 pixels, sa réapparition attend qu’il s’éloigne. Aucun boss, attaque à distance ou variante d’élite.

## 8. Mort, soins et respawn

À 0 PV, le joueur ne peut plus agir. Un écran bref explique la défaite puis propose **« Revenir au village »**.

- Retour au point d’apparition du village avec tous les PV.
- Aucun objet, or, XP ou progrès de quête perdu.
- Poursuites et attaques en cours annulées ; tous les monstres sont replacés à leur origine, vivants et avec leurs PV maximum.
- Aucun cadavre à récupérer ni pénalité durable.

Dans le village, rester hors combat et immobile pendant 3 secondes déclenche une récupération de 10 PV par seconde. Bouger interrompt ce soin. Aucun soin automatique dans la forêt et aucune potion dans le MVP.

## 9. Inventaire, équipement et économie

### Inventaire

Un sac de **12 emplacements**. Chaque équipement occupe un emplacement et les ressources s’empilent jusqu’à 99 unités par emplacement. Les deux emplacements équipés sont séparés du sac : **arme** et **torse**. L’or est un compteur distinct, sans poids ni limite de sac.

L’interface montre le nom, l’icône, la quantité et les statistiques des objets. Équiper se fait avec un bouton ; remplacer un objet échange sa place avec l’ancien. Retirer un équipement nécessite une place libre. Aucun glisser-déposer, artisanat, coffre, échange entre joueurs ni abandon au sol.

### Trois équipements exactement

| Objet | Emplacement | Effet | Obtention | Prix |
| --- | --- | --- | --- | --- |
| Épée usée | Arme | +0 attaque | Équipement de départ | Non vendable |
| Épée de fer | Arme | +3 attaque | Marchand | 30 pièces |
| Tunique de cuir | Torse | +2 armure | Marchand | 20 pièces |

L’attaque finale additionne l’attaque de base et le bonus de l’arme. L’armure de base vaut 0. Les bonus ne se cumulent pas entre deux objets du même emplacement. Chaque amélioration ne peut être achetée qu’une seule fois ; la boutique indique ensuite « Acquis ». Les équipements ne se revendent pas, afin d’éviter de perdre définitivement un objet unique.

### Butin et vente

Le butin est déterministe : pas de rareté ni de tirage aléatoire. À la mort d’un monstre, l’or et l’XP sont reçus immédiatement. La ressource rejoint le sac automatiquement si une pile ou une place est disponible.

Si le sac est plein, la ressource reste au sol pendant 60 secondes. Passer à moins de 16 pixels permet de la ramasser dès qu’une place est libre. Un message signale le manque de place. Les objets au sol ne sont pas sauvegardés.

Le marchand achète les gelées **2 pièces l’unité** et les défenses **4 pièces l’unité**, avec quantité et prix affichés avant validation. Le sac distingue les ressources réservées par la quête active ; elles ne peuvent pas être vendues. Le marchand ne propose ni achat de ressources ni rachat d’objets vendus.

## 10. Quête unique : « Sécuriser le sentier »

Le garde du village explique que les créatures bloquent l’accès à la forêt.

1. Parler au garde et accepter la quête. Les actions antérieures à l’acceptation ne comptent pas pour les objectifs de combat.
2. Vaincre **4 slimes et 2 sangliers**, puis rapporter **4 gelées et 2 défenses**. Les ressources déjà possédées peuvent servir ; les compteurs de monstres et de ressources sont distincts.
3. Revenir parler au garde. La remise nécessite les quantités complètes ; les ressources sont consommées uniquement à la validation.
4. Recevoir **20 pièces et 30 XP**. La quête est terminée définitivement, sans répétition.

Pendant la quête, jusqu’à 4 gelées et 2 défenses du sac sont réservées automatiquement pour la remise ; tout surplus peut être vendu. Le suivi affiche les compteurs de monstres vaincus et les quantités en sac. Mourir ou recharger ne réinitialise pas la quête.

Les six monstres nécessaires rapportent 16 pièces et 40 XP. Avec la récompense, le joueur possède 36 pièces et 70 XP s’il n’a rien acheté auparavant : assez pour une première amélioration, puis quelques combats et ventes permettent d’obtenir la seconde. Acheter la tunique en premier reste un choix valable.

## 11. PvP et multijoueur

**Aucun PvP** : le joueur ne peut attaquer ni PNJ ni autres joueurs. Le village est toujours sûr. Le multijoueur, les groupes et les compagnons de l’ancienne version sont hors périmètre. Leur ajout éventuel nécessitera une nouvelle décision de conception et une architecture réseau dédiée.

## 12. Interface et sauvegarde

L’interface affiche les PV actuels/maximum, le niveau, la progression XP, l’or et l’objectif de quête. Les monstres montrent leur barre de vie lorsqu’ils sont proches ou blessés. Une invite indique le nom du PNJ et la touche d’interaction à portée. Les boutons tactiles couvrent toutes les actions du MVP.

Sauvegarde locale versionnée, propre à cette reconstruction, contenant le niveau/XP, l’or, le sac, les équipements acquis/équipés et l’état de quête. Une sauvegarde est écrite après chaque gain, achat, vente, changement d’équipement ou étape de quête. Elle n’utilise pas les anciennes sauvegardes du prototype.

À l’ouverture d’une partie existante, le joueur apparaît au village avec tous ses PV et une forêt réinitialisée. Position, PV courants, attaques et objets au sol ne sont pas persistés. Un bouton « Nouvelle partie », avec confirmation explicite, efface uniquement cette sauvegarde. Si le stockage est indisponible ou les données invalides, le jeu reste jouable et affiche un message clair ; les données invalides ne sont pas chargées.

## 13. Limites du MVP

Hors périmètre : classes supplémentaires, équipe de trois personnages, compétences actives, donjons, intérieurs, autres villages ou biomes, boss, ressources de récolte, crafting, potions, raretés, cycle jour/nuit, météo, comptes, serveur, multijoueur, PvP et boutique payante.

Ne pas réintroduire les systèmes de l’ancien prototype pendant la réalisation de ce MVP. Toute extension de contenu attend la validation de la boucle complète.

## 14. Ordre de réalisation et critères d’acceptation

Ce document précède l’implémentation. Développer ensuite par petites étapes jouables :

1. **Terrain et déplacement** : village/forêt connectés, caméra, collisions, clavier et tactile. Aucun passage à travers les obstacles, aucune accélération diagonale.
2. **Combat** : guerrier et deux monstres, déplacements ennemis, attaques annoncées, dégâts et retour après la mort. Les monstres ne peuvent ni attaquer à travers les obstacles ni entrer au village.
3. **Objets** : butin, sac, deux emplacements équipés et marchand. Les quantités et l’or restent cohérents lors d’un sac plein, d’un achat impossible ou d’un échange d’équipement.
4. **Progression** : niveaux, soins du village et quête unique. Impossible de valider sans ressources, de vendre les ressources réservées ou de recevoir deux fois la récompense.
5. **Sauvegarde et finition** : rechargement cohérent, nouvelle partie, effets et audio désactivable, interface utilisable sur petit écran.

Le MVP est terminé lorsqu’une nouvelle partie permet, au clavier comme au tactile, de parler au garde, entrer dans la forêt, combattre les deux espèces, mourir et revenir, terminer la quête, acheter puis équiper une amélioration, et retrouver la progression après rechargement. Aucun ajout de contenu n’est nécessaire pour satisfaire cette définition.
