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

## 8. Gabarit original et couleurs des classes

`src/data/appearance.js` définit les couleurs des tenues : rouge pour le combattant, violet pour le soutien, vert pour le distance. Les trois corps utilisent exactement la géométrie du sprite original : pas de heaume, de robe longue, d’épaulières élargies ou de carquois de classe ajouté. La silhouette nue, ombre de contact comprise, garde une emprise de 18 × 32 pixels dans le rendu de référence. Les petits marqueurs d’arme d’origine restent à leurs positions.

Les équipements utilisent leurs ancrages d’origine. Les coiffes, capes, bottes, ceintures, armes, boucliers et familiers conservent les formes prévues ; les amulettes et anneaux ajoutent leurs touches de couleur dans le corps existant. Les barres de vie et le marqueur du principal retrouvent leur hauteur d’origine.

`ui/character-art.js` utilise le même dessin pour les portraits et l’aperçu d’inventaire, sans second modèle. Le cadrage tient compte du corps d’origine ; les aperçus sont peints à une échelle interne entière avec le lissage désactivé.

La comparaison navigateur des masques alpha avec le rendu précédant le changement de gabarit vérifie 96 configurations : trois classes, quatre directions, mouvement ou repos, équipement ou non et pose de récolte ou pose normale. La géométrie est identique ; les couleurs des trois tenues restent distinctes.

## 9. Golden hour

Le passage `src/rendering/golden-hour.js` est un vrai post-traitement **WebGL / GLSL**, appliqué à la scène de **640 × 400** avant sa présentation à zoom entier. Il réchauffe les hautes lumières, conserve des ombres légèrement froides, ajoute un bloom modéré des zones lumineuses, de légers rayons venant du haut gauche et une vignette douce. La texture de scène utilise NEAREST et CLAMP_TO_EDGE ; les pixels du monde ne sont pas interpolés. Les interfaces HTML restent hors de ce passage.

`sun-shadows.js` projette les silhouettes des arbres et constructions vers le bas droit. Leur masque est mis en cache par carte et état des souches, puis découpé sur la terre. Le flou très léger concerne uniquement les ombres au niveau du pixel natif. Les personnages et monstres reçoivent des ombres de contact allongées. Les collisions et les matériaux ne dépendent pas de ces effets.

Le bouton **☀** active ou désactive cet ensemble d’effets, avec préférence locale `auroria-lighting-v1`. Les rayons restent immobiles lorsque `prefers-reduced-motion` est actif. En absence de WebGL ou pendant la perte du contexte, une passe Canvas 2D légère assure un rendu chaud ; la restauration du contexte reconstruit le programme. La fermeture du renderer libère textures, buffers, programme et écouteurs.

La vérification navigateur couvre la compilation réelle du shader, l’orientation de la texture, l’égalité des blocs de pixels après agrandissement, le respect du gabarit et des ancrages sous les panoplies, le repli 2D, la perte/restauration de contexte, les préférences, l’inventaire et l’écran mobile.

## 10. Prévisualisations ennemies

`src/data/monster-attacks.js` fournit les éléments, dimensions, temps et multiplicateurs. `src/combat/monster-attacks.js` verrouille la destination dans une intention sérialisable du monstre, puis simule charge, bond ou projectile. Le rendu `src/rendering/monster-attacks.js` lit ces mêmes coordonnées et rayons : cercle Eau d’atterrissage, couloir Terre, couloirs puis tornades Feu/Air. Les formes ont un fond et un contour contrastés pour rester lisibles sous l’éclairage doré, ainsi qu’une indication de progression et d’élément. Les prévisualisations sont dessinées au sol, avant les objets et personnages.

Le slime se comprime avant son départ ; sa hauteur visuelle suit une parabole sinusoïdale pendant le trajet, avec son ombre au sol. Ses indications de vie et de visée tiennent compte de cette hauteur. Le sanglier oriente son museau et laisse une courte traînée de poussière pendant la charge. Les tornades utilisent des anneaux et particules de leur élément ; leurs anneaux au sol reprennent le rayon de collision. Les effets gardent le repère et le zoom entiers du pixel art.

## 11. Carte des marais et état des zones

`src/world/slime-marsh-map.js` fournit la côte, les mares, les routes, les objets, les fleurs et les points d’apparition. La distance de terrain soustrait les polygones des mares : rendu et collisions partagent la même géométrie. Le marais réutilise les échantillonneurs périodiques avec sa palette verte/turquoise. Les nénuphars sont déclarés séparément comme décor d’eau ; les autres racines sont validées sur terre. L’atlas ajoute champignons et roseaux avec leurs ancrages.

