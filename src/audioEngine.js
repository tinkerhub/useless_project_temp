const path = require('path');
const sound = require('sound-play');

function playSound(fileName) {
  const filePath = path.join(__dirname, '../assets', fileName);
  sound.play(filePath);
}

module.exports = { playSound };

