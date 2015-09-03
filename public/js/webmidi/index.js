var WebMidi = function () {

  function randomRange(min, max) {
    return Math.random() * (max + min) + min;
  }

  function rangeMap(x, a1, a2, b1, b2) {
    return ((x - a1) / (a2 - a1)) * (b2 - b1) + b1;
  }

  function createSelect (index, webMidi) {
    var newElem = document.createElement('select');
    newElem.dataset.midiKey = index;

    var newOption = document.createElement('option');
    newOption.innerHTML = 'Click to load and select sound';

    newElem.appendChild(newOption);

    //newElem.onclick = function(event) {
      webMidi.patchLibrary.forEach(function (file) {
        var newOption = document.createElement('option');
        newOption.innerHTML = file.name;
        newOption.value = (file.library + '/' + file.patch + '/' + file.file);

        newElem.appendChild(newOption);
      });
    //};

    newElem.onchange = function(event) {
      WebMidi.addAudioProperties(this);
    };

    return newElem;
  }

  var MIDI_PAD_MIN = 32;
  var MINI_PAD_MAX = 39;

  var MIDI_KEY_MIN = 48;
  var MIDI_KEY_MAX = 72;

  var WebMidi = {};

  WebMidi.masterVolume = 0;

  WebMidi.pressure = 1;
  WebMidi.bend = 1;
  WebMidi.delay = 0;
  WebMidi.feedbackGain = 0.8;
  WebMidi.delayFrequency = 1000;

  WebMidi.patchLibrary = [];

  WebMidi.sampleMap = {};

  WebMidi.currentlyPlaying = [];

  WebMidi.audioCtx = AudioContext || webkitAudioContext;
  WebMidi.context = new WebMidi.audioCtx();

  WebMidi.addToLibrary = function (fileList) {
    fileList.forEach(function (file) {
      WebMidi.patchLibrary.push(file);
    });
  };

  WebMidi.init = function () {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess({ sysex: false }).then(WebMidi.onMIDISuccess, WebMidi.onMIDIFailure);

      //WebMidi.soundPatches = document.getElementsByClassName('sound-patch');
      //
      //for (var i = 0; i < WebMidi.soundPatches.length; i++) {
      //  WebMidi.addAudioProperties(WebMidi.soundPatches[i], i);
      //}

    } else {
      alert("No MIDI support in your browser.");
    }
  };

  WebMidi.createPlayArea = function () {
    WebMidi.playArea = document.getElementById('player');

    var container1 = document.createElement('div');
    container1.setAttribute('class', 'jumbotron');

    var header1 = document.createElement('h1');
    header1.innerHTML = 'Midi Keyboard';
    container1.appendChild(header1);

    for (var i = MIDI_KEY_MIN; i <= MIDI_KEY_MAX; i++) {
      container1.appendChild(createSelect(i, WebMidi));
    }
    WebMidi.playArea.appendChild(container1);

    var container2 = document.createElement('div');
    container2.setAttribute('class', 'jumbotron');

    var header2 = document.createElement('h1');
    header2.innerHTML = 'Midi Drumpad';
    container2.appendChild(header2);

    for (var j = MIDI_PAD_MIN; j <= MINI_PAD_MAX; j++) {
      container2.appendChild(createSelect(j, WebMidi));
    }
    WebMidi.playArea.appendChild(container2);
  };

  WebMidi.onMIDISuccess = function (midiAccess) {
    WebMidi.midi = midiAccess;

    WebMidi.inputs = WebMidi.midi.inputs.values();
    // loop through all inputs
    for (var input = WebMidi.inputs.next(); input && !input.done; input = WebMidi.inputs.next()) {
      // listen for midi messages
      input.value.onmidimessage = WebMidi.onMIDIMessage;
      // this just lists our inputs in the console
      //listInputs(input);
    }
    // listen for connect/disconnect message
    WebMidi.midi.onstatechange = WebMidi.onStateChange;
  };

  WebMidi.onMIDIFailure = function(e) {
    console.log("No access to MIDI devices or your browser doesn't support WebMIDI API. Please use WebMIDIAPIShim " + e);
  };

  WebMidi.onStateChange = function (event) {
    var port = event.port;
    var state = port.state;
    var name = port.name;
    var type = port.type;

    if (type == 'input') {
      console.log('name', name, 'port', port, 'state', state);
    }
  };

  WebMidi.onMIDIMessage = function (event) {
    var data = event.data;
    var cmd = data[0] >> 4;
    var channel = data[0] & 0xf;
    var type = data[0] & 0xf0; // channel agnostic message type. Thanks, Phil Burk.
    var note = data[1];
    var velocity = data[2];
    // with pressure and tilt off
    // note off: 128, cmd: 8
    // note on: 144, cmd: 9
    // pressure / tilt on
    // pressure: 176, cmd 11:
    // bend: 224, cmd: 14

    switch (type) {
      case 144: // noteOn message
        WebMidi.noteOn(note, velocity, type);
        break;
      case 128: // noteOff message
        WebMidi.noteOff(note, velocity, type);
        break;
      case 176:
        if (note === 1) {
          WebMidi.pressure = (1 * velocity);
          WebMidi.changeGain();
        }

        if (note === 2) {
          if (velocity === 0) {
            WebMidi.delay = 0;
          } else {
            WebMidi.delay = (0.1 * velocity);
            //WebMidi.changeDelay();
          }
        }

        if (note === 3) {
          WebMidi.delayFrequency = 1000 * velocity;
        }

        break;
      case 224:
        WebMidi.bend = (0.01 * velocity);
        WebMidi.changePitch();
        break;
    }

    console.log('data', data, 'cmd', cmd, 'channel', channel);
    //console.log(keyData, 'key data', data);
  };

  WebMidi.noteOn = function (midiNote, velocity, type) {
    WebMidi.player(midiNote, velocity, type);
  };

  WebMidi.noteOff = function (midiNote, velocity, type) {
    //var element = WebMidi.sampleMap['key' + midiNote];
    //element.sample.stop();
    //WebMidi.player(midiNote, velocity, type);
  };

  WebMidi.player = function(note, velocity, type) {
    var sample = WebMidi.sampleMap['key' + note];
    if (sample) {
      if (type == (0x80 & 0xf0) || velocity == 0) { //QuNexus always returns 144
        //WebMidi.soundPatches.btn[sample - 1].classList.remove('active');
        return;
      }
      //WebMidi.soundPatches.btn[sample - 1].classList.add('active');
      sample.play(note, velocity);
    }
  };

  WebMidi.loadAudio = function(object, url) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    request.onload = function () {
      WebMidi.context.decodeAudioData(request.response, function (buffer) {
        object.buffer = buffer;
      });
    };
    request.send();
  };

  WebMidi.changePitch = function() {
    _.each(WebMidi.sampleMap, function (element) {
      if (element.sample) {
        element.sample.playbackRate.value = 0.02 * element.sample.id + WebMidi.bend;
      }
    });
  };

  WebMidi.changeGain = function() {
    _.each(WebMidi.sampleMap, function (element) {
      var v = rangeMap(element.sample.velocity + WebMidi.pressure, 1, 127, 0.2, 2);
      if ( element.sample &&  element.sample.volumeGain) {
        element.sample.volumeGain.gain.value = v * v;
      }
    });
  };

  WebMidi.changeDelay = function() {
    _.each(WebMidi.sampleMap, function (element) {
      if (element.sample && element.sample.delayNode) {
        element.sample.delayNode.delayTime.value = WebMidi.delay;
      }
    });
  };

  WebMidi.addAudioProperties = function (element) {

    element.name = element.id;
    element.source = 'patches/' + element.value;

    WebMidi.sampleMap['key' + element.dataset.midiKey] = element;

    WebMidi.loadAudio(element, element.source);

    element.play = function (note, velocity) {
      var sample = WebMidi.context.createBufferSource();

      element.sample = sample;

      sample.id = note;
      sample.velocity = velocity;

      //if (WebMidi.delay > 0) {
        var delayNode = WebMidi.context.createDelay();
        delayNode.delayTime.value = WebMidi.delay;
        sample.delayNode = delayNode;

        var feedbackGain = WebMidi.context.createGain();
        feedbackGain.gain.value = WebMidi.feedbackGain;
        sample.feedbackGain = feedbackGain;

        var delayFrequencyFilter = WebMidi.context.createBiquadFilter();
        delayFrequencyFilter.frequency.value = WebMidi.delayFrequency;
        sample.delayFrequencyFilter = delayFrequencyFilter;

        delayNode.connect(feedbackGain);
        feedbackGain.connect(delayFrequencyFilter);
        delayFrequencyFilter.connect(delayNode);

        sample.connect(delayNode);
        delayNode.connect(WebMidi.context.destination);
      //}

      sample.buffer = element.buffer;
      //sample.loop = true;
      var playbackValue =  0.02 * note + WebMidi.bend;
      sample.playbackRate.value = playbackValue; //randomRange(0.5, 2);

      var volumeGain = WebMidi.context.createGain();
      sample.volumeGain = volumeGain;

      var v = rangeMap(velocity + WebMidi.pressure, 1, 127, 0.2, 2);
      sample.connect(volumeGain);
      volumeGain.gain.value = v * v;
      volumeGain.connect(WebMidi.context.destination);

      sample.onended = function() {
        //sample.delayNode.disconnect(WebMidi.context.destination);
        _.remove(WebMidi.currentlyPlaying, 'id', sample.id);
      };

      WebMidi.currentlyPlaying.push(sample);

      sample.start();
    }
  };

  return WebMidi;
};


