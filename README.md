# Auroria

RPG fantasy en pixel art sur navigateur. La vision multijoueur, les rôles, les équipes et les objets sont décrits dans [GAME_DESIGN.md](GAME_DESIGN.md).

## Version actuelle : jardin des essais

Une **zone de développement locale**, pour tester les interfaces et les premières mécaniques avant leur intégration au monde partagé :

- Maison, atelier et aire de combat dans une petite carte top-down.
- Équipe de trois : corps à corps, soutien et distance. Aucun poste flexible.
- **Molette de souris** ou portraits pour sélectionner le principal. Le **mode combat est actif par défaut** : trois personnages, deux alliés IA, vitesse normale. **E** bascule librement en **exploration** : un personnage et **+50 % de vitesse**. Aucune durée ni recharge. Les compagnons suivent leurs propres chemins, gardent leurs distances selon leur rôle et se regroupent autour du principal.
- **48 sorts**, grimoire avec mélange des éléments par classe, trois sorts actifs et un ultime personnel par personnage.
- Trois bots de promenade identifiés comme tels. Ils ne représentent pas des connexions humaines et ne possèdent pas encore leurs propres équipes.
- Slime, sanglier, luciole ardente et phalène : dégâts, recul, effets, récompenses, réapparition et retour à la maison après défaite complète.
- Sac de test partagé, équipement individuel de 16 emplacements, équipement/retrait d’objets et variantes de loot dans des piles distinctes.
- Outils dev : bouton **Obtenir les 4 panoplies maximisées** (36 pièces chromatiques Terre/Feu/Air/Eau, arme et bouclier inclus, niveau 1), téléportation, soin/réanimation, XP, génération d’équipements et des quatre variantes de loot, attaque automatique.
- Clavier et commandes tactiles, interface responsive, journal d’événements.

**Pas de serveur multijoueur ni de sauvegarde dans cette zone.** Recharger réinitialise la session. Les règles de contrôle de l’équipe, les statistiques, les probabilités de loot, la capacité du sac et les gains d’XP sont des conventions de test, pas des décisions définitives de game design. Tous les outils sont volontairement accessibles sans limite.

## Démarrer

Prérequis : Node.js 24 et npm.

```sh
npm ci
npm run dev
```

Ouvrir l’adresse affichée par Vite. Cliquer sur la scène pour activer le clavier : flèches, ZQSD ou WASD pour bouger, **clic droit**, **R** et **C** pour les trois sorts équipés, **T** pour l’ultime personnel, **K** pour le grimoire, **molette** pour changer de personnage, **E** pour activer l’ultime (une pression, sans répétition en maintenant la touche). Le bouton d’attaque reste disponible au tactile ; soin et téléportation sont dans les outils dev. Sélectionner un portrait change le personnage contrôlé. La durée et la recharge de l’ultime sont affichées dans la barre d’actions ; changement de personnage, soin et téléportation ne réinitialisent pas ces délais.

Le jeu remplit la fenêtre, avec portraits, PV et actions en surimpression. **I** ou le bouton **Inventaire** ouvre le panneau d’équipement et de sac ; **I**, **Échap** ou le bouton Fermer le referme. Les anciens raccourcis 1/2/3 sont retirés. La molette dans le panneau fait défiler son contenu sans changer de personnage. Le monde et l’ultime continuent pendant les menus. Un bouton ⛶ active le plein écran natif si disponible.

L’inventaire rassemble l’aperçu du personnage au centre, les **six trophées alignés en bas**, les bijoux à gauche (amulette et deux anneaux), l’arme en bas à gauche et les vêtements à droite (coiffe, cape, ceinture, bottes) et la grille du sac à droite. La fiche de l’objet sélectionné est placée en bas. Le sac propose un filtre Équipements/Ressources ; cliquer sur un objet ne l’équipe pas immédiatement.

Dans **Outils dev**, générer un équipement, puis revenir à **Équipement & sac**, sélectionner l’objet et choisir **Équiper** dans sa fiche. Sélectionner ensuite son emplacement équipé permet de **Retirer** l’objet. Les 16 emplacements comprennent un **bouclier** indépendant de l’arme et un **familier**. Le familier de test reste disponible ; les quatre familiers de l’animalerie ont une progression et un bonus élémentaire. Coiffe, cape et bouclier modifient l’apparence ; les statistiques des équipements augmentent les sorts selon leur élément et la Puissance.


## Vérification

```sh
npm test
npm run build
npm run preview
```

Les tests couvrent déplacements, modes combat/exploration, composition à trois, butins, noyaux ouverts partout, recyclage et échanges, équipement, XP, sorts, compagnons, collisions, tutoriel et métiers. Les parcours navigateur vérifient aussi les commandes, panneaux et petits écrans.

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

Les monstres peuvent donner un noyau en plus de leur ressource : slime → Eau, sanglier → Terre, luciole ardente → Feu, phalène → Air. Taux d’essai : **25 %**, uniquement des noyaux standards. Le noyau conserve l’élément et la tranche de dix niveaux du monstre.

**Où que vous soyez**, ouvrir **I**, sélectionner le noyau dans le sac puis cliquer **Ouvrir le noyau**. Un noyau est consommé pour une pièce aléatoire du bon élément et de la bonne tranche ; neuf choix équiprobables, doublons possibles. Les noyaux donnent uniquement des pièces standards. Les versions chromatiques sont fabriquées à la forge de Borin. Les autres tranches n’ont pas encore d’équipements et leurs noyaux ne peuvent pas être consommés.

Les pièces donnent Vitalité et caractéristique élémentaire, sans bonus de panoplie supplémentaire. Dans le prototype, 1 Vitalité donne 1 PV maximum ; les dégâts des sorts utilisent leur propre élément, sa caractéristique correspondante et la Puissance (+1 % par point). Les PV actuels ne sont pas restaurés par un échange d’équipement. Les sorts élémentaires sont disponibles dans le grimoire (K). Les outils dev proposent les quatre noyaux et la téléportation **Maison**, pour tester sans attendre un drop.

## Direction graphique — premier passage

Le jardin adopte une palette douce et chaleureuse : herbe dorée, chemins de terre aux bordures irrégulières, maison en pierre et colombages avec toit d’ardoise, bouleaux, buissons, fleurs, clôtures et objets de village. Les personnages et les quatre espèces de monstres ont des sprites ombrés et plus détaillés.

