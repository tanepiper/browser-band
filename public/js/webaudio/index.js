var OscillatorOutput = function() {

  var maxFreq = 6000;
  var maxVol = 0.02;

  var initialFreq = 3000;
  var initialVol = 0.001;

  var OscillatorOutput = {};

  OscillatorOutput.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  OscillatorOutput.oscillator = OscillatorOutput.audioCtx.createOscillator();
  OscillatorOutput.gainNode = OscillatorOutput.audioCtx.createGain();

  OscillatorOutput.oscillator.type = 'square';
  OscillatorOutput.oscillator.frequency.value = initialFreq; // value in hertz
  OscillatorOutput.oscillator.detune.value = 100; // value in cents

  OscillatorOutput.gainNode.gain.value = initialVol;

  OscillatorOutput.start = function() {
    OscillatorOutput.oscillator.connect(OscillatorOutput.gainNode);
    OscillatorOutput.gainNode.connect(OscillatorOutput.audioCtx.destination);
    OscillatorOutput.oscillator.start(0);
  };

  OscillatorOutput.update = function(frequency, gain) {
    OscillatorOutput.oscillator.frequency.value = frequency/50 * maxFreq;
    OscillatorOutput.gainNode.gain.value = gain/50 * maxVol;
  };

  return OscillatorOutput;
};




