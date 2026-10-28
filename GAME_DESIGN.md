# Auroria — Document de conception

Statut : vision de référence en cours de définition. Ce document précède le développement des systèmes décrits. La version jouable actuelle est une zone de développement locale pour essayer les interfaces et les mécaniques ; elle ne dispose pas encore de multijoueur.

Les décisions explicitement définies ci-dessous constituent la cible. Les propositions et questions ouvertes sont identifiées comme telles : elles ne valent pas validation. Le précédent périmètre MVP est abandonné ; aucun plafond de contenu ni ordre de développement n’est fixé pour le moment.

## 1. Vision

Un RPG fantasy coloré en pixel art, en vue **top-down 2D**, jouable dans un navigateur et conçu pour le **multijoueur**. Des joueurs humains et des bots simulant d’autres joueurs partagent les zones du monde.

Le joueur constitue une équipe de trois personnages, explore, combat des monstres, gagne de l’XP et du butin, puis revient à sa maison pour revoir sa composition. Les métiers enrichiront cette progression dans une phase ultérieure.

## 2. Monde partagé et population

- Plusieurs joueurs humains peuvent être présents dans une même zone.
- Des **bots de population** simulent d’autres joueurs : ils se déplacent, constituent leurs propres équipes et participent à la vie du monde. Le détail de leurs activités reste à définir.
- Un bot de population est distinct d’un PNJ de service, comme un marchand, et d’un compagnon appartenant à l’équipe d’un joueur.
- Les bots doivent être identifiables comme tels dans leur fiche ou leur nom, afin de ne pas faire croire qu’une IA est une personne réelle.
- Les villages servent de lieux de rencontre, de commerce et de retour ; les espaces sauvages accueillent les monstres et l’exploration. Le nombre de villages, de biomes et de monstres n’est pas limité par l’ancien MVP.

**À définir :** capacité en joueurs humains par zone, nombre de bots, nombre total de personnages simulés, instances éventuelles et comportement lorsque la zone est pleine. Une capacité exprimée en joueurs doit tenir compte des trois personnages de chaque équipe ; les bots consomment aussi des ressources de simulation.

## 3. Vue, déplacement et lisibilité

- Vue top-down, décors en pixel art, textures raccordables, caméra suivant le personnage contrôlé et profondeur visuelle cohérente.
- Déplacement libre dans huit directions, à vitesse normalisée en diagonale. Les sprites s’orientent selon leur mouvement et les obstacles bloquent les déplacements.
- Commandes de déplacement : flèches, ZQSD ou WASD ; commandes tactiles équivalentes.
- Différencier visuellement le personnage principal, ses alliés, les autres équipes, les bots de population et les monstres.
- Préserver la lisibilité lorsque plusieurs équipes de trois sont proches : noms, silhouettes, effets et barres de vie devront pouvoir être filtrés ou simplifiés.

Les tailles de sprites, vitesses, distances et raccourcis d’action seront fixés après définition des interactions d’équipe et du combat.

## 4. Trois rôles de personnages

Les personnages se répartissent en **trois rôles de combat**. Il s’agit de catégories fonctionnelles, pas du genre ou de l’apparence du personnage.

| Rôle | Fonction générale |
| --- | --- |
| Combattant au corps à corps | Combat au contact et présence sur la ligne de front |
| Soutien | Aide à la survie et à l’efficacité de l’équipe ; soins, protections ou améliorations à préciser selon les classes |
| Distance | Attaques et pression depuis l’arrière, avec une gestion de la portée |

Les classes concrètes, compétences et spécialisations restent à concevoir à l’intérieur de ces rôles. Le rôle de corps à corps n’impose pas à lui seul une classe de tank.

## 5. Équipe de trois et maison

Chaque joueur dispose d’une **équipe de trois personnages** : un combattant au corps à corps, un soutien et un personnage à distance. Le poste flexible est supprimé. Cette taille concerne les personnages d’une équipe, pas la capacité en joueurs humains d’une zone multijoueur, qui reste à définir.

### Recomposition

Le joueur peut **refaire sa composition chaque fois qu’il revient à sa maison**. La maison est le lieu de préparation de l’équipe ; la recomposition ne se fait pas librement au milieu d’un combat ou d’une zone d’exploration.

- L’interface de maison présente les personnages disponibles et les trois postes.
- Une composition incomplète ou ne respectant pas les rôles ne peut pas être validée.
- Un personnage ne peut pas occuper deux postes à la fois.
- Modifier la composition ne supprime pas les personnages retirés ni leur progression et leur équipement.

**À définir :** acquisition de nouveaux personnages, taille de la réserve, coût éventuel d’une recomposition et possibilité d’enregistrer des compositions. Aucun coût ni limite de fréquence n’est imposé à ce stade. La maison pourrait être une instance personnelle accessible depuis le village ; son implantation reste à décider.

### Contrôle de l’équipe

Le joueur dirige uniquement son **personnage principal**. En exploration, seul ce personnage est présent sur le terrain ; en combat, les trois sont déployés. La **molette de la souris** parcourt les personnages vivants dans les deux sens, avec retour au début de la liste. Les portraits servent aussi de boutons, notamment au tactile. Les touches 1, 2 et 3 ne changent plus de personnage. En exploration, le nouveau personnage apparaît à la position actuelle, avec ses propres PV, équipement et délai d’attaque. Un personnage à terre ne peut pas être sélectionné.

### Modes combat et exploration

- Le **combat est actif par défaut** : le principal est contrôlé par le joueur et les deux alliés sont pilotés par l’IA. La vitesse du principal est normale.
- **E** bascule à tout moment en exploration : les alliés sont rappelés et la vitesse du principal augmente de **50 %**, sans autre bonus.
- Une nouvelle pression sur E redéploie les alliés près du principal. Aucune durée limite ni recharge ne s’applique.
- La molette et les portraits permettent de changer de personnage dans les deux modes. En combat, le contrôle passe à la position de l’allié sélectionné ; en exploration, le nouveau principal conserve la position actuelle.
- PV, équipement, charges d’ultimes personnels et recharges de sorts sont conservés à chaque bascule. Le mode reste choisi lors d’un changement de zone ; après une défaite complète, l’équipe revient en combat.
- Le bouton de la barre affiche le mode de destination et un état indique le nombre de personnages et le bonus de vitesse. Les ultimes personnels de chaque classe restent sur T.

La troupe s’articule autour du personnage principal, sans former une file rigide ni recopier ses pas :

- Chaque compagnon choisit sa destination et son chemin, contourne les obstacles et garde un espace personnel.
- Les changements de direction et de vitesse sont progressifs. À l’arrêt, les compagnons se stabilisent au lieu de tourner constamment autour du joueur.
- Le corps à corps approche les ennemis et engage au contact.
- Le personnage à distance conserve une zone de tir et recule lorsqu’un ennemi s’approche trop.
- Le soutien reste en retrait, suit la troupe et aide les alliés.
- Quand le personnage principal s’éloigne, les compagnons abandonnent les combats trop éloignés et se regroupent autour de lui.

Le changement de personnage principal est disponible à la molette et par les portraits, en combat et en exploration. Les distances, vitesses et règles de priorité précises sont encore des réglages de test.

L’IA des compagnons et les bots simulant d’autres joueurs sont deux systèmes distincts, même s’ils peuvent partager des briques de déplacement ou de combat.

## 6. Combat et interactions entre équipes

**Combat en temps réel**, avec contrôle du principal et assistance des deux compagnons pendant l’ultime. Les attaques doivent être lisibles, respecter les obstacles et proposer des comportements différents selon les trois rôles.

Les valeurs de dégâts, ressources, portées, délais, compétences, ciblage, aggro et collisions entre personnages restent à définir. Les anciennes statistiques du guerrier solo ne font plus référence.

En multijoueur, ouvrir un inventaire, une boutique, un dialogue ou quitter l’onglet **ne met pas le monde en pause**. La conduite de l’équipe pendant ces actions, l’absence du joueur et la déconnexion restent à définir ; ouvrir un panneau ne doit pas accorder automatiquement une invulnérabilité.

**À définir pour les combats partagés :** attribution des monstres, participation de plusieurs équipes, partage de l’XP, droit au butin et effet des soins ou protections entre équipes. Les bots suivent les mêmes règles d’accès aux récompenses que les joueurs humains.

## 7. Progression par XP et métiers

### Expérience

La progression comprend un **système d’XP et de niveaux**. Le combat et les activités du monde pourront fournir de l’expérience ; les sources exactes et leurs récompenses restent à définir.