Le décor est assemblé dans `src/rendering/environment.js`, à partir des données de carte, des textures et de l’atlas de sprites, puis réutilisé. Les arbres sont triés avec les personnages selon leur profondeur et deviennent partiellement transparents près du principal. Les sprites animés sont isolés dans `src/rendering/actors.js`. La caméra et les règles de déplacement/combat conservent leurs coordonnées actuelles.

## Rendu et carte : base commune

Le terrain, les chemins et les collisions reposent désormais sur les mêmes données dans `src/world/map.js`. Les textures d’herbe, terre, eau et pierre sont périodiques et échantillonnées dans le repère du monde. Les chemins sont fusionnés avant de calculer leurs bords : les intersections ne portent plus les contours des branches superposées.

Les arbres et les autres objets sont vérifiés sur la terre ferme avant le rendu ; les pieds d’arbres et les objets solides bloquent les déplacements. Les sprites sont mis en cache avec un ancrage explicite. La caméra utilise un zoom et une origine entiers pour stabiliser le pixel art. Les points de contrôle et les conventions sont détaillés dans [docs/RENDERING.md](docs/RENDERING.md).

## Illustrations des objets

Les huit ressources possèdent des silhouettes propres : gelée, cœur, soies de sanglier, défense ancienne, poussière de braise, étincelle, écaille et aile. Leurs variantes chromatiques conservent la silhouette, avec une palette distincte et une marque brillante.

Les 36 pièces des quatre panoplies utilisent les thèmes de leur élément : Ronce/Force (feuilles, épines et bois), Braise/Intelligence (flammes et métal chaud), Brise/Agilité (plumes et formes légères), Rosée/Chance (gouttes et vagues). Les dessins sont partagés par l’inventaire et le bestiaire dans `src/ui/item-art.js` ; l’aperçu et les sprites équipés reprennent leurs couleurs et leurs coiffes.

Les noyaux chromatiques sont supprimés du tirage et du bestiaire. Les ressources chromatiques continuent à tomber. Les versions chromatiques s’obtiennent à la forge, jamais à l’ouverture d’un noyau.


## Animalerie et adoption

Nola accueille le joueur à l’animalerie du village : **F** à proximité ou bouton **Parler à Nola**. L’onglet Animalerie permet aussi de consulter les quêtes à distance, mais les échanges exigent sa présence.

Chaque panoplie dispose d’une quête et d’un certificat remis à l’acceptation. Obtenir les **neuf pièces distinctes** dans les noyaux débloque l’échange du certificat contre le familier ; les équipements restent au joueur. Les pièces obtenues avant la quête comptent aussi, même réparties entre les personnages. Une adoption par panoplie et par session.

| Panoplie | Familier | Nourriture rare chromatique |
| --- | --- | --- |
| Ronce | Roncinet | Défense ancienne du sanglier |
| Braise | Flammèche | Étincelle vive de la luciole |
| Brise | Zéphyr | Aile de zéphyr de la phalène |
| Rosée | Gélutin | Cœur d’eau du slime |

Sélectionner le familier dans le sac ou son emplacement équipé, puis **Nourrir**. Une ressource donne 10 XP ; passer au niveau suivant demande `niveau × 10` XP. Le plafond de test est 20, avec un bonus de `niveau + 1` dans la caractéristique de son élément. Les ressources normales chromatiques ne sont pas consommées : elles servent à l’amélioration chromatique des armures chez Borin. Toute progression reste locale à la session actuelle.


### Raccourcis et ouverture en quantité

Dans le sac, **Maj + clic** sur un équipement l’équipe directement sur le personnage actif, avec les mêmes restrictions de niveau que le bouton Équiper. Le matériel remplacé revient dans le sac.

La fiche d’un noyau propose une **quantité** réglable (par exemple 20), puis **Ouvrir la quantité**. Chaque noyau effectue son propre tirage. Le bouton **Ouvrir le noyau** garde l’ouverture à l’unité. La sélection et le défilement du sac restent sur la pile de noyaux tant qu’elle existe ; les récompenses ne sont plus sélectionnées automatiquement. Une pile épuisée laisse la fiche vide.


## Forge chromatique

**Borin** travaille à la forge, dans l’ancien atelier. Approchez-vous et appuyez sur **F**, ou utilisez le bouton **Parler à Borin**. L’onglet **Forge** permet de consulter les recettes à distance ; les améliorations exigent sa présence. La téléportation **Forge** des outils dev facilite les essais.

Les **36 pièces** des quatre panoplies débutantes ont une version chromatique, y compris bijoux, arme et bouclier. Choisir une pièce du sac ou de l’équipement d’un personnage. L’amélioration transforme cette même pièce, garde toutes ses statistiques et ajoute **+2 Puissance**. Elle ne peut être appliquée qu’une fois, sans coût en or ni risque d’échec.

Coût par pièce, avec les ressources du monstre associé à la panoplie :

- La pièce standard à transformer.
- **1 ressource normale chromatique**.
- **10 ressources normales standards**.
- **5 ressources rares standards**.
- **5 Planches de frêne (niveau 1)**, fabriquées à la scierie.

Les ingrédients ne sont consommés que si la recette entière est disponible. Les ressources rares chromatiques, utilisées pour nourrir les familiers, sont conservées. La Puissance renforce les dégâts de tous les éléments selon la même règle que la caractéristique élémentaire : `dégâts de base × (1 + (caractéristique + Puissance) / 100)`.

Les pièces possèdent une palette chromatique, une aura dans l’inventaire et des éclats sur le personnage. Porter les **neuf pièces chromatiques du même ensemble sur un personnage** déclenche une aura avec particules lorsqu’il se déplace ; elle disparaît au repos ou si une pièce manque. Les essais couvrent aussi les recettes, la consommation exacte, l’équipement conservé et l’activation de l’aura.


## Classes, sorts et grimoire

**K**, le bouton Grimoire ou son onglet ouvre le catalogue du personnage actif : **Combattant**, **Soutien** ou **Distance**. Chaque classe possède **12 sorts normaux et 4 ultimes** (Terre, Feu, Air et Eau), soit **48 sorts** au total. Ils se débloquent désormais par niveau ; les ultimes nécessitent un choix de progression.

