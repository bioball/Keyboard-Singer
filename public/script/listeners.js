var keyMap = {
  65:  'A',   87:  'As',  83:  'B',  68:  'C',  82: 'Cs',  70:  'D',
  84:  'Ds',  71:  'E',   72:  'F',  85:  'Fs', 74: 'G',   73:  'Gs',
  75:  'uA',  79:  'uAs', 76:  'uB', 186: 'uC',
  97:  'A',   119: 'As',  115: 'B',  100: 'C',  114: 'Cs', 102: 'D',
  116: 'Ds',  103: 'E',   104: 'F',  117: 'Fs', 106: 'G',  105: 'Gs',
  107: 'uA',  111: 'uAs', 108: 'uB', 59:  'uC',
};
var addListeners = function(){
  $(document).keypress(function(key){
    var key = keyMap[key.which];
    if(!vocoder.players){
      vocoder.createPlayers();
    }
    var player = vocoder.players[key];
    if(!player.isPlaying){
      player.play();
      $('.' + key).addClass('pressed');
    }
  });

  $(document).keyup(function(key){
    var key = keyMap[key.which];
    var player = vocoder.players[key];
    player.stop();
    $('.' + key).removeClass('pressed');
  })
};