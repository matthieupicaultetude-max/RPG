export function viewport(width, height, player) {
  const scale = Math.max(width / 640, height / 400);
  const viewWidth = width / scale, viewHeight = height / scale;
  return {
    scale, viewWidth, viewHeight,
    x: Math.max(0, Math.min(640 - viewWidth, player.x - viewWidth / 2)),
    y: Math.max(0, Math.min(400 - viewHeight, player.y - viewHeight / 2)),
  };
}
export function screenToWorld(clientX, clientY, rect, player) {
  const view = viewport(rect.width, rect.height, player);
  return { x: view.x + (clientX - rect.left) / view.scale, y: view.y + (clientY - rect.top) / view.scale };
}
