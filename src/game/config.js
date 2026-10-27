export const SCENE = Object.freeze({ width: 640, height: 400, speed: 85, margin: 12 });
export const SPAWN = Object.freeze({ x: 320, y: 220 });

export const playerSpeed = state => SCENE.speed * (state.deployed === false ? 1.5 : 1);
