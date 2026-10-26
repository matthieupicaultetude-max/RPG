# Auroria — Document de conception

Statut : vision de référence en cours de définition. Ce document précède le développement des systèmes décrits. La version jouable actuelle est une zone de développement locale pour essayer les interfaces et les mécaniques ; elle ne dispose pas encore de multijoueur.

Les décisions explicitement définies ci-dessous constituent la cible. Les propositions et questions ouvertes sont identifiées comme telles : elles ne valent pas validation. Le précédent périmètre MVP est abandonné ; aucun plafond de contenu ni ordre de développement n’est fixé pour le moment.

## 1. Vision

Un RPG fantasy coloré en pixel art, en vue **top-down 2D**, jouable dans un navigateur et conçu pour le **multijoueur**. Des joueurs humains et des bots simulant d’autres joueurs partagent les zones du monde.

Le joueur constitue une équipe de quatre personnages, explore, combat des monstres, gagne de l’XP et du butin, puis revient à sa maison pour revoir sa composition. Les métiers enrichiront cette progression dans une phase ultérieure.

## 2. Monde partagé et population

- Plusieurs joueurs humains peuvent être présents dans une même zone.
- Des **bots de population** simulent d’autres joueurs : ils se déplacent, constituent leurs propres équipes et participent à la vie du monde. Le détail de leurs activités reste à définir.
- Un bot de population est distinct d’un PNJ de service, comme un marchand, et d’un compagnon appartenant à l’équipe d’un joueur.
- Les bots doivent être identifiables comme tels dans leur fiche ou leur nom, afin de ne pas faire croire qu’une IA est une personne réelle.
- Les villages servent de lieux de rencontre, de commerce et de retour ; les espaces sauvages accueillent les monstres et l’exploration. Le nombre de villages, de biomes et de monstres n’est pas limité par l’ancien MVP.

**À définir :** capacité en joueurs humains par zone, nombre de bots, nombre total de personnages simulés, instances éventuelles et comportement lorsque la zone est pleine. Une capacité exprimée en joueurs doit tenir compte des quatre personnages de chaque équipe ; les bots consomment aussi des ressources de simulation.

## 3. Vue, déplacement et lisibilité

- Vue top-down, décors en pixel art, textures raccordables, caméra suivant le personnage contrôlé et profondeur visuelle cohérente.
- Déplacement libre dans huit directions, à vitesse normalisée en diagonale. Les sprites s’orientent selon leur mouvement et les obstacles bloquent les déplacements.
- Commandes de déplacement : flèches, ZQSD ou WASD ; commandes tactiles équivalentes.
- Différencier visuellement le personnage principal, ses alliés, les autres équipes, les bots de population et les monstres.
- Préserver la lisibilité lorsque plusieurs équipes de quatre sont proches : noms, silhouettes, effets et barres de vie devront pouvoir être filtrés ou simplifiés.

Les tailles de sprites, vitesses, distances et raccourcis d’action seront fixés après définition des interactions d’équipe et du combat.

## 4. Trois rôles de personnages

Les personnages se répartissent en **trois rôles de combat**. Il s’agit de catégories fonctionnelles, pas du genre ou de l’apparence du personnage.

| Rôle | Fonction générale |
| --- | --- |
| Combattant au corps à corps | Combat au contact et présence sur la ligne de front |
| Soutien | Aide à la survie et à l’efficacité de l’équipe ; soins, protections ou améliorations à préciser selon les classes |
| Distance | Attaques et pression depuis l’arrière, avec une gestion de la portée |

Les classes concrètes, compétences et spécialisations restent à concevoir à l’intérieur de ces rôles. Le rôle de corps à corps n’impose pas à lui seul une classe de tank.

## 5. Équipe de quatre et maison

Chaque joueur dispose d’une **équipe de quatre personnages** :

| Poste | Règle |
| --- | --- |
| 1 | Un combattant au corps à corps |
| 2 | Un soutien |
| 3 | Un personnage à distance |
| 4 | Un poste flexible, choisi parmi les trois rôles |

