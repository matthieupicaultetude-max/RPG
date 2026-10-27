import {
  beginTutorial,
  startTutorialFight,
  stepTutorial,
  finishTutorial,
} from "../game/tutorial.js";
import { chooseMain, teleport, note } from "../dev/sandbox.js";
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
      "Déplacez-vous avec ZQSD, WASD ou les flèches. Sur mobile, utilisez les flèches tactiles. Parcourez quelques pas pour continuer.",
    ],
    ready: [
      "Prêt pour le combat ?",
      "Visez à la souris et attaquez au clic droit. R et C lancent les autres sorts équipés. Cliquez gauche sur une cible dorée pour répéter les derniers dégâts ! E réunit la troupe 30 s, puis recharge 5 min. T est l’ultime personnel, à débloquer dès le niveau 5. Sur mobile, touchez les sorts en bas.",
    ],
    combat: [
      "Battez le slime d’entraînement",
      "Le slime devant vous inflige peu de dégâts. Approchez-vous, visez-le et utilisez le clic droit. Il vous donnera assez d’XP pour monter de niveau !",
    ],
    stats: [
      "Un niveau gagné : 5 points !",
      "Ouvrez les caractéristiques (P) et dépensez tous les points du héros qui a commencé le combat. Force → Terre, Intelligence → Feu, Agilité → Air, Chance → Eau. Vitalité augmente les PV ; Sagesse augmente l’XP. La fontaine permet de tout réinitialiser.",
    ],
    spells: [
      "Votre premier sort Feu",
      "Ouvrez le grimoire (K). Au niveau 2, votre premier sort Feu est débloqué. Sélectionnez un des trois emplacements normaux, puis équipez le sort Feu depuis sa fiche. Clic droit, R ou C pour le lancer selon l’emplacement choisi. Vous pouvez mélanger Terre et Feu ! Fermez ensuite le grimoire avec Échap pour terminer le guide. Un sort par niveau ; un ultime au choix tous les 5 niveaux.",
    ],
  };
  const stages = Object.keys(text);
  function update() {
    const s = game.state;
    stepTutorial(s);
    const t = s.tutorial;
    const key = `${t.step}:${t.spellRead}:${s.main}:${t.visited.length}:${Math.floor(t.distance / 10)}`;
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
    }[t.step];
    panel.innerHTML = `<small>PREMIERS PAS · ${stages.indexOf(t.step) + 1} / 6</small><h2>${title}</h2><p>${body}</p>${t.step === "classes" ? `<p>${t.visited.length} / 3 personnages essayés</p><div class="tutorial-classes">${s.team.map((m, i) => `<button data-tutorial-main="${i}" aria-pressed="${s.main === i}">${["⚔ Corps à corps", "✧ Soutien", "➶ Distance"][i]}</button>`).join("")}</div>` : ""}${t.step === "move" ? `<progress max="55" value="${t.distance}" aria-label="Déplacement effectué"></progress>` : ""}<div>${action ? `<button data-tutorial="${action[0]}" ${t.step === "classes" && t.visited.length < 3 ? "disabled" : ""}>${action[1]}</button>` : ""}${t.step === "spells" ? `<button data-tutorial="finish" ${t.spellRead ? "" : "disabled"}>${t.spellRead ? "Terminer · À vous l’aventure !" : "Équiper le sort Feu pour terminer"}</button>` : ""}<button data-tutorial="skip">Passer le tutoriel</button></div>`;
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
      teleport(s, "combat");
      startTutorialFight(s);
    }
    if (action === "stats" || action === "spells") {
      chooseMain(s, t.member);
      openPanel(true, action === "stats" ? "characteristics" : "spells");
    }
    if (action === "skip") {
      finishTutorial(s, true);
      openPanel(false);
    }
    if (action === "finish" && t.spellRead) {
      finishTutorial(s);
      note(s, "Tutoriel terminé ! Explorez le jardin avec votre troupe.");
      openPanel(false);
    }
    game.refresh();
    update();
    if (!["stats", "spells"].includes(action))
      app.querySelector("canvas").focus({ preventScroll: true });
  }
  app.addEventListener("click", click);
  function observe(event) {
    const t = game.state.tutorial;
    if (t.step !== "spells" || game.state.main !== t.member) return;
    const slot = event.target.closest("[data-spell-slot]");
    if (!t.manualSpell && slot?.dataset.spellSlot === "1") {
      t.spellRead = true;
      const button = panel.querySelector('[data-tutorial="finish"]');
      if (button) {
        button.disabled = false;
        button.textContent = "Terminer · À vous l’aventure !";
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