Choisir un des **3 emplacements normaux**, puis un sort débloqué de cette classe. Les éléments se mélangent librement : par exemple Frappe de faille Terre, Entaille ardente Feu et Garde d’écume Eau. Le quatrième emplacement accueille un ultime personnel de n’importe quel élément de cette même classe. Les sorts équipés restent propres à chaque personnage. Un même sort ne peut pas occuper deux emplacements.

- **Clic droit** : sort 1 ; maintenir puis relâcher charge le Trait perforant (charge maximale après 1 s).
- **R** : sort 2 ; **C** : sort 3 ; **T** : ultime personnel.
- **E** : basculer combat/exploration, sans recharge. Combat : trois personnages ; exploration : un personnage et vitesse +50 %.
- Les quatre boutons de la barre permettent aussi de lancer les sorts au tactile. Ils affichent recharges et jauge personnelle.

Les dégâts se calculent avec **l’élément du sort**, indépendamment de l’arme : `arrondi(base × (1 + (caractéristique de cet élément + Puissance) / 100))`. Force pour Terre, Intelligence pour Feu, Agilité pour Air et Chance pour Eau. Les soins et les valeurs de bouclier utilisent la même formule. Le grimoire affiche les valeurs de base et après équipements. Les résistances de la cible sont appliquées après ce calcul lorsqu’elles sont présentes.

La jauge personnelle commence à zéro et monte sur les dégâts, soins effectifs et absorptions en combat. Un ultime coûte 100 points et conserve une recharge de 20 s ; aucun gain de jauge pendant les 8 s suivant son activation. Les temps de recharge sont attachés au sort et ne sont pas réinitialisés en changeant de barre ou de personnage. L’outil dev **Charger les ultimes personnels** facilite les essais.

Les alliés déployés utilisent **leurs sorts équipés**, donnent priorité aux soins nécessaires, préparent leurs combinaisons et conservent leur déplacement par rôle. Les zones, événements et projectiles d’un personnage rappelé cessent ; le monde continue pendant le grimoire, mais les commandes directes y sont suspendues. L’état reste local à la session.

Le catalogue et les règles détaillées sont dans [docs/SPELLS.md](docs/SPELLS.md). Les valeurs constituent un premier équilibrage jouable.


## Caractéristiques et apprentissage

**P**, le bouton **Carac.** ou l’onglet **Caractéristiques** ouvre la répartition du personnage actif. Chaque montée de niveau rapporte **5 points**, y compris lors de plusieurs niveaux gagnés d’un coup. Le niveau 1 commence sans point à dépenser. Les budgets sont individuels et les points non dépensés sont conservés.

Un point acheté vaut **+1** en Vitalité, Force, Intelligence, Agilité, Chance ou Sagesse. Choisir la quantité à investir puis la caractéristique. Les totaux combinent les points et les équipements. La Vitalité augmente les PV maximum sans soigner ; les quatre caractéristiques élémentaires augmentent les sorts de leur élément avec la Puissance. La Sagesse augmente l’XP reçue : `floor(XP de base × (1 + Sagesse / 100))`, individuellement. Puissance, résistances, critique et prospection restent des bonus d’équipement, sans achat de points dans cet écran.

La **Fontaine du renouveau**, au village à droite de l’animalerie, s’ouvre avec **F** à proximité ou le bouton d’interaction. Elle permet de réinitialiser gratuitement les points du personnage actif. Tous les points investis sont remboursés ; les équipements, niveaux, XP, sorts appris, jauge et recharges restent conservés. Le retrait de Vitalité limite les PV au nouveau maximum et ne soigne pas. Un raccourci **Fontaine** figure dans les outils dev.

Les sorts normaux s’obtiennent automatiquement dans **K** :

| Niveaux | Déblocages |
| --- | --- |
| 1, 2, 3, 4 | Premier Terre, premier Feu, premier Air, premier Eau |
| 5, 6, 7, 8 | Deuxième Terre, deuxième Feu, deuxième Air, deuxième Eau |
| 9, 10, 11, 12 | Troisième Terre, troisième Feu, troisième Air, troisième Eau |

Au départ, seul le premier Terre est équipé. Les nouveaux sorts remplissent les emplacements libres, sans remplacer une barre personnalisée. Les cartes verrouillées affichent leur niveau requis, et le combat vérifie aussi le déblocage.

Aux **niveaux 5, 10, 15, 20, puis tous les 5 niveaux**, chaque personnage reçoit un choix d’ultime. Dans le quatrième emplacement du grimoire, choisir **Débloquer cet ultime**. Le premier est automatiquement équipé ; les suivants sont disponibles sans remplacer l’ultime choisi. Aucun doublon ni ultime d’une autre classe n’est possible. Les choix non utilisés restent en réserve, y compris une fois les quatre ultimes actuels acquis. Le catalogue actuel s’arrête à 12 sorts normaux par classe ; aucun nouveau sort normal n’est inventé après le niveau 12.


## Cibles bonus au clic gauche

Quand le personnage contrôlé inflige des dégâts, il a **20 % de chance** de faire apparaître une petite cible dorée autour de l’ennemi survivant. Elle suit ses déplacements et reste visible **1 seconde**, avec un cercle indiquant le temps restant. **Clic gauche** sur son centre, ou toucher sur mobile, inflige les dégâts de la **dernière attaque reçue au moment du clic**. Un impact plus récent, y compris d’un allié, met donc cette valeur à jour.

Les dégâts sont copiés après les calculs de caractéristiques, Puissance et résistances : aucun de ces multiplicateurs n’est appliqué une seconde fois. Le bonus ne consomme pas la recharge d’un sort et contribue normalement à la jauge personnelle selon les PV réellement retirés. Il ne déclenche ni une autre cible ni les effets secondaires des sorts. Un bonus fatal donne les récompenses normales, une seule fois.

Un clic raté ne fait rien. Une cible ne s’utilise qu’une fois ; il ne peut y en avoir qu’une par ennemi et trois simultanément. Le délai d’apparition minimal par ennemi est de 4 secondes. Les cibles expirent aussi pendant les menus, dont l’ouverture bloque leur activation. Obstacles, mort et réapparition nettoient les opportunités invalides.