Les décisions suivantes sont encore ouvertes :

- XP propre à chaque personnage, XP de compte/équipe ou combinaison des deux.
- Répartition entre les trois membres et éventuelle progression des personnages en réserve.
- Courbe d’XP, niveau maximum et effets d’une montée de niveau.
- Conditions d’équipement et déblocages de compétences.

Aucun plafond au niveau 3 ni aucune remise à niveau automatique lors d’un changement de composition n’est retenu.

### Métiers : développement ultérieur

Le premier **métier de bûcheron** est implémenté dans le jardin des essais (section 30). Les autres métiers seront développés plus tard. Les autres métiers, leur progression, leurs récoltes et recettes restent à définir. L’XP de métier et son articulation avec l’XP de combat devront être explicitées avant leur implémentation.

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
| Bouclier | 1 |
| Familier | 1 |
| Trophées | 6 |
| **Total** | **16** |

Les deux anneaux occupent des emplacements indépendants. Les six trophées sont des emplacements dédiés, séparés des bijoux et de l’arme. Un emplacement de bouclier distinct de l’arme est ajouté. Aucun emplacement de torse n’est prévu.

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
- Conséquence de la défaite des trois personnages.
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
2. Compétences, ciblage et coopération entre équipes en temps réel.
3. Capacité des zones, population de bots et activités simulées.
4. XP par personnage ou par équipe, progression des réservistes et acquisition des personnages.
5. Mort, réanimation, respawn et déconnexion.
6. Propriété du sac, fonctionnement des équipements et des trophées.
7. Attribution du butin, probabilités et effet des variations chromatiques.
8. Place du PvP, identité des joueurs et architecture serveur.

Il s’agit d’une liste de conception à compléter, pas d’un MVP ni d’un engagement à implémenter tous ces systèmes immédiatement.

## 14. Zone de développement actuelle

Le jardin des essais sert à éprouver les interfaces et les personnages avant de choisir les règles finales. Il comprend une maison, un atelier, quatre monstres de test, trois membres contrôlables et trois bots de promenade explicitement identifiés. Ces bots n’ont pas encore d’équipe autonome.

Les conventions suivantes s’appliquent **uniquement à cette zone** :

- Trois personnages déployés par défaut en combat ; un seul en exploration, avec vitesse +50 %. Changement par **molette** ou portraits. **E** bascule librement entre les modes. Le suivi autonome par rôle est décrit en section 5. Les rôles sont fixes dans ce banc d’essai.
- Combat temps réel au clic droit avec visée guidée vers le curseur, animations par rôle et dégâts à l’impact ; soutien IA soignant les alliés vivants. Les compétences et le ciblage définitifs ne sont pas implémentés.
- XP de base commune aux trois membres, bonus de Sagesse individuel, sac partagé sans capacité maximale et métier de bûcheron partagé.
- Seize emplacements individuels équipables ; coiffe/cape/bouclier visibles et bonus de test de +5 dégâts pour l’arme du personnage contrôlé. Autres statistiques à définir.
- Un objet par victoire : 20 % de loot rare, 10 % de variante chromatique indépendante. Ces taux ne constituent pas un équilibrage validé. Les quatre variantes peuvent aussi être générées manuellement.
- Soin/réanimation, XP et téléportation disponibles par boutons dev ; retour automatique à la maison et restauration de l’équipe après défaite complète.
- Pas de sauvegarde, de serveur ni de joueurs distants. Le rechargement remet à zéro la session. Aucun menu ne suspend les combats.

Ces essais ne tranchent pas les questions ouvertes des sections précédentes et ne définissent pas un nouveau périmètre MVP.

## 15. Présentation du jeu et inventaire

La scène occupe toute la fenêtre du navigateur. Le rendu conserve les proportions du pixel art ; la caméra suit le personnage sur les écrans étroits. Un bouton permet aussi de demander le plein écran natif du navigateur lorsque celui-ci est disponible.

L’interface est superposée à la scène : zone et statut de session en haut, portraits avec PV sur le côté, attaque et ultime avec ses compteurs en bas. L’ancienne colonne latérale permanente et la page de présentation sont supprimées.

**I** ouvre ou ferme l’inventaire ; **Échap**, le bouton Fermer et le clic sur le fond extérieur permettent aussi de le fermer. Un bouton visible permet de l’ouvrir au tactile. Le panneau contient l’équipement du personnage, le sac et, dans la zone de développement, les outils de test. Il est fermé au départ.

Pendant l’ouverture, la molette fait défiler le panneau et ne change pas de personnage. Les commandes directes de déplacement et d’attaque sont suspendues pour éviter les actions accidentelles dans les menus ; le monde, les compagnons et les délais d’ultime continuent. La fermeture ne conserve pas une touche de déplacement bloquée. Les gestes de molette sont filtrés pour éviter plusieurs changements involontaires sur un seul cran ou un court geste de pavé tactile.

## 16. Attaque au clic droit et visée guidée

- Le **clic droit** déclenche une attaque, à la place d’Espace. Le menu contextuel est désactivé uniquement sur la scène de jeu. Un clic déclenche un coup, soumis au délai d’attaque.
- Le curseur définit la direction. La visée accroche les monstres proches du curseur, avec une légère assistance dans sa direction ; elle ne choisit pas systématiquement le monstre le plus proche du joueur.
- Un réticule et une ligne de visée montrent l’accroche, la portée et les obstacles. La conversion du curseur utilise la caméra réelle, quelle que soit la taille de fenêtre. Les PNJ, bots et alliés ne sont pas des cibles offensives.
- Le corps à corps exécute un coup de taille orienté, avec une brève préparation ; une cible sortie de portée ou de l’arc avant l’impact évite le coup.
- Le distance tire une flèche, le soutien lance un orbe. Une cible accrochée guide le projectile pendant son trajet limité ; les obstacles arrêtent le projectile et les dégâts arrivent à l’impact.
- Les compagnons IA utilisent les animations et impacts différés correspondant à leur rôle. Les impacts affichent particules, recul et nombre de dégâts.
- Le bouton d’attaque demeure disponible au tactile. Sans curseur actif, il sélectionne automatiquement un monstre proche à portée. L’inventaire ouvert bloque l’attaque directe.

Les distances d’accroche, portées et vitesses de projectile sont des réglages d’essai, à équilibrer avec les futures classes.

## 17. Disposition de l’inventaire

Le panneau rassemble l’équipement et le sac dans une même vue :

- En bas : les **six trophées alignés horizontalement**.
- Au centre : aperçu du personnage. À gauche, de haut en bas : **amulette, anneau 1, anneau 2, arme**. À droite : **coiffe, cape, ceinture, bottes**. Le bouclier et le familier disposent de cases sous l’aperçu, au-dessus des trophées.
- À droite : grille du sac, filtre Tous/Équipements/Ressources et compteur d’or.
- En bas : fiche de l’objet sélectionné, indiquant son nom, son type, sa variante, sa quantité et ses effets actuellement implémentés.

Un clic sélectionne un objet ou un emplacement sans modifier l’équipement. La fiche propose **Équiper** pour un équipement du sac, ou **Retirer** pour un objet équipé. Un emplacement vide affiche une explication ; une ressource n’offre pas d’action d’équipement. Les trois personnages sont consultables dans le panneau, avec leur équipement individuel.

Le bouclier et le familier portent le total à **16 emplacements**, dont les six trophées. Il peut être généré dans les outils dev, équipé et retiré indépendamment de l’arme. Il est visible dans l’aperçu et sur le personnage en jeu. Ses statistiques défensives restent à définir. Le familier est équipable depuis le sac et visible dans l’aperçu et en jeu. Les familiers de l’animalerie suivent les règles de la section 24.

L’inventaire n’a pas de grand en-tête : le personnage et les objets occupent directement le haut du panneau. Les commandes Équipement & sac, Outils dev et Fermer sont compactées dans la barre du bas pour éviter le défilement de la vue principale. Seule la grille du sac défile si elle contient beaucoup d’objets.

## 18. Bestiaire et consultation par niveau

Le bestiaire est accessible par **B**, un bouton visible et un onglet du panneau. Il recense toutes les espèces actuellement implémentées : slime, sanglier, luciole ardente et phalène. La fiche comprend une illustration, la famille, l’habitat, une description, les PV, les dégâts, le délai d’attaque, la vitesse de poursuite, le rayon d’engagement, le délai de réapparition, l’XP et l’or.

