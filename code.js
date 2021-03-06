function scaleAndDrawRect(context, rect) {
  // draw passed rect to context, which is a canvas
  var canvasWidth = $('canvas').attr('width');
  var canvasHeight = $('canvas').attr('height');
  var scaledRect = scaleRect(rect);
  context.fillStyle = scaledRect.fill;
  context.fillRect(scaledRect.x, scaledRect.y, scaledRect.w, scaledRect.h);
}

function Rect(x, y, w, h, fill, aspectRatio) {
  // prototype to hold rectangular data structures
  // coordinates x, y
  // dimensions w, h
  // color fill
  // aspectRatio
  this.x = x; this.y = y;
  this.w = w; this.h = h;
  this.fill = fill;
  this.aspectRatio = aspectRatio;
  this.left = this.x;
  this.right = this.x + this.w;
}

function scaleRect(rect) {
  // function to scale rectangular to proper aspect ration
  var canvasWidth = $('canvas').attr('width');
  var canvasHeight = $('canvas').attr('height');
  var rectWidth = rect.w * canvasWidth;
  var rectHeight;
  if(rect.aspectRatio) {
    rectHeight = rectWidth * rect.aspectRatio;
  }
  else {
    rectHeight = rect.h * canvasHeight;
  }
  return new Rect(rect.x * canvasWidth, rect.y * canvasHeight, rectWidth, rectHeight, rect.fill);
}

function apparentRect(rect) {
  // function to get actual rectangular height as it appears on the canvas
  var canvasWidth = $('canvas').attr('width');
  var canvasHeight = $('canvas').attr('height');
  var ratio = canvasWidth / canvasHeight;
  rect.h = rect.h * ratio;
  return rect;
}

Rect.prototype.contains = function(mx, my) {
  // function to check whether rectangle is contained within this
  return (this.x <= mx) && (this.x + this.w >= mx) && (this.y <= my) && (this.y + this.h >= my);
};

Rect.prototype.intersects = function(rect) {
  // function to check whether rectangle is intersected with this
  return this.x < (rect.x + rect.w) &&
    (this.x + this.w) > rect.x &&
    this.y < (rect.y + rect.h) &&
    (this.y + this.h) > rect.y;
};

Rect.prototype.draw = function(context) {
  // draw this to canvas context
  context.fillStyle = this.fill;
  context.fillRect(rect.x, rect.y, rect.w, rect.h);
};

function Player(playerRef) {
  // sync local object to server object
  this.update(playerRef);
}

Player.prototype.update = function(playerRef) {
  // set player attributes from server object
  this.w = 0.02;
  this.h = this.w;
  this.x = playerRef.x;
  this.y = playerRef.y;
  this.hasEnemyFlag = playerRef.hasEnemyFlag;
  this.team = playerRef.team;
  this.id = playerRef.id;
  if(this.team === "red") this.fill = '#bb3311';
  else this.fill = '#1133bb';
  this.rect = function() { return new Rect(this.x, this.y, this.w, this.h, this.fill, this.h / this.w); }
  this.apparentRect = function() { return apparentRect(this.rect()); }
};

Player.prototype.draw = function(context) {
  // function to draw player to context, if his id is present - that is, if he hasn't stepped on the mine;
  if (this.id) {
    context.fillStyle = this.fill;
    scaleAndDrawRect(context, this.rect());
  }
};

Player.prototype.drawSelection = function(context) {
  // function to draw player with its selection line
  context.strokeStyle = '#000000';
  context.lineWidth = 2;
  var sr = scaleRect(this.rect());
  context.strokeRect(sr.x,sr.y,sr.w,sr.h);
};

Player.prototype.contains = function(mx, my) {
  // function to check whether this player's apparent rectangle contains passed in coordinates
  return this.apparentRect().contains(mx, my);
};

Player.prototype.isInHomeArea = function() {
  // function to check whether this player is in home area
  var rect = this.rect();

  if(this.team === "red") return rect.right <= 0.1 && rect.y <= 0.1;
  else return rect.left >= 0.9 && rect.y >= 0.9;
  return false;
};

function Flag(flagRef) {
  // sync local object to server object
  this.update(flagRef);
}

Flag.prototype.update = function(flagRef) {
  // set flag attributes from server object
  this.w = 0.008;
  this.h = this.w;
  this.x = flagRef.x;
  this.y = flagRef.y;
  this.team = flagRef.team;
  this.id = flagRef.id;

  if(this.team === "red") this.fill = '#bb3311';
  else this.fill = '#1133bb';

  this.rect = function() { return new Rect(this.x, this.y, this.w, this.h, this.fill, this.h / this.w); }
  this.apparentRect = function() { return apparentRect(this.rect()); }
};

