/* This reads a rotary encoder with node.js
   The idea for the logic came from
	 https://www.youtube.com/watch?v=hFpSwfKw5G0
*/

const Gpio = require('onoff').Gpio;

class Knob {
    constructor(gpio1, gpio2, ticksNeeded) {
        this.gpio = 
        this._buttonA = new Gpio(gpio1, 'in', 'both');
        this._buttonB = new Gpio(gpio2, 'in', 'both');
        this.a = 0 // GPIO 1 val
        this.b = 0 // GPIO 2 val
        this.v = 0 //value to increment/decrement
        this.ticks = 0;
        this.needed = 1;

        this._buttonB.watch((err, value) => {
            if (err) {
              throw err;
            }
            this.a = value;	
          });
        this._buttonA.watch((err, value) => {
            if (err) {
              throw err;
            }
              this.b = value;
              //only evaluate if a = 1
              if (this.a == 1 && this.b == 1) {
                this.ticks++;
                if(!!this.onchange && this.ticks >= this.needed) {
                  this.onchange(+1);
                  this.ticks = 0;
                }
              } else if (this.a==1 && this.b==0) {
                this.ticks--;
                if(!!this.onchange && this.ticks <= -this.needed) {
                  this.onchange(-1);
                  this.ticks = 0;
                }
              }
          });
          process.on('SIGINT', () => this.exit(this));
    }
    exit(that) {
      that._buttonA.unexport();
      process.exit();
    }
}

module.exports = Knob;

//Watch for hardware interrupt of switch 1

//Watch for hardware interrupt of switch 2
// button2.watch(function (err, value) {
//   if (err) {
//     throw err;
//   }
// 	b = value;

// 	//only evaluate if a = 1
// 	if (a == 1 && b == 1) {

// 	} else if (a==1 && b==0) {
// 	}
// });