Un curseur de **niveau 1 à 100** recalcule les statistiques consultées, sans modifier les monstres présents ni leurs récompenses. Le niveau consulté est conservé lors du changement de fiche et pendant la session. Il s’agit d’une plage de consultation d’essai, pas d’une décision de plafond pour la progression des personnages.

Croissance provisoire, calculée à partir des valeurs du niveau 1, avec `n = niveau − 1` :

- PV : `arrondi(PV de base × (1 + 0,12 × n))`.
- Dégâts : `arrondi(dégâts de base × (1 + 0,08 × n))`.
- XP : `arrondi(XP de base × (1 + 0,10 × n))`.
- Or : `arrondi(or de base × (1 + 0,05 × n))`.
- Vitesse, distances et délais fixes pour le moment.

La fiche expose les quatre résultats du tirage de butin et leurs probabilités effectives : normal standard **72 %**, normal chromatique **8 %**, rare standard **18 %**, rare chromatique **2 %**. Ces valeurs correspondent au tirage de test existant : 20 % rare et 10 % chromatique indépendant, un objet par victoire. Le niveau ne modifie pas ces chances pour le moment.

Le catalogue de monstres est partagé entre le combat et le bestiaire ; les données ne doivent pas être dupliquées dans l’interface. Le monde continue pendant la consultation. Les statistiques et règles de croissance restent des paramètres d’essai.

## 19. Caractéristiques des personnages

Le système s’inspire de Dofus en version simplifiée. Les règles ci-dessous remplacent la première proposition de caractéristiques. Elles décrivent la cible de conception ; les bonus de Vitalité et de dégâts élémentaires des premières panoplies sont implémentés en section 20. Sagesse, Prospection, Puissance, résistances et critiques restent à implémenter.

### Caractéristiques principales

| Caractéristique | Effet unique |
| --- | --- |
| Vitalité | Augmente les PV maximum |
| Force | Augmente les dégâts de Terre |
| Intelligence | Augmente les dégâts de Feu |
| Agilité | Augmente les dégâts d’Air |
| Chance | Augmente les dégâts d’Eau |
| Sagesse | Augmente l’XP gagnée |

Vitalité, Force, Intelligence, Agilité et Chance ne donnent aucun bonus secondaire : ni poids transportable, ni soins, ni critique, ni esquive, ni prospection. La Sagesse renforce uniquement le gain d’XP ; elle ne renforce pas les boucliers ou les améliorations d’alliés. Les caractéristiques élémentaires ne sont pas liées de façon obligatoire aux rôles corps à corps, soutien ou distance.

### Statistiques complémentaires

| Statistique | Fonction |
| --- | --- |
| Puissance | Augmente les dégâts des quatre éléments sans augmenter directement les caractéristiques élémentaires |
| Résistance Terre | Réduit les dégâts de Terre reçus |
| Résistance Feu | Réduit les dégâts de Feu reçus |
| Résistance Air | Réduit les dégâts d’Air reçus |
| Résistance Eau | Réduit les dégâts d’Eau reçus |
| Critique | Augmente la probabilité de coup critique |
| Prospection | Améliore les chances d’obtenir du butin |

La Prospection est indépendante de la Chance. Aucun bonus de vitesse de déplacement ou de réduction des délais de compétences n’est retenu dans ce système de caractéristiques. Les vitesses et délais techniques du prototype restent des paramètres de combat, pas des statistiques à augmenter avec l’équipement.

### Réglages et compétences à définir plus tard

- Coefficients de PV, dégâts, XP et prospection, valeurs de départ, limites et règles d’arrondi.
- La répartition de cinq points par montée de niveau et la redistribution à la fontaine sont définies en section 28. Les autres équilibrages des équipements/trophées/familiers pourront être affinés.
- Intensité des critiques, compétences concernées et plafonds des critiques/résistances. Les plafonds évoqués dans la première proposition ne sont pas fixés.
- Formule de Prospection, prise en compte individuelle ou par équipe, effets sur le loot normal, rare et chromatique, et articulation avec le tirage actuel d’un objet par victoire.
- Conditions d’attribution de l’XP et de la Prospection aux personnages actifs, compagnons et réservistes.
- Compétences des classes pour chaque élément, ainsi que les règles de soins, protections et améliorations : conception ultérieure. Aucun bonus de soin n’est attribué implicitement à l’Intelligence.

Les statistiques et chances affichées dans le bestiaire restent les valeurs de base des monstres. Les futurs bonus de Sagesse et de Prospection devront être distingués de ces valeurs et ne pas modifier silencieusement les probabilités de base affichées.

## 20. Panoplies débutantes et noyaux élémentaires

### Quatre panoplies niveau 1

| Panoplie | Élément | Caractéristique principale | Monstre source actuel |
| --- | --- | --- | --- |
| Ronce | Terre | Force | Sanglier |
| Braise | Feu | Intelligence | Luciole ardente |
| Brise | Air | Agilité | Phalène |
| Rosée | Eau | Chance | Slime |

Chaque panoplie comporte **neuf pièces équipables dès le niveau 1** : coiffe, cape, ceinture, bottes, amulette, anneau 1, anneau 2, arme et bouclier. Familiers et trophées ne font pas partie de ces panoplies. Tous les rôles peuvent porter les quatre panoplies. Il n’y a pas de bonus conditionnel de panoplie complète pour le moment.

Réglages initiaux par pièce :

- Arme : **+5** dans la caractéristique élémentaire et **+1 Vitalité**.
- Bouclier : **+2** dans la caractéristique élémentaire et **+5 Vitalité**.
- Chacune des sept autres pièces : **+3** dans la caractéristique élémentaire et **+3 Vitalité**.
- Ensemble des neuf pièces : **+28** dans la caractéristique et **+27 Vitalité**.

Dans le prototype, **1 Vitalité = 1 PV maximum**. Équiper ne soigne pas les PV actuels ; retirer un bonus peut les ramener au nouveau maximum. Une montée de niveau conserve les bonus équipés. Les sorts prennent leur propre élément et sont multipliés par `1 + (caractéristique de cet élément + Puissance) / 100`, avec arrondi. Ce calcul s’applique aussi aux compagnons. Les sorts par élément sont implémentés selon la section 27 et le catalogue `docs/SPELLS.md`. Les anciennes armes d’essai sans statistiques ne donnent pas de bonus aux sorts.

### Acquisition

Chaque monstre possède un élément principal, associé à une caractéristique élémentaire. À sa défaite, un tirage de **25 %** peut donner un **noyau de cet élément**, en plus du loot normal/rare existant. Ce taux est un réglage de test ; la Prospection n’intervient pas encore. Le bestiaire expose l’affinité, le noyau et ses chances. Les équipements réels de panoplie ne tombent pas directement sur les monstres. Les générateurs d’équipements d’essai restent des outils dev.

Le noyau mémorise une tranche de dix niveaux : **1–10**, **11–20**, etc., calculée d’après le niveau du monstre. Seule la tranche 1–10 possède actuellement des panoplies, toutes équipables niveau 1. Le curseur du bestiaire ne change pas le niveau des monstres de la carte ni la tranche des noyaux qu’ils donnent.

Les noyaux sont **exclusivement standards**, avec **25 %** de chance par victoire. Aucun noyau chromatique ne peut tomber. Les piles sont séparées par élément et tranche. Cette règle ne retire pas les variantes chromatiques des ressources normales et rares.

### Ouverture des noyaux partout

Les noyaux peuvent être ouverts depuis leur fiche d’inventaire partout, en combat comme en exploration et dans le tutoriel. Aucune proximité de maison ni monnaie n’est nécessaire.

Une ouverture consomme **un seul noyau** et donne **une pièce aléatoire** de la panoplie de son élément et de sa tranche. Chaque pièce a une probabilité de **1/9** ; les doublons sont possibles. Un noyau donne uniquement une pièce standard. Les armures chromatiques sont obtenues par amélioration à la forge, selon la section 26. Le résultat est ajouté au sac et peut être équipé ; la sélection reste sur la pile de noyaux utilisée. Un noyau d’une tranche non disponible ne peut pas être consommé. Les outils dev permettent de générer les quatre noyaux débutants pour tester la boucle partout.

## 21. Direction graphique : village pastoral

Premier passage inspiré des références de village en pixel art : herbe jaune-verte nuancée, terre sableuse, bois miel, façades de pierre et colombages, toitures d’ardoise chaude et eau turquoise. Les végétaux utilisent des silhouettes irrégulières, des troncs clairs et des feuillages en plusieurs tons. Fleurs, caisses, tonneaux, bancs et panneaux ancrent la zone dans un village habité.