Flag.prototype.draw = function (context) {
  // draw this to canvas context
  context.fillStyle = this.fill;
  scaleAndDrawRect(context, this.rect());
};

Flag.prototype.contains = function(mx, my) {
  // function to check whether this flag's apparent rectangle contains passed in coordinates
  return this.apparentRect().contains(mx, my);
};
function Mine(mineRef) {
  // just do it
  this.update(mineRef);
}
Mine.prototype.update = function(mineRef) {
  // set them mines attributes
  this.w = 0.008;
  this.h = this.w;
  this.x = mineRef.x;
  this.y = mineRef.y;
  this.team = mineRef.team;
  this.id = mineRef.id;
  if(this.team === "red") {
    this.fill = '#bb3311';
  }
  if(this.team === "none") {
    this.fill = '#000000';
  }
  else {
    this.fill = '#1133bb';
  }
  this.rect = function() { return new Rect(this.x, this.y, this.w, this.h, this.fill, this.h / this.w); }
  this.apparentRect = function() { return apparentRect(this.rect()); }
};

Mine.prototype.draw = function(context) {
  // draw this to canvas context
  context.fillStyle = this.fill;
  scaleAndDrawRect(context, this.rect());
};

Mine.prototype.contains = function(mx, my) {
  // function to check whether this mine's apparent rectangle contains passed in coordinates
  return this.apparentRect().contains(mx, my);
};

function CanvasState(canvas) {
  this.canvas = canvas;
  this.width = canvas.width;
  this.height = canvas.height;
  this.context = canvas.getContext('2d');

  // This complicates things a little but but fixes mouse co-ordinate problems
  // when there's a border or padding. See getMouse for more detail
  var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
  if (document.defaultView && document.defaultView.getComputedStyle) {
    this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
    this.stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
    this.styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
    this.styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
  }

  // Some pages have fixed-position bars (like the stumbleupon bar) at the top or left of the page
  // They will mess up mouse coordinates and this fixes that
  var html = document.body.parentNode;
  this.htmlTop = html.offsetTop;
  this.htmlLeft = html.offsetLeft;

  // **** Keep track of state! ****

  this.valid = false; // when set to false, the canvas will redraw everything
  this.flags = [];
  this.players = [];
  this.mines = [];
  this.line = new Rect(0.1, 0, 0.005, 0.1, '#dddd11');
  this.line1 = new Rect(0, 0.1, 0.1, 0.005, '#dddd11');
  this.line2 = new Rect(0.9, 0.9, 0.005, 0.1, '#dddd11');
  this.line3 = new Rect(0.9, 0.9, 0.1, 0.005, '#dddd11');
  this.selectedPlayer = null;
  this.lastMoveTime = 0;
  this.redWins = false;
  this.blueWins = false;

  window.myState = this;

  canvas.addEventListener('mousedown', function(e) {
    var mouse = myState.getMouse(e);
    var mx = mouse.x;
    var my = mouse.y;
    var players = myState.players;
    var l = players.length;
    for (var i = l-1; i >= 0; i--) {
      if (players[i].contains(mx, my)) {
        var mySel = players[i];
        myState.selectedPlayer = mySel;
        myState.valid = false;
        return;
      }
    }
    // havent returned means we have failed to select anything.
    // If there was an object selected, we deselect it
    clearSelectedPlayer(false);
  }, true);

  // listen for arrow key presses
  document.addEventListener('keydown', function(e) {
    // Left = 37
    // Up = 38
    // Right = 39
    // Down = 40
    if(e.keyCode <= 40 && e.keyCode >= 37) {
      var currentTime = (new Date).getTime();
      if(currentTime - myState.lastMoveTime > 100) {
        var selectedPlayer = myState.selectedPlayer;
        var players = myState.players;
        var mines = myState.mines;
        var width = selectedPlayer.w;
        var height = selectedPlayer.h;
        var enemyFlag = null;

        if(selectedPlayer.team === "red") {
          enemyFlag = myState.getFlag("1");
        }
        else {
          enemyFlag = myState.getFlag("0");
        }

        // set movement positions
        if(e.keyCode === 37) {
          selectedPlayer.x = selectedPlayer.x - width;
          e.preventDefault();
        }
        if(e.keyCode === 38) {
          selectedPlayer.y = selectedPlayer.y - height;
          e.preventDefault();
        }
        if(e.keyCode === 39) {
          selectedPlayer.x = selectedPlayer.x + width;
          e.preventDefault();
        }
        if(e.keyCode === 40) {
          selectedPlayer.y = selectedPlayer.y + height;
          e.preventDefault();
        }

        // if player has flag and is in home area - the team wins
        if(selectedPlayer.hasEnemyFlag && selectedPlayer.isInHomeArea()) {
          if(selectedPlayer.team === "red") {
            myState.redWins = true;
          }
          else {
            myState.blueWins = true;
          }
        }

        // if player stepped on the mine - set their id to null
        for(var i=0; i < mines.length; i++){
          if(selectedPlayer.apparentRect().intersects(mines[i].apparentRect())){
            selectedPlayer.id = null;
          }
        }
        // Grab flag
        if(!selectedPlayer.hasEnemyFlag && selectedPlayer.apparentRect().intersects(enemyFlag.apparentRect())) {
          selectedPlayer.hasEnemyFlag = true;
        }

        var updatedOtherPlayer = null;
        // send new state to server
        var playerRef = new Firebase("https://capture-the-flag.firebaseio.com/players/" + selectedPlayer.id);
        playerRef.set({id: selectedPlayer.id,
          team: selectedPlayer.team,
          x: selectedPlayer.x,
          y: selectedPlayer.y,
          hasEnemyFlag: selectedPlayer.hasEnemyFlag});

        if(selectedPlayer.hasEnemyFlag) {
          var flagRef = new Firebase("https://capture-the-flag.firebaseio.com/flags/" + enemyFlag.id);
          flagRef.set({id: enemyFlag.id,
            team: enemyFlag.team,
            x: selectedPlayer.x,
            y: selectedPlayer.y});
        }

        if(updatedOtherPlayer) {
          var otherPlayerRef = new Firebase("https://capture-the-flag.firebaseio.com/players/" + updatedOtherPlayer.id);
          otherPlayerRef.set({id: updatedOtherPlayer.id,
            team: updatedOtherPlayer.team,
            x: updatedOtherPlayer.x,
            y: updatedOtherPlayer.y,
            hasEnemyFlag: updatedOtherPlayer.hasEnemyFlag});
        }

        myState.valid = false;
        myState.lastMoveTime = currentTime;

        // clear selected player for the next move
        clearSelectedPlayer(false);
      }
    }
  }, true);

  // **** Options ****
  this.interval = 30;
  setInterval(function() { myState.draw(); }, myState.interval);
}

