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
    'A':   110,     'As':  116.541,
    'B':   123.471,
    'C':   130.813, 'Cs':  138.591,
    'D':   146.832, 'Ds':  155.563,
    'E':   164.814,
    'F':   174.614, 'Fs':  174.614,
    'G':   195.998, 'Gs':  207.652,
    'uA':  220,     'uAs': 233.082,
    'uB':  246.942, 'uC':  261.626
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
    if(freq > 0){
      currentPitch = freq;
    }
  }


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
  }

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
    }
    if(buffer[buffer.length - 1] > 0){
      while(buffer[i] > 0){
        buffer[i] = 0;
        i--;
      }
    }
    return buffer;
  }



  var getPitch = function(buffer){
    var time
    return yinDetector(buffer)
  };
})(vocoder);