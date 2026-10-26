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

Le joueur dirige uniquement son **personnage principal**. Hors ultime, seul ce personnage est présent sur le terrain. La **molette de la souris** parcourt les personnages vivants dans les deux sens, avec retour au début de la liste. Les portraits servent aussi de boutons, notamment au tactile. Les touches 1, 2 et 3 ne changent plus de personnage. Hors ultime, le nouveau personnage apparaît à la position actuelle, avec ses propres PV, équipement et délai d’attaque. Un personnage à terre ne peut pas être sélectionné.

### Ultime : réunion de la troupe

- **E** active l’ultime, prêt au début de la session.
- Pendant **30 secondes**, les trois personnages sont présents : le principal contrôlé et les deux autres pilotés par l’IA.
- L’ultime se recharge pendant **5 minutes à partir de son activation** : il reste donc 4 min 30 s de recharge à la fin des 30 secondes de déploiement.
- Une nouvelle pression sur E ne rappelle pas les alliés, ne prolonge pas l’effet et ne relance pas la recharge.
- À l’expiration, les deux compagnons se retirent automatiquement ; le personnage actuellement contrôlé reste présent.
- Le changement de principal reste disponible pendant l’ultime : le contrôle passe au personnage sélectionné à sa position sur le terrain. Les deux autres restent sous IA pour la durée restante.
- Le délai est commun à l’équipe. Changement de personnage, soin, téléportation et défaite ne le remettent pas à zéro. Une défaite complète interrompt le déploiement actif.
- Une pression maintenue ne répète pas l’activation. Un bouton équivalent et les compteurs de durée/recharge sont disponibles dans l’interface.
- Les temps d’ultime suivent le temps écoulé, y compris après une absence de l’onglet. La simulation des déplacements ne rattrape pas l’absence.

La troupe s’articule autour du personnage principal, sans former une file rigide ni recopier ses pas :

- Chaque compagnon choisit sa destination et son chemin, contourne les obstacles et garde un espace personnel.
- Les changements de direction et de vitesse sont progressifs. À l’arrêt, les compagnons se stabilisent au lieu de tourner constamment autour du joueur.
- Le corps à corps approche les ennemis et engage au contact.
- Le personnage à distance conserve une zone de tir et recule lorsqu’un ennemi s’approche trop.
- Le soutien reste en retrait, suit la troupe et aide les alliés.
- Quand le personnage principal s’éloigne, les compagnons abandonnent les combats trop éloignés et se regroupent autour de lui.

Le changement de personnage principal est disponible à la molette et par les portraits, pendant et hors ultime. Les distances, vitesses et règles de priorité précises sont encore des réglages de test.

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

- Trois personnages, un seul actif hors ultime, changement par **molette** ou portraits. **E** réunit la troupe pendant 30 s, toutes les 5 min. Le suivi autonome par rôle pendant l’ultime est décrit en section 5. Les rôles sont fixes dans ce banc d’essai.
- Combat temps réel au clic droit avec visée guidée vers le curseur, animations par rôle et dégâts à l’impact ; soutien IA soignant les alliés vivants. Les compétences et le ciblage définitifs ne sont pas implémentés.
- XP identique pour les trois membres, sac partagé sans capacité maximale et aucun métier.
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
- Attribution des points par niveau, redistribution et bonus des équipements/trophées/familiers. Les cinq points par niveau de la première proposition ne constituent pas encore une règle validée.
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

Dans le prototype, **1 Vitalité = 1 PV maximum**. Équiper ne soigne pas les PV actuels ; retirer un bonus peut les ramener au nouveau maximum. Une montée de niveau conserve les bonus équipés. Les attaques de base prennent l’élément de l’arme et sont multipliées par `1 + caractéristique correspondante / 100`, avec arrondi. Ce calcul s’applique aussi aux compagnons. Les compétences par élément seront travaillées ultérieurement. Les anciennes armes d’essai conservent leur bonus de débogage +5 dégâts ; elles ne sont pas des pièces de panoplie.

### Acquisition

Chaque monstre possède un élément principal, associé à une caractéristique élémentaire. À sa défaite, un tirage de **25 %** peut donner un **noyau de cet élément**, en plus du loot normal/rare existant. Ce taux est un réglage de test ; la Prospection n’intervient pas encore. Le bestiaire expose l’affinité, le noyau et ses chances. Les équipements réels de panoplie ne tombent pas directement sur les monstres. Les générateurs d’équipements d’essai restent des outils dev.

