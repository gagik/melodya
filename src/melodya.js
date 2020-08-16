"use strict";
const MatrixFont = require('rpi-led-matrix').Font;

class Matrix {
    constructor (ledMatrix, {width, height, offsetX, offsetY}) {
        this.matrix = ledMatrix;
        this.width = width == undefined ? matrix.width() : width;
        this.height = height == undefined ? matrix.height() : height;
        this.offsetX = offsetX == undefined ? 0 : offsetX;
        this.offsetY = offsetY == undefined ? 0 : offsetY;
        this.layers = [];
    }
    addLayer(layer) {
        // if(!(layer instanceof Layer)) return false;
        layer.m = this;
        this.layers.push(layer);
        this.layers = this.layers
                          .sort((l1, l2) => (l1.z > l2.z) ? 1 : -1);
        return this;
    }
    render() {
        this.matrix.afterSync((mat, dt, t) => {
            this.matrix.clear();
            this.layers.forEach(layer => { layer.render() });
            setTimeout(() => this.matrix.sync(), 0);
        });
        this.matrix.sync();
    }
}

// Validation of element information
// Return true if unsuccessful
const validate = (x, type) => {
    switch(type) {
        case 'text':
            if(typeof x != 'string') return true;
            break;
        case 'number':
            if(typeof x != 'number') return true;
            break;
        case 'function':
            if(typeof x != 'function') return true;
            break;
        default:
            console.warn('Validation of unknown type');
            break;
    }
    return false;
}

class Group {
    constructor(name, z)
    {
        this.name = name;
        this.z = validate(z, 'number') ? 0 : z;
        this.hidden = false;
        this.m = undefined;
        this.elements = [];
    }
    add(element) {
        element.parent = this;
        if(this.m === undefined) console.warn('Group/layer not added to matrix.');
        element.m = this.m;
        this.elements.push(element);
        return this;
    }
    remove(element) {
        let index = this.elements.indexOf(this);
        if(index === -1) {
            console.warn('Removing a non-existent element');
            return;
        }
        this.elements.splice(index, 1);
        return this;
    }
    render() {
        this.elements.forEach(element => { element.render() });
        return this;
    }
}

class Layer extends Group {
    constructor(name, z)
    {
        super(name, z);
    }
}

class Element {
    constructor({
        x, y, aX, aY, width, color, height, parent, m,
        hidden
    }) 
    {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        // Anchor points from 0 to 1.
        this.aX = aX;
        this.aY = aY;
        this.hidden = hidden;
        this.render;
        Element.instances.push(this);
    }
    hide() {
        this.hidden = true;
    }
    show() {
        this.hidden = false;
    }
    remove() {
        if(this.parent === undefined) {
            console.warn('Removing an element without parent.');
            return;
        }
        this.parent = this.parent.remove(this);
    }
    get pX() {
        return this.m.offsetX + this.x - this.width * this.aX;
    }
    get pY() {
        return this.m.offsetY + this.y - this.height * this.aY;
    }
}

Element.instances = [];
Element.defaults = {
    x:0, y:0, aX:0, aY:0, width:0, height: 0,
    color: 0xFF0000, hidden: false,
    parent:undefined, m:undefined
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
    constructor(text, font, color, options) {
        if(validate(text, 'text')) 
            return;
        
        let width = text.length * font._width;
        let height = font._height;
        super({...Element.defaults, ...options, width, height, color});
        
        this.text = text;
        this.font = font;
    }
    render() {
        if(this.hidden) return;
        this.m.matrix.font(this.font)
              .fgColor(this.color)
              .drawText(this.text, this.pX, this.pY);
    }
}

class Rectangle extends Element {
    constructor(x, y, width, height, color, options) {
        
        super({...Element.defaults, ...options, width, height, color});
    }
    render() {
        if(this.width === 0 || this.height === 0) {
            return;
        }
        this.m.matrix
                .fgColor(this.color)
                .fill(this.pX, this.pY, 
                    this.pX + this.width - 1, 
                    this.pY + this.height - 1)
              
    }
}
const { GifUtil } = require('gifwrap');
class Image extends Element {

    constructor(src, options) {
        super({...Element.defaults, ...options});
        this.loaded = false;
        this.frames = [];
        this.delta = 0;
        GifUtil.read(src).then((gif) => {this.setup(this, gif)});
    }

    setup(image, gif) {

        image.width = gif.width;
        image.height = gif.height;

        let frameId = 0;
        gif.frames.forEach(frame => {
            const buf = frame.bitmap.data;
            let frameData = image.frames[frameId] = {};
            frame.scanAllCoords((x, y, bi) => {
                const r = buf[bi];
                const g = buf[bi + 1];
                const b = buf[bi + 2];
                const opacity = buf[bi + 3];

                if((r === 0 && g === 0 && b === 0) ||
                    opacity === 0) return;

                // Group frameData by hex
                let hex = (r << 16) + (g << 8) + b;
                frameData[hex] = !frameData[hex] ? [] : frameData[hex];

                frameData[hex].push({x, y});
            });
            frameId++;
        });


        image.loaded = true;

        if(!validate(this.onload, 'function')) this.onload(this);
    }

    render() {
        if(!this.loaded) return;
        this.delta++;
        let frameId = Math.floor(this.delta/20);

        if(frameId > this.frames.length - 1) {
            this.frames = this.frames.reverse();
            this.delta = 0;
            frameId = 0;
        }
        
        let frame = this.frames[frameId];

        for(let color of Object.keys(frame)) {
            let hex = parseInt(color);
            this.m.matrix.fgColor(hex);

            for(let position of frame[color]) {
                this.m.matrix.setPixel(this.pX + position.x, this.pY + position.y);
            }
        }
    }
}

module.exports = {
    Element,
    Text,
    Image,
    Group,
    Layer,
    Rectangle,
    Font,
    Matrix,
    validate
};