Les contours et les ombres restent modérés ; les chemins ont des raccords continus et des bordures usées plutôt qu’une grille visible. Les personnages et les monstres gardent des silhouettes distinctes, des orientations lisibles et leurs animations de combat. Le tri vertical permet l’occultation par les arbres ; une transparence de proximité aide à retrouver le personnage principal. Cette étape porte sur le rendu du jardin existant, avant une éventuelle refonte de sa géométrie et de son contenu.

## 22. Cohérence du terrain et des objets

Le rendu de terrain et la navigation partagent une seule définition de la terre, de l’eau, des chemins et des emprises solides. Les textures sont périodiques, avec une phase commune dans le repère du monde. Les chemins et clairières forment une surface unifiée ; seules ses bordures extérieures sont visibles. Les routes rejoignent une jonction ou une destination, sans branche isolée.

Chaque arbre et objet possède un ancrage au sol contrôlé sur la terre ferme. Les racines ne sont jamais placées dans l’eau ni sur un chemin. Les objets solides et les clôtures bloquent les déplacements selon leur emprise, et leur affichage suit la profondeur de cet ancrage. Les textures ne servent pas à déduire les collisions.

Le pixel art est présenté avec une échelle entière, une caméra calée au pixel et une conversion de visée identique au rendu. Ces règles remplacent le placement libre des objets et le tracé indépendant des bordures du premier passage graphique. Voir `docs/RENDERING.md` pour les conventions d’implémentation et les tests.

## 23. Identité visuelle des objets et provenance des chromatiques

Chaque ressource possède un dessin lié à son nom. La variation chromatique garde cette silhouette tout en changeant de palette et en ajoutant une marque brillante ; elle reste identifiée par le texte de l’objet.

Les pièces de panoplie partagent un vocabulaire visuel :

| Panoplie | Motifs et matières |
| --- | --- |
| Ronce / Force | Feuilles, épines, cuir et bois, vert olive et laiton |
| Braise / Intelligence | Flammes, pointes, métal chaud, cuivre et ambre |
| Brise / Agilité | Plumes, ailes, formes effilées, sauge et ivoire |
| Rosée / Chance | Gouttes, vagues, capuchon fluide, bleu et argent |

Les neuf catégories restent reconnaissables entre les panoplies. Les icônes sont partagées entre le sac, l’équipement, la fiche de détail et le bestiaire. Coiffes, capes, armes et boucliers reprennent le thème dans l’aperçu ; les sprites du monde affichent les couleurs, coiffes et accessoires équipés. Ces changements ne modifient pas les bonus des objets.

**Suppression des noyaux chromatiques :** ni le tirage sur les monstres ni l’ouverture d’un noyau ne peuvent donner un équipement chromatique. Même un ancien marqueur chromatique sur un noyau ne doit pas être transmis à sa récompense. Le taux global de noyau reste 25 %.

Les équipements chromatiques relèvent de **l’artisanat** : amélioration chez Borin selon la section 26. La progression générale des métiers reste à concevoir. Les ressources normales/rares et leurs variations chromatiques conservent leurs tirages actuels.


## 24. Animalerie, certificats et progression des familiers

L’animalerie du village est tenue par **Nola**, PNJ accessible avec **F** à proximité. Ses quatre quêtes correspondent aux panoplies Ronce, Braise, Brise et Rosée. Accepter une quête donne un **certificat d’adoption**, conservé dans le sac. Une fois les neuf pièces distinctes obtenues par ouverture de noyaux, le certificat s’échange contre le familier associé. Les équipements ne sont pas consommés. L’historique compte aussi les pièces obtenues avant l’acceptation, indépendamment du personnage qui les porte. Une quête et une récompense par panoplie dans la session.

| Élément / panoplie | Familier | Monstre associé | Aliment accepté |
| --- | --- | --- | --- |
| Terre / Ronce | Roncinet | Sanglier | Défense ancienne rare chromatique |
| Feu / Braise | Flammèche | Luciole ardente | Étincelle vive rare chromatique |
| Air / Brise | Zéphyr | Phalène | Aile de zéphyr rare chromatique |
| Eau / Rosée | Gélutin | Slime | Cœur de gelée rare chromatique |

Le familier commence au niveau 1. Le nourrissage consomme une seule ressource rare chromatique du monstre associé et accorde **10 XP**. Le seuil du prochain niveau vaut **niveau actuel × 10 XP**. Le plafond provisoire est **20** ; au plafond, aucune nourriture n’est consommée. Le bonus vaut **niveau + 1** dans la caractéristique principale de l’élément, sans effet secondaire. La progression reste attachée à l’objet lors des échanges d’équipement. Le familier est un compagnon visuel passif, sans attaque autonome.

Les ressources **normales chromatiques** sont réservées au craft des armures chromatiques. Elles ne nourrissent aucun familier. Leur recette d’amélioration à la forge est décrite en section 26. La sauvegarde persistante et la validation serveur ne font pas partie de cette étape : collections, certificats et familiers appartiennent à la session locale.


## 25. Utilisation en quantité et équipement rapide

La fiche des noyaux permet de choisir une quantité entière positive et d’ouvrir un lot partout. Chaque noyau produit un tirage indépendant avec les règles de collection habituelles. La quantité réellement consommée est limitée à la pile disponible ; les tranches indisponibles ne consomment rien. L’ouverture à l’unité reste accessible.

Après ouverture, la sélection reste sur la pile utilisée et le défilement du sac est conservé. Aucune récompense n’est sélectionnée automatiquement ; quand la pile est épuisée, sa fiche devient vide. **Maj + clic** sur un équipement du sac l’équipe sur le personnage actif, en respectant le niveau requis et en replaçant l’ancien équipement dans le sac.


## 26. Forge et versions chromatiques des panoplies

Borin est le PNJ de la forge du village, accessible avec **F** à proximité. L’onglet Forge affiche les pièces standards possédées dans le sac ou équipées sur les trois personnages et les ressources nécessaires. Les échanges sont bloqués hors de portée du PNJ.

Chacune des neuf pièces des quatre panoplies débutantes possède une version chromatique, soit **36 versions**. La transformation conserve le niveau requis, la panoplie, l’emplacement et toutes les statistiques existantes, et ajoute **+2 Puissance** par pièce (réglage initial). Elle transforme l’objet d’origine sans duplication, sans changer ses PV ni offrir de soin gratuit s’il est équipé. Elle ne peut pas se cumuler sur une pièce déjà chromatique. Les familiers et trophées ne sont pas concernés.

La recette consomme la pièce standard pour sa transformation, **1 ressource normale chromatique, 10 ressources normales standards, 5 ressources rares standards et 5 Planches de frêne (niveau 1)** du monstre associé à l’élément : sanglier/Ronce, luciole/Braise, phalène/Brise, slime/Rosée. Tous les coûts sont validés avant consommation ; aucun ingrédient ne disparaît en cas de manque. Les rares chromatiques restent destinés aux familiers. Aucun or, niveau de forgeron, hasard ou risque d’échec n’est ajouté à cette recette.

La Puissance est prise en compte dans les dégâts du joueur et de ses alliés : la caractéristique de l’élément du sort et la Puissance s’additionnent dans le multiplicateur de dégâts. Les autres statistiques des pièces restent identiques.

Chaque pièce chromatique présente une palette distincte, une aura dans ses icônes et des éclats en jeu. Les **neuf pièces chromatiques d’une même panoplie équipées par un seul personnage** activent une aura de déplacement : halo au sol et particules derrière le personnage en mouvement. L’effet n’est pas actif au repos, avec des pièces réparties entre les personnages, une pièce standard ou des panoplies mélangées. L’aura complète reste purement visuelle, sans bonus additionnel.


## 27. Classes, équipement des sorts et ultimes personnels

Les trois rôles deviennent trois classes jouables : **Combattant, Soutien et Distance**. Chacune dispose de trois sorts normaux et un ultime dans chacun des quatre éléments, soit **48 sorts**. Le catalogue des effets, valeurs, portées et recharges est documenté dans `docs/SPELLS.md` et défini dans `src/data/spells.js`.

