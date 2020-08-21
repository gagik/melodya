"use strict";

const Knob = require('./lib/knob.js');
const M = require('./lib/melodya.js');

const { Gpio } = require('onoff');

const VolumeKnob = new Knob(19, 26);
const button = new Gpio(16, 'in', 'both');

const server = require('http').createServer();
const io = require('socket.io')(server);
const Sound = require('./lib/soundcontrol.js')(io);
io.sockets.on('connection', (client) => { Sound.handler(client, Sound);});
const OS = require('./os.js')(Sound);
Sound.onsetup = () => {OS.init()};

let temporaryScreen = -1;
let tSD = -1;
// let transitionVolume = currentVolume;
let isMuted = false;

let matrix, UI, volume, volumeBar, volumeText;

// const visualizeVolume = () => {
//     if(temporaryScreen != -1) {
//         return;
//     }
//     temporaryScreen = setInterval(() => {
//         if(transitionVolume === currentVolume) {
//             clearInterval(temporaryScreen);
//             temporaryScreen = -1;
//             if(tSD === -1) {
//                 tSD = setTimeout(volume.hide, 2500);
//             }
//         }
//         else {
//             if(tSD != -1) {
//                 clearTimeout(tSD);
//                 tSD = -1;
//             }
//             if(transitionVolume > currentVolume) transitionVolume--;
//             else transitionVolume++;
//         }
//         let progress = Math.round(transitionVolume/100*31);
//         if(transitionVolume < 5) {
//             progress = 0;
//         }
//         volume.bar.width = progress;
//         volume.index.text = transitionVolume.toString();
//     }, 6);
// }

server.listen(3000);

console.log("Running...");
let currentVolume = 35;

VolumeKnob.onchange = (delta) => {
    delta *= 5;
    if(currentVolume + delta > 100) {
        currentVolume = 100;
        return;
    }
    else if(currentVolume + delta < 0) { 
        currentVolume = 0;
        return;
    }
    io.sockets.emit("volume-add", {'delta': delta});
    currentVolume += delta;
}

button.watch((err, value) => {
    if(value == 0) return;
    isMuted = !isMuted;
    io.sockets.emit('volume-mute', isMuted ? 1 : 0);
});