Une composition valide contient donc au moins un personnage de chaque rôle, avec un second personnage du rôle choisi pour le poste flexible. Le poste flexible n’est pas un quatrième rôle.

### Recomposition

Le joueur peut **refaire sa composition chaque fois qu’il revient à sa maison**. La maison est le lieu de préparation de l’équipe ; la recomposition ne se fait pas librement au milieu d’un combat ou d’une zone d’exploration.

- L’interface de maison présente les personnages disponibles et les quatre postes.
- Une composition incomplète ou ne respectant pas les rôles ne peut pas être validée.
- Un personnage ne peut pas occuper deux postes à la fois.
- Modifier la composition ne supprime pas les personnages retirés ni leur progression et leur équipement.

**À définir :** acquisition de nouveaux personnages, taille de la réserve, coût éventuel d’une recomposition et possibilité d’enregistrer des compositions. Aucun coût ni limite de fréquence n’est imposé à ce stade. La maison pourrait être une instance personnelle accessible depuis le village ; son implantation reste à décider.

### Contrôle de l’équipe

Le joueur dirige uniquement son **personnage principal**. Les trois autres membres sont pilotés par l’IA. La touche **E** déploie ou rappelle les alliés ; elle reste disponible en déplacement comme en combat. Une pression maintenue ne répète pas le basculement. Un bouton équivalent est disponible dans l’interface et au tactile.

La troupe s’articule autour du personnage principal, sans former une file rigide ni recopier ses pas :

- Chaque compagnon choisit sa destination et son chemin, contourne les obstacles et garde un espace personnel.
- Les changements de direction et de vitesse sont progressifs. À l’arrêt, les compagnons se stabilisent au lieu de tourner constamment autour du joueur.
- Le corps à corps approche les ennemis et engage au contact.
- Le personnage à distance conserve une zone de tir et recule lorsqu’un ennemi s’approche trop.
- Le soutien reste en retrait, suit la troupe et aide les alliés.
- Quand le personnage principal s’éloigne, les compagnons abandonnent les combats trop éloignés et se regroupent autour de lui.

Le changement de personnage principal est disponible par les portraits dans la zone d’essai ; ses restrictions éventuelles dans le monde partagé restent à définir. Les distances, vitesses et règles de priorité précises sont encore des réglages de test.

L’IA des compagnons et les bots simulant d’autres joueurs sont deux systèmes distincts, même s’ils peuvent partager des briques de déplacement ou de combat.

## 6. Combat et interactions entre équipes

**Orientation proposée : combat en temps réel**, à confirmer avec les règles de contrôle des quatre personnages. Les attaques doivent être lisibles, respecter les obstacles et proposer des comportements différents selon les trois rôles.

Les valeurs de dégâts, ressources, portées, délais, compétences, ciblage, aggro et collisions entre personnages restent à définir. Les anciennes statistiques du guerrier solo ne font plus référence.

En multijoueur, ouvrir un inventaire, une boutique, un dialogue ou quitter l’onglet **ne met pas le monde en pause**. La conduite de l’équipe pendant ces actions, l’absence du joueur et la déconnexion restent à définir ; ouvrir un panneau ne doit pas accorder automatiquement une invulnérabilité.

**À définir pour les combats partagés :** attribution des monstres, participation de plusieurs équipes, partage de l’XP, droit au butin et effet des soins ou protections entre équipes. Les bots suivent les mêmes règles d’accès aux récompenses que les joueurs humains.

## 7. Progression par XP et métiers

### Expérience

La progression comprend un **système d’XP et de niveaux**. Le combat et les activités du monde pourront fournir de l’expérience ; les sources exactes et leurs récompenses restent à définir.

Les décisions suivantes sont encore ouvertes :

- XP propre à chaque personnage, XP de compte/équipe ou combinaison des deux.
- Répartition entre les quatre membres et éventuelle progression des personnages en réserve.
- Courbe d’XP, niveau maximum et effets d’une montée de niveau.
- Conditions d’équipement et déblocages de compétences.

