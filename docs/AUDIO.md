# Son du jardin

`src/audio/events.js` sépare les événements de simulation de leur restitution. Les événements sont bornés à 64, consommés au fil des images et abandonnés lorsque le son est suspendu ou coupé. Aucun objet Web Audio n’est stocké dans l’état du jeu.

`src/audio/instruments.js` contient la partition originale (104 BPM, 256 doubles croches) et les synthèses : oscillateurs à enveloppe douce, bruit filtré déterministe, basse et percussions. Le bruit synthétique n’utilise pas `Math.random` et ne change pas les tirages de gameplay.

`src/audio/engine.js` crée un seul contexte audio après interaction. Trois bus permettent de régler général, musique et effets. Le thème est planifié avec une anticipation de 180 ms ; une longue pause ne provoque pas de rattrapage massif de notes. Les impacts sont atténués selon leur distance et placés en stéréo, avec priorité au personnage principal. Les répétitions par famille sont espacées et huit événements au maximum sont restitués par mise à jour. Un compresseur doux limite les pointes.

Le contexte est suspendu après un court fondu lors de la coupure générale ou du masquage de l’onglet. La reprise restaure les gains progressivement. Les préférences validées sont stockées sous `auroria-audio-v1` ; stockage absent ou corrompu et audio indisponible ont un comportement de repli silencieux. Le panneau et ses écouteurs sont supprimés lors du rechargement à chaud.

Les impacts de sorts portent les métadonnées de leur véritable source, y compris pour les projectiles, dégâts périodiques et zones. La classification ne dépend pas du dernier bouton pressé. Les effets d’épée, d’arc et de magie sont déclenchés à l’impact ; un petit retour de lancement reste distinct du bruit d’impact.

La validation combine des tests de logique et un parcours navigateur avec contexte natif. Un rendu hors ligne vérifie le signal produit par les trois familles d’impacts et une boucle musicale complète : signal non nul, formes distinctes, raccord musical actif et absence de saturation. Les essais navigateur couvrent activation, volumes réels, persistance de la coupure, reprise et interface mobile.
