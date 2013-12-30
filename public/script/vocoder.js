// YIN detector is brought in from the Pitchfinder library, courtesy of
// the brilliant Peter Hayes.
var vocoder = {};

(function(){
  var
    context     = new webkitAudioContext(),
    yinDetector = YIN(),
    micSource,
    sourceNode,
    currentPitch;

  vocoder.notes = {
    octave1: {
      'A':  110,     'As':  116.541,
      'B':  123.471,
      'C':  130.813, 'Cs':  138.591,
      'D':  146.832, 'Ds':  155.563,
      'E':  164.814,
      'F':  174.614, 'Fs':  174.614,
      'G':  195.998, 'Gs':  207.652,
      'uA': 220,     'uAs': 233.082,
      'uB': 246.942, 'uC':  261.626
    },
    octave2: {
      'A':  220,     'As':  233.082,
      'B':  246.942,
      'C':  261.626, 'Cs':  277.183,
      'D':  293.665, 'Ds':  311.127,
      'E':  329.528,
      'F':  349.228, 'Fs':  369.994,
      'G':  391.995, 'Gs':  415.305,
      'uA': 440,     'uAs': 466.164,
      'uB': 493.883, 'uC':  523.251
    }
  };

  vocoder.getMicSource = function(){
    if(navigator.webkitGetUserMedia){
      navigator.webkitGetUserMedia({audio: true}, initialize, function(error){
        alert("Error capturing audio. Try refreshing, or updating your Chrome browser.")
      });
    } else {
      alert("This application only supports Chrome browsers");
    }
  };

  vocoder.createPlayers = function(octave){
    octave = octave || 'octave1';
    vocoder.players = {};
    Object.keys(vocoder.notes[octave]).forEach(function(note){
      vocoder.players[note] = createPitchNode(vocoder.notes[octave][note]);
    })
  };

  var createPitchNode = function(targetPitch){
    var node = context.createJavaScriptNode(2048, 1, 1);
    sourceNode.connect(node);
    node.onaudioprocess = function(e){
      changePitch(e, targetPitch);
    };
    node.play = function(){
      this.connect(context.destination);
      this.isPlaying = true;
    };
    node.stop = function(){
      this.disconnect(context.destination);
      this.isPlaying = false;
    };
    node.isPlaying = false;
    return node;
  };

  var initialize = function(micSource){
    sourceNode     = context.createMediaStreamSource(micSource);
    var gainNode   = context.createGain();
    var pitchNode  = context.createJavaScriptNode(2048, 1, 1);
    pitchNode.onaudioprocess = findPitch;

    sourceNode.connect(gainNode);
    gainNode.connect(pitchNode);
    pitchNode.connect(context.destination);
  };

  var findPitch = function(e){
    var freq = yinDetector(e.inputBuffer.getChannelData(0)).freq;
    if(freq > 0){
      currentPitch = freq;
    }
  };

  var changePitch = function(e, targetPitch){
    var shiftRatio = targetPitch/currentPitch;

    buffer     = smoothBuffer(e.inputBuffer.getChannelData(0)),
    buffer     = resizeBuffer(buffer, shiftRatio),
    source     = context.createBufferSource()
    gain       = context.createGain();

    source.buffer = context.createBuffer(1, 2048*shiftRatio, 44100);
    source.buffer.getChannelData(0).set(buffer);
    source.playbackRate.value = shiftRatio;

    source.connect(gain);
    gain.connect(context.destination);
    source.start(0);
  };

  var resizeBuffer = function(buffer, percentage){
    var newLength = buffer.length * percentage
    var newBuffer = new Float32Array(newLength)

    for(var i = 0; i < newLength; i++){
      newBuffer[i] = buffer[i % buffer.length]
    }
    return newBuffer;
  };

  var smoothBuffer = function(buffer){
    var i = 0;
    if(buffer[0] < 0){
      while(buffer[i] < 0){
        buffer[i] = 0;
        i++;
      }
    } else {
      while(buffer[i] > 0){
        buffer[i] = 0;
        i++
      }
    }
    i = buffer.length - 1;
    if(buffer[buffer.length - 1] < 0){
      while(buffer[i] < 0){
        buffer[i] = 0;
        i--;
      }
    } else {
      while(buffer[i] > 0){
        buffer[i] = 0;
        i--;
      }
    }
    return buffer;
  };

  var getPitch = function(buffer){
    return yinDetector(buffer)
  };
})();