Le grimoire **K** permet d’équiper **trois sorts normaux distincts et un ultime personnel de la classe**, en mélangeant librement les éléments. Aucun élément de spécialisation exclusif n’est imposé. Chaque personnage conserve sa propre barre. Les changements sont libres dans le jardin des essais, mais ne réinitialisent ni recharges, ni jauge. Les autres classes ne sont pas équipables sur ce personnage.

**Commandes : clic droit / R / C / T.** A est conservé pour le déplacement WASD ; il n’est donc pas utilisé comme raccourci de sort. Les boutons de la barre offrent les mêmes actions au tactile. Le Trait perforant peut être chargé par maintien du clic droit puis relâchement. **E bascule entre combat et exploration**, sans durée ni recharge, indépendamment des ultimes personnels sur T.

Les dégâts élémentaires valent `arrondi(base du sort × [1 + (caractéristique de l’élément du sort + Puissance) / 100])`. L’arme ne convertit pas l’élément. Les soins et valeurs de bouclier élémentaires utilisent la même échelle ; aucune caractéristique ne reçoit un effet secondaire automatique. Les résistances élémentaires, si une cible en possède, sont appliquées ensuite. Les combos précisent leurs coefficients additionnels.

Un délai commun de **0,35 s** sépare les sorts. Chaque sort conserve en plus sa recharge propre par identifiant. Chaque personnage possède une jauge personnelle **0–100**, initialement vide, alimentée par dégâts, soins effectifs et absorption. Un ultime consomme 100 et impose une recharge de **20 s** ; les gains de jauge sont bloqués pendant les **8 s** suivantes. Soigner sans PV manquants ne remplit pas la jauge. Les outils dev proposent de la charger pour les essais.

Les alliés contrôlés par l’IA utilisent la même barre, les mêmes formules et les mêmes règles de recharge. Les soins nécessaires sont prioritaires ; les comportements prennent notamment en compte Fractures, Braises, Ancrage et flaques. Le suivi naturel et les distances propres au rôle sont conservés. Un personnage hors terrain n’agit plus et ses zones, événements et projectiles sont interrompus.

Les animations distinguent impacts, projectiles, boucliers, zones persistantes et avertissements de zones différées, avec une couleur par élément. Les déplacements et tirs respectent les collisions du monde. Le prototype reste local, sans sauvegarde persistante ni autorité multijoueur ; les chiffres constituent des réglages initiaux.


## 28. Répartition des caractéristiques et déblocages par niveau

Chaque personnage commence au **niveau 1 avec zéro point**. Toute montée de niveau accorde **5 points de caractéristiques**, conservés jusqu’à dépense. Les gains multiples accordent cinq points par niveau traversé. L’interface **P** permet d’investir une quantité entière positive à **1 point = +1** en Vitalité, Force, Intelligence, Agilité, Chance ou Sagesse. Aucune dépense ne dépasse le budget ni ne vise une statistique secondaire. Les points investis et les bonus d’équipement restent distingués dans l’affichage et additionnés dans les calculs.

Vitalité : +1 PV maximum par point, sans soin gratuit. Les caractéristiques élémentaires alimentent la formule des sorts avec la Puissance. Sagesse : bonus individuel d’XP selon `floor(base × (1 + Sagesse / 100))`, équipements inclus, sans effet sur le butin. Les gains de PV de base par niveau du prototype restent inchangés.

La **Fontaine du renouveau** est un objet interactif solide dans le village, relié au chemin existant. **F** ou son bouton ouvre les caractéristiques. À proximité, une réinitialisation gratuite restitue tous les points investis du personnage actif. Elle ne modifie ni équipements, ni niveaux, ni XP, ni sorts appris, ni jauges ou recharges. Les PV sont seulement limités au nouveau maximum. Réinitialiser à distance ou réclamer deux fois les mêmes points est impossible.

Les **12 sorts normaux actuels de chaque classe** se débloquent automatiquement : premier Terre au niveau 1, premier Feu au 2, premier Air au 3, premier Eau au 4, puis deuxièmes sorts aux niveaux 5–8 et troisièmes aux niveaux 9–12. Seul le premier Terre est équipé au départ. Les emplacements normaux libres sont remplis à l’apprentissage, sans remplacer les choix déjà faits. Les éléments restent librement combinables parmi les sorts acquis ; le grimoire et le moteur de combat vérifient les conditions.

Chaque palier de **5 niveaux** accorde un **choix d’ultime individuel**. Le joueur choisit un ultime de sa classe dans le grimoire ; chaque ultime ne peut être appris qu’une fois. Le premier appris remplit l’emplacement d’ultime vide, les suivants n’en remplacent pas le contenu. Les choix sont conservés jusqu’à dépense, y compris après acquisition des quatre ultimes actuels. Les ultimes appris restent acquis à la fontaine. Le déploiement E reste indépendant et disponible au niveau 1.

Le catalogue n’ajoute pas de sorts normaux fictifs après le niveau 12. Les prochains contenus pourront exploiter les niveaux et choix supplémentaires. Les outils d’XP et de charge restent réservés au banc d’essai local ; aucune sauvegarde persistante ou validation serveur n’est ajoutée dans cette étape.


## 29. Opportunités de clic gauche

Chaque impact positif du personnage principal sur un ennemi survivant peut créer une **cible bonus** avec une probabilité de **20 %**. Les dégâts reçus par l’ennemi sont mémorisés après les calculs de caractéristiques, Puissance et résistances, y compris les impacts des alliés. Un coup plus récent met à jour la valeur à copier, sans renouveler la durée d’une cible déjà présente.

La cible apparaît à environ 26 pixels du centre visuel de l’ennemi, sur une position valide et visible en ligne directe. Elle suit l’ennemi, dure **1 seconde** et affiche un indicateur circulaire de durée. Son centre possède un rayon cliquable de **6 pixels du monde**. Le clic gauche utilise la même conversion caméra/écran que le rendu ; le clic droit conserve son rôle de sort principal. Les boutons de l’interface ne sont pas des cibles bonus.

Un clic réussi consomme l’opportunité puis inflige exactement la dernière valeur de dégâts mémorisée, sans nouveau multiplicateur ni nouvelle résistance. Il ne dépense pas de recharge de sort, ne déclenche pas d’effet secondaire de sort et ne génère pas de nouvelle opportunité. Les dégâts effectifs contribuent à la jauge personnelle avec les plafonds et blocages habituels. Un ennemi tué par ce bonus suit la boucle normale de récompenses et de réapparition.

Une seule cible existe par ennemi, avec **4 secondes** entre apparitions possibles, et **3 cibles simultanées** au maximum. Une cible expirée, derrière un obstacle ou portée par un ennemi mort disparaît. La réapparition du monstre efface les anciennes données. Le personnage principal à terre et les menus ouverts empêchent l’activation ; le temps réel continue à écouler la durée. Les cibles non cliquées n’infligent aucun dégât.


## 30. Premier métier : bûcheron

Le métier est partagé par la troupe d’un joueur, démarre au niveau 1 et possède sa propre XP. Trois essences sont disponibles sur les arbres existants : **Frêne niveau 1**, **Châtaignier niveau 5**, **Noyer niveau 10**. Le catalogue actuel s’arrête à ces trois essences ; les futures pourront prolonger les paliers de cinq niveaux. Aucun bois ou produit de scierie chromatique n’existe.

Un clic gauche sur une couronne ou un tronc sélectionne l’arbre. Le personnage rejoint un emplacement de coupe libre par un chemin respectant les obstacles, puis démarre une animation de hache et une barre de progression. L’action dure `max(1, 4 / (1 + 0,06 × (niveau − 1)))` secondes : quatre secondes au départ, plancher d’une seconde hors bonus du mini-jeu. Elle utilise le temps de simulation actif et ne récolte pas hors ligne. La durée est déterminée au début de l’action.

Une coupe achevée donne un bois et **15 / 25 / 40 XP métier**, selon l’essence. Le seuil d’un niveau métier est **30 × niveau actuel**, avec conservation de l’XP restante et possibilité de franchir plusieurs niveaux lors d’un lot de fabrication. Les caractéristiques, la Sagesse et le niveau des personnages ne modifient pas cette XP.

Une action de récolte est unique et interruptible : déplacement manuel, sort réussi, cible bonus de combat réussie, dégâts subis, changement de principal, téléportation, menu ou mort l’annulent sans bois ni XP. Le métier reste identique lors d’un changement de personnage. Il n’y a ni hache à acheter ni récolte automatique en boucle dans cette première étape.

