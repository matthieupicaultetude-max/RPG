import { SCENE } from "../game/config.js";

export function viewport(width, height, player, bounds = SCENE) {
  const scale = Math.max(
    1,
    Math.ceil(Math.max(width / SCENE.width, height / SCENE.height)),
  );
  const viewWidth = width / scale,
    viewHeight = height / scale;
  return {
    scale,
    viewWidth,
    viewHeight,
    x: Math.floor(
      Math.max(0, Math.min(bounds.width - viewWidth, player.x - viewWidth / 2)),
    ),
    y: Math.floor(
      Math.max(
        0,
        Math.min(bounds.height - viewHeight, player.y - viewHeight / 2),
      ),
    ),
  };
}
export function screenToWorld(clientX, clientY, rect, player, bounds = SCENE) {
  const view = viewport(rect.width, rect.height, player, bounds);
  return {
    x: view.x + (clientX - rect.left) / view.scale,
    y: view.y + (clientY - rect.top) / view.scale,
  };
}
