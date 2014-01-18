var WINDOW_WIDTH = 800;
var WINDOW_HEIGHT = 800;

var PADDLE_WIDTH = 100;
var PADDLE_HEIGHT = 10;

var PADDLE_DIST = 200;

var PADDLE_SPEED = 0.5;

var BALL_SIZE = 10;
var BALL_SPEED = 0.25;

var BALL_DIE_SCORE = -1;
var BLOCK_HIT_SCORE = 1;

Crafty.c('Ball', {
	replicate : function() {
		TogetherJS.send({
			type: "ball",
			velx : this.velx,
			vely : this.vely,
			x : this.x,
			y : this.y,
			num : this.num,
			time : getMilliseconds()
		});
	},
  init: function() {
	this.requires('2D, Canvas, Color, Keyboard, Collision').attr({
		w : BALL_SIZE,
		h : BALL_SIZE,
		velx : 0,
		vely : 0
	}).color('rgb(255,255,255)');
	
	this.onHit('Paddle', function(objects) {
		this.vely = -this.vely;
	});
	
	this.onHit('Block', function(objects) {
		if(this.num == 0) {
			this.vely = -this.vely;
			objects[0].obj.destroy();
			TogetherJS.send({
				type: "block",
				i : objects[0].obj.i,
				j : objects[0].obj.j
			});
			this.replicate();
			
			window.scores[this.num] += BLOCK_HIT_SCORE;
			syncScores()
		}
	});
	
	this.bind('EnterFrame', function(data) {
		if( this.velx == 0 && this.vely == 0 ) {
			if(this.num == 0) {
				this.x = window.playerpaddle.x + PADDLE_WIDTH/2 - BALL_SIZE/2;
				this.y = window.playerpaddle.y - BALL_SIZE*2;
				
				if( this.isDown("SPACE") ) {
					this.vely = -BALL_SPEED;
					this.replicate();
				}
			}
			else {
				this.x = window.networkpaddle.x + PADDLE_WIDTH/2 - BALL_SIZE/2;
				this.y = window.networkpaddle.y + PADDLE_HEIGHT + BALL_SIZE;
			}
		}
		else {
			this.x += this.velx*data.dt;
			this.y += this.vely*data.dt;
			
			this.previous_vel = this.vel;
			if(this.x < 0 || this.x > WINDOW_WIDTH - BALL_SIZE)
				this.velx = -this.velx;
				
			if(this.previous_vel != this.vel && window.is_host) {
				this.replicate();
			}
			
			if(window.is_host) {
				if(this.y < -BALL_SIZE) {
					this.velx = 0;
					this.vely = 0;
					
					this.replicate();
					
					window.scores[0] += BALL_DIE_SCORE;
					window.syncScores();
				}
				if(this.y > WINDOW_HEIGHT) {
					this.velx = 0;
					this.vely = 0;
					this.replicate();
					
					window.scores[1] += BALL_DIE_SCORE;
					window.syncScores();
				}
			}
		}
	});
  }
});

Crafty.c('Paddle', {
  init: function() {
	this.requires('2D, Canvas, Color, Collision').attr({
		w : PADDLE_WIDTH,
		h : PADDLE_HEIGHT
	}).color('rgb(255,255,255)');
  }
});

Crafty.c('PlayerPaddle', {
  init: function() {
	this.requires('Paddle, Keyboard').attr({
		x : (WINDOW_WIDTH - PADDLE_WIDTH)/2,
		y : WINDOW_HEIGHT - PADDLE_DIST - (PADDLE_HEIGHT/2),
		vel : 0,
		num : 0
	})
	
	this.bind('EnterFrame', function(data) {
		this.previous_vel = this.vel;
		if ( this.isDown('RIGHT_ARROW') && this.x < (WINDOW_WIDTH - PADDLE_WIDTH) ) {
			this.vel = PADDLE_SPEED;
		}
		else if ( this.isDown('LEFT_ARROW') && this.x > 0) {
			this.vel = -PADDLE_SPEED;
		}
		else {
			this.vel = 0;
		}
		if(this.previous_vel != this.vel) {
			TogetherJS.send({
				type: "paddle",
				vel : this.vel,
				x : this.x,
				time : getMilliseconds()
			});
		}
		
		this.x += this.vel*data.dt;
	});
  }
});

