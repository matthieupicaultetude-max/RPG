import { drawAdventurer } from "../rendering/actors.js";
export function characterArt(member, portrait = false) {
  return `<canvas class="${portrait ? "class-portrait" : "paper-avatar"}" data-character-art="${member.id}" width="${portrait ? 36 : 120}" height="${portrait ? 52 : 170}" role="img" aria-label="Apparence de ${member.name}"></canvas>`;
}
export function paintCharacterArt(root, team) {
  for (const canvas of root.querySelectorAll("[data-character-art]")) {
    const member = team.find(
      (member) => member.id === Number(canvas.dataset.characterArt),
    );
    if (!member) continue;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    const scale = Math.max(
      1,
      Math.floor(Math.min(canvas.width / 36, (canvas.height - 8) / 46)),
    );
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(Math.floor(canvas.width / 2), canvas.height - 9 * scale);
    ctx.scale(scale, scale);
    drawAdventurer(
      ctx,
      { ...member, x: 0, y: 0, facing: "down", moving: false },
      0,
    );
    ctx.restore();
  }
}
