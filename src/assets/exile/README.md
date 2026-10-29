# Comptoir de l’Exil — assets du port

Assets originaux générés pour ce projet, dans une direction fantasy médiévale en pixel art, à partir des références d’ambiance fournies par le joueur.

`port-landmarks.png` : atlas transparent 2 × 2, ordre de lecture : halle marchande, forge des artisans, entrepôt portuaire, porte du Refuge. Le manifeste `atlas-frames.json`, mesuré sur l’alpha de chaque cellule, définit son cadre de dessin ; le fond RGB transparent n’est jamais utilisé comme terrain.

Le rendu charge les atlas à l’entrée dans le Comptoir. Les sprites sont découpés d’après le manifeste et mis en cache en mémoire à l’échelle du jeu. Leurs silhouettes n’imposent ni le sol ni les collisions : les empreintes, accès, escaliers et pontons sont décrits séparément dans `src/world/exile-map.js`.

Les grues, les quais à arcades, les escaliers, les emblèmes de slime et les détails d’ateliers sont des assets dessinés en Canvas dans `src/rendering/exile-port-assets.js`. Les matériaux pierre et eau du port sont périodiques sur 64 pixels, ancrés dans les coordonnées du monde.

`port-streets.png` : six variantes de maisons et ateliers sur fond transparent. Ligne supérieure : trois façades marchandes aux toits chauds ; ligne inférieure : trois ateliers aux ardoises bleues. Les gouttières de découpe mesurées sont stockées dans le module de rendu pour conserver les potences, auvents et cheminées.

La variante `tower` du manifeste réutilise une tour de la porte pour les remparts, sans nouvelle texture. La géométrie des courtines et des terrasses reste indépendante de ce cadre graphique.

`artisan-buildings.png`, `artisan-buildings-2.png` et `artisan-buildings-3.png` : quinze bâtiments indépendants, redessinés avec des façades de face et la même direction artistique que les maisons de `port-streets.png`. Chaque planche de 1536 × 1024 contient cinq bâtiments de 420 à 519 pixels de haut, sur fond transparent. Les contours, les tuiles et les colombages sont détaillés ; le rendu désactive le lissage des sprites. Les cadres sont mesurés sur les silhouettes alpha et vérifiés sans chevauchement dans chaque planche.

Les identifiants du premier catalogue restent inchangés pour conserver les placements enregistrés. Les hauteurs visuelles sont recalculées selon les nouvelles proportions ; la profondeur des collisions initiales est conservée explicitement dans `footprintDepth`.

`artisan-catalog.json` nomme les quinze bâtiments et définit leur taille dans le jeu. `src/data/artisan-buildings.js` ajoute leurs ancrages au sol et leurs empreintes de collision. Ces modèles enrichissent uniquement la palette de l’éditeur ; aucun bâtiment supplémentaire n’est placé automatiquement dans la ville. Les copies conservent leur modèle dans l’export JSON et la sauvegarde locale.
