import alsaaudio
import socketio
import wave
import os
from time import sleep

sleep(1)
curVol = 35
curMute = False
sio = socketio.Client()

m = alsaaudio.Mixer('Speaker')

m.setvolume(curVol)
# sio.emit('volume-get', {'volume': m.getvolume()[0]})

@sio.event
def connect():
	# print('im connected')
	sio.emit('sound-setup')

@sio.event
def disconnect():
    print("I'm disconnected!")

@sio.on('sound-add')
def sound_add(delta):
    global curVol
    if curVol < 0 or curVol > 100: return
    curVol += delta.get('delta')
    print('ff')
    sio.emit('volume', {'volume': m.getvolume()[0]})
    m.setvolume(curVol)

@sio.on('sound-play')
def sound_play(src):
	dirname = os.getcwd()
	filepath = os.path.join(dirname, src)
	with wave.open(filepath, 'rb') as f:
		sio.emit('sound-loaded', src)
		play('default', f)

# taken from alsaaudio docs.
def play(device, f):	
	format = None

	# 8bit is unsigned in wav files
	if f.getsampwidth() == 1:
		format = alsaaudio.PCM_FORMAT_U8
	# Otherwise we assume signed data, little endian
	elif f.getsampwidth() == 2:
		format = alsaaudio.PCM_FORMAT_S16_LE
	elif f.getsampwidth() == 3:
		format = alsaaudio.PCM_FORMAT_S24_3LE
	elif f.getsampwidth() == 4:
		format = alsaaudio.PCM_FORMAT_S32_LE
	else:
		raise ValueError('Unsupported format')

	periodsize = f.getframerate() // 8

	print('%d channels, %d sampling rate, format %d, periodsize %d\n' % (f.getnchannels(),
																		 f.getframerate(),
																		 format,
																		 periodsize))

	device = alsaaudio.PCM(channels=f.getnchannels(), rate=f.getframerate(), format=format, periodsize=periodsize, device=device)

	data = f.readframes(periodsize)
	while data:
		# Read data from stdin
		device.write(data)
		data = f.readframes(periodsize)


sio.connect('http://localhost:3000')
# @sio.on('volume-mute')
# def volume_togglemute(state):
#     #  curMute = state
#     # m.setmute(curMute)

# current_volume = m.getvolume() # Get the current Volume
# m.setvolume(args["get"]) # Set the volume to 70%.