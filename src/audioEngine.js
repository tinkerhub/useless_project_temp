const path = require('path');
const player = require('play-sound')();

const sounds = {
    syntax: 'sigh.mp3',
    deletion: 'violin.mp3',
    inactivity: 'yawn.mp3'
};

function playSound(type) {
    const file = sounds[type];

    if (!file) {
        return;
    }

    const filePath = path.join(
        __dirname,
        '..',
        'assets',
        file
    );

    console.log('🔊 Playing:', file);

    try {
        player.play(filePath, function (error) {
            if (error) {
                console.error(
                    'Audio error:',
                    error.message
                );
            }
        });
    } catch (error) {
        console.error(
            'Audio error:',
            error.message
        );
    }
}

module.exports = {
    playSound
};