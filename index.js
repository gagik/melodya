const Knob = require('./knob.js');
const VolumeKnob = new Knob(19, 26);
const volume = require('./volume.js');

console.log("Good to go!");
VolumeKnob.onchange = (direction) => {
    console.log(direction);
    volume.getVolume().then(currentVol => {
        let newVol = currentVol + direction*3;
        volume.changeBy(5, direction);
    });
}