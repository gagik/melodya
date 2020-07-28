// Adapted from https://github.com/LinusU/node-loudness/blob/master/impl/linux.js

const execa = require('execa')

async function amixer (...args) {
  const {stdout} = await execa('amixer', args, { preferLocal: false });
  return stdout;
}

let defaultDeviceCache = null
const reDefaultDevice = /Simple mixer control '([a-z0-9 -]+)',[0-9]+/i

function parseDefaultDevice (data) {
  const result = reDefaultDevice.exec(data)

  if (result === null) {
    throw new Error('Alsa Mixer Error: failed to parse output')
  }

  return result[1]
}

function getDefaultDevice () {
  if (defaultDeviceCache) return Promise.resolve(defaultDeviceCache)

  return amixer().then(data => (defaultDeviceCache = parseDefaultDevice(data)))
}

const reInfo = /[a-z][a-z ]*: Playback [0-9-]+ \[([0-9]+)%\] (?:[[0-9.-]+dB\] )?\[(on|off)\]/i

function parseInfo (data) {
  const result = reInfo.exec(data)

  if (result === null) {
    throw new Error('Alsa Mixer Error: failed to parse output')
  }

  return { volume: parseInt(result[1], 10), muted: (result[2] === 'off') }
}


function getInfo () {
  return getDefaultDevice().then(dev => amixer('get', dev)).then(data => parseInfo(data))
}

module.exports.changeBy = (delta, direction) => {
  let sign = direction > 0 ? '+' : '-'; 
  return getDefaultDevice().then(dev => amixer('-q', 'sset', dev, ('3%' + sign)));
}

exports.getVolume = function () {
  return getInfo().then(info => info.volume)
}

module.exports.setVolume = function (val) {
  return getDefaultDevice().then(dev => amixer('set', dev, val + '%')).then(() => undefined)
}

module.exports.getMuted = function (cb) {
  return getInfo().then(info => info.muted)
}

module.exports.setMuted = function (val, cb) {
  return amixer('set', 'PCM', (val ? 'mute' : 'unmute')).then(() => undefined)
}
