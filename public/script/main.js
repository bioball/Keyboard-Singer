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
    'A':   110,     'A#':  116.541,
    'Bb':  116.541, 'B':   123.471,
    'C':   130.813, 'C#':  138.591,
    'Db':  138.591, 'D':   146.832,  'D#': 155.563,
    'Eb':  155.563, 'E':   164.814,
    'F':   174.614, 'F#':  174.614,
    'Gb':  174.614, 'G':   195.998,  'G#': 207.652,
    '^Ab': 207.652, '^A':  220,      '^A#': 233.082,
    '^Bb': 233.082, '^B':  246.942
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

  vocoder.createPitchNode = function(targetPitch){
    var node = context.createJavaScriptNode(2048, 1, 1);
    sourceNode.connect(node);
    node.onaudioprocess = function(e){
      changePitch(e, targetPitch);
    };
    node.play = function(){
      this.connect(context.destination);
    }
    node.stop = function(){
      this.disconnect(context.destination);
    }
    return node;
  };

  var initialize = function(micSource){

    // mic source --> gain --> pitchfinder --> context.destination
    sourceNode    = context.createMediaStreamSource(micSource);
    var gainNode  = context.createGain();
    var pitchNode = context.createJavaScriptNode(2048, 1, 1);
    pitchNode.onaudioprocess = findPitch;

    sourceNode.connect(gainNode);
    gainNode.connect(pitchNode);
    pitchNode.connect(context.destination);
  };

  var findPitch = function(e){
    var freq = yinDetector(e.inputBuffer.getChannelData(0)).freq;
    if(freq > 0 && freq < 2000){
      currentPitch = freq;
    }
  }


  var changePitch = function(e, targetPitch){
    var shiftRatio = targetPitch/currentPitch;

    buffer     = smoothBuffer(e.inputBuffer.getChannelData(0), 20),
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

  var smoothBuffer = function(buffer, size){
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
    }
    if(buffer[buffer.length - 1] > 0){
      while(buffer[i] > 0){
        buffer[i] = 0;
        i--;
      }
    }
    return buffer;
  }

  var resizeBuffer = function(buffer, percentage){
    var newLength = buffer.length * percentage
    var newBuffer = new Float32Array(newLength)

    //build out the old buffer
    for(var i = 0; i < newLength; i++){
      newBuffer[i] = buffer[i % buffer.length]
    }
    return newBuffer;
  }


  var getPitch = function(buffer){
    return yinDetector(buffer)
  };
})(vocoder);