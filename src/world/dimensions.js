import { MAP_SIZE as EXILE_SIZE } from "./exile-map.js";
import { SCENE } from "../game/config.js";
export const worldSize = (zone) => (zone === "exile" ? EXILE_SIZE : SCENE);
