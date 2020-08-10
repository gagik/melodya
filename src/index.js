"use strict";

const Knob = require('./knob.js');
const M = require('./melodya.js');
// const Volume = require('./volume.js');
const { Gpio } = require('onoff');
const { basename } = require('path');
const {
    LedMatrix,
    Font
 } = require('rpi-led-matrix');
const server = require('http').createServer();
const io = require('socket.io')(server);
const VolumeKnob = new Knob(19, 26);
const button = new Gpio(16, 'in', 'both');
const { exec } = require('child_process');
// const font = new Font('5x8', './src/fonts/5x8.bdf');
const font = new M.Font(5, 8);
let temporaryScreen = -1;
let tSD = -1;
let currentVolume = 35;
let transitionVolume = currentVolume;
let isMuted = false;
let isVolumeProcess = false;
const clearTempDisplay = () => {
    matrix.clear().sync();
}

const matrix = new LedMatrix( {
    ...LedMatrix.defaultMatrixOptions(),
    rows: 16,
    cols: 32,
    pwmLsbNanoseconds: 500,
    pwmBits: 1,
}, {
    ...LedMatrix.defaultRuntimeOptions(),
    gpioSlowdown: 2,
});


const init = () => {
    M.init(matrix, {
        width: 31, height: 10,
        offsetX: 1, offsetY: 1
    });
    matrix.afterSync((mat, dt, t) => {
        M.Element.instances.forEach(element => {
          element.render();
        });
      
        setTimeout(() => matrix.sync(), 0);
    });
    const text = new M.Text('hello!', 0xFF0000, font);
    matrix.sync();
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
                tSD = setTimeout(clearTempDisplay, 2500);
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
        const progress = Math.round(transitionVolume/101*31);
        if(progress === 0) {
            matrix.clear().sync();
            return;
        }
        matrix.clear()
        .fgColor(0xFF0000)
        .fill(0, 0, progress, 10)
        .font(font)
        .fgColor(0x000000)
        .drawText(transitionVolume.toString(), 3, 3)
        .sync();
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
    if(currentVolume + delta > 100 ||
       currentVolume + delta < 0) { 
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
