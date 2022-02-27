// Set up canvas
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

// Get the width and height from the canvas element
var width = canvas.width;
var height = canvas.height;

// Work out the width and height in blocks
var blockSize = 10;
var widthInBlocks = width / blockSize;
var heightInBlocks = height / blockSize;

// Set score to 0
var score = 0;

// Timeout ID used for the timeout in the animation
var timeoutId = null;
// snake game

// Animation time, reduced every time when the snake eats an apple
var animationTime = 100;
var animationSpeed = 5;

var directions = {
	37: 'left',
	38: 'up',
	39: 'right',
	40: 'down'
};

// Draws the border of the gaming field
var drawBorder = function () {
	ctx.fillStyle = 'Gray';
	ctx.fillRect(0, 0, width, blockSize);
	ctx.fillRect(0, height - blockSize, width, blockSize);
	ctx.fillRect(0, 0, blockSize, height);
	ctx.fillRect(width - blockSize, 0, blockSize, height);
};


// Shows the player's current score on the top left corner
var drawScore = function () {
	ctx.font = '20px Courier';
	ctx.fillStyle = 'Black';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'top';
	ctx.fillText('Score: ' + score, blockSize, blockSize);
};

// Called when the game is over, i.e. when the snake hits the wall or runs into itself
var gameOver = function () {
	// Stop the animation
	clearTimeout(timeoutId);

	// Remove the key down listener 
	$('body').off('keydown');

	ctx.font = '60px Courier';
	ctx.fillStyle = 'Black';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText('Game Over', width / 2, height / 2);
};

// Draws a circle
var circle = function (x, y, radius, fillCircle) {
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, Math.PI * 2, false);

	if (fillCircle) { 
		ctx.fill(); 
	} else { 
		ctx.stroke(); 
	} 
};

/* Block object - representing individual blocks on our invisible game grid, each block will
* have the properties col and row which will store the location of that particular block on the grid
*/
var Block = function (col, row) {
	this.col = col;
	this.row = row;
};


// Draws a square in a particular block on the grid
Block.prototype.drawSquare = function (color) {
	var x = this.col * blockSize;
	var y = this.row * blockSize;
	ctx.fillStyle = color;
	ctx.fillRect(x, y, blockSize, blockSize);
};

// Draws a circle in a particular block on the grid
Block.prototype.drawCircle = function (color) {
	var centerX = this.col * blockSize + blockSize / 2;
	var centerY = this.row * blockSize + blockSize / 2;

	ctx.fillStyle = color;
	circle(centerX, centerY, blockSize / 2, true);
};

// Checks If two blocks (this and otherBlock) have the same col and row props, then they are in the same place
Block.prototype.equal = function (otherBlock) {
	return this.col === otherBlock.col && this.row === otherBlock.row;
};

/* Snake object - store the snake's position as an array called 'segments', which
 * will contain a series of block objects. To move the snake, we'll a new block to the
 * beginning of the segments array and remove the block at the end of the array. The
 * first element of the segments array will represent the head of the snake.
*/
var Snake = function () {
	this.segments = [new Block(7, 5), new Block(6, 5), new Block(5, 5)];
	this.direction = 'right';
	this.nextDirection = 'right';
};

// Draws the sn ake by looping through each of the blocks in its segments array calling drawSquare method
Snake.prototype.draw = function () {
	this.segments[0].drawSquare('Green');
	for (var i = 1; i < this.segments.length; i++) {
		this.segments[i].drawSquare('Blue');
		if (i % 2) {
			this.segments[i].drawSquare('Yellow');
		}
	}
};

Snake.prototype.move = function () {
	var head = this.segments[0];
	var newHead = null;

	this.direction = this.nextDirection;

	if (this.direction === 'right') {
		newHead = new Block(head.col + 1, head.row);
	} else if (this.direction === 'down') {
		newHead = new Block(head.col, head.row + 1);
	} else if (this.direction === 'left') {
		newHead = new Block(head.col - 1, head.row);
	} else if (this.direction === 'up') {
		newHead = new Block(head.col, head.row - 1);
	}

	if (this.checkCollision(newHead)) {
		gameOver();
		return;
	}

	this.segments.unshift(newHead);

	if (newHead.equal(apple.position)) {
		score++;
		apple.move();
		animationTime -= animationSpeed;
	} else {
		this.segments.pop();
	}
};

/* Collision detection, a very common step in game mechanics, is often one of the more complex 
 * aspects of game programming, but here is simple - we care about two types of collisions: 
 * collisions with the wall and collisions with the snake itself. */
Snake.prototype.checkCollision = function (head) {
	var leftCollision = (head.col === 0);
	var topCollision = (head.row === 0);
	var rightCollision = (head.col === widthInBlocks - 1);
	var bottomCollision = (head.row === heightInBlocks - 1);

	var wallCollision = leftCollision || topCollision || rightCollision || bottomCollision;
	var selfCollision = false;

	for (var i = 0; i < this.segments.length; i++) {
		if (head.equal(this.segments[i])) {
			selfCollision = true;
		}
	}

	return wallCollision || selfCollision;
};

/* Updates the snake's direction and prevents the player from making turns that would have
* the snake immediately run into itself. */
Snake.prototype.setDirection = function (newDirection) {
	if (this.direction === 'up' && newDirection === 'down') {
		return;
	} else if (this.direction === 'right' && newDirection === 'left') {
		return;
	} else if (this.direction === 'down' && newDirection === 'up') {
		return;
	} else if (this.direction === 'left' && newDirection === 'right') {
		return;
	}

	this.nextDirection = newDirection;
};

// Apple object 
var Apple = function () {
	this.position = new Block(10, 10);
};

// Draws the apple using drawCircle method
Apple.prototype.draw = function () {
	this.position.drawCircle('LimeGreen');
};

// Moves the apple to a random new position within the game area, that is any block on the canvas other than the border
Apple.prototype.move = function () {
	// Prevent positioning the apple to a block that part of the snake is already occupying
	for (var i = 0; i < snake.segments.length; i++) {
		while (this.position.equal(snake.segments[i])) {
			var randomCol = Math.floor(Math.random() * (widthInBlocks - 2)) + 1;
			var randomRow = Math.floor(Math.random() * (heightInBlocks - 2)) + 1;
			this.position = new Block(randomCol, randomRow);
		}
	}
};

// Create the snake and apple objects
var snake = new Snake();
var apple = new Apple();

var gameLoop = function () {
	ctx.clearRect(0, 0, width, height);
	drawScore();
	snake.move();
	snake.draw();
	apple.draw();
	drawBorder();

	timeoutId = setTimeout(gameLoop, animationTime);
};

// Start the game
gameLoop();

// Keydown event handler for user interacton
$('body').keydown(function (event) {
	var newDirection = directions[event.keyCode];

	if (newDirection !== undefined) {
		snake.setDirection(newDirection);
	}
});