L’arbre coupé devient une **souche solide**, en conservant son emprise au sol. Il repousse après **30 s pour le Frêne, 45 s pour le Châtaignier, 60 s pour le Noyer**. La repousse suit le temps écoulé réel et ne déclenche pas une nouvelle coupe. Les arbres gardent une identité et un état propres à la session.

La scierie est un nouvel objet interactif du village, relié aux chemins existants. **F** à proximité ou le panneau **Métiers (L)** donne accès aux recettes : **2 bois d’une essence → 1 planche de cette essence**, au même niveau requis que la récolte. La fabrication peut se faire en lot et rapporte **10 XP bûcheron par planche**. Le niveau, la proximité et tous les ingrédients sont vérifiés avant toute consommation.

Toutes les améliorations chromatiques d’équipement à la forge demandent **5 Planches de frêne de niveau 1** en supplément des ingrédients existants. Une planche d’un autre niveau, du bois brut ou une ressource chromatique ne se substitue pas à cette exigence. L’amélioration d’armure ne donne pas d’XP bûcheron ; seule la fabrication des planches en donne.

Les essences disposent de palettes distinctes, les ressources et planches de leurs propres icônes, et les interactions affichent le niveau requis ou le temps de repousse. Le panneau montre niveau, XP, vitesse de coupe, disponibilités et stocks. Le prototype reste local et sans sauvegarde persistante ; un serveur partagé devra porter les états d’arbres dans l’étape multijoueur.


## 31. Cible bonus de récolte et durée commune

Les cibles de combat et de bûcheron utilisent désormais une **durée commune de 1 seconde**. Une cible de récolte est proposée une seule fois par coupe, après 25 % de la progression, à une position autour de la couronne de l’arbre. Elle possède le même rayon de clic de six pixels du monde et un anneau indiquant le temps restant.

Le clic gauche donne priorité à la cible de récolte active avant la sélection ordinaire d’un arbre. Une réussite ajoute **25 % de la durée totale de coupe** à la progression et consomme immédiatement la cible. Il n’accorde directement ni bois ni XP. La récolte finale conserve ses récompenses normales. L’expiration ou un clic raté n’ajoutent aucune pénalité, et une deuxième cible n’est pas proposée pendant la même coupe. Fin ou interruption de la coupe suppriment l’opportunité. Aux niveaux où la coupe est très courte, la fin de l’action peut faire disparaître la cible avant sa seconde complète.


## 32. Musique, ambiance et retours sonores

Le jardin possède une musique rétro originale, douce et entraînante, à **104 BPM**, en boucle de **16 mesures** avec une seconde phrase plus aérée. Une basse triangulaire, des arpèges, une mélodie carrée adoucie et des percussions légères composent le thème.

Le son s’active après une interaction utilisateur. Le bouton **🔊** donne accès aux volumes général, musique et effets, ainsi qu’à la coupure générale. Les préférences audio sont mémorisées séparément du jeu. Le changement de volume et les pauses comportent des fondus courts. Un onglet masqué suspend la restitution sonore ; le retour reprend la même ambiance sans empiler plusieurs musiques.

Les dégâts réellement appliqués déclenchent un impact adapté à la source : lame, arc ou magie. Les sorts magiques distinguent leurs éléments. L’origine sonore est conservée par les projectiles, zones et événements différés ; une compétence lancée ensuite ne change pas le bruit d’un ancien tir. Les soins effectifs, dégâts reçus, ultimes et cibles bonus ajoutent des retours courts et distincts. Les déplacements, coups de hache, récoltes et fabrications apportent des bruitages plus discrets.

Le personnage principal est prioritaire dans les impacts simultanés. Une atténuation selon la distance, un placement stéréo modéré, une limitation des répétitions et une compression douce maintiennent la lisibilité. Les sons ne participent pas aux calculs de combat et utilisent un générateur distinct du hasard du butin. Le moteur reste facultatif : une indisponibilité du son ne bloque aucune règle du jeu.

## 33. Zone d’initiation

Toute nouvelle session locale commence sur l’**Île des premiers pas**, à un point d’apparition praticable devant le pavillon d’accueil d’Iris. Cette carte est indépendante du Jardin des essais : terrain, empreintes solides, chemins, décor et guide sont propres à l’île. Les activités du village ne sont pas accessibles à des coordonnées équivalentes sur l’île.

La place centrale accueille la découverte des trois personnages et du déplacement. La cour d’entraînement, reliée par un chemin, reçoit le slime uniquement lors du combat guidé. La porte orientale rejoint le village après les étapes de bestiaire, d’équipement et de métiers : bouton de fin de tutoriel ou F près de la porte. Passer le guide rejoint également le village. Les transitions suppriment projectiles et zones d’effet en cours et repositionnent la troupe en conservant le mode choisi. Toute progression acquise reste conservée.

## 34. Initiation aux butins et aux métiers

Après les sorts, le joueur consulte le Slime et utilise la barre de niveau du bestiaire. Le slime d’entraînement accorde une fois un noyau Eau garanti ; les monstres ordinaires conservent leur taux indépendant de 25 %. L’ouverture est possible partout, y compris sur l’île. Le guide attend l’ouverture du noyau reçu et l’équipement réel de sa pièce aléatoire. Les ressources chromatiques et la fabrication d’armures sont expliquées, sans donner une armure chromatique gratuitement.

La présentation des métiers passe par le panneau L, puis par deux coupes réelles de frêne dans le bosquet et la fabrication d’une planche à la scierie de l’île. La récolte et le craft utilisent les règles habituelles et donnent leur XP métier. Seules les actions réalisées aux étapes correspondantes valident cette pratique ; aucun simple ajout d’objet en sac ne remplace une récolte ou un craft. Les niveaux métier débloquent Frêne (1), Châtaignier (5), Noyer (10). La sortie vers le village est disponible au terme de ce parcours ; le joueur peut toujours passer le guide.

## 35. Fragments de noyau et recyclage

Borin reprend les pièces normales élémentaires, du sac ou équipées, contre un fragment de même élément et de même tranche de niveau. Les armes, bijoux et boucliers sont acceptés ; les pièces chromatiques, trophées et familiers sont exclus. Une pièce équipée recyclée est retirée et ses bonus cessent immédiatement, sans soin. Les collections déjà découvertes restent mémorisées.

Dix fragments du même élément et de la même tranche de dix niveaux donnent un noyau correspondant, près de Borin, sans or ni hasard. Le stock est validé avant consommation ; les fragments d’éléments ou de tranches différents ne se mélangent pas. Une remise produit un seul fragment par pièce, sans duplication. Le noyau s’ouvre partout avec les règles habituelles de tirage de panoplie.

## 36. Couleurs des classes et éclairage d’ambiance

Les trois rôles se distinguent par un code couleur sur le gabarit du sprite original : rouge pour le combattant, violet pour le soutien, vert pour le distance. Aucune armure élargie ni accessoire de classe ajouté ne doit déformer ce corps commun ou gêner les vrais équipements. Les ancrages, les petits marqueurs d’arme et les dimensions d’origine sont conservés. Les équipements restent responsables de leurs formes et de leurs ornements ; les portraits et l’inventaire reprennent le sprite du monde. Aucune statistique de combat ne change.

Un éclairage golden hour, actif par défaut, réchauffe les hautes lumières et ajoute ombres longues, rayons doux, léger halo et vignette. Le traitement se fait sur la scène native avant agrandissement, sans lisser les pixels ; les interfaces HTML restent hors du shader. Le bouton ☀ permet de désactiver l’effet. Le choix est mémorisé sur le navigateur, les rayons respectent la réduction du mouvement et une restitution 2D prend le relais sans WebGL.

## 37. Monstres : préparation, zone annoncée et attaque élémentaire

Toutes les attaques des quatre espèces passent par une préparation visible au sol. Leur élément est Terre (sanglier), Eau (slime), Feu (luciole), Air (phalène). Les zones indiquent la forme dangereuse, l’élément et la progression ; leur destination ne suit pas le joueur après son verrouillage. Un même assaut ne touche chaque personnage qu’une fois. Les résistances élémentaires s’appliquent avant les protections, avec les plafonds provisoires de simulation de −50 à 80 %.

| Espèce | Préparation | Attaque | Dégâts de base au niveau 1 | Repos après attaque |
| --- | --- | --- | --- | --- |
| Sanglier | 1,1 s | Charge rectiligne, couloir de rayon 12, vitesse 260 | 12 Terre | 2,4 s |
| Slime | 1,2 s | Bond de 0,65 s, zone d’atterrissage de rayon 24 | 10 Eau | 2,8 s |
| Luciole | 1,2 s | Tornade mobile de rayon 14, vitesse 95 | 6 Feu | 3 s |
| Phalène | 1,2 s | Tornade mobile de rayon 14, vitesse 105 | 6 Air | 3 s |