## Bûcheron et scierie

**L**, le bouton **Métiers** ou son onglet ouvre le premier métier, partagé par la troupe et indépendant de l’XP des personnages. Les douze arbres existants sont récoltables et portent trois essences :

| Essence | Niveau métier | XP par coupe | Repousse |
| --- | --- | --- | --- |
| Frêne | 1 | 15 | 30 s |
| Châtaignier | 5 | 25 | 45 s |
| Noyer | 10 | 40 | 60 s |

**Clic gauche sur un arbre** : le personnage rejoint un emplacement libre près du tronc, puis le coupe avec une animation de hache, des copeaux et une barre de progression. Le panneau Métiers propose aussi **Rejoindre et couper**, utile au tactile. Une coupe achevée donne **1 bois** et de l’XP métier. L’arbre devient une souche solide puis repousse automatiquement. Aucun bois ni aucune planche chromatique n’est généré.

La durée de base de la coupe est de **4 secondes au niveau 1**, puis `max(1, 4 / (1 + 0,06 × (niveau métier − 1)))` secondes. Le seuil du niveau suivant vaut `30 × niveau métier` XP ; l’excédent est conservé. Une seule coupe à la fois. Déplacement manuel, sort réussi, cible bonus de combat réussie, dégâts reçus, changement de personnage, téléportation ou ouverture d’un menu interrompent l’action sans récompense. La récolte ne recommence pas automatiquement après repousse.

La **scierie du village**, à gauche du chemin de la maison, est accessible avec **F** à proximité. Chaque essence possède sa recette : **2 bois → 1 planche**, au même niveau métier que la récolte. Choisir un nombre de planches pour fabriquer en lot. Chaque planche donne **10 XP bûcheron**. La recette vérifie le niveau, le lieu et tout le stock avant de consommer. La Sagesse des personnages ne modifie pas cette XP métier.

Les **36 améliorations chromatiques d’armure** à la forge exigent désormais **5 Planches de frêne**, en plus de la pièce et des ressources du monstre. Les bois bruts et les planches des essences supérieures ne remplacent pas ces planches de niveau 1. L’XP bûcheron provient des coupes et des planches, pas de l’amélioration d’armure elle-même.

Les outils dev ajoutent **Bosquet**, **Scierie**, **+30 XP bûcheron** et **10 Bois de frêne (test)**. Les stocks et la progression restent locaux à la session, comme le reste du jardin.


### Cibles pendant la coupe

Une cible dorée apparaît une fois pendant chaque coupe, après un quart de la progression. Elle reste au plus **1 seconde**, comme les cibles de combat, et disparaît si la coupe se termine ou est interrompue. Un **clic gauche précis** ajoute **25 % de la durée totale** à la progression, une seule fois. Un clic manqué ou une cible expirée ne pénalisent pas la coupe ; elle continue normalement. Le bois et l’XP restent les mêmes et ne sont accordés qu’à la fin effective de la récolte. Le bonus peut raccourcir la durée de base sous son plancher habituel d’une seconde.


## Ambiance sonore

Le son démarre à la **première interaction** avec le jeu, selon les règles du navigateur. Le bouton **🔊** ouvre les réglages : **Général, Musique, Bruitages**, plus une coupure complète. Ces préférences sont mémorisées sur le navigateur, indépendamment de la progression locale du jeu.

Une composition rétro originale à **104 BPM**, sur une boucle de seize mesures, associe mélodie douce, arpèges, basse et percussion légère. Les réglages initiaux privilégient une musique discrète et des actions lisibles.

Les impacts réussis distinguent **lame**, **arc** et **magie**, avec des nuances selon l’élément. Le son d’un projectile reste lié à son sort d’origine, même si une autre compétence est lancée avant l’impact. Les coups ratés ne produisent pas de bruit d’impact. Des retours courts accompagnent aussi les soins, dégâts reçus, ultimes, cibles réussies, pas, coups de hache, récoltes, planches et améliorations à la forge.

Les effets proches du personnage contrôlé sont prioritaires et légèrement spatialisés ; les alliés et actions éloignées sont plus discrets. Les répétitions simultanées sont limitées pour éviter la cacophonie. Les volumes changent avec un fondu court ; le son se suspend lorsque l’onglet est masqué et reprend à son retour. En cas d’absence de prise en charge audio, le jeu continue normalement.

Les sons sont synthétisés dans le navigateur : aucun téléchargement audio ni service externe n’est nécessaire. Les vérifications couvrent les familles d’impacts, les effets retardés, les préférences, la pause/reprise, les curseurs de volume et le rendu audio sans saturation.

### Tutoriel guidé

À chaque nouvelle session, le guide présente les trois classes (molette ou portraits), valide quelques pas puis propose un slime d’entraînement isolé. Il inflige 2 dégâts et donne assez d’XP pour monter de niveau : dépensez les 5 points du héros ayant commencé le combat avec **P**, puis équipez son nouveau sort Feu dans un des trois emplacements normaux avec **K**. Le guide explique les commandes, les éléments, le déploiement et les ultimes. Fermez le grimoire pour continuer vers le bestiaire, l’équipement et les métiers. **Passer le tutoriel** restaure le monde sans accorder d’XP gratuite. Le vent a été retiré de l’audio et des réglages.

Dans le grimoire, sélectionnez un emplacement puis **Déséquiper le sort sélectionné** pour le laisser vide. Ses délais de recharge sont conservés ; une montée de niveau ne remplit pas les emplacements volontairement vidés.

### Île des premiers pas

La nouvelle session fait apparaître le personnage sur une île dédiée au tutoriel, devant le pavillon d’accueil d’Iris. Les chemins rejoignent une cour d’entraînement clôturée et une porte vers le village. Cette carte possède son propre terrain, ses collisions et son décor ; les monstres, PNJ marchands et arbres récoltables du jardin restent dans leur zone. Le slime n’apparaît qu’au début de l’étape de combat.

Après les sorts, le bestiaire, l’équipement et la fabrication d’une planche, **Terminer · Rejoindre le village** transfère toute la troupe au village. La porte permet aussi de sortir avec **F** à proximité. XP, caractéristiques, équipement et choix de sorts sont conservés. Passer le guide rejoint le village sans récompense gratuite.