//var log = console.log.bind(console),
//  keyData = document.getElementById('key_data'),
//  midi;
//var AudioContext = AudioContext || webkitAudioContext; // for ios/safari
//var context = new AudioContext();
//var btnBox = document.getElementById('content'),
//  btn = document.getElementsByClassName('button');
//var data, cmd, channel, type, note, velocity;
//
//// request MIDI access
//if (navigator.requestMIDIAccess) {
//  navigator.requestMIDIAccess({
//    sysex: false
//  }).then(onMIDISuccess, onMIDIFailure);
//} else {
//  alert("No MIDI support in your browser.");
//}
//
//// add event listeners
//document.addEventListener('keydown', keyController);
//document.addEventListener('keyup', keyController);
//for (var i = 0; i < btn.length; i++) {
//  btn[i].addEventListener('mousedown', clickPlayOn);
//  btn[i].addEventListener('mouseup', clickPlayOff);
//}
//// prepare audio files
//for (var i = 0; i < btn.length; i++) {
//  addAudioProperties(btn[i]);
//}
//// this maps the MIDI key value (60 - 64) to our samples
//var sampleMap = {
//  key60: 1,
//  key61: 2,
//  key62: 3,
//  key63: 4,
//  key64: 5
//};
//// user interaction, mouse click
//function clickPlayOn(e) {
//  e.target.classList.add('active');
//  e.target.play();
//}
//
//function clickPlayOff(e) {
//  e.target.classList.remove('active');
//}
//// qwerty keyboard controls. [q,w,e,r,t]
//function keyController(e) {
//  if (e.type == "keydown") {
//    switch (e.keyCode) {
//      case 81:
//        btn[0].classList.add('active');
//        btn[0].play();
//        break;
//      case 87:
//        btn[1].classList.add('active');
//        btn[1].play();
//        break;
//      case 69:
//        btn[2].classList.add('active');
//        btn[2].play();
//        break;
//      case 82:
//        btn[3].classList.add('active');
//        btn[3].play();
//        break;
//      case 84:
//        btn[4].classList.add('active');
//        btn[4].play();
//        break;
//      default:
//      //console.log(e);
//    }
//  } else if (e.type == "keyup") {
//    switch (e.keyCode) {
//      case 81:
//        btn[0].classList.remove('active');
//        break;
//      case 87:
//        btn[1].classList.remove('active');
//        break;
//      case 69:
//        btn[2].classList.remove('active');
//        break;
//      case 82:
//        btn[3].classList.remove('active');
//        break;
//      case 84:
//        btn[4].classList.remove('active');
//        break;
//      default:
//      //console.log(e.keyCode);
//    }
//  }
//}
//
//// midi functions
//function onMIDISuccess(midiAccess) {
//  midi = midiAccess;
//  var inputs = midi.inputs.values();
//  // loop through all inputs
//  for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
//    // listen for midi messages
//    input.value.onmidimessage = onMIDIMessage;
//    // this just lists our inputs in the console
//    listInputs(input);
//  }
//  // listen for connect/disconnect message
//  midi.onstatechange = onStateChange;
//}
//
//function onMIDIMessage(event) {
//  data = event.data,
//    cmd = data[0] >> 4,
//    channel = data[0] & 0xf,
//    type = data[0] & 0xf0, // channel agnostic message type. Thanks, Phil Burk.
//    note = data[1],
//    velocity = data[2];
//  // with pressure and tilt off
//  // note off: 128, cmd: 8
//  // note on: 144, cmd: 9
//  // pressure / tilt on
//  // pressure: 176, cmd 11:
//  // bend: 224, cmd: 14
//
//  switch (type) {
//    case 144: // noteOn message
//      noteOn(note, velocity);
//      break;
//    case 128: // noteOff message
//      noteOff(note, velocity);
//      break;
//  }
//
//  //console.log('data', data, 'cmd', cmd, 'channel', channel);
//  logger(keyData, 'key data', data);
//}
//
//function onStateChange(event) {
//  var port = event.port,
//    state = port.state,
//    name = port.name,
//    type = port.type;
//  if (type == "input") console.log("name", name, "port", port, "state", state);
//}
//
//function listInputs(inputs) {
//  var input = inputs.value;
//  log("Input port : [ type:'" + input.type + "' id: '" + input.id +
//    "' manufacturer: '" + input.manufacturer + "' name: '" + input.name +
//    "' version: '" + input.version + "']");
//}
//
//function noteOn(midiNote, velocity) {
//  player(midiNote, velocity);
//}
//
//function noteOff(midiNote, velocity) {
//  player(midiNote, velocity);
//}
//
//function player(note, velocity) {
//  var sample = sampleMap['key' + note];
//  if (sample) {
//    if (type == (0x80 & 0xf0) || velocity == 0) { //QuNexus always returns 144
//      btn[sample - 1].classList.remove('active');
//      return;
//    }
//    btn[sample - 1].classList.add('active');
//    btn[sample - 1].play(velocity);
//  }
//}
//
//function onMIDIFailure(e) {
//  log("No access to MIDI devices or your browser doesn't support WebMIDI API. Please use WebMIDIAPIShim " + e);
//}
//
//// audio functions
//// We'll go over these in detail in future posts
//function loadAudio(object, url) {
//  var request = new XMLHttpRequest();
//  request.open('GET', url, true);
//  request.responseType = 'arraybuffer';
//  request.onload = function () {
//    context.decodeAudioData(request.response, function (buffer) {
//      object.buffer = buffer;
//    });
//  }
//  request.send();
//}
//
//function addAudioProperties(object) {
//  object.name = object.id;
//  object.source = object.dataset.sound;
//  loadAudio(object, object.source);
//  object.play = function (volume) {
//    var s = context.createBufferSource();
//    var g = context.createGain();
//    var v;
//    s.buffer = object.buffer;
//    s.playbackRate.value = randomRange(0.5, 2);
//    if (volume) {
//      v = rangeMap(volume, 1, 127, 0.2, 2);
//      s.connect(g);
//      g.gain.value = v * v;
//      g.connect(context.destination);
//    } else {
//      s.connect(context.destination);
//    }
//
//    s.start();
//    object.s = s;
//  }
//}
//
//// utility functions
//function randomRange(min, max) {
//  return Math.random() * (max + min) + min;
//}
//
//function rangeMap(x, a1, a2, b1, b2) {
//  return ((x - a1) / (a2 - a1)) * (b2 - b1) + b1;
//}
//
//function frequencyFromNoteNumber(note) {
//  return 440 * Math.pow(2, (note - 69) / 12);
//}
//
//function logger(container, label, data) {
//  messages = label + " [channel: " + (data[0] & 0xf) + ", cmd: " + (data[0] >> 4) + ", type: " + (data[0] & 0xf0) + " , note: " + data[1] + " , velocity: " + data[2] + "]";
//  container.textContent = messages;
//}
