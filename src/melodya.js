"use strict";
const MatrixFont = require('rpi-led-matrix').Font;
let matrix, width, height, offsetX, offsetY;

const init = (ledMatrix, {width, height, offsetX, offsetY}) => {
    matrix = ledMatrix;
    width = width == undefined ? matrix.width() : width;
    height = height == undefined ? matrix.height() : height;
    offsetX = offsetX == undefined ? 0 : offsetX;
    offsetY = offsetY == undefined ? 0 : offsetY;
}

// Validation of element information
// Return true upon true
const validate = (x, type) => {
    switch(type) {
        case 'text':
            if(typeof x != 'string') return true;
            break;
        default:
            console.warn('Validation of unknown type');
            break;
    }
    return false;
}

class Element {
    constructor({
        x, y, aX, aY, width, height
    }) 
    {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        // Anchor points from 0 to 1.
        this.aX = aX;
        this.aY = aY;
        this.render;
        Element.instances.push(this);
    }
    get pX() {
        return offsetX + this.x - this.width * this.aX;
    }
    get pY() {
        return offsetY + this.y - this.height * this.aY;
    }
}

Element.instances = [];
Element.defaults = {
    x:0, y:0, aX:0, aY:0
}

class Font extends MatrixFont {
    constructor(width, height) {
        // Use width & height for sourcing.
        super(
            `${width}x${height}`,
            `./src/fonts/${width}x${height}.bdf`
        );

        this._width = width;
        this._height = height;
    }
}

class Text extends Element {
    constructor(text, color, font, options) {
        if(validate(text, 'text')) 
            return;
        
        let width = text.length * font._width;
        let height = font._height;
        super({...Element.defaults, ...options, width, height});
        
        this.text = text;
        this.font = font;
        this.color = color;
    }
    render() {
        matrix.font(this.font)
              .fgColor(this.color)
              .drawText(this.text, this.pX, this.pY);
    }
}

module.exports = {
    Element,
    Text,
    Font,
    init,
    validate
};