### Bestiaire, armures et métiers dans le guide

Le parcours d’Iris compte désormais **13 étapes** : après les sorts, consulter le **Slime** dans **B** et déplacer sa barre de niveau au-dessus de 1. Le guide présente les statistiques, les ressources et les probabilités.

Le slime d’entraînement donne **un noyau Eau garanti, une seule fois**, en plus de son butin habituel. Les monstres ordinaires gardent leur taux de noyau de 25 %. Dans **I**, où que vous soyez, ouvrir le noyau puis équiper la pièce Rosée obtenue, avec le bouton Équiper ou **Maj + clic**. Le guide explique les tranches de niveaux, les doublons et les améliorations chromatiques.

Découvrir ensuite **L**, couper les **deux frênes récoltables** du bosquet de l’île, puis fabriquer **une Planche de frêne** à la scierie locale avec les deux bois récoltés. Le bouton Rejoindre et couper lance le déplacement normal vers l’arbre ; Rejoindre la scierie place la troupe à l’atelier de cette leçon. Coupe, cible bonus, interruptions, repousse, consommation et XP métier suivent les règles habituelles. La sortie s’active après la fabrication ; Passer le tutoriel reste disponible. Équipement, planche et progression métier sont conservés au village.

### Recyclage chez Borin

À la forge (**F** près de Borin), la section **Recycler les pièces normales** accepte les pièces du sac et celles équipées : armures, bijoux, armes et boucliers possédant un élément. Chaque pièce consommée donne **un fragment du même élément et de la même tranche de dix niveaux**. Les pièces chromatiques, familiers et trophées ne sont pas recyclables. Retirer une pièce équipée recalcule les PV sans soigner.

La section **Échanger les fragments** transforme **10 fragments identiques en un noyau correspondant**, sans coût en or. Les éléments et tranches ne se mélangent pas. Les fragments ont une icône propre et apparaissent dans le filtre **Noyaux & fragments** du sac. Le noyau reçu peut être ouvert immédiatement, partout dans le monde.

### Skins de classes et lumière dorée

Les trois classes conservent **le même gabarit de corps que le sprite original**, sans armure ou accessoire de classe ajouté : **combattant rouge**, **soutien violet**, **distance vert**. Les petits marqueurs d’arme d’origine et les ancrages des équipements sont conservés. Les vrais équipements fournissent leurs couleurs et leurs ornements. Le monde, les portraits et l’inventaire utilisent le même dessin.

Le shader **golden hour** ajoute lumière chaude, ombres projetées, rayons discrets et léger halo sur les zones lumineuses, à la résolution native du pixel art. Le bouton **☀**, en haut à droite, permet de revenir à l’éclairage neutre et mémorise ce choix. L’interface garde ses couleurs. Une version légère en Canvas 2D prend le relais lorsque WebGL est indisponible ; les préférences de réduction du mouvement sont respectées.

### Attaques des monstres annoncées au sol

Les monstres préparent une attaque élémentaire au lieu de frapper instantanément au contact :

- **Sanglier — Terre** : fixe une cible, annonce un couloir pendant **1,1 s**, puis charge en ligne droite. La cible et la destination sont figées ; les obstacles arrêtent la charge.
- **Slime — Eau** : se comprime pendant **1,2 s**, puis saute sur le personnage vivant et déployé le plus éloigné du centre de la troupe. Le cercle d’atterrissage reste figé pendant le bond : sortez-en pour esquiver. Le slime d’entraînement prévient pendant **1,5 s** et conserve ses dégâts réduits.
- **Luciole — Feu / Phalène — Air** : annoncent une trajectoire pendant **1,2 s**, puis envoient une tornade mobile. Chaque tornade touche une seule fois chaque personnage et respecte les obstacles.

Les zones affichent leur élément, un contour contrasté, la direction et la progression de la préparation. Dégâts, effets visuels et sons suivent l’élément annoncé ; les résistances correspondantes s’appliquent avant les boucliers. L’enracinement interrompt une préparation ou une charge. La mort du lanceur et les changements de zone suppriment ses attaques en cours. Le bestiaire présente les nouvelles attaques et leurs dégâts au niveau sélectionné.

## Marais de Gelée

Une nouvelle zone est accessible au **passage au sud-est du village**, au bout du chemin : approchez-vous du cercle puis appuyez sur **F**. Le retour fonctionne de la même manière à l’entrée du marais. Les outils dev proposent aussi **Marais de Gelée** pour tester directement la zone. Un guide s’ouvre à la première visite et reste disponible avec le bouton **✿**.

Le décor possède ses propres mares turquoise infranchissables, nénuphars, roseaux, champignons géants, sentiers et trois fleurs éponges. Cinq **Slimes des marais de niveau 3** occupent la zone ; l’un commence à la taille 2. Ils donnent les ressources et noyaux Eau habituels et disposent d’une fiche dédiée au bestiaire.

- Chaque atterrissage laisse une **flaque pendant 18 s**. Atterrir dans une flaque préexistante l’absorbe et fait grandir le slime, jusqu’à **trois tailles**.
- Chaque croissance ajoute **30 % de PV maximum**, **25 % aux dégâts** et **25 % au rayon** par rapport à la base, avec **0,3 s de préparation supplémentaire**. La proportion de PV est conservée à l’arrondi.
- Un gros slime qui rate son saut devient **vulnérable pendant 2,5 s** : il reste déséquilibré et reçoit **+50 % de dégâts**. Les cibles bonus répètent les dégâts reçus sans appliquer une seconde fois ce bonus.
- Un slime qui atterrit à moins de **20 pixels d’une fleur éponge prête** gagne **une taille**, jusqu’à trois, en conservant son pourcentage de PV. Le nectar est prioritaire sur les flaques : une seule croissance par saut. La fleur se recharge en **10 s**. Elle ne nettoie ni ne bloque les flaques ; un saut y dépose toujours de la gelée. Le bref éclat violet signale son activation. Un gros slime qui rate son saut reste vulnérable.

Inventaire, équipement, niveaux, métier et mode de combat sont conservés lors des trajets. Le village et les monstres blessés se retrouvent à chaque retour dans la même session. Les flaques expirent selon le temps de simulation ; un changement de zone annule les attaques en cours. Après une défaite complète dans le marais, la troupe est soignée à son entrée. Recharger la page réinitialise toujours cette progression locale.

