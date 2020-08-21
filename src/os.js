// Not actually an OS, more like a matrix navigator

const M = require('./lib/melodya.js');
const {
    LedMatrix
 } = require('rpi-led-matrix');
 const { exec } = require('child_process');
let matrix;
let Sound = S = {};
let Layer = L = {};

const bootupScreen = () => {
    let logo = new M.Image('src/assets/bootup.gif', {}, {x: 0, y:0});
    logo.on('load', () => {
        logo.hide();
        L.UI.add(logo);
    });
    Sound.playFile('startup.wav', () => {
        logo.show();
    });
}

const init = (soundControl) => {
    const _matrix = new LedMatrix( {
        ...LedMatrix.defaultMatrixOptions(),
        rows: 16,
        cols: 32,
        pwmLsbNanoseconds: 500,
        pwmBits: 1,
    }, {
        ...LedMatrix.defaultRuntimeOptions(),
        gpioSlowdown: 2,
    });

    matrix = new M.Matrix(_matrix, {
        width: 31, height: 10,
        offsetX: 1, offsetY: 1
    });

    Sound = soundControl;

    Layer.UI = new M.Layer('ui', 10);
    Layer.Graphics = new M.Layer('graphics', 0);

    matrix.addLayer(L.UI)
          .addLayer(L.Graphics)
          .render();

    bootupScreen();
}

module.exports = (soundControl) => {
    return {
        init: () => {init(soundControl)}
    };
}
