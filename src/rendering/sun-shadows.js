// Static silhouettes are projected once per map / harvested-tree state.
const caches = new WeakMap();
export function drawSunShadows(ctx, environment, state) {
  const key = state.trees
    .filter((tree) => tree.respawn > 0)
    .map((tree) => tree.id)
    .join(",");
  let cached = caches.get(environment);
  if (!cached || cached.key !== key) {
    const mask = document.createElement("canvas");
    mask.width = environment.ground.width;
    mask.height = environment.ground.height;
    const g = mask.getContext("2d");
    g.imageSmoothingEnabled = false;
    for (const prop of environment.props) {
      if (
        ![
          "exile-city-gate","exile-rampart-tower","exile-rampart","exile-gate","exile-crane","exile-house","exile-lamp","exile-fountain","exile-stall","tree",
          "house","workshop",
          "petshop",
          "market",
          "sawmill",
          "bench",
          "fountain",
        "windmill","mushroom","mountain-boulder","mountain-ridge",
          "sign",
        ].includes(prop.kind)
      )
        continue;
      const felled =
        prop.kind === "tree" &&
        state.trees.some((tree) => tree.id === prop.id && tree.respawn > 0);
      g.save();
      g.translate(prop.x, prop.y);
      g.transform(1, 0, -0.7, -0.32, 0, 0);
      g.translate(-prop.x, -prop.y);
      prop.draw(g, felled);
      g.restore();
    }
    g.globalCompositeOperation = "source-in";
    g.fillStyle = "#343952";
    g.fillRect(0, 0, mask.width, mask.height);
    cached = { key, mask };
    caches.set(environment, cached);
  }
  ctx.save();
  ctx.beginPath();
  environment.land.forEach(([x, y], i) =>
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y),
  );
  ctx.closePath();
  ctx.clip();
  ctx.globalAlpha = 0.23;
  ctx.filter = "blur(1px)";
  if(state.zone==='exile'){
    const transform=ctx.getTransform(),x=Math.max(0,Math.floor(-transform.e)-16),y=Math.max(0,Math.floor(-transform.f)-16),w=Math.min(672,cached.mask.width-x),h=Math.min(432,cached.mask.height-y);
    ctx.drawImage(cached.mask,x,y,w,h,x,y,w,h);
  }else ctx.drawImage(cached.mask, 0, 0);
  ctx.filter = "none";
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#343952";
  const people = [
    ...state.team.filter(
      (p, i) => p.hp > 0 && (i === state.main || state.deployed),
    ),
    ...state.bots,
    ...state.npcs,
    ...state.monsters.filter((m) => m.hp > 0),
  ];
  for (const p of people) {
    ctx.beginPath();
    ctx.ellipse(
      Math.round(p.x + 9),
      Math.round(p.y + 6),
      p.species ? 16 : 14,
      3,
      0.5,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}