Un saut raté par un slime de taille 2 ou 3 provoque une scission : le parent perd une taille (3 → 2, 2 → 1), conserve son pourcentage de PV et devient vulnérable. Un nouveau slime de taille 1 apparaît à côté sur un terrain praticable, au même niveau. Ce saut ne permet pas de regrossir immédiatement grâce à une flaque ou une fleur. Les slimes issus de scission combattent et donnent leurs récompenses habituelles, mais ne réapparaissent pas après leur mort.

### Crevasse des profondeurs

Au **sud-est des Marais de Gelée**, un trou sombre dans la mer reçoit une cascade. Approchez-vous de sa lèvre et appuyez sur **F — Entrer dans le donjon** : un bond et une chute animés emmènent toute la troupe dans la grotte. Le bouton contextuel fonctionne aussi sur mobile. La descente consomme **une Clé de la Crevasse pour toute la troupe**. Sans clé, le passage reste fermé. **Outils dev → Donjon · accès dev** permet une visite de test gratuite.

La crevasse est une carte distincte : sol rocheux humide sans pavage, mares infranchissables, trois cascades animées, stalagmites, champignons lumineux et éclairage souterrain bleuté. La lumière dorée extérieure s’efface dans cette zone. La **remontée lumineuse à l’ouest + F** ramène à la cascade des marais.

- Sept slimes de **niveau 5**, Eau (abyssaux bleus) et Terre (limon ambré), engagent de plus loin. Les formes Eau bondissent et les formes Terre chargent ; cercles et couloirs annoncent les impacts.
- Un saut raté d’un gros slime produit **taille 3 → 2 + 1** ou **taille 2 → 1 + 1**, avec une brève vulnérabilité du parent.
- Deux slimes proches, au sol et sans attaque en cours, peuvent fusionner : **1 + 1 → 2**, **1 + 2 → 3**. Un lien et des anneaux dorés l’annoncent pendant **1 s**. Les repousser, les immobiliser ou tuer un partenaire annule la fusion. Ils attendent **5 s** après une scission ou fusion avant de refusionner.
- Les fusions mixtes alternent **bond Eau / roulade Terre**. La masse totale de la horde est conservée lors des transformations : pas de multiplication sans fin des ennemis vivants. La fusion ne donne ni XP ni loot.
- Ressources élémentaires partagées : **Gelée d’eau / Cœur d’eau** et **Gelée de terre / Cœur de terre**, avec variantes chromatiques ; noyaux Eau ou Terre selon le monstre. Fiches disponibles dans le bestiaire avec aperçu par niveau.

Les ennemis vaincus restent morts pendant l’expédition. Chaque nouvelle entrée payante recrée le donjon complet, avec ses sept slimes et Gorgelimon. Le retour vers les marais est gratuit. Une défaite ramène la troupe soignée sur la berge d’entrée, avec son or et ses objets.

### Boss — Gorgelimon, Cœur du gouffre

Au sud-est de la crevasse sommeille **Gorgelimon**, un boss **niveau 8 Eau / Terre** : une énorme gelée bleu pétrole, une carapace de limon et de stalagmites, et un cœur cristallin lumineux. Approchez et appuyez sur **F** (ou le bouton contextuel) pour l’éveiller ; une attaque du personnage principal peut également commencer le combat. Les alliés ne le réveillent pas seuls. Pour un accès rapide : **Outils dev → Approcher Gorgelimon**.

- **Marée d’impact · Eau** : un grand bond annoncé. Esquiver complètement le boss fissure son cœur pendant **2 s**, avec **+50 % de dégâts reçus**.
- **Ruée de limon · Terre** : une charge dont le couloir est annoncé et figé avant le départ.
- **Éboulement du gouffre · Terre** : des cercles apparaissent aux positions des personnages avant les impacts. Les cercles restent fixes et un même éboulement ne touche chaque personnage qu’une fois, même si plusieurs zones se superposent.
- À **70 % puis 35 % de PV**, la carapace se scinde en **deux aspects de taille 2, Eau et Terre**. Le cœur central est protégé. Détruisez tous les aspects et leurs descendants en **12 s** : le boss expose son cœur pendant **5 s**, avec **+50 % de dégâts reçus**. Sinon il absorbe les survivants et récupère **4 % de ses PV maximum par unité de taille survivante**, jusqu’à 16 %.
- Les aspects peuvent se scinder et fusionner entre eux ; ils ne fusionnent pas avec les slimes ordinaires. La dernière phase accélère les attaques.

La barre de vie indique les seuils, la phase et le temps avant réabsorption. Sa fiche de bestiaire décrit ses attaques. Le boss ne donne pour le moment aucun objet ni noyau ; son XP et son or restent attribués une seule fois. Les réabsorptions ne donnent aucune récompense. Une fuite, une défaite ou un départ de la zone remet le boss vivant au repos avec tous ses PV et supprime ses aspects. Un boss vaincu reste mort pendant l’expédition ; il revient à la prochaine entrée payante dans une nouvelle expédition.

### Météo des marais

Les **Marais de Gelée** sont sous une pluie battante : gouttes obliques en deux profondeurs, éclaboussures sur la terre et rides sur l’eau, avec un ciel couvert plus froid. Les annonces d’attaque, cibles bonus et interfaces restent lisibles. La pluie reste limitée à cette carte ; la grotte et le village conservent leur ambiance. La préférence système de réduction des animations est respectée.

Un bruit de pluie stéréo accompagne les marais et s’estompe en quittant la zone. Son volume suit **🔊 → Bruitages**, ainsi que le volume général et la sourdine. Le son démarre après la première interaction et se met en pause avec l’audio lorsque l’onglet est masqué.

### Commandes sur téléphone