`src/game/zone-travel.js` sauvegarde les entités propres à chaque zone, puis déplace la troupe par les passages. `src/game/slime-marsh.js` gère les flaques, la croissance, la vulnérabilité et les temps des fleurs. Les paramètres de l’attaque sont calculés à la préparation et copiés dans l’intention, pour conserver la correspondance entre prévisualisation et impact.

`src/rendering/slime-marsh.js` dessine les passages, les flaques, les fleurs ouvertes ou en repos, les éclats de nectar et les indications de vulnérabilité. Les flaques et éclats sont découpés sur le terrain en excluant les mares. Le slime grandit visuellement avec sa taille ; les sprites des personnages conservent leur gabarit d’origine.

## 12. Gouffre et grotte des profondeurs

`slime-depths-map.js` fournit une carte de grotte avec bassins exclus de la géométrie praticable. Son échantillonneur de terrain utilise des textures rocheuses périodiques et un grain humide sans grille de briques ; les matériaux conservent une période de 64 pixels. `terrain.js` accepte un échantillonneur de terrain spécifique, et l’environnement peut désactiver les fleurs de prairie. Les stalagmites ont des sprites mis en cache et des empreintes solides.

`rendering/slime-depths.js` dessine le gouffre marin, la cascade extérieure, les cascades de la grotte, les champignons lumineux, les avertissements de fusion et l’atmosphère froide. Le terrain de grotte conserve sa palette ; la passe golden hour et les ombres de soleil y sont désactivées. Les zones d’impact restent au-dessus du décor de sol et les effets atmosphériques sont légers.

Les slimes des profondeurs reprennent la silhouette de gelée avec palettes Eau et Terre, une taille de 1 à 3 et des touches des deux couleurs après une fusion mixte. Les personnages conservent leur sprite original. La traversée du gouffre interpole la troupe vers le trou avec un arc de saut et une transition sombre avant le changement de carte. Les fusions annoncées relient les deux slimes par des anneaux et une ligne dorés pendant une seconde.

## 13. Gorgelimon

`rendering/depths-boss.js` dessine la silhouette originale du boss, la carapace de limon, les crêtes rocheuses et le cœur cristallin, ainsi que le repaire et les annonces d’éboulement. Le sprite est propre au boss : aucun changement de gabarit des personnages. Les états sommeil, scission, exposition et rage changent les yeux, la carapace et la lumière du cœur.

Les cercles d’éboulement sont dessinés au même niveau que les autres annonces, au-dessus des zones de sorts au sol, avant les acteurs. Le cœur en scission est relié aux aspects par des lignes élémentaires, avec un compte à rebours. La barre de vie HTML reste hors du traitement de la scène et affiche les seuils de phase et les fenêtres de vulnérabilité. Le bestiaire et les deux ressources du boss disposent d’illustrations SVG distinctes.

## 14. Pluie battante des marais

`rendering/marsh-rain.js` pré-calcule des graines visuelles déterministes et des points d’éclaboussure classés terre/eau. L’animation utilise l’horloge du jeu, des coordonnées entières et de petits rectangles à la résolution native ; elle ne consomme jamais le hasard du gameplay. Les gouttes se répartissent en deux profondeurs. Le voile froid, les éclaboussures et la couche arrière passent avant les acteurs et les annonces ; la couche avant passe sous les effets d’attaque, textes de dégâts et cibles bonus. Les interfaces HTML restent hors de la pluie.

La pluie est dessinée uniquement dans `slime-marsh`. Les rayons et ombres de soleil y sont remplacés par une ambiance de ciel couvert, sans modifier la préférence d’éclairage extérieure mémorisée. La préférence `prefers-reduced-motion` réduit la densité et fige les animations de pluie. Aucun état de combat ou de déplacement n’est modifié.

## 15. Plateaux montagneux et carapaces

`world/slime-mountains-map.js` décrit trois plateaux et deux ponts comme une union de polygones. Le terrain et les collisions utilisent les mêmes régions. Les crevasses sont dessinées à partir de la distance aux plateformes, avec des strates rocheuses ; les textures des sols et sentiers restent périodiques. Les planches des ponts traversent les crevasses, leurs garde-corps sont des détails visuels. Les rochers et parois ont des empreintes solides séparées des bords du vide, afin de distinguer une collision qui brise une carapace d’un simple arrêt.

`rendering/slime-mountains.js` dessine les sommets lointains, ponts, passages, slimes ambrés et plaques de schiste. La préparation comprime la gelée ; la charge fait rouler la silhouette. Les fissures accompagnent les blessures, et la rupture expose un cœur clair avec fragments rocheux, bruitage et indication de vulnérabilité. Les sprites des personnages gardent leur taille originale. Les rochers et parois rejoignent le tri par profondeur, l’atténuation lors de l’occlusion et les ombres projetées de l’extérieur.