Aucun plafond au niveau 3 ni aucune remise à niveau automatique lors d’un changement de composition n’est retenu.

### Métiers : développement ultérieur

Un **système de métiers** est prévu, mais sera développé plus tard. La liste des métiers, leur progression, la récolte, les recettes et leurs liens avec le butin ne sont pas encore définis. L’XP de métier et son articulation avec l’XP de combat devront être explicitées avant leur implémentation.

## 8. Inventaire et équipement

Chaque personnage possède la grille d’équipement suivante :

| Catégorie | Nombre d’emplacements |
| --- | --- |
| Coiffe | 1 |
| Cape | 1 |
| Ceinture | 1 |
| Bottes | 1 |
| Anneaux | 2 |
| Amulette | 1 |
| Arme | 1 |
| Trophées | 6 |
| **Total** | **14** |

Les deux anneaux occupent des emplacements indépendants. Les six trophées sont des emplacements dédiés, séparés des bijoux et de l’arme. Aucun emplacement de torse ou de bouclier n’est ajouté à cette liste.

Le sac d’inventaire est distinct de ces emplacements équipés. Il stocke les objets non équipés et les ressources de butin, en préservant leur identité et leur variante.

**À définir :** sac partagé par l’équipe ou propre à chaque personnage, capacité, empilement, poids éventuel, statistiques d’objet, restrictions de classe/niveau, doublons d’anneaux ou de trophées, échange d’équipement entre personnages et changements autorisés en combat. L’ancienne limite de 12 places et l’ancien catalogue de trois équipements sont supprimés.

## 9. Monstres et loot chromatique

Chaque espèce de monstre possède **deux références de butin** :

1. Un loot normal.
2. Un loot rare.

**Chacun de ces deux loots possède une variante chromatique.** Une table de butin doit donc pouvoir représenter quatre identités distinctes :

| Référence | Variante standard | Variante chromatique |
| --- | --- | --- |
| Loot normal | Normal standard | Normal chromatique |
| Loot rare | Rare standard | Rare chromatique |

« Chromatique » est une variation de l’objet obtenu ; cela n’implique pas à ce stade l’existence de monstres chromatiques. Rare et chromatique sont deux propriétés distinctes. Les piles standard et chromatiques doivent rester différenciées, avec un nom et une icône reconnaissables sans dépendre uniquement de la couleur.

**À définir avant implémentation :**

- Chances de drop du normal, du rare et de chaque variation chromatique.
- Quantités et possibilité d’obtenir normal et rare sur une même victoire.
- Tirage de la variation chromatique : remplacement de l’objet standard ou récompense supplémentaire.
- Butin individuel ou partagé entre joueurs/équipes, et comportement des bots face aux objets au sol.
- Fonction des variantes chromatiques : collection, valeur, recettes ou propriétés ; aucun bonus de puissance n’est supposé.
- Vente, échange, stockage et traitement d’un inventaire plein.

La règle précédente d’un butin uniquement garanti sans rareté est abandonnée. Le bestiaire, les tables chiffrées, l’or éventuel et les temps de réapparition restent à concevoir.

## 10. Mort, soins et respawn

Ces règles doivent être redéfinies pour une équipe dans un monde partagé :

- Mort ou mise à terre d’un seul personnage, réanimation et comportement des survivants.
- Conséquence de la défaite des quatre personnages.
- Lieu et délai de respawn, pertes éventuelles, restauration des PV et soins hors combat.
- Effet de la déconnexion et retour dans une zone de combat.

**Contrainte multijoueur :** la défaite ou le retour au village d’une équipe ne réinitialise pas les monstres ni les combats des autres joueurs. L’ancien respawn solo réinitialisant toute la forêt est supprimé.

Aucune perte d’objet, d’XP ou de monnaie n’est décidée pour l’instant.

## 11. Quêtes, économie et PvP