- **☰ en haut à droite** ouvre un menu compact : Inventaire, Bestiaire, Caractéristiques, Grimoire, Métiers, Outils dev, Audio et affichage. Touchez un bloc pour ouvrir son panneau ; le menu se referme après la sélection. Touchez à côté ou de nouveau sur le carré pour le fermer.
- **Joystick en bas à gauche** : direction libre, inclinaison légère pour marcher doucement, inclinaison complète pour la vitesse normale. Relâcher arrête le personnage. Le joystick et les sorts acceptent deux doigts simultanés.
- **Gros bouton Base à droite**, avec **Sort 2, Sort 3 et Ultime** autour. Les sorts tactiles partent dès la pression et utilisent la visée assistée du jeu, avec les recharges et la jauge d’ultime visibles. Les emplacements vides se configurent dans le Grimoire depuis ☰.
- **Portraits de l’équipe en haut à gauche** : touchez un héros pour le contrôler. **Explorer / Combat**, au-dessus des sorts, permet de changer de mode.

La disposition s’adapte au portrait et au paysage, aux petits écrans et aux zones réservées par l’encoche. L’interface ordinateur conserve ses menus, raccourcis clavier et barre de sorts habituels.

### Cimes de Schiste — slimes des montagnes

Un passage au **nord-est du village + F** conduit aux **Cimes de Schiste**. Trois plateaux rocheux, reliés par des ponts de bois, accueillent six **Slimes de schiste Terre, niveau 5**. Des blocs de roche et des parois solides sont répartis pour préparer les collisions. **Outils dev → Cimes de Schiste** permet un accès direct ; le col au sud-ouest ramène au village.

Leur mécanique est la **carapace rocheuse** :

- Tant qu’elle est intacte, elle réduit **tous les dégâts reçus de 40 %**. Les fissures visuelles accompagnent les blessures.
- Le slime annonce un couloir Terre pendant **1,3 s**, puis roule en ligne droite. Placez un rocher ou une paroi sur sa trajectoire et esquivez latéralement.
- La première collision qui brise la carapace étourdit le slime et expose son cœur pendant **3 s**, avec **+50 % de dégâts reçus**. La protection reste ensuite perdue jusqu’au respawn. Un arrêt au bord d’un précipice ne brise pas la carapace.

La fiche du bestiaire comprend les statistiques par niveau, la mécanique et les ressources **Gelée de terre / Cœur de terre**, avec leurs variantes chromatiques, ainsi que le noyau Terre habituel. Les personnages et le sac sont conservés entre les zones. Une défaite soigne la troupe au col ; les slimes réapparaissent après 18 s avec leur carapace restaurée.


### Carapaces des slimes de la caverne

Les **slimes de limon et les fusions mixtes Eau/Terre** utilisent la même carapace que les slimes des montagnes : dégâts reçus réduits de **40 %**, protection brisée après une roulade contre une **stalagmite ou une paroi**, puis cœur exposé pendant **3 s** (+50 % de dégâts). Les rives des mares ne comptent pas comme des parois rocheuses.

Les formes mixtes gardent leur alternance **bond Eau / roulade Terre**, ainsi que leurs scissions et fusions. La scission conserve l’état de la carapace chez le parent et le petit. Une fusion conserve une protection cassée si toute sa composante Terre était déjà brisée ; une composante Terre encore intacte apporte sa carapace. Ajouter de l’Eau seule ne répare donc pas la protection.

La teinte Terre de la caverne, des formes mixtes, de leurs illustrations et du limon utilise désormais la **même palette ambrée que le slime de schiste**. Le guide de zone et le bestiaire expliquent les roulades et les carapaces.


## Bricoleur et clés de donjon

**Tessa · Bricoleuse** tient l’atelier de bricolage au village. Approchez et appuyez sur **F**, ou ouvrez **Métiers (L) → Bricoleur** pour consulter la recette. La fabrication nécessite d’être près de Tessa.

La **Clé de la Crevasse**, accessible au niveau 1 bricoleur, demande :

- **5 Planches de châtaignier** : bois débloqué au niveau 5 bûcheron, 2 bois par planche à la scierie.
- **1 Cœur d’eau** : ressource rare commune des slimes Eau (jardin, marais ou profondeurs).
- **1 Cœur de terre** : ressource rare commune des slimes Terre (montagnes ou profondeurs).

Les variantes chromatiques ne remplacent pas ces ingrédients. Le frêne et le bois brut ne remplacent pas les planches de châtaignier. Posséder les planches suffit : le bricoleur n’exige pas lui-même le niveau 5 bûcheron.

La quantité peut être choisie pour fabriquer en lot. Chaque clé rapporte **25 XP bricoleur**, avec une progression indépendante du combat et du bûcheron. Les clés se regroupent en sac et disposent du filtre **Clés de donjon**. Une réanimation dans le donjon conserve l’expédition et ne consomme aucune autre clé.

Les outils dev proposent l’atelier, les ingrédients d’une clé et +30 XP bricoleur. La progression reste locale à la session.

## Champs de Braise · Slimes de feu

Le passage **au sud-est des Cimes de Schiste** mène aux Champs de Braise, une zone de basalte entourée de lave, avec trois bassins infranchissables, des rochers et des braises en suspension. **F** près du passage traverse dans les deux sens ; les outils dev proposent aussi un accès direct. Aucun coût de clé pour cette zone extérieure.

Six **Slimes de braise de niveau 5** y sautillent et bondissent :

- Leurs déplacements laissent une traînée au sol. Les braises sont annoncées **0,35 seconde**, puis brûlent pendant **4 secondes**. Les superpositions ne multiplient pas les touches : au maximum une brûlure toutes les **0,6 seconde par personnage**.
- Leur bond Feu conserve une zone d’atterrissage annoncée avant l’impact.
- À la mort, un cercle fixe annonce une **explosion après 0,9 seconde**, dans un rayon de **36 pixels**. Le coup fatal donne le butin immédiatement, mais il faut encore s’éloigner !

Les résistances Feu s’appliquent aux bonds, traînées et explosions. Les obstacles bloquent les dégâts. Les dangers disparaissent en changeant de zone ou après une défaite ; la troupe est alors soignée au passage d’entrée. Les slimes réapparaissent après **18 secondes**.

Butins : **Gelée de feu**, **Cœur de feu** rare, chacun avec variation chromatique, et possibilité de noyau Feu standard. Le bestiaire inclut les mécanismes, les visuels et les statistiques réglables par niveau. Les recettes d’armures et la nourriture des familiers existants conservent leurs ingrédients.

## Donjon du Volcan · Pyroclaste