## 16. Carapaces partagées et gelée ambrée

`data/rock-shell.js` centralise la palette ambrée et l’identification des formes contenant de la Terre. `rendering/rock-shell.js` partage le dessin des plaques, fissures et cœur exposé entre les slimes de schiste et ceux de la crevasse. Les formes mixtes conservent leur corps bicolore bleu/ambré et leur taille issue des fusions. Les barrettes de vie et indications de carapace tiennent compte du relief des plaques. Les illustrations du bestiaire et la ressource Limon humide reprennent cette même palette.

Le calcul de roulade distingue les rochers et parois de la grotte des berges des mares. Les avertissements suivent la trajectoire réellement praticable ; une collision rocheuse déclenche les particules de schiste, le bruit de rupture et la fenêtre de vulnérabilité existants.


### Atelier de bricolage

L’atelier du village possède un sprite dédié (toit d’ardoise, charpente, enseigne de clé et établi), une emprise solide et une liaison au chemin. Il participe au tri d’occlusion et aux ombres solaires comme les autres bâtiments. Tessa utilise le gabarit de personnage existant. Les clés ont une icône dédiée dans le sac ; le panneau Bricoleur adapte les ingrédients à la quantité saisie et se replie en une colonne sur petit écran.

### Champs de Braise

Le terrain basaltique emploie des textures périodiques de 64 pixels, échantillonnées dans les coordonnées du monde. Le masque de sol soustrait les trois bassins de lave au contour extérieur et pilote aussi les collisions et le placement des flammes. Les routes utilisent leur union de distances. Les rochers conservent le tri en profondeur des autres environnements.

Les slimes ont une palette orange et un cœur lumineux, une compression avant bond, une ombre au sol et des sautillements décoratifs ; la hauteur du bond réel vient de la simulation. Les traînées et cercles d’explosion sont dessinés au sol à partir des mêmes positions, rayons et durées que les dégâts. L’explosion disparaît après un unique déclenchement, remplacée par l’impact Feu et des particules. Des bulles de lave et des braises atmosphériques animent le décor sans ajouter de collisions ou de dégâts cachés.

### Volcan et surgissements

Le Donjon du Volcan possède son propre masque basaltique, ses bassins de lave non praticables et son réseau de chemins. Les textures réutilisent l’échantillonnage périodique des Champs de Braise, tandis que le contour, les accessoires et la navigation sont propres à la carte.

Le surgissement d’un slime Feu interpole sa position visuelle depuis un bassin intérieur jusqu’à son point de sol valide avec une hauteur sinusoïdale ; collisions et IA restent sur le point d’arrivée et sont suspendues pendant cette phase. Le personnage joueur conserve son gabarit d’origine.

Les slimes de magma portent un dessin de basalte sombre fissuré sur un corps ambré incandescent. Les fissures et le compteur de dégâts rendent la rupture lisible. Les explosions de carapace utilisent les mêmes cercles, positions et durées que les dégâts. Les projectiles de magma et les slimes expulsés du cratère dessinent des arcs vers les points annoncés ; les flaques persistantes restent visibles après un contact. Pyroclaste possède un sprite dédié de volcan vivant, cratère lumineux, coulée et particules, sans emprunter le sprite de Gorgelimon. La barre de boss et les informations accessibles changent selon le donjon ; les repères de scission de Gorgelimon sont masqués pour Pyroclaste.

### Hauts des Alizés

Le terrain repose sur l’union de trois polygones de plateaux et de deux ponts : les mêmes distances pilotent la pelouse, les falaises, la navigation et le placement. Les textures de pelouse et de sentier sont périodiques sur 64 pixels, y compris aux coordonnées négatives. Le ciel, les nuages lointains, les herbes et les volutes atmosphériques distinguent cette zone. Les moulins sont des accessoires solides triés en profondeur ; leur rotor est animé dans leur propre couche et participe à l’occlusion du personnage.

Le slime Vent garde une base turquoise pâle et une spirale claire, puis dilate son corps en fonction de la progression réelle du gonflement. Deux cercles concentriques distinguent portée d’aspiration et explosion ; des traits entrants indiquent la direction de l’aspiration. Les cercles numérotés 1 et 2 utilisent directement les positions verrouillées de la simulation, restent affichés pendant le cycle et disparaissent après leur impact respectif. Les arcs de vol et les ondes d’Air réutilisent la hauteur et les événements de la simulation. Le rendu de ce cycle est dédié pour éviter les anciennes annonces de charge ou de tornade.
