// @TODO
// 1. Beim runterkommen sprung sperren
// 2. endloser sprung verhindern
// 3. Code verschönern -> Vektor erstellen für blocks und für player
// 4. Jumpcounter & Punktecounter
// 5. Spielphysik verbessern (player geht länger hoch als man drückt und beschleunigt beim runterkommen)
// 6. alle Eigenschaften in Abhängigkeit der Canvas-Größe setzen
// 7. doppeltes Design
// 8. Particle System -> Optional
// 9. Enemy
// 10. Shot Funktion
// 11. Musik & SoundFx


const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth - window.innerWidth * 0.2;
canvas.height = window.innerHeight - window.innerHeight * 0.3;
const ctx = canvas.getContext("2d");

// Player
var player_x, player_y, player_width, player_height, player_dx, player_dy_up, player_dy_down;
// flags
var pressed, draw_block_1, draw_block_2; // boolean
var block; // 1 or 2
// block1:
var block1_x, block1_y, block1_width, block1_height;
// block2:
var block2_x, block2_y, block2_width, block2_height;

setup();

// Setup
function setup() {
    // Setup player
    player_x = 200;
    player_y = 100;
    player_width = 50;
    player_height = 50;
    player_dx = 60;
    player_dy_up = 20;
    player_dy_down = 10;
    // flag setup
    pressed = false;
    block = 1;
    draw_block_1 = true;
    draw_block_2 = false;
    // Setup for block1:
    block1_x = 200;
    block1_y = 250;
    block1_width = canvas.width;
    block1_height = 300;
}

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

    if (
        draw_block_1 == false &&
        block2_x + block2_width < block2_width * 0.75
    ) {
        init_block(1);
        draw_block_1 = true;
    }
    if (
        draw_block_2 == false &&
        block1_x + block1_width < block1_width * 0.75
    ) {
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
    }, 1000 / 60);
}

gameLoop();

function check_for_block1() {
    if (player_y > block1_y - 50) {
        gameOver();
        return;
    }
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
    if (player_y > block2_y - 50) {
        gameOver();
        return;
    }
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
        block1_y = Math.round(block1_y / 10) * 10;
        block1_width = randomIntFromInterval(700, 1200);
        block1_height = canvas.height - block1_y;
    } else {
        // block2
        block2_x = canvas.width;
        block2_y = randomIntFromInterval(250, 350);
        block2_y = Math.round(block2_y / 10) * 10;
        block2_width = randomIntFromInterval(700, 1200);
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

function gameOver() {
    console.log("Game Over");
    setup();
}
