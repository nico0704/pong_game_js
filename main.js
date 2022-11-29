const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth - window.innerWidth * 0.2;
canvas.height = window.innerHeight - window.innerHeight * 0.3;
const ctx = canvas.getContext("2d");
console.log(canvas.width);

// Setup
var player_x = 100;
var player_y = 100;
var player_width = 50;
var player_height = 50;
var player_dx = 60;
var player_dy_up = 20;
var player_dy_down = 12;

var pressed = false;
var block = 1;
var draw_block_1 = true;
var draw_block_2 = false;

// Setup for block1:
var block1_x = 200;
var block1_y = 250;
var block1_width = canvas.width;
var block1_height = 300;

// Setup for block2:
var block2_x;
var block2_y;
var block2_width = canvas.width;
var block2_height;

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //Draw player block
    ctx.fillStyle = "red";
    ctx.fillRect(player_x, player_y, player_width, player_height);

    // Draw block_1
    if (draw_block_1 == true) {
        ctx.fillStyle = "green";
        ctx.fillRect(block1_x, block1_y, block1_width, block1_height);
    }
    // Draw block_2
    if (draw_block_2 == true) {
        ctx.fillStyle = "blue";
        ctx.fillRect(block2_x, block2_y, block2_width, block2_height);
    }

    if (draw_block_1 == false && block2_x + block2_width < block2_width * 0.75) {
        init_block(1);
        draw_block_1 = true;
    }
    if (draw_block_2 == false && block1_x + block1_width < block1_width * 0.75) {
        init_block(2);
        draw_block_2 = true;
    }

    if (block1_x + block1_width < 0) {
        draw_block_1 = false;
    }
    if (block2_x + block2_width < 0) {
        draw_block_2 = false;
    }

    //make them move backwards at the same speed
    block1_x -= player_dx / 4;
    block2_x -= player_dx / 4;

    if (pressed == true) {
        player_y -= player_dy_up;
    }
    if (pressed == false) {
        block == 1 ? check_for_block1() : check_for_block2();
    }
    setTimeout(() => {
        requestAnimationFrame(gameLoop);
    }, 1000 / 600);
}

gameLoop();

function check_for_block1() {
    if (player_y < block1_y - player_height) {
        player_y += player_dy_down;
    } else if (
        player_x < block1_x - player_width ||
        player_x > block1_x + block1_width
    ) {
        player_y += player_dy_down;
    }
    if (player_x > block1_x + block1_width) {
        block = 2;
    }
}

function check_for_block2() {
    if (player_y < block2_y - player_height) {
        player_y += player_dy_down;
    } else if (
        player_x < block2_x - player_width ||
        player_x > block2_x + block2_width
    ) {
        player_y += player_dy_down;
    }
    if (player_x > block2_x + block2_width) {
        block = 1;
    }
}

function init_block(number) {
    if (number == 1) {
        // block1
        block1_x = canvas.width;
        block1_y = randomIntFromInterval(250, 350);
        block1_width = randomIntFromInterval(700, 1200);
        block1_height = canvas.height - block1_y;
        console.log(block1_height);
    } else {
        // block2
        block2_x = canvas.width;
        block2_y = randomIntFromInterval(250, 350);
        block2_width = randomIntFromInterval(700, 1200); // random zahl zwischen 800 und 1200
        block2_height = canvas.height - block2_y;
    }
}

function randomIntFromInterval(min, max) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
}

document.addEventListener("keydown", keyDownHandler, false);
function keyDownHandler(e) {
    if (e.keyCode == 38) {
        console.log("pressed");
        pressed = true;
    }
}

document.addEventListener("keyup", keyUpHandler, false);
function keyUpHandler(e) {
    if (e.keyCode == 38) {
        console.log("released");
        pressed = false;
    }
}
