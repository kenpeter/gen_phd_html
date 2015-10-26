/*
function isUpperCase(str) {
  return str === str.toUpperCase();
}


var input = "A BATTLE OF TONGUES: THE LEGACY OF ARABISM AND LEBANISM IN TELEVISION MEDIA IN THE LINGUISTIC STRUGGLE FOR THE 'FACE' OF LEBANON";

if(isUpperCase(input)) {
  console.log("Yes, up");
}
else {
  console.log("Yes, down");
}
*/

var changeCase = require('change-case');

var input = "A BATTLE OF TONGUES: THE LEGACY OF ARABISM AND LEBANISM IN TELEVISION MEDIA IN THE LINGUISTIC STRUGGLE FOR THE 'FACE' OF LEBANON.";

if(input.match(/\.$/)) {
  console.log('com')
}
else {
  console.log('no com');
}
