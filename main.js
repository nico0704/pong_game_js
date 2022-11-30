// @TODO
// - Code verschönern -> Vektor erstellen für blocks und für player
// - Spielphysik verbessern (player geht länger hoch als man drückt und beschleunigt beim runterkommen)
// - Spiel mit Verlauf schwieriger / schneller machen
// - alle Eigenschaften in Abhängigkeit der Canvas-Größe setzen
// - doppeltes Design
// - Particle System -> Optional
// - Enemy
// - Shot Funktion
// - Musik & SoundFx

// sound fx
/*var sfx = {
    game_over: new Howl({
        src: "./assets/error.mp3"
    }),
    jump : new Howl({
        src: "./assets/jump.mp3"
    })
}
// music
var music = {
    game_music: new Howl({

    })
*/

const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth - window.innerWidth * 0.2;
canvas.height = window.innerHeight - window.innerHeight * 0.2;
const ctx = canvas.getContext("2d");

// Player
var player_x,
    player_y,
    player_width,
    player_height,
    player_dx,
    player_dy_up,
    player_dy_down;
// flags
var pressed, draw_block_1, draw_block_2, prevent_from_going_up, collider; // boolean
var block; // 1 or 2
// block1:
var block1_x, block1_y, block1_width, block1_height, block1_touched;
// block2:
var block2_x, block2_y, block2_width, block2_height, block2_touched;
// Display
var jump_counter;
var blocks_jumped;
var record = 0;

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
    prevent_from_going_up = false;
    block = 1;
    draw_block_1 = true;
    draw_block_2 = false;
    collider = false;
    // Setup for block1
    block1_x = 200;
    block1_y = 250;
    block1_width = canvas.width;
    block1_height = canvas.height;
    // display setup
    blocks_jumped = 0;
    jump_counter = 0;
    total_blocks = 0;
    // block touched or not
    block1_touched = false;
    block2_touched = false;
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw player block
    ctx.fillStyle = "red";
    ctx.fillRect(player_x, player_y, player_width, player_height);

    // Draw jump counter & blocks_jumped
    ctx.font = "26px Courier New";
    ctx.fillText("BLOCKS : " + blocks_jumped, canvas.width - 225, 50);
    ctx.font = "26px Courier New";
    ctx.fillText("JUMPS  : " + jump_counter, canvas.width - 225, 80);
    ctx.font = "26px Courier New";
    ctx.fillText("RECORD : " + record, canvas.width - 225, 110);

    if (draw_block_1 == true) {
        // Draw block_1
        ctx.fillStyle = "green";
        ctx.fillRect(block1_x, block1_y, block1_width, block1_height);
    } else if (block2_x + block2_width < block2_width * 0.75) {
        init_block(1);
        draw_block_1 = true;
    }
    if (draw_block_2 == true) {
        // Draw block_2
        ctx.fillStyle = "blue";
        ctx.fillRect(block2_x, block2_y, block2_width, block2_height);
    } else if (block1_x + block1_width < block1_width * 0.75) {
        init_block(2);
        draw_block_2 = true;
    }

    if (block1_x + block1_width < 0) {
        draw_block_1 = false;
    }
    if (block2_x + block2_width < 0) {
        draw_block_2 = false;
    }

    //make blocks move backwards at the same speed
    block1_x -= player_dx / 4;
    block2_x -= player_dx / 4;

    if (pressed == true) {
        // check if player_y reached maximum
        if (player_y < 0) {
            pressed = false;
            prevent_from_going_up = true;
        } else {
            player_y -= player_dy_up;
        }
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
    if (player_y > block1_y - player_height) {
        gameOver();
        return;
    }
    if (player_y < block1_y - player_height) {
        player_y += player_dy_down;
    } else if (
        player_x < block1_x - player_width ||
        player_x > block1_x + block1_width
    ) {
        prevent_from_going_up = true;
        player_y += player_dy_down;
    } else {
        // the following commands execute when the player is touching block
        blocks_jumped = block1_touched == false ? blocks_jumped + 1 : blocks_jumped;
        jump_counter = collider == false ? jump_counter + 1 : jump_counter;
        block1_touched = true;
        collider = true;
        prevent_from_going_up = false;
    }
    if (player_x > block1_x + block1_width) {
        block = 2;
    }
}

function check_for_block2() {
    if (player_y > block2_y - player_height) {
        gameOver();
        return;
    }
    if (player_y < block2_y - player_height) {
        player_y += player_dy_down;
    } else if (player_x < block2_x - player_width || player_x > block2_x + block2_width) {
        prevent_from_going_up = true;
        player_y += player_dy_down;
    } else {
        // the following commands execute when the player is touching block
        blocks_jumped = block2_touched == false ? blocks_jumped + 1 : blocks_jumped;
        jump_counter = collider == false ? jump_counter + 1 : jump_counter;
        block2_touched = true;
        collider = true;
        prevent_from_going_up = false;
    }
    if (player_x > block2_x + block2_width) {
        block = 1;
    }
}

function init_block(number) {
    if (number == 1) {
        // block1
        block1_x = canvas.width;
        block1_y = randomIntFromInterval(275, 350);
        block1_y = Math.round(block1_y / 10) * 10;
        block1_width = randomIntFromInterval(750, 1200);
        block1_height = canvas.height - block1_y;
        block1_touched = false;
    } else {
        // block2
        block2_x = canvas.width;
        block2_y = randomIntFromInterval(275, 350);
        block2_y = Math.round(block2_y / 10) * 10;
        block2_width = randomIntFromInterval(750, 1200);
        block2_height = canvas.height - block2_y;
        block2_touched = false;
    }
}

function randomIntFromInterval(min, max) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// pressed
document.addEventListener("keydown", keyDownHandler, false);
function keyDownHandler(e) {
    if (e.keyCode == 38) {
        collider = false;
        if (prevent_from_going_up == true) {
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
        prevent_from_going_up = true;
        pressed = false;
    }
}

function gameOver() {
    record = record < jump_counter ? jump_counter : record;
    //sfx.game_over.play();
    setup();
}