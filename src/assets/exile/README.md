# Comptoir de l’Exil — assets du port

Assets originaux générés pour ce projet, dans une direction fantasy médiévale en pixel art, à partir des références d’ambiance fournies par le joueur.

`port-landmarks.png` : atlas transparent 2 × 2, ordre de lecture : halle marchande, forge des artisans, entrepôt portuaire, porte du Refuge. Le manifeste `atlas-frames.json`, mesuré sur l’alpha de chaque cellule, définit son cadre de dessin ; le fond RGB transparent n’est jamais utilisé comme terrain.

Le rendu charge les atlas à l’entrée dans le Comptoir. Les sprites sont découpés d’après le manifeste et mis en cache en mémoire à l’échelle du jeu. Leurs silhouettes n’imposent ni le sol ni les collisions : les empreintes, accès, escaliers et pontons sont décrits séparément dans `src/world/exile-map.js`.

Les grues, les quais à arcades, les escaliers, les emblèmes de slime et les détails d’ateliers sont des assets dessinés en Canvas dans `src/rendering/exile-port-assets.js`. Les matériaux pierre et eau du port sont périodiques sur 64 pixels, ancrés dans les coordonnées du monde.

`port-streets.png` : six variantes de maisons et ateliers sur fond transparent. Ligne supérieure : trois façades marchandes aux toits chauds ; ligne inférieure : trois ateliers aux ardoises bleues. Les gouttières de découpe mesurées sont stockées dans le module de rendu pour conserver les potences, auvents et cheminées.
