const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth - window.innerWidth * 0.2;
canvas.height = window.innerHeight - window.innerHeight * 0.2;
const ctx = canvas.getContext("2d");

// Flags
let pressed, draw_block_1, draw_block_2, collider, block_to_check;

// Display
let jump_counter;
let blocks_jumped;
let record = 0;

class Block {
    constructor(x, y, width, height, draw) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.touched = false;
        this.draw = draw;
    }
    reset() {
        this.x = canvas.width;
        this.y = randomIntFromInterval(275, 350);
        this.y = Math.round(this.y / 10) * 10;
        this.width = randomIntFromInterval(750, 1200);
        this.height = canvas.height - this.y;
        this.touched = false;
        this.draw = true;
    }
    checkBlock() {
        if (player.y > this.y - player.height) {
            gameOver();
            return;
        }
        if (player.y < this.y - player.height) {
            player.y += player.dy_down;
        } else if (
            player.x < this.x - player.width ||
            player.x > this.x + this.width
        ) {
            player.prevent_from_going_up = true;
            player.y += player.dy_down;
        } else {
            // the following commands execute when the player is touching block
            blocks_jumped =
                this.touched == false ? blocks_jumped + 1 : blocks_jumped;
            jump_counter = collider == false ? jump_counter + 1 : jump_counter;
            this.touched = true;
            collider = true;
            player.prevent_from_going_up = false;
        }
        if (player.x > this.x + this.width) {
            block_to_check = block_to_check == 1 ? 2 : 1;
        }
    }
}
class Player {
    constructor(x, y, width, height, dx, dy_up, dy_down) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.dx = dx;
        this.dy_up = dy_up;
        this.dy_down = dy_down;
        this.prevent_from_going_up = false;
        this.pressed = false;
    }
}
class Obstacle extends Block {
    constructor(x, y, width, height, draw) {
        super(x, y, width, height, draw);
    }
}

let player, block1, block2;
setup();

function setup() {
    player = new Player(200, 100, 50, 50, 60, 20, 10);
    block1 = new Block(200, 250, canvas.width, canvas.height, true);
    block2 = new Block(200, 250, canvas.width, canvas.height, false);
    // flag setup
    pressed = false;
    block_to_check = 1;
    draw_block_1 = true;
    draw_block_2 = false;
    // display setup
    blocks_jumped = 0;
    jump_counter = 0;
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw player block
    ctx.fillStyle = "grey";
    ctx.fillRect(player.x, player.y, player.width, player.height);
    // Draw jump counter & blocks_jumped
    ctx.font = "26px Courier New";
    ctx.fillText("BLOCKS : " + blocks_jumped, canvas.width - 225, 50);
    ctx.font = "26px Courier New";
    ctx.fillText("JUMPS  : " + jump_counter, canvas.width - 225, 80);
    ctx.font = "26px Courier New";
    ctx.fillText("RECORD : " + record, canvas.width - 225, 110);

    if (block1.draw) {
        // Draw block_1
        ctx.fillStyle = "burlywood";
        ctx.fillRect(block1.x, block1.y, block1.width, block1.height);
    } else if (block2.x + block2.width < block2.width * 0.75) {
        block1.reset();
    }

    if (block2.draw) {
        // Draw block_2
        ctx.fillStyle = "burlywood";
        ctx.fillRect(block2.x, block2.y, block2.width, block2.height);
    } else if (block1.x + block1.width < block1.width * 0.75) {
        block2.reset();
    }

    if (block1.x + block1.width < 0) {
        block1.draw = false;
    }
    if (block2.x + block2.width < 0) {
        block2.draw = false;
    }

    //make blocks move backwards at the same speed
    block1.x -= player.dx / 4;
    block2.x -= player.dx / 4;

    if (pressed) {
        // check if player.y reached max
        if (player.y < 0) {
            pressed = false;
            player.prevent_from_going_up = true;
        } else {
            player.y -= player.dy_up;
        }
    }
    if (!pressed) {
        // console.log(block_to_check);
        block_to_check == 1 ? block1.checkBlock() : block2.checkBlock();
    }

    // Draw obstacle

    requestAnimationFrame(gameLoop);
}
gameLoop();

function randomIntFromInterval(min, max) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// pressed
document.addEventListener("keydown", keyDownHandler, false);
function keyDownHandler(e) {
    if (e.keyCode == 38) {
        collider = false;
        if (player.prevent_from_going_up) {
            return;
        }
        //sfx.jump.play();
        pressed = true;
    }
}

// released
document.addEventListener("keyup", keyUpHandler, false);
function keyUpHandler(e) {
    if (e.keyCode == 38) {
        player.prevent_from_going_up = true;
        pressed = false;
    }
}

function gameOver() {
    record = record < jump_counter ? jump_counter : record;
    //sfx.game_over.play();
    setup();
}
