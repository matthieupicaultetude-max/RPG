# Organisation du rendu 2D

Le rendu sépare la géométrie du monde, les matériaux de terrain, les sprites et la présentation à l’écran. Le jardin conserve un repère de 640 × 400 unités ; une unité correspond à un pixel de la scène de référence.

## 1. Données de carte et collisions

`src/world/map.js` est la source commune du terrain et de la navigation :

- `LAND` décrit la côte ; `landDistance` est positive sur la terre et négative sur l’eau.
- `ROADS` décrit des axes de chemin, leurs largeurs et leurs jonctions explicites. Les deux accès à la prairie se terminent à l’intérieur de la clairière.
- `CLEARINGS` décrit les surfaces de terre complémentaires.
- `PROPS`, `DECORATIONS` et `FENCES` placent les objets par leur point d’ancrage au sol.
- `SOLIDS` associe aux objets solides une emprise circulaire ou rectangulaire. L’image complète d’un arbre n’est pas sa collision : seul son pied bloque le passage.

`canWalkMap` est utilisée par le joueur, les IA et les lignes de vue du combat. L’eau, les pieds d’arbres, les murs, les clôtures et les objets solides sont donc cohérents avec le décor affiché. Les petits éléments décoratifs ne bloquent pas les déplacements.

`validateMap` vérifie avant le rendu que les emprises reposent sur la terre, que les objets ne coupent pas les chemins et que deux obstacles ne se superposent pas. La maison et l’atelier peuvent toucher le chemin à leur entrée ; cette exception ne concerne pas les arbres. Les racines sont contrôlées sur un cercle de 12 unités, plus large que la collision du tronc. Le feuillage peut surplomber la rive ; le tronc et les racines restent sur terre.

## 2. Matériaux périodiques

`src/rendering/textures.js` fournit des échantillonneurs déterministes de période **64 × 64** pour l’herbe, la terre, l’eau et la pierre. Les détails utilisent des coordonnées ramenées dans cette période, y compris aux coordonnées négatives. Les motifs de pierre divisent exactement la période ; les rides d’eau et les petites touffes se raccordent par rebouclage.

Les coordonnées d’échantillonnage sont toujours celles du monde. Elles ne repartent jamais à zéro au début d’un chemin, d’une tuile ou d’un morceau de rendu. La texture ne dépend pas de la caméra ni de l’ordre des appels.

## 3. Surfaces et raccords

`src/rendering/terrain.js` choisit le matériau de chaque pixel d’après les données de carte.

La surface des chemins est l’**union** des rubans autour des axes et des clairières. La distance à cette union sert à ombrer uniquement son contour extérieur. Aucun trait de bordure n’est peint séparément sur chaque branche : il ne peut donc pas traverser un carrefour ou fermer un embranchement par un arrondi parasite.

La côte, la pierre et l’eau utilisent le même repère. Le raster de terrain est opaque et calculé une fois. Aucune règle de placement ni collision ne dépend de la lecture des couleurs du canvas. Les fleurs se placent à partir des catégories de terrain et de la distance aux objets, pas d’un seuil RGB.

## 4. Sprites et profondeur

`src/rendering/sprites.js` contient les dessins d’objets et un registre de sprites. Chaque entrée définit ses dimensions et son ancrage. Un atlas en mémoire évite de redessiner les feuilles ou les tuiles à chaque image.

Les sprites sont calculés à leur taille native, puis leur silhouette est ramenée à une couverture opaque/transparente. Leur placement est arrondi au pixel entier. Les façades et les bandes de l’auvent sont découpées dans leurs propres surfaces pour éviter les débordements de texture.

`src/rendering/environment.js` assemble le terrain et les objets à partir de la carte. `scene.js` trie les objets, clôtures, personnages et monstres selon leur ancrage vertical au sol. Les arbres peuvent devenir partiellement transparents lorsque le personnage passe sous leur feuillage. Les animations des personnages et créatures restent dans `actors.js`.

## 5. Caméra et présentation

`src/rendering/viewport.js` calcule un zoom entier suffisant pour remplir la fenêtre, puis arrondit l’origine de la caméra au pixel du monde. `scene.js` présente l’image complète à cette échelle, avec une position de destination entière et sans lissage. Il ne redimensionne pas une découpe fractionnaire de la scène.

La conversion curseur → monde utilise exactement cette caméra. La visée reste donc alignée après déplacement, redimensionnement ou passage en orientation portrait. Sur un écran étroit ou un rapport d’aspect différent, la scène est recadrée autour du personnage plutôt que déformée.

## 6. Ajouter un objet ou un chemin

1. Déclarer la géométrie et l’ancrage dans la carte.
2. Définir l’emprise physique si l’objet est solide ; garder une marge suffisante avec la rive et les passages.
3. Ajouter ou réutiliser une entrée de sprite, avec une origine au sol explicite.
4. Pour une nouvelle route, joindre une jonction existante ou terminer dans une destination. Ne jamais dessiner un chemin supplémentaire directement dans le canvas.
5. Exécuter `npm test` et `npm run build`, puis vérifier visuellement le résultat sur écran large et étroit.

## 7. Vérifications

Les tests de rendu couvrent :

- périodicité des matériaux dans les deux axes et aux coordonnées négatives ;
- égalité pixel par pixel entre un raster complet et des morceaux indépendants non alignés sur la période ;
- absence de bordure intérieure aux jonctions ;
- ancrage de tous les objets sur la terre, séparation des obstacles et dégagement des chemins ;
- liaison praticable entre village, atelier et zone de combat ;
- blocage de l’eau et des racines ;
- zoom et origine de caméra entiers.

Les parcours navigateur vérifient aussi le remplissage opaque des quatre coins du canvas, la visée guidée avec la caméra entière, les impacts, l’inventaire et l’ouverture des noyaux. Les collisions et les échantillonneurs peuvent être testés sans DOM ; seuls les adaptateurs Canvas et l’atlas de sprites utilisent le navigateur.

La maison utilise une géométrie de toit commune dans `src/rendering/house-geometry.js` : les deux versants, le faîtage et le pignon partagent exactement leurs sommets. Les tuiles sont découpées dans chaque versant ; aucun fond de toiture indépendant ne peut dépasser. Les tests vérifient aussi que le pignon masque le haut des poteaux de façade.


### Auras chromatiques

`src/rendering/chromatic-aura.js` sépare les éclats de chaque pièce du halo de panoplie complète. Le halo est dessiné avant le personnage, uniquement en mouvement avec neuf pièces chromatiques du même ensemble ; les éclats des pièces sont dessinés après. Les particules utilisent des positions arrondies et des rectangles de pixels, sans flou de sprite. Les icônes conservent les silhouettes de panoplie avec une palette et une aura distinctes.


### Cibles bonus

`src/rendering/bonus-targets.js` dessine les cibles en dernier dans le repère du monde : silhouette contrastée, centre cliquable et anneau de durée. Le décalage reste attaché au monstre. Le clic passe par `screenToWorld`, sans la correction de hauteur des sorts guidés ; le rendu et la détection partagent `bonusTargetPosition` et le même rayon. La visée habituelle est masquée lorsque le pointeur survole une cible bonus.


### Arbres récoltables

Les arbres de `PROPS` gardent leurs emprises physiques et portent une essence. Leurs états de récolte/repousse sont stockés séparément dans la simulation. L’environnement met en cache couronne et souche ; le rendu choisit la souche sans modifier le terrain ou les collisions. La palette d’essence entre dans la clé du cache. Les constructions deviennent translucides lorsqu’elles masquent le joueur ; le rendu de hache et des copeaux reste distinct du rendu des armes de combat.
