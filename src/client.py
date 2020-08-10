import alsaaudio
import socketio
from time import sleep

sleep(3)
curVol = 35
curMute = False
sio = socketio.Client()

sio.connect('http://localhost:3000')

m = alsaaudio.Mixer('Speaker')

@sio.event
def connect():
    sio.emit('volume-init', {'volume': m.getvolume()[0]})

m.setvolume(curVol)
# sio.emit('volume-get', {'volume': m.getvolume()[0]})

@sio.event
def connect_error():
    sleep(3)
    sio.connect('http://localhost:3000')

@sio.event
def disconnect():
    print("I'm disconnected!")

@sio.on('volume-add')
def volume_add(data):
    global curVol
    if curVol < 0 or curVol > 100: return
    curVol += data.get('delta')
    m.setvolume(curVol)

# @sio.on('volume-mute')
# def volume_togglemute(state):
#     #  curMute = state
#     # m.setmute(curMute)

# current_volume = m.getvolume() # Get the current Volume
# m.setvolume(args["get"]) # Set the volume to 70%.