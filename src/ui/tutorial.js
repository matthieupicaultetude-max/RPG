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
    classes:['Votre troupe, trois styles','Corps à corps, soutien et distance : essayez les trois héros avec la molette ou les boutons ci-dessous.'],
    move:['Faites vos premiers pas','ZQSD, WASD ou flèches : déplacer. Sur téléphone : joystick. Faites quelques pas pour continuer.'],
    ready:['Prêt pour le combat ?','Clic droit : attaquer. R et C : autres sorts. Esquivez les zones au sol ; cliquez sur une cible dorée pour répéter les derniers dégâts.'],
    combat:['Battez le slime d’entraînement','Attaquez au clic droit et sortez du cercle bleu avant son saut. Cette victoire vous fera gagner un niveau.'],
    stats:['Un niveau gagné : 5 points !','P → Répartition : dépensez les cinq points du héros qui a commencé le combat. Chaque caractéristique indique son effet.'],
    spells:['Votre premier sort Feu','K : choisissez un emplacement normal, puis équipez le sort Feu. Terre et Feu peuvent être équipés ensemble. Fermez avec Échap.'],
    bestiary:['Connaître son adversaire','B → famille Slime → Slime. Ouvrez Statistiques et réglez son niveau au-delà de 1. Les butins sont sur sa fiche. Fermez avec Échap.'],
    loot:['Du monstre à la panoplie','I : ouvrez le noyau Eau reçu pour obtenir une pièce de la panoplie Rosée. Les noyaux s’ouvrent partout.'],
    armor:['Votre première pièce d’équipement','Dans I, sélectionnez la pièce puis Équiper, ou faites Maj + clic sur sa case. Ses bonus s’ajoutent à votre héros.'],
    professions:['Les métiers de votre troupe','L : découvrez le Bûcheron et ses bois, débloqués aux niveaux 1, 5 et 10. L’XP métier est séparée de celle des héros. Fermez pour récolter.'],
    gather:['Récoltez deux bois de frêne','Cliquez sur les deux frênes et laissez finir la coupe. Une cible dorée à toucher en 1 seconde accélère la récolte. Bouger ou ouvrir un panneau interrompt la coupe.'],
    craft:['Votre première planche','Rejoignez la scierie. Métiers → Bûcheron → Fabriquer des planches : 2 bois de frêne donnent 1 planche.'],
    complete:['Prêt pour l’aventure !','Votre progression est conservée. Rejoignez le village avec le bouton ou utilisez F près de la porte à l’est.'],
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
    panel.innerHTML = `<small>PREMIERS PAS · ${stages.indexOf(t.step) + 1} / ${stages.length}</small><h2>${title}</h2><p>${body}</p>${t.step==='ready'?'<details class="ui-disclosure"><summary>Toutes les commandes</summary><p>Molette : changer de héros. E : combat à trois ou exploration à +50 % de vitesse. T : ultime personnel dès le niveau 5. Téléphone : joystick à gauche, sorts à droite, menu en haut.</p></details>':''}${t.step === "classes" ? `<p>${t.visited.length} / 3 personnages essayés</p><div class="tutorial-classes">${s.team.map((m, i) => `<button data-tutorial-main="${i}" aria-pressed="${s.main === i}">${["⚔ Corps à corps", "✧ Soutien", "➶ Distance"][i]}</button>`).join("")}</div>` : ""}${t.step === "move" ? `<progress max="55" value="${t.distance}" aria-label="Déplacement effectué"></progress>` : ""}<div>${action ? `<button data-tutorial="${action[0]}" ${t.step === "classes" && t.visited.length < 3 ? "disabled" : ""}>${action[1]}</button>` : ""}${["spells", "bestiary", "professions"].includes(t.step) ? `<button data-tutorial="next" ${(t.step === "spells" ? t.spellRead : t.step === "bestiary" ? t.bestiaryRead : t.professionsRead) ? "" : "disabled"}>Continuer</button>` : ""}${t.step === "gather" ? `<span>${t.harvested || 0} / 2 bois récoltés</span>` : ""}<button data-tutorial="skip">Passer le tutoriel</button></div>`;
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