function getMilliseconds() {
	return (new Date()).getTime();
}

Crafty.c('NetworkPaddle', {
  init: function() {
	this.requires('Paddle').attr({
		x : (WINDOW_WIDTH - PADDLE_WIDTH)/2,
		y : PADDLE_DIST,
		vel : 0,
		num : 1
	})
	
	this.bind('EnterFrame', function(data) {
		this.x += this.vel*data.dt;
	});
  }
});

var BLOCK_ROWS = 5;
var BLOCK_COLUMNS = 11;
var BLOCK_WIDTH = 30
var BLOCK_HEIGHT = 10;
var BLOCK_SPACE = 8;
Crafty.c('Block', {
  init: function() {
	this.requires('2D, Canvas, Color, Collision').attr({
		w : BLOCK_WIDTH,
		h : BLOCK_HEIGHT
	}).color('rgb(255,255,255)');
  }
});


Game = {
  // Initialize and start our game
  start: function() {
    // Start crafty and set a background color so that we can see it's working
    Crafty.init(WINDOW_WIDTH, WINDOW_HEIGHT, "game");
    Crafty.background('black');
	
	window.playerpaddle = Crafty.e('PlayerPaddle');
	window.networkpaddle = Crafty.e('NetworkPaddle');
	
	window.balls = [Crafty.e('Ball'), Crafty.e('Ball')]
	balls[0].num = 0;
	balls[1].num = 1;
	
	window.scores = [0, 0]
	
	var score0 = Crafty.e("2D, Canvas, Text").attr({x: WINDOW_WIDTH/2 - 50, y: 0, w: 800, h: 50})
	.text( "SCORE: " + scores[0] )
	.textColor('white').textFont({ size: '20px', weight: 'bold' });
	
	var score1 = Crafty.e("2D, Canvas, Text").attr({x: WINDOW_WIDTH/2 - 50, y: WINDOW_HEIGHT - 100, w: 800, h: 50})
	.text( "SCORE: " + scores[1] )
	.textColor('white').textFont({ size: '20px', weight: 'bold' });
	
	window.syncScores = function() {
		score0.text("SCORE: " + scores[0]);
		score1.text("SCORE: " + scores[1]);
		
		if(window.is_host) {
			TogetherJS.send({
				type : 'score',
				scores : window.scores
			});
		}
	};
	
	//Create blocks
	window.blocks = []
	for(var i = 0; i < BLOCK_COLUMNS; ++i) {
		window.blocks.push([])
		for(var j = 0; j < BLOCK_ROWS; ++j) {
			var block = Crafty.e('Block');
			block.x = WINDOW_WIDTH/2 + (i - BLOCK_COLUMNS/2)*(BLOCK_WIDTH + BLOCK_SPACE);
			block.y = WINDOW_HEIGHT/2 - BLOCK_HEIGHT/2 + (j - BLOCK_ROWS/2)*(BLOCK_HEIGHT + BLOCK_SPACE);
			
			block.i = i;
			block.j = j;
			
			window.blocks[i].push(block)
		}
	}
	
	TogetherJS.hub.on( 'paddle', function (msg) {
		networkpaddle.x = msg.x;
		networkpaddle.vel = msg.vel;
	});
	
	TogetherJS.hub.on( 'block', function (msg) {
		blocks[msg.i][BLOCK_ROWS - msg.j - 1].destroy();
		window.scores[1] += BLOCK_HIT_SCORE;
		syncScores();
	});
	
	TogetherJS.hub.on( 'ball', function (msg) {
		if(msg.num == 0) {
			balls[1].x = msg.x;
			balls[1].y = WINDOW_HEIGHT - msg.y - BALL_SIZE;
			balls[1].velx = msg.velx;
			balls[1].vely = -msg.vely;
		}
		if(msg.num == 1) {
			balls[0].x = msg.x;
			balls[0].y = WINDOW_HEIGHT - msg.y - BALL_SIZE;
			balls[0].velx = msg.velx;
			balls[0].vely = -msg.vely;
		}
	});
	
	TogetherJS.hub.on( 'score', function (msg) {
		scores[0] = msg.scores[1];
		scores[1] = msg.scores[0];
		
		syncScores();
	});
  }
}

$(function() {
	//Game.start();
})