Le noyau mémorise une tranche de dix niveaux : **1–10**, **11–20**, etc., calculée d’après le niveau du monstre. Seule la tranche 1–10 possède actuellement des panoplies, toutes équipables niveau 1. Le curseur du bestiaire ne change pas le niveau des monstres de la carte ni la tranche des noyaux qu’ils donnent.

Les noyaux sont **exclusivement standards**, avec **25 %** de chance par victoire. Aucun noyau chromatique ne peut tomber. Les piles sont séparées par élément et tranche. Cette règle ne retire pas les variantes chromatiques des ressources normales et rares.

### Ouverture au village

Dans la zone d’essai, le village est matérialisé près de la maison. Le joueur doit être dans cette zone pour ouvrir un noyau depuis sa fiche d’inventaire. Aucune monnaie n’est nécessaire.

Une ouverture consomme **un seul noyau** et donne **une pièce aléatoire** de la panoplie de son élément et de sa tranche. Chaque pièce a une probabilité de **1/9** ; les doublons sont possibles. Un noyau donne uniquement une pièce standard. Les armures chromatiques sont obtenues par amélioration à la forge, selon la section 26. Le résultat est ajouté au sac et peut être équipé ; la sélection reste sur la pile de noyaux utilisée. Un noyau d’une tranche non disponible ne peut pas être consommé. Les outils dev permettent de générer les quatre noyaux débutants et de revenir à la maison pour tester la boucle.

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

La fiche des noyaux permet de choisir une quantité entière positive et d’ouvrir un lot au village. Chaque noyau produit un tirage indépendant avec les règles de collection habituelles. La quantité réellement consommée est limitée à la pile disponible ; les tranches indisponibles et les ouvertures hors village ne consomment rien. L’ouverture à l’unité reste accessible.

Après ouverture, la sélection reste sur la pile utilisée et le défilement du sac est conservé. Aucune récompense n’est sélectionnée automatiquement ; quand la pile est épuisée, sa fiche devient vide. **Maj + clic** sur un équipement du sac l’équipe sur le personnage actif, en respectant le niveau requis et en replaçant l’ancien équipement dans le sac.


## 26. Forge et versions chromatiques des panoplies

Borin est le PNJ de la forge du village, accessible avec **F** à proximité. L’onglet Forge affiche les pièces standards possédées dans le sac ou équipées sur les trois personnages et les ressources nécessaires. Les échanges sont bloqués hors de portée du PNJ.

Chacune des neuf pièces des quatre panoplies débutantes possède une version chromatique, soit **36 versions**. La transformation conserve le niveau requis, la panoplie, l’emplacement et toutes les statistiques existantes, et ajoute **+2 Puissance** par pièce (réglage initial). Elle transforme l’objet d’origine sans duplication, sans changer ses PV ni offrir de soin gratuit s’il est équipé. Elle ne peut pas se cumuler sur une pièce déjà chromatique. Les familiers et trophées ne sont pas concernés.

La recette consomme la pièce standard pour sa transformation, **1 ressource normale chromatique, 10 ressources normales standards et 5 ressources rares standards** du monstre associé à l’élément : sanglier/Ronce, luciole/Braise, phalène/Brise, slime/Rosée. Tous les coûts sont validés avant consommation ; aucun ingrédient ne disparaît en cas de manque. Les rares chromatiques restent destinés aux familiers. Aucun or, métier, hasard ou risque d’échec n’est ajouté à cette recette.

La Puissance est prise en compte dans les dégâts du joueur et de ses alliés : la caractéristique de l’élément de l’arme et la Puissance s’additionnent dans le multiplicateur de dégâts. Les autres statistiques des pièces restent identiques.

Chaque pièce chromatique présente une palette distincte, une aura dans ses icônes et des éclats en jeu. Les **neuf pièces chromatiques d’une même panoplie équipées par un seul personnage** activent une aura de déplacement : halo au sol et particules derrière le personnage en mouvement. L’effet n’est pas actif au repos, avec des pièces réparties entre les personnages, une pièce standard ou des panoplies mélangées. L’aura complète reste purement visuelle, sans bonus additionnel.
