"use strict";

const Knob = require('./knob.js');
const M = require('./melodya.js');

const { Gpio } = require('onoff');
const {
    LedMatrix
 } = require('rpi-led-matrix');

const VolumeKnob = new Knob(19, 26);
const button = new Gpio(16, 'in', 'both');

const server = require('http').createServer();
const io = require('socket.io')(server);
const font = new M.Font(5, 8);
let temporaryScreen = -1;
let tSD = -1;
let currentVolume = 35;
let transitionVolume = currentVolume;
let isMuted = false;
let isVolumeProcess = false;

let matrix, UI, volume, volumeBar, volumeText;
const _matrix = new LedMatrix( {
    ...LedMatrix.defaultMatrixOptions(),
    rows: 16,
    cols: 32,
    pwmLsbNanoseconds: 300,
    pwmBits: 1,
}, {
    ...LedMatrix.defaultRuntimeOptions(),
    gpioSlowdown: 2,
});


const init = () => {
    matrix = new M.Matrix(_matrix, {
        width: 31, height: 10,
        offsetX: 1, offsetY: 1
    });

    UI = new M.Layer('ui', 10);
    matrix.addLayer(UI);
    volume = new M.Group('');

    volume.index = new M.Text('', font, 0x000000, {y: 1, x: 3});
    volume.bar = new M.Rectangle(0, 0, 0, 10, 0xFF0000);

    UI.add(volume);
    
    volume.add(volume.index).add(volume.bar);

    let image = new M.Image('src/assets/logo.gif', {x: 0, y: 0});

    image.onload = () => {UI.add(image);}

    matrix.render();
}

const visualizeVolume = () => {
    if(temporaryScreen != -1) {
        return;
    }
    temporaryScreen = setInterval(() => {
        if(transitionVolume === currentVolume) {
            clearInterval(temporaryScreen);
            temporaryScreen = -1;
            if(tSD === -1) {
                tSD = setTimeout(volume.hide, 2500);
            }
        }
        else {
            if(tSD != -1) {
                clearTimeout(tSD);
                tSD = -1;
            }
            if(transitionVolume > currentVolume) transitionVolume--;
            else transitionVolume++;
        }
        let progress = Math.round(transitionVolume/100*31);
        if(transitionVolume < 5) {
            progress = 0;
        }
        volume.bar.width = progress;
        volume.index.text = transitionVolume.toString();
    }, 6);
}

io.on('connection', client => {
    client.on('volume-init', (data) => {
        console.log('Connection established with volume control');
        currentVolume = data.volume;
    });
    client.on('disconnect', () => { /* … */ });
    init();

});
server.listen(3000);

console.log("Running...");

VolumeKnob.onchange = (delta) => {
    delta *= 5;
    if(currentVolume + delta > 100) {
        currentVolume = 100;
        visualizeVolume()
        return;
    }
    else if(currentVolume + delta < 0) { 
        currentVolume = 0;
        visualizeVolume()
        return;
    }
    io.sockets.emit("volume-add", {'delta': delta});
    currentVolume += delta;
    visualizeVolume();
}

button.watch((err, value) => {
    if(value == 0) return;
    isMuted = !isMuted;
    io.sockets.emit('volume-mute', isMuted ? 1 : 0);
});