CanvasState.prototype.hasFlag = function(flag) {
  for(var i = 0; i < this.flags.length; i++) {
    if(this.flags[i].id === flag.id) {
      return true;
    }
  }
  return false;
};

CanvasState.prototype.hasMine = function(mine) {
  for(var i = 0; i < this.mines.length; i++) {
    if(this.mines[i].id === mine.id) {
      return true;
    }
  }
  return false;
};

CanvasState.prototype.getFlag = function(flagId) {
  for(var i = 0; i < this.flags.length; i++) {
    if(this.flags[i].id === flagId) {
      return this.flags[i];
    }
  }
  return null;
};

CanvasState.prototype.getMine = function(mineId) {
  for(var i = 0; i < this.mines.length; i++) {
    if(this.mines[i].id === mineId) {
      return this.mines[i];
    }
  }
  return null;
};

CanvasState.prototype.addFlag = function(flag) {
  this.flags.push(flag);
  this.valid = false;
};

CanvasState.prototype.addMine = function(mine) {
  this.mines.push(mine);
  this.valid = false;
};

CanvasState.prototype.updateFlag = function(firebaseFlagRef) {
  this.getFlag(firebaseFlagRef.id).update(firebaseFlagRef);
  this.valid = false;
};

CanvasState.prototype.updateMine = function(firebaseMineRef) {
  this.getMine(firebaseMineRef.id).update(firebaseMineRef);
  this.valid = false;
};

CanvasState.prototype.hasPlayer = function(player) {
  for(var i = 0; i < this.players.length; i++) {
    if(this.players[i].id === player.id) {
      return true;
    }
  }
  return false;
};

CanvasState.prototype.getPlayer = function(playerId) {
  for(var i = 0; i < this.players.length; i++) {
    if(this.players[i].id === playerId) {
      return this.players[i];
    }
  }
  return null;
};

CanvasState.prototype.addPlayer = function(player) {
  this.players.push(player);
  this.valid = false;
};

CanvasState.prototype.updatePlayer = function(firebasePlayerRef) {
  this.getPlayer(firebasePlayerRef.id).update(firebasePlayerRef);
  this.valid = false;
};

CanvasState.prototype.addFlag = function(flag) {
  this.flags.push(flag);
  this.valid = false;
};



CanvasState.prototype.clear = function() {
  this.context.clearRect(0, 0, this.width, this.height);
};

