import {
  beginTutorial,
  startTutorialFight,
  stepTutorial,
  finishTutorial,
  advanceTutorial,
  approachTutorialSawmill,
} from "../game/tutorial.js";
import { requestCut } from "../game/woodcutting.js";
import { canWalkZone } from "../world/zones.js";
import { chooseMain, note } from "../dev/sandbox.js";
export function createTutorialUI(app, game, openPanel) {
  const panel = document.createElement("aside");
  panel.className = "tutorial";
  panel.setAttribute("aria-label", "Tutoriel guidé");
  app.querySelector(".game-screen").append(panel);
  beginTutorial(game.state);
  let signature = "";
  const text = {
    classes: [
      "Votre troupe, trois styles",
      "Aëlan combat au corps à corps. Liora soutient, soigne et protège. Sylas attaque à distance. Essayez chacun avec la molette sur le terrain ou les portraits à gauche.",
    ],
    move: [
      "Faites vos premiers pas",
      "Déplacez-vous avec ZQSD, WASD ou les flèches. Sur mobile, utilisez le joystick en bas à gauche. Parcourez quelques pas pour continuer.",
    ],
    ready: [
      "Prêt pour le combat ?",
      "Visez à la souris et attaquez au clic droit. R et C lancent les autres sorts équipés. Cliquez gauche sur une cible dorée pour répéter les derniers dégâts ! Le combat est le mode initial : vos trois personnages sont déployés. E bascule librement en exploration (un personnage, vitesse +50 %) ou en combat (troupe déployée, vitesse normale). T est l’ultime personnel, à débloquer dès le niveau 5. Sur mobile, déplacez-vous avec le joystick à gauche, touchez les sorts à droite et ouvrez les panneaux depuis le petit menu en haut à droite.",
    ],
    combat: [
      "Battez le slime d’entraînement",
      "Le slime devant vous inflige peu de dégâts. Il se comprime et un cercle bleu annonce son saut : sortez-en avant l’atterrissage ! Approchez-vous, visez-le et utilisez le clic droit. Il vous donnera assez d’XP pour monter de niveau !",
    ],
    stats: [
      "Un niveau gagné : 5 points !",
      "Ouvrez les caractéristiques (P) et dépensez tous les points du héros qui a commencé le combat. Force → Terre, Intelligence → Feu, Agilité → Air, Chance → Eau. Vitalité augmente les PV ; Sagesse augmente l’XP. La fontaine permet de tout réinitialiser.",
    ],
    spells: [
      "Votre premier sort Feu",
      "Ouvrez le grimoire (K). Au niveau 2, votre premier sort Feu est débloqué. Sélectionnez un des trois emplacements normaux, puis équipez le sort Feu depuis sa fiche. Clic droit, R ou C pour le lancer selon l’emplacement choisi. Vous pouvez mélanger Terre et Feu ! Fermez ensuite le grimoire avec Échap et continuez vers le bestiaire. Un sort par niveau ; un ultime au choix tous les 5 niveaux.",
    ],
    bestiary: [
      "Connaître son adversaire",
      "Ouvrez le bestiaire (B), sélectionnez le Slime, puis déplacez la barre de niveau au-delà de 1. Observez ses PV, dégâts, XP et butins : la barre permet de préparer un combat sans modifier les monstres de la carte. Fermez avec Échap pour continuer.",
    ],
    loot: [
      "Du monstre à la panoplie",
      "Le slime vous a donné un noyau Eau garanti pour cette initiation. Habituellement, le noyau est un butin bonus à 25 %, lié à l’élément et à la tranche de niveau du monstre. Où que vous soyez, ouvrez I, sélectionnez ce noyau et cliquez « Ouvrir le noyau » : une pièce aléatoire de la panoplie Rosée vous attend.",
    ],
    armor: [
      "Votre première pièce d’équipement",
      "Dans I, sélectionnez la pièce obtenue et cliquez « Équiper », ou faites Maj + clic sur sa case. Les panoplies apportent les caractéristiques de leur élément. Les noyaux donnent des pièces standards, parfois en doublon. Borin reprend une pièce normale contre un fragment ; 10 fragments identiques donnent un noyau. Les pièces chromatiques se fabriquent à la forge avec une pièce et des ressources.",
    ],
    professions: [
      "Les métiers de votre troupe",
      "Ouvrez Métiers (L) pour découvrir le bûcheron. Récolter et fabriquer donnent de l’XP métier, séparée de l’XP de combat. Les coupes accélèrent avec le niveau : Frêne au niveau 1, Châtaignier au niveau 5, Noyer au niveau 10. Fermez le panneau pour passer à la pratique.",
    ],
    gather: [
      "Récoltez deux bois de frêne",
      "Cliquez sur les deux frênes du petit bosquet au sud, ou utilisez le bouton ci-dessous pour rejoindre le prochain arbre. Laissez la coupe se terminer. Une cible dorée apparaît pendant 1 seconde : un clic gauche réussi accélère la coupe. Les arbres repoussent ; bouger ou ouvrir un menu interrompt la récolte.",
    ],
    craft: [
      "Votre première planche",
      "Rejoignez la scierie de l’île puis ouvrez Métiers (L ou F). Fabriquez 1 Planche de frêne avec vos 2 Bois de frêne : la fabrication donne aussi de l’XP métier. Plus tard, cinq planches serviront à améliorer une pièce d’armure en chromatique à la forge.",
    ],
    complete: [
      "Prêt pour l’aventure !",
      "Vous savez combattre, progresser, consulter le bestiaire, obtenir une armure et récolter puis fabriquer. Rejoignez le village avec le bouton ci-dessous, ou utilisez F près de la porte à l’est. Vos équipements, caractéristiques, sorts et progrès de bûcheron sont conservés.",
    ],
  };
  const stages = Object.keys(text);
  function update() {
    const s = game.state;
    stepTutorial(s);
    const t = s.tutorial;
    const key = `${t.step}:${t.spellRead}:${t.bestiaryRead}:${t.professionsRead}:${t.harvested}:${s.main}:${t.visited.length}:${Math.floor(t.distance / 10)}`;
    if (signature === key) return;
    signature = key;
    if (!text[t.step]) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    const [title, body] = text[t.step];
    const action = {
      classes: ["move", "Continuer"],
      ready: ["fight", "Affronter le slime"],
      stats: ["stats", "Répartir mes points"],
      spells: ["spells", "Voir mon nouveau sort"],
      bestiary: ["bestiary", "Consulter le bestiaire"],
      loot: ["equipment", "Ouvrir mon sac"],
      armor: ["equipment", "Équiper ma pièce"],
      professions: ["professions", "Découvrir les métiers"],
      gather: ["cut", "Rejoindre et couper un frêne"],
      craft: ["sawmill", "Rejoindre la scierie"],
      complete: ["finish", "Terminer · Rejoindre le village"],
    }[t.step];
    panel.innerHTML = `<small>PREMIERS PAS · ${stages.indexOf(t.step) + 1} / ${stages.length}</small><h2>${title}</h2><p>${body}</p>${t.step === "classes" ? `<p>${t.visited.length} / 3 personnages essayés</p><div class="tutorial-classes">${s.team.map((m, i) => `<button data-tutorial-main="${i}" aria-pressed="${s.main === i}">${["⚔ Corps à corps", "✧ Soutien", "➶ Distance"][i]}</button>`).join("")}</div>` : ""}${t.step === "move" ? `<progress max="55" value="${t.distance}" aria-label="Déplacement effectué"></progress>` : ""}<div>${action ? `<button data-tutorial="${action[0]}" ${t.step === "classes" && t.visited.length < 3 ? "disabled" : ""}>${action[1]}</button>` : ""}${["spells", "bestiary", "professions"].includes(t.step) ? `<button data-tutorial="next" ${(t.step === "spells" ? t.spellRead : t.step === "bestiary" ? t.bestiaryRead : t.professionsRead) ? "" : "disabled"}>Continuer</button>` : ""}${t.step === "gather" ? `<span>${t.harvested || 0} / 2 bois récoltés</span>` : ""}<button data-tutorial="skip">Passer le tutoriel</button></div>`;
  }
  function click(event) {
    const member = event.target.closest("[data-tutorial-main]")?.dataset
      .tutorialMain;
    if (member !== undefined) {
      chooseMain(game.state, Number(member));
      game.refresh();
      update();
      return;
    }
    const action = event.target.closest("[data-tutorial]")?.dataset.tutorial;
    if (!action) return;
    const s = game.state,
      t = s.tutorial;
    if (action === "move" && t.visited.length === 3) {
      t.step = "move";
      t.previous = { ...s.player };
    }
    if (action === "fight" && t.step === "ready") {
      openPanel(false);
      startTutorialFight(s);
    }
    if (action === "stats" || action === "spells") {
      chooseMain(s, t.member);
      openPanel(true, action === "stats" ? "characteristics" : "spells");
    }
    if (["bestiary", "equipment", "professions"].includes(action))
      openPanel(true, action);
    if (action === "next") advanceTutorial(s);
    if (action === "sawmill" && approachTutorialSawmill(s))
      openPanel(true, "professions");
    if (action === "cut" && t.step === "gather") {
      const tree = s.trees
        .filter((tree) => tree.respawn === 0)
        .sort(
          (a, b) =>
            Math.hypot(a.x - s.player.x, a.y - s.player.y) -
            Math.hypot(b.x - s.player.x, b.y - s.player.y),
        )[0];
      if (tree) requestCut(s, tree.id, (x, y) => canWalkZone(x, y, s.zone));
    }
    if (action === "skip") {
      finishTutorial(s, true);
      openPanel(false);
    }
    if (action === "finish" && t.step === "complete") {
      finishTutorial(s);
      note(s, "Tutoriel terminé ! Explorez le jardin avec votre troupe.");
      openPanel(false);
    }
    game.refresh();
    update();
    if (
      ![
        "stats",
        "spells",
        "equipment",
        "bestiary",
        "professions",
        "sawmill",
      ].includes(action)
    )
      app.querySelector("canvas").focus({ preventScroll: true });
  }
  app.addEventListener("click", click);
  function observe(event) {
    const t = game.state.tutorial;
    if (t.step !== "spells" || game.state.main !== t.member) return;
    const slot = event.target.closest("[data-spell-slot]");
    if (!t.manualSpell && slot?.dataset.spellSlot === "1") {
      t.spellRead = true;
      const button = panel.querySelector('[data-tutorial="next"]');
      if (button) {
        button.disabled = false;
        button.textContent = "Continuer";
      }
    }
  }
  app.addEventListener("click", observe);
  update();
  return {
    update,
    destroy() {
      app.removeEventListener("click", click);
      app.removeEventListener("click", observe);
      panel.remove();
    },
  };
}