Les slimes Feu des Champs de Braise **surgissent des trois bassins de lave** à leur apparition et à chaque repousse, puis atterrissent sur un point praticable. Pendant ce saut d’arrivée de 1,2 s, ils n’attaquent pas et ne peuvent pas être ciblés. Les personnages restent bloqués par la lave.

Le **cratère central des Champs de Braise + F** ouvre le Donjon du Volcan. Chez Tessa, choisissez **Clé du Volcan** dans l’onglet Bricoleur : **5 Planches de châtaignier + 1 Cœur de feu + 1 Cœur de terre**, non chromatiques. Fabrication niveau 1, 25 XP par clé, en lot. Cette clé et celle de la Crevasse restent distinctes. Une clé ouvre un donjon neuf pour toute la troupe ; sortie gratuite et nouvelle tentative après défaite sans seconde clé.

Les **cinq Slimes de magma de niveau 6**, Terre / Feu, portent une carapace réduisant les dégâts de 40 %. Elle accumule les dégâts réellement reçus : au seuil de **25 % des PV maximaux**, elle se brise et annonce son explosion pendant **1,1 s**. Le souffle Terre projette six éclaboussures de magma Feu, avec leurs cercles d’arrivée. Ils bondissent et ne roulent pas.

Le magma **reste au sol**, même après avoir touché plusieurs personnages : brûlure Feu toutes les 0,6 s au maximum par personnage, résistances et boucliers applicables, aucun recul automatique de brûlure. Les flaques ne suivent pas les personnages. Elles sont nettoyées à la sortie, après une défaite ou lors d’une réinitialisation du combat du boss. Les projections voisines fusionnent ; les dangers permanents sont plafonnés à 100 flaques pour borner la mémoire.

Au nord-est, **Pyroclaste, le Slime-Volcan**, boss niveau 9, se réveille avec **F** ou une attaque du héros principal à proximité. Son cratère projette des slimes vers des emplacements annoncés et verrouillés, puis les créatures atterrissent et combattent. Les vagues alternent slimes Feu et slimes de magma ; leurs impacts sont respectivement Feu et Terre, et laissent du magma. Sous **40 % de PV**, trois projections remplacent les deux habituelles et leur rythme accélère. Maximum six invocations vivantes, sans XP, or ou butin.

Les slimes de magma donnent une gelée ou un cœur de Terre ou de Feu, avec variantes chromatiques et possibilité d’un noyau de l’élément tiré. Pyroclaste ne donne pour le moment aucun objet ni noyau ; son XP et son or sont conservés. Les monstres du donjon ne réapparaissent pas durant l’expédition. Le bestiaire et le guide détaillent les règles. Les outils dev proposent l’accès gratuit au volcan, l’approche du boss et les ingrédients de la clé.

## Hauts des Alizés · Slimes Vent

Le passage du **plateau central des Cimes de Schiste + F** rejoint les Hauts des Alizés, sans clé. Trois plateaux verdoyants au-dessus des nuages sont reliés par des ponts suspendus ; moulins animés, herbes et feuilles portées par le vent habillent la zone. Le passage à l’ouest revient aux montagnes. **Outils dev → Hauts des Alizés** donne aussi un accès direct. L’arrivée est à l’écart des rencontres pour lire le guide.

Les six **Slimes des alizés de niveau 5**, d’élément Air, enchaînent :

1. **Gonflement pendant 1,8 s** : le grand cercle de 78 pixels aspire doucement la troupe. Le petit cercle de 43 pixels indique l’explosion à venir. Déplacez-vous pour en sortir ; la marche reste plus rapide que l’aspiration, même si plusieurs champs se superposent.
2. **Explosion d’Air** à gonflement maximal, puis propulsion immédiate vers le premier atterrissage annoncé.
3. **Deux bonds en ricochet**, avec des cercles numérotés **1 et 2** verrouillés dès le début. Chaque vol dure 0,5 s, avec une pause de 0,22 s entre les deux ; chaque impact touche dans un rayon de 23 pixels.
4. **Récupération de 3,2 s** avant le prochain cycle.

Immobiliser le slime pendant le gonflement ou la pause interrompt le cycle ; un saut déjà lancé va jusqu’à son atterrissage. L’aspiration respecte obstacles et précipices : aucun personnage n’est aspiré dans le vide. Les résistances Air et protections habituelles s’appliquent à l’explosion et aux impacts.

Butins : **Gelée d’air / Cœur d’air**, avec variantes chromatiques, et possibilité d’un noyau Air standard. Le bestiaire présente les règles, les icônes et les statistiques réglables. Réapparition après 18 s ; une défaite soigne la troupe au point d’entrée. Les ingrédients des recettes existantes restent inchangés.


## Bestiaire par famille et ressources des slimes

La catégorie principale **Slime** rassemble les huit monstres normaux, puis les deux **Boss**. Les bêtes et insectes gardent leurs catégories séparées. Les catégories sont dépliables, avec la même organisation sur téléphone ; les mécanismes et la barre de niveau restent dans chaque fiche.

| Élément | Ressource normale | Ressource rare |
| --- | --- | --- |
| Eau | Gelée d’eau | Cœur d’eau |
| Terre | Gelée de terre | Cœur de terre |
| Feu | Gelée de feu | Cœur de feu |
| Air | Gelée d’air | Cœur d’air |

Les ressources normale et rare possèdent chacune une variante chromatique. Les slimes du même élément, même dans des zones différentes, donnent les mêmes ressources empilables. La probabilité de test reste 20 % rare et 10 % chromatique, avec un objet par victoire ; le noyau standard reste un bonus indépendant de 25 %.

Pour un slime à deux éléments, un élément est choisi à parts égales pour la victoire : gelée/cœur et éventuel noyau correspondent à cet élément. Cela couvre le magma Terre/Feu et les fusions Eau/Terre des profondeurs. Aucun noyau chromatique.

**Gorgelimon et Pyroclaste n’ont aucun butin pour le moment** : ni ressource ni noyau, y compris dans le générateur de loot dev. Leur XP, leur or et la validation de victoire restent inchangés. Les ingrédients des clés et la nourriture du familier Eau utilisent les nouveaux cœurs ; un cœur du bon élément peut provenir de n’importe quelle zone. Les butins des sangliers et insectes restent inchangés.
