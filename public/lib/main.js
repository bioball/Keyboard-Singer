// YIN detector is brought in from the Pitchfinder library, courtesy of
// the brilliant Peter Hayes.

var
  context     = new webkitAudioContext(),
  yinDetector = YIN();

var vocoder = {
  note: 246.942
};

vocoder.connectThings = function(micSource){
  var
    mic         = context.createMediaStreamSource(micSource),
    gain        = context.createGain(),
    shifter     = vocoder.shifter(),
    pitchFinder = vocoder.pitchFinder();


  mic.connect(gain);
  gain.connect(shifter);
  gain.connect(pitchFinder);
  shifter.connect(context.destination);
  pitchFinder.connect(context.destination);
};

vocoder.pitchFinder = function(){
  var node = context.createJavaScriptNode(2048, 1, 1);
  node.onaudioprocess = vocoder.findPitch;
  return node;
};

vocoder.findPitch = function(e){
  var freq = yinDetector(e.inputBuffer.getChannelData(0)).freq;
  if(freq > 0){
    vocoder.shiftRatio = vocoder.note/freq;
  }
}

vocoder.shifter = function(e){
  var node = context.createJavaScriptNode(2048, 1, 1);
  node.onaudioprocess = vocoder.phaseShift;
  return node;
};

vocoder.phaseShift = function(e){
  var
    shiftRatio = vocoder.shiftRatio,
    buffer     = vocoder.smoothBuffer(e.inputBuffer.getChannelData(0), 20),
    buffer     = vocoder.resizeBuffer(buffer, shiftRatio),
    source     = context.createBufferSource()
    gain       = context.createGain();

  source.buffer = context.createBuffer(1, 2048*shiftRatio, 44100);
  source.buffer.getChannelData(0).set(buffer);
  source.playbackRate.value = shiftRatio;

  source.connect(gain);
  gain.connect(context.destination);
  source.start(0);
};

vocoder.smoothBuffer = function(buffer, size){
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

vocoder.resizeBuffer = function(buffer, percentage){
  var newLength = buffer.length * percentage
  var newBuffer = new Float32Array(newLength)

  //build out the old buffer
  for(var i = 0; i < newLength; i++){
    newBuffer[i] = buffer[i % buffer.length]
  }
  return newBuffer;
}


vocoder.getPitch = function(buffer){
  return yinDetector(buffer)
};

vocoder.getMicSource = function(){
  if(navigator.webkitGetUserMedia){
    navigator.webkitGetUserMedia({audio: true}, vocoder.connectThings, function(error){
      alert("Error capturing audio. Try refreshing, or updating your Chrome browser.")
    });
  } else {
    alert("This application only supports Chrome browsers");
  }
};


// chain of calls: getMicSource --> connectThings --> returnPitch --> 