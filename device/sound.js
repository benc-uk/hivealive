var Sound = require('node-arecord');

class SoundCapture {
  constructor(captureTime, filename) {
    this.sound = new Sound({
      debug: false,
      destination_folder: '/tmp',
      filename: filename,
      alsa_format: 'S16_LE',
      alsa_device: 'hw:1,0',
      alsa_rate: '44100'
    });

    this.time = captureTime
  }

  record() {
    return new Promise((resolve, reject) => {
      this.sound.record();

      setTimeout(() => {
        this.sound.stop(); 
        console.log(`### Captured ${this.time} millsec audio sample`);
        resolve();
      }, this.time)
    });
  }


}

module.exports = SoundCapture;