# Melodya

This is the code for **Project Melodya**, where I am turning an old Soviet radio into a Spotify speaker with a LED matrix and webapp control.

To do this, I am using a a Rasberry Pi, an [Adafruit 16x32 RGB LED matrix panel](https://www.adafruit.com/product/420), a couple of rotary encoders, a hacked JBL Go speaker connected through AUX, and, obviously, the radio itself.

I could have connected the old speaker in the radio to the Raspberry Pi itself but its age and form factor were not a great fit for the build.

## Setup
Note: this project is **WIP**, the setup steps are prone to change and at the moment are for reference only.
1. Create a Python 3 virtual environment called `venv`.
2. Install Python dependencies with `source venv/bin/activate` then `pip3 install -r requirements.txt`.
3. Install NodeJS dependencies with `npm install`.
4. Start the service with `npm run start`.

I ran into issues installing the `pyalsaaudio` dependency, this was fixed with `sudo apt-get install -y python3-dev libasound2-dev gcc g++ make`; all of these are necessary to compile the library from source.

## Sound, NodeJS, and the LED Matrix
Controlling volume of Raspberry Pi in NodeJS can be accomplished through a couple of ways. The simplest (and arguably most effective) way to just spawn a child process either running a Python script or a bash command like `amixer`. This seemed to work great on its own but for a very odd reason when using the LED matrix library access to amixer's speaker devices would disappear in the program scope. I thought this could be fixed by setting environment variables but the issue seems to occur when the LED matrix library is given root permissions. For those curious, I left a child process-based approach to sound control in `unused/volume_cmd.js`. 

Luckily, despite blocking access to the speaker for child processes of the node program, a parallel python script is still able to change and get the volume of the speaker. With this, we are left with the issue of communicating between the NodeJS process and the python one. As this program was going to use `socket.io` for its webserver anyways, a simple way to get python communication would be through a python `socket.io-client` library, which is what is being used right now. 

