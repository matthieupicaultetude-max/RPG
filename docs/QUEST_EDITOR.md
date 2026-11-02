# Éditeur de quêtes

Ouvrir **Développement → Éditeur de carte → Quêtes**. Le jeu est suspendu pendant l’édition.

## Première quête

1. Choisir **Exemple jouable** : promenade au port, retour au donneur, 25 or et 20 XP de base.
2. Sélectionner un donneur existant, ou créer un **PNJ de quête**. Son nom, accueil et apparence sont modifiables ; **Placer sur la carte** choisit sa position au prochain clic. Le personnage doit être sur un terrain praticable, accessible par le bas.
3. Modifier le titre, les dialogues, les objectifs et récompenses. Cocher **Activer en jeu** ; décoché, le scénario reste un brouillon invisible aux joueurs.
4. **Vérifier**, puis **Appliquer et sauvegarder**. Fermer l’éditeur et rejoindre le PNJ au Comptoir. **F**, un clic sur le PNJ ou le **Journal de quêtes** permettent de parler et d’accepter.
5. Accomplir les objectifs, puis revenir au PNJ de validation. Cliquer sur **Valider l’étape**, ou **Terminer la quête** à la dernière étape.

Le journal est dans **Monde → Journal de quêtes**. Un `!` indique une quête disponible sur un habitant, un `?` une étape prête à être validée. Un objectif de conversation peut nécessiter de cliquer sur **Parler** dans le dialogue.

## Scénarios

Une quête contient jusqu’à vingt étapes réordonnables, chacune avec son dialogue, son PNJ de validation et jusqu’à huit objectifs. Tous les objectifs d’une étape doivent être remplis ; leur ordre est libre.

- **Conversation** : parler au PNJ désigné, au Comptoir.
- **Visite** : entrer dans un cercle, dans la zone choisie. La sélection sur carte concerne le Comptoir ; les autres zones utilisent leurs coordonnées mondiales (640 × 400).
- **Combat** : vaincre un nombre de monstres d’une espèce. Les invocations sans récompense ne comptent pas.
- **Objets** : posséder la quantité en sac, avec retrait optionnel au rendu. Les objets équipés ne comptent pas. Deux demandes identiques à remettre nécessitent leur quantité totale, retirée en une seule validation.
- **Récolte** : terminer des coupes du bois choisi.
- **Fabrication** : produire des planches, clés de donjon ou améliorations chromatiques.

Les événements comptent uniquement après l’acceptation et pendant l’étape concernée ; la possession d’objets est vérifiée en direct. Les récompenses (or, XP de base et objets du catalogue) sont attribuées à la fin, une seule fois par exécution. La sagesse s’applique à l’XP comme en combat.

Les prérequis combinent niveau minimum et quêtes déjà terminées. Les cycles sont refusés. Une quête répétable devient disponible après son délai en secondes, calculé depuis la dernière réussite. Abandonner conserve les réussites précédentes et ne donne aucune récompense.

## Sauvegarde et partage

Les quêtes et PNJ sont inclus dans le JSON de carte, l’import/export, l’historique Annuler/Rétablir et la sauvegarde locale `auroria-map-exile-v1`. Les cartes anciennes restent compatibles. **Carte d’origine** retire aussi les scénarios personnalisés ; l’historique permet d’annuler avant de fermer l’éditeur. **Nouveau port** conserve les scénarios.

La progression appartient au compte navigateur (`auroria-progress`), séparément des définitions de carte. Modifier une quête en cours recommence ses étapes et compteurs, en conservant l’historique de ses réussites. La désactiver masque son contenu sans effacer cet historique. **Réinitialiser mon test** efface uniquement le suivi de la quête sélectionnée ; les récompenses déjà reçues ne sont pas retirées. Cet outil sert au développement et permet de rejouer un scénario.

Les créations sont locales à ce navigateur. Exporter le JSON permet de les partager ; il faut intégrer ce contenu au projet pour le distribuer par défaut à tous les joueurs. Ce système n’ajoute pas de serveur de quêtes multijoueur.
