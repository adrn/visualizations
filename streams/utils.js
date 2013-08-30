/*
    Helper functions
*/

function gaussian(mean, std) {
  if (mean === undefined || std === undefined) {
    throw "Gaussian random needs 2 arguments (mean, standard deviation)";
  }
  return randByBoxMullerTransform() * std + mean;
}
 
// Box Muller
var useVal1 = true;
function randByBoxMullerTransform() {
  var alpha = Math.random(),
      beta = Math.random(),
      ret;
 
  if (useVal1 = !useVal1) {
    ret = Math.sqrt(-2 * Math.log(alpha)) * Math.sin(2 * Math.PI * beta);
  } else {
    ret = Math.sqrt(-2 * Math.log(alpha)) * Math.cos(2 * Math.PI * beta);
  }
  return ret;
}