Le slime vise le membre vivant et déployé le plus éloigné du centre moyen de la troupe. En cas d’égalité, il choisit le plus éloigné de lui. Sa cible doit être à portée ; le cercle reste à sa position annoncée pendant le saut. Le slime du tutoriel prévient 1,5 s et inflige seulement 2 dégâts. Les insectes varient leurs cibles parmi les personnages à portée et visibles. La portée maximale d’une attaque est 145 pour la charge, 155 pour le bond et les tornades.

Charges et tornades utilisent des collisions balayées pour éviter de traverser un personnage entre deux images. Les trajectoires terrestres s’arrêtent aux obstacles ; le saut peut les survoler mais n’atterrit que sur une position praticable. Une préparation ou une charge peut être interrompue par enracinement ; un bond déjà en l’air rejoint son atterrissage annoncé. Les attaques du lanceur mort et celles de l’ancienne zone sont supprimées. Les temps avancent avec la simulation physique, sans rattrapage d’attaque à la reprise d’un onglet masqué.

## 38. Marais de Gelée — absorption et fleurs éponges

Le passage sud-est du village relie une carte de marais distincte au village avec F à proximité. Le marais possède des mares non praticables, des nénuphars décoratifs sur l’eau, des roseaux, de grands champignons et trois fleurs éponges sur des positions accessibles. Les chemins contournent les mares ; un passage à l’ouest permet le retour. Un guide initial explique le gimmick et peut être rouvert avec ✿. Les outils dev permettent un accès direct après le tutoriel.

Cinq Slimes des marais de niveau 3 sont présents. Cette espèce Eau figure dans le bestiaire et partage les butins du Slime : Gelée, Cœur de gelée, variantes chromatiques et noyau Eau de tranche 1–10. Ses statistiques de taille 1 découlent de sa fiche (124 PV, 11 dégâts de bond au niveau 3). Un slime commence à la taille 2 pour illustrer la mécanique.

| Taille | PV au niveau 3 | Dégâts du saut | Rayon | Préparation |
| --- | --- | --- | --- | --- |
| 1 | 124 | 11 Eau | 24 | 1,2 s |
| 2 | 161 | 14 Eau | 30 | 1,5 s |
| 3 | 198 | 17 Eau | 36 | 1,8 s |

L’atterrissage traite les flaques déjà présentes avant d’en déposer une nouvelle pendant 18 s. Une flaque absorbée donne une taille, jusqu’au maximum de trois. La croissance conserve la proportion de vie à l’arrondi et ne modifie les valeurs que pour l’attaque suivante : le cercle et les dégâts d’une attaque annoncée restent verrouillés. À la taille maximale, l’absorption consomme toujours la flaque sans augmenter les PV. Les flaques sont limitées à 32 et ne donnent aucun objet d’inventaire.

Un saut raté par un slime de taille 2 ou 3 le déséquilibre pendant 2,5 s et augmente de 50 % les dégâts reçus. Une attaque bloquée par un bouclier reste un saut ayant touché. Le bonus des cibles dorées ne multiplie pas une seconde fois une valeur déjà amplifiée. À la réapparition, le slime retrouve sa taille de départ et sa vie correspondante.

- Un slime qui atterrit à moins de **20 pixels d’une fleur éponge prête** gagne **une taille**, jusqu’à trois, en conservant son pourcentage de PV. Le nectar est prioritaire sur les flaques : une seule croissance par saut. La fleur se recharge en **10 s**. Elle ne nettoie ni ne bloque les flaques ; un saut y dépose toujours de la gelée. Le bref éclat violet signale son activation. Un gros slime qui rate son saut reste vulnérable.

Les états du village et du marais sont conservés séparément dans la session, avec les mêmes personnages et le même sac. Les flaques et recharges des fleurs utilisent l’horloge de simulation partagée. Les attaques sont annulées lors d’un trajet et un bond interrompu reprend un point de départ terrestre valide. Une défaite dans le marais ramène l’équipe soignée à son entrée. Les services du village restent accessibles dans leur propre zone.

Un saut raté par un slime de taille 2 ou 3 provoque une scission : le parent perd une taille (3 → 2, 2 → 1), conserve son pourcentage de PV et devient vulnérable. Un nouveau slime de taille 1 apparaît à côté sur un terrain praticable, au même niveau. Ce saut ne permet pas de regrossir immédiatement grâce à une flaque ou une fleur. Les slimes issus de scission combattent et donnent leurs récompenses habituelles, mais ne réapparaissent pas après leur mort.

## 39. Crevasse des profondeurs — scissions et fusions

Une cascade au sud-est des marais se jette dans un gouffre marin. F près de la lèvre déclenche un saut suivi d’une chute de 1,1 s ; le déplacement et les attaques sont suspendus durant la traversée. La troupe arrive ensemble sur une berge sûre d’une carte souterraine distincte. Une remontée à l’ouest ramène au bord de la cascade. Personnages, mode combat/exploration, équipement, sac et progression sont conservés.

La carte représente une grotte humide : parois sombres, roches naturelles, stalagmites, bassins non praticables, cascades et végétation luminescente. Les matériaux sont périodiques, le terrain et ses collisions partagent les mêmes distances signées. L’éclairage est froid et souterrain, sans soleil doré.

La population initiale compte sept slimes de niveau 5, pour dix unités de taille. Deux espèces sont distinguées par leur couleur et leur élément : abyssal (Eau, bleu) et limon (Terre, brun). Le rayon d’engagement est de 240 px, la portée de bond de 210 px, la préparation de 0,85 / 0,97 / 1,09 s selon la taille, et le repos de 1,1 s. Tous les bonds restent annoncés avant les dégâts.

Un saut raté retire une taille à un slime de taille 2 ou 3 et crée un slime de taille 1 du même niveau, sur une position praticable voisine. Le parent conserve son pourcentage de PV et devient vulnérable 1,5 s (+50 % de dégâts reçus). Les tailles 1 ne se divisent pas.

Deux slimes à moins de 30 px, à portée visuelle, sans attaque, immobilisation ou vulnérabilité en cours, peuvent fusionner si la somme de leurs tailles ne dépasse pas trois. L’annonce dure une seconde et suspend leurs bonds. Éloigner les partenaires, les immobiliser ou en éliminer un annule la fusion. La transformation conserve leur pourcentage de PV combiné, leur masse et ne déclenche aucune récompense. Après une scission ou fusion, cinq secondes interdisent la prochaine fusion. Une fusion de deux éléments produit un slime mixte alternant Eau et Terre à chaque bond ; ses descendants conservent cette propriété.

Chaque espèce possède ses ressources normale et rare, leurs variations chromatiques et les noyaux de son élément. Les ressources des profondeurs sont distinctes des ingrédients des recettes débutantes actuelles. Les fiches du bestiaire expliquent les transformations et permettent de consulter les statistiques de taille 1 à chaque niveau.

Les ennemis de cette expédition n’ont pas de réapparition individuelle : une population complètement vaincue est renouvelée à la prochaine visite. Sinon, le monde reste conservé en session. La masse ne peut donc pas croître indéfiniment à force de fusionner et de se diviser. La défaite soigne la troupe à l’entrée sans perte d’or ni de sac. Un changement de zone annule les préparations de fusion et les attaques en cours avant de sauvegarder le monde quitté.

## 40. Gorgelimon, Cœur du gouffre

Boss facultatif de niveau 8 de la Crevasse des profondeurs, au sud-est, à proximité de la cascade orientale. Il reste endormi jusqu’à une interaction F à moins de 65 px ou une attaque du personnage principal à proximité. Les compagnons ignorent le boss endormi et concentrent leurs attaques sur les aspects lorsque le cœur est protégé. Le joueur peut nettoyer les slimes ordinaires avant de commencer le défi.

**Direction artistique.** Gelée massive bleu pétrole et turquoise, carapace asymétrique de limon brun, crêtes de pierre humides et cœur cristallin fendu d’or. Les yeux s’illuminent au réveil. En scission, la silhouette se réduit à un cœur protégé entre des fragments de carapace ; des liens élémentaires le relient à ses aspects. En exposition, le cœur pâlit et projette des éclats dorés. La phase finale réchauffe ses yeux et fissures. La taille des personnages reste inchangée.

