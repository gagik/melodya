const DEFAULT_VOLUME = 35;

class Sound {
    constructor(io) {
        this.io = io;
        this.volume = DEFAULT_VOLUME;
        this.onsetup = false;
        this.fileCallback = {};
    }
    set volume(newVolume) {

    }

    playFile(src, callback) {
        src = 'src/assets/' + src;
        this.io.sockets.emit('sound-play', src);
        this.fileCallback[src] = callback;
    }

    handler(client, sound) {
        client.on('sound-setup', (data) => {
            console.log('Connection established with volume control');
            if(typeof sound.onsetup === 'function') sound.onsetup(this.volume);
        });
        client.on('sound-loaded', (filename) => {
            let callback = sound.fileCallback[filename];
            if(typeof callback === 'function')
                callback(filename);
        })
    }
}

module.exports = (io) => {return new Sound(io)};