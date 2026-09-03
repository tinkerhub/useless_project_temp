const path = require('path');
const sound = require('sound-play');

function playRandomSound() {
  const sounds = ['sigh.mp3', 'laugh.mp3', 'fail.mp3'];
  const choice = sounds[Math.floor(Math.random() * sounds.length)];
  const filePath = path.join(__dirname, '../assets', choice);
  sound.play(filePath);
}

module.exports = { playRandomSound };