**Statistiques initiales.** 773 PV au niveau 8 ; la vie de base au niveau 1 vaut 420 et utilise la progression habituelle (+12 % par niveau). Dégâts de base 11 avec +8 % par niveau, puis multiplicateur propre à l’attaque. Pas de résistance cachée ou de vulnérabilité à un élément imposé : chaque composition peut exploiter ses ouvertures.

| Attaque | Élément | Annonce | Effet et réponse du joueur |
| --- | --- | --- | --- |
| Marée d’impact | Eau | 1,4 s, cercle de 40 px | Bond sur la cible isolée, dégâts ×1,5. Esquiver toute la troupe expose le cœur 2 s (+50 % de dégâts reçus). |
| Ruée de limon | Terre | 1,35 s, couloir de 21 px de demi-largeur | Charge à 180 px/s, dégâts ×1,4 ; sortir latéralement du couloir. |
| Éboulement du gouffre | Terre | 1,6 s, cercles de 27 px | Positions de chaque personnage figées à l’annonce, dégâts ×1,25, au plus une touche par personnage. Se déplacer avant l’impact ; un enracinement interrompt la préparation. |

Les attaques suivent ce cycle. Les spécifications sont figées lors de l’annonce, y compris la durée du vol et la vitesse, pour éviter qu’un changement vers l’attaque suivante ne modifie l’attaque en cours. Le repos est de 1,8 s. La dernière phase réduit les annonces à 1,05 / 1 / 1,2 s et le repos à 1,25 s ; toutes les zones restent visibles avant les dégâts.

**Scission de la carapace.** À 70 % et 35 % de vie, une seule fois par seuil, l’attaque courante est interrompue et deux aspects Eau et Terre de taille 2 apparaissent sur des positions voisines praticables. Chaque aspect dispose de 45 % de la vie de base d’un slime normal de même niveau, avant son multiplicateur de taille. Les scissions des aspects conservent cette fragilité et leur appartenance au boss. Ils suivent les règles de fusion de la zone entre eux, jamais avec les monstres ordinaires.

Le cœur est invulnérable pendant cette séquence, jusqu’à 12 secondes. Éliminer tous les aspects et descendants déclenche immédiatement une exposition de 5 secondes, avec +50 % de dégâts reçus et une pause des attaques. En cas d’échec, la masse survivante est réabsorbée : 4 % des PV maximum par unité de taille, jusqu’à 16 %, sans dépasser la vie maximum. Les transformations ne créent pas de masse supplémentaire. Aucune récompense n’est donnée pour une absorption ; un aspect tué donne son butin habituel. La copie de dégâts des cibles bonus n’applique pas une seconde fois la vulnérabilité.

**Lisibilité et cycle de vie.** Barre de boss avec marqueurs 70/35 %, état du cœur, compte à rebours et indication de rage. Cercles Eau bleus, couloir et éboulements Terre dorés. Le joueur peut revenir sur la berge : si aucun membre vivant déployé ne reste dans un rayon de 200 px du repaire, le boss vivant retourne au sommeil, récupère toute sa vie et supprime ses aspects sans récompense. Même réinitialisation après une défaite ou un changement de zone. Un boss mort ne réapparaît pas individuellement.

**Récompenses.** XP et or du boss, une ressource normale ou rare (Éclat de carapace abyssale / Cœur de Gorgelimon, avec variation chromatique indépendante), et un noyau Eau ainsi qu’un noyau Terre garantis. La récompense de victoire est attribuée une seule fois. La fiche du bestiaire permet de consulter ses statistiques par niveau et explique les trois attaques et les deux scissions. Le boss et ses ressources ont des illustrations propres.

## 41. Pluie battante dans les Marais de Gelée

La météo des marais est une pluie battante permanente, limitée à cette carte : gouttes obliques, éclaboussures et rides sur l’eau, palette sous ciel couvert et bruit de pluie stéréo. Les avertissements d’attaque et cibles bonus conservent leur priorité visuelle. La pluie n’ajoute aucun malus, bonus de dégâts ou changement de déplacement. Elle respecte la réduction des animations du système ; son volume suit les bruitages et la sourdine. L’ambiance sonore s’estompe lors des trajets vers le village ou les profondeurs.

## 42. Interface tactile

L’interface compacte s’active sur les écrans étroits ou avec pointeur tactile principal. Un carré ☰ en haut à droite déploie les panneaux du jeu dans une grille de boutons. La sélection ferme le menu et ouvre le panneau choisi ; toucher à côté ou presser Échap ferme le menu. L’ouverture remet les entrées de mouvement à zéro. Les portraits compacts restent accessibles en haut à gauche pour changer de personnage.

Un joystick fixe en bas à gauche remplace les flèches. Sa zone morte évite la dérive ; son inclinaison contrôle progressivement la vitesse jusqu’à la vitesse du mode courant. Le vecteur reste borné pour ne pas accélérer en diagonale. La capture du pointeur permet de dépasser le socle sans perdre le geste. Relâchement, annulation tactile, perte de visibilité, changement de disposition et ouverture d’un panneau annulent le mouvement.

À droite, le bouton principal Base est entouré des trois autres emplacements : Sort 2, Sort 3 et Ultime. Les sorts partent à la pression tactile et utilisent l’assistance de ciblage du système de combat. Le second doigt peut lancer un sort pendant que le premier maintient le joystick. Le clic synthétique suivant un toucher ne doit jamais lancer deux actions. Recharges, disponibilité, jauge et restrictions de niveau restent partagées avec les commandes classiques. Le bouton Explorer / Combat se trouve près des sorts.

La disposition est prévue pour les deux orientations, respecte les zones de sécurité de l’écran et laisse les dialogues défiler normalement. Les commandes clavier, souris et la disposition large restent disponibles sur ordinateur.

## 43. Cimes de Schiste — carapace et collisions

Zone montagneuse reliée au nord-est du village par F, également accessible depuis les outils dev. Trois plateaux rocheux sont reliés par des ponts de bois au-dessus de crevasses. Les rochers et parois servant de points d’impact sont solides, visibles et distincts des précipices. Le col au sud-ouest permet le retour. La pluie reste propre aux marais ; les cimes conservent l’éclairage extérieur et les préférences habituelles. Les commandes téléphone et le guide de zone restent accessibles par le menu compact.

**Slime de schiste.** Élément Terre, niveau 5, 133 PV, corps ambré entouré de plaques de schiste gris et de veines ocres. Sa carapace réduit tous les dégâts de 40 %, avec un minimum de 1 dégât. Les fissures suivent visuellement ses blessures ; la réduction reste constante jusqu’à la rupture. Les copies de dégâts des cibles dorées utilisent directement le dernier montant réellement reçu et ne réappliquent ni réduction ni vulnérabilité.

**Roulade de schiste.** Annonce Terre de 1,3 s, demi-largeur 12 px, portée 170 px, vitesse 170 px/s, repos 2,1 s, dégâts de base ×1,4. Le slime vise le membre vivant déployé le plus proche, verrouille sa direction et dépasse la position ciblée. La trajectoire est coupée au premier obstacle ou bord inaccessible ; le couloir visible correspond à cet arrêt. Chaque personnage ne peut subir qu’une touche par charge.

**Briser la carapace.** Une collision avec un gros rocher ou une paroi détruit la protection et expose le cœur pendant 3 s : le slime ne lance aucune nouvelle attaque et reçoit +50 % de dégâts. Il conserve ensuite sa forme sans armure jusqu’à sa mort, sans réparation intermédiaire. Les collisions suivantes ne créent pas une nouvelle rupture. Un arrêt au bord du vide ou une interruption par enracinement ne détruit pas la carapace. Les points d’impact sont revalidés si le slime est repoussé pendant la préparation.

La zone se concentre sur cette interaction avec le terrain. Les éboulements, filons de réparation et ondes de résonance proposés restent réservés à d’autres monstres. Il n’y a pas de scission ou de fusion pour le slime de schiste.

**Progression et persistance.** Ressources normale et rare : Éclat de schiste et Cœur d’ambre, chacune avec variation chromatique selon les probabilités usuelles. Le noyau bonus est Terre et suit la tranche de niveau du monstre. Pas de nouvelle recette débutante dans cette zone. Les blessures et carapaces restent conservées lors des allers-retours pendant la session ; chaque réapparition après 18 s restaure les PV et la carapace au point d’origine. Une défaite ramène la troupe soignée au col sans perte d’or ni d’objets.