Les quêtes et le commerce s’inscriront dans le monde multijoueur, avec des règles à définir pour les objectifs individuels ou partagés, les récompenses et les échanges. L’ancienne quête unique et ses prix/récompenses ne constituent plus une spécification.

**PvP : décision ouverte.** Le passage au multijoueur ne signifie pas automatiquement l’activation du PvP. Le PvE est au cœur de la boucle décrite ; duels, zones PvP, consentement et éventuelles récompenses doivent être décidés explicitement avant tout ajout de combat entre joueurs. Même décision pour les bots : aucune attaque contre un joueur n’est implicite.

## 12. Persistance et architecture multijoueur

Le monde partagé nécessite une **simulation serveur faisant autorité** sur les positions validées, combats, monstres, bots, XP, objets, transactions et compositions. Le navigateur présente le jeu et envoie des intentions ; il n’attribue pas lui-même de récompenses définitives.

Les personnages, leurs équipements, leur progression, la réserve et la composition doivent être persistés côté serveur. L’identité des joueurs, l’authentification, le stockage, les reconnexions et le protocole réseau restent à choisir. Le stockage local peut conserver des préférences d’interface ou de son, mais ne fait pas autorité sur les possessions.

GitHub Pages peut continuer à héberger le client statique ; il ne peut pas héberger à lui seul le serveur multijoueur. Le service serveur et son hébergement devront être choisis avant l’implémentation réseau. Aucun service payant n’est engagé par ce document.

## 13. Décisions à prendre ensuite

Avant de coder ces systèmes, préciser en priorité :

1. Restrictions éventuelles du changement de personnage principal et priorités avancées des compagnons IA.
2. Confirmation du temps réel, compétences, ciblage et coopération entre équipes.
3. Capacité des zones, population de bots et activités simulées.
4. XP par personnage ou par équipe, progression des réservistes et acquisition des personnages.
5. Mort, réanimation, respawn et déconnexion.
6. Propriété du sac, fonctionnement des équipements et des trophées.
7. Attribution du butin, probabilités et effet des variations chromatiques.
8. Place du PvP, identité des joueurs et architecture serveur.

Il s’agit d’une liste de conception à compléter, pas d’un MVP ni d’un engagement à implémenter tous ces systèmes immédiatement.

## 14. Zone de développement actuelle

Le jardin des essais sert à éprouver les interfaces et les personnages avant de choisir les règles finales. Il comprend une maison, un atelier, deux monstres de test, quatre membres contrôlables et trois bots de promenade explicitement identifiés. Ces bots n’ont pas encore d’équipe autonome.

Les conventions suivantes s’appliquent **uniquement à cette zone** :

- Un personnage principal contrôlé, trois compagnons IA déployables/rappelables avec **E**, sélection du principal à tout moment. Le suivi autonome par rôle est décrit en section 5. Les trois premiers rôles restent fixes ; seul le poste flexible est modifiable à la maison.
- Combat temps réel avec acquisition automatique du monstre le plus proche à portée ; soutien IA soignant les alliés vivants. Les compétences et le ciblage définitifs ne sont pas implémentés.
- XP identique pour les quatre membres, sac partagé sans capacité maximale et aucun métier.
- Quatorze emplacements individuels équipables ; coiffe/cape visibles et bonus de test de +5 dégâts pour l’arme du personnage contrôlé. Autres statistiques à définir.
- Un objet par victoire : 20 % de loot rare, 10 % de variante chromatique indépendante. Ces taux ne constituent pas un équilibrage validé. Les quatre variantes peuvent aussi être générées manuellement.
- Soin/réanimation, XP et téléportation disponibles par boutons dev ; retour automatique à la maison et restauration de l’équipe après défaite complète.
- Pas de sauvegarde, de serveur ni de joueurs distants. Le rechargement remet à zéro la session. Aucun menu ne suspend les combats.

Ces essais ne tranchent pas les questions ouvertes des sections précédentes et ne définissent pas un nouveau périmètre MVP.
