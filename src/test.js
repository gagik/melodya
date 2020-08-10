const VolumeKnob = new Knob(19, 26);

tKnob.onchange = (direction) => console.log(direction);
VolumeKnob.onchange = (direction) => {
    // matrix.clear()
    // .fgColor(0x0000FF)
    // .drawText('100', 6, 2)
    // .sync();
    Volume.changeBy(6, direction);
}