CanvasState.prototype.draw = function() {
  if(!this.valid) {
    var context = this.context;
    var flags = this.flags;
    var mines = this.mines;
    var players = this.players;
    this.clear();

    // Background here

    // Draw all items

    // Draw base boundaries
    context.fillStyle = this.line.fill;
    scaleAndDrawRect(context, this.line);

    context.fillStyle = this.line1.fill;
    scaleAndDrawRect(context, this.line1);

    context.fillStyle = this.line2.fill;
    scaleAndDrawRect(context, this.line2);

    context.fillStyle = this.line3.fill;
    scaleAndDrawRect(context, this.line3);

    var l = players.length;
    for (var i = 0; i < l; i++) {
      players[i].draw(context);
    }
    var l = flags.length;
    for (var i = 0; i < l; i++) {
      flags[i].draw(context);
    }
    var l = mines.length;
    for (var i = 0; i < l; i++) {
      mines[i].draw(context);
    }

    if(this.redWins) {
      context.fillStyle = "red";
      context.font = "bold 32px Arial";
      context.fillText("Red Wins!", 10, 50);
    }
    else if(this.blueWins) {
      context.fillStyle = "blue";
      context.font = "bold 32px Arial";
      context.fillText("Blue Wins!", 10, 50);
    }

    if(this.selectedPlayer != null) {
      this.selectedPlayer.drawSelection(context);
    }

    this.valid = true;
  }
};

CanvasState.prototype.getMouse = function(e) {
  var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;

  // Compute the total offset
  if (element.offsetParent !== undefined) {
    do {
      offsetX += element.offsetLeft;
      offsetY += element.offsetTop;
    } while ((element = element.offsetParent));
  }

  // Add padding and border style widths to offset
  // Also add the <html> offsets in case there's a position:fixed bar
  offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
  offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

  mx = e.pageX - offsetX;
  my = e.pageY - offsetY;

  mx = mx / this.width;
  my = my / this.height;

  // We return a simple javascript object (a hash) with x and y defined
  return {x: mx, y: my};
};

function initializePlayers(firebasePlayers, s) {
  if(!firebasePlayers) { return; }

  for(var i = 0; i < firebasePlayers.length; i++) {
    var firebasePlayer = firebasePlayers[i];
    if(s.hasPlayer(firebasePlayer)) {
      s.updatePlayer(firebasePlayer);
    }
    else {
      s.addPlayer(new Player(firebasePlayer));
    }
  }
}

function initializeFlags(firebaseFlags, s) {
  if(!firebaseFlags) { return; }

  for(var i = 0; i < firebaseFlags.length; i++) {
    var firebaseFlag = firebaseFlags[i];
    if(s.hasFlag(firebaseFlag)) {
      s.updateFlag(firebaseFlag);
    }
    else {
      s.addFlag(new Flag(firebaseFlag));
    }
  }
}

function getRandomArbitrary(min, max) {
  return parseFloat((Math.random() * (min - max) + max).toFixed(4));
}

function initializeMines(s) {
  for(var i = 0; i < 6; i++) {
    var mine = {
      "id": i.toString(),
      "team": "none",
      "x": getRandomArbitrary(0.1,0.9),
      "y": getRandomArbitrary(0.1,0.9)
    };

    if(s.hasMine(mine)) {
      s.updateMine(mine);
    }
    else {
      s.addMine(new Mine(mine));
    }
  }
}

function init() {

  var fb = new Firebase("https://capture-the-flag.firebaseio.com/");
  var s = new CanvasState(document.getElementById('canvas'));

  initializeMines(s);

  fb.on('value', function(snapshot) {
    initializePlayers(snapshot.val().players, s);
    initializeFlags(snapshot.val().flags, s);
  });

  $('.reset').bind('click', function() {
    s.redWins = false;
    s.blueWins = false;

    json = { "players": [ { "id": "0", "team": "red", "x": 0.08, "y": 0.08, "hasEnemyFlag": false }, { "id": "1", "team": "red", "x": 0.08, "y": 0.08, "hasEnemyFlag": false }, { "id": "2", "team": "red", "x": 0.08, "y": 0.08, "hasEnemyFlag": false }, { "id": "3", "team": "blue", "x": 0.9, "y": 0.9, "hasEnemyFlag": false }, { "id": "4", "team": "blue", "x": 0.9, "y": 0.9, "hasEnemyFlag": false }, { "id": "5", "team": "blue", "x": 0.9, "y": 0.9, "hasEnemyFlag": false } ], "flags": [ { "id": "0", "team": "red", "x": getRandomArbitrary(0.1,0.9), "y": getRandomArbitrary(0.1,0.9) }, { "id": "1", "team": "blue", "x": getRandomArbitrary(0.1,0.9), "y": getRandomArbitrary(0.1,0.9) } ] };
    var fb = new Firebase("https://capture-the-flag.firebaseio.com/");
    fb.set(json);
  });
  initialized = true;
}

var initialized = false;

$(document).ready(function () {
  if(!initialized)
    init();
});

function clearSelectedPlayer (valid) {
  if (window.myState.selectedPlayer) {
    window.myState.selectedPlayer = null;
    window.myState.valid = typeof valid === 'undefined' ? true : valid;
  }
}
