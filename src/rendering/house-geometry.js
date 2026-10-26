// One projected gable roof. Both slopes share the same ridge and front eaves.
const backRidge = [106, 7];
const frontRidge = [110, 30];
const backLeft = [46, 42];
const frontLeft = [50, 65];
const backRight = [166, 42];
const frontRight = [170, 65];
export const HOUSE_ROOF = Object.freeze({
  left: [backLeft, backRidge, frontRidge, frontLeft],
  right: [backRidge, backRight, frontRight, frontRidge],
  gable: [frontLeft, frontRidge, frontRight],
  frontTrim: [frontLeft, frontRidge, frontRight],
  ridge: [backRidge, frontRidge],
});
