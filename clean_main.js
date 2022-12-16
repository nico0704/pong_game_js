const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
//console.log("Canvas Width: " + canvas.width);
//console.log("Canvas Height: " + canvas.height);
const ctx = canvas.getContext("2d");

const image_paths = [
    "./assets/Mars_Background.jpg",
    "./assets/background2.jpg",
    "./assets/among_us_purple.png",
    "./assets/among_us_purple.png",
    "./assets/ghost.png",
    "./assets/ghost.png",
    "./assets/coin.png",
    "./assets/coin.png",
];

const images = [];
var img_load_count = 0;
var img_loaded = false;
var world_det = 0; // 0 => space, 1 => ???
var start_pressed = false;

image_paths.forEach((src) => {
    const img = new Image();
    img.src = src;
    images.push(img);
    img.onload = () => {
        img_load_count++;
        if (img_load_count === image_paths.length) {
            img_loaded = true;
            console.log("images loaded");
            ctx.drawImage(images[0 + world_det], 0, 0, canvas.width, canvas.height);
            ctx.font = canvas.width * 0.03 + "px Courier New";
            ctx.fillStyle = "#1c1b1b";
            ctx.fillText("JUMP : ARROW KEY UP", canvas.width / 3, 100);

            ctx.font = canvas.width * 0.03 + "px Courier New";
            ctx.fillStyle = "#1c1b1b";
            ctx.fillText("SHOOT: SPACE BAR", canvas.width / 3, 150);

            ctx.font = canvas.width * 0.03 + "px Courier New";
            ctx.fillStyle = "#1c1b1b";
            ctx.fillText("CHANGE WORLD: w", canvas.width / 3, 200);

            ctx.font = "bold " + canvas.width * 0.03 + "px Courier New";
            ctx.fillStyle = "#1c1b1b";
            ctx.fillText("PRESS S TO START", canvas.width / 3, 300);
        }
    };
});

// sound fx
var jump_sound_plays = false;

var sfx = {
    error: new Howl({
        src: "./assets/error2.mp3",
    }),
    success: new Howl({
        src: "./assets/win2.mp3",
    }),
    gameOver: new Howl({
        src: "./assets/error.mp3",
    }),
    hit: new Howl({
        src: "./assets/hit.mp3",
    }),
};

// music
var music = {
    game_music: new Howl({
        src: "./assets/game_music.mp3"
    }),
}

const acceleration_down = 1.01;
const acceleration_up = 0.94;
const player_dx = canvas.width * 0.04;
const player_dy_up = canvas.height * 0.03;
const player_dy_down = canvas.height * 0.015;
const player_width = player_dy_down * 4;
const player_height = player_dy_down * 4;
const max_x_platform = canvas.width;
const min_x_platform = canvas.width * 0.8;
const min_y_platform = Math.round(canvas.height / 2 / player_height) * player_height;
const max_y_platform = Math.round((canvas.height * 0.6) / player_height) * player_height;

let player, platform1, platform2;

// Flags
let pressed, draw_platform_1, draw_platform_2, collider, platform_to_check;

// shot array
let shots = [];

// Display
let points;
let jump_counter;
let blocks_jumped;
let record = 0;

class Block {
    constructor(x, y, width, height, draw, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.draw = draw;
        this.color = color;
    }
    draw_obj() {
        if (this.draw) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
    move() {
        if (this.draw) {
            this.x -= player.dx / 4;
            this.draw = this.x + this.width <= 0 ? false : true;
        }
    }
}

class Platform extends Block {
    constructor(x, y, width, height, draw, color) {
        super(x, y, width, height, draw, color);
        this.touched = false;
        this.obstacle = new Obstacle(
            this.x + this.width / 2,
            this.y - 100,
            75,
            100,
            false,
            "red"
        );
        this.obstacle.height = this.y - this.obstacle.y;
        this.friendlyObject = new FriendlyObject(
            this.x + this.width * 0.7,
            this.y - randomIntFromInterval(150, 250),
            50,
            50,
            true,
            "green"
        );
    }
    reset() {
        this.x = canvas.width;
        this.y = randomIntFromInterval(min_y_platform, max_y_platform);
        this.y = Math.round(this.y / player.height) * player.height;
        this.width = randomIntFromInterval(min_x_platform, max_x_platform);
        this.height = 30;
        this.touched = false;
        this.draw = true;
        this.obstacle = new Obstacle(
            this.x + this.width / 2,
            this.y - 100,
            85,
            100,
            true,
            "red"
        );
        // randomise obstacles
        // 66.66 % chance that obstacle gets drawn
        let random = randomIntFromInterval(1, 3);
        if (random == 1) {
            this.obstacle.draw = false;
        }
        this.obstacle.height = this.y - this.obstacle.y;
        this.friendlyObject = new FriendlyObject(
            randomIntFromInterval(this.width, this.width * 2),
            this.y - randomIntFromInterval(150, 250),
            50,
            50,
            true,
            "green"
        );
        // randomise friend
        // 66.66 % chance that friend gets drawn
        random = randomIntFromInterval(1, 3);
        if (random == 1) {
            this.friendlyObject.draw = false;
        }
    }
    check_platform() {
        if (player.y < this.y - player.height) {
            player.y += player.dy_down;
            player.dy_down *= acceleration_down;
        } else if (player.y > this.y - player.height + player.dy_down) {
            gameOver();
            return;
        } else if (
            player.x < this.x - player.width ||
            player.x > this.x + this.width
        ) {
            player.prevent_from_going_up = true;
            player.y += player.dy_down;
            player.dy_down *= acceleration_down;
            
        } else {
            // the following commands execute when the player is touching the platform
            blocks_jumped =
                this.touched == false ? blocks_jumped + 1 : blocks_jumped;
            jump_counter = collider == false ? jump_counter + 1 : jump_counter;
            this.touched = true;
            collider = true;
            player.prevent_from_going_up = false;
            player.dy_down = player_dy_down;
            player.y = this.y - player.height;
            jump_sound_plays = false;
        }
        if (player.x > this.x + this.width) {
            platform_to_check = platform_to_check == 1 ? 2 : 1;
        }
    }
    draw_obj(other_platform) {
        super.draw_obj();
        if (this.draw) {
            this.obstacle.draw_obj();
            this.obstacle.move();
            this.friendlyObject.draw_obj();
            this.friendlyObject.move();
        } else if (
            other_platform.x + other_platform.width <
            other_platform.width * 0.75
        ) {
            this.reset();
        }
    }
}

class Obstacle extends Block {
    constructor(x, y, width, height, draw, color) {
        super(x, y, width, height, draw, color);
        this.shot = false;
        this.img = images[4 + world_det];
    }
    draw_obj() {
        if (this.draw) {
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        }
    }
    check_for_collision() {
        if (this.draw) {
            if (
                player.x + player.width / 2 > this.x * 1.1 &&
                player.x < this.x * 0.9 + this.width &&
                player.y + player.y / 2 > this.y * 1.1 &&
                player.y < this.y * 0.9 + this.height &&
                !this.shot
            ) {
                points--;
                sfx.error.play();
                this.shot = true;
                if (points < 0) {
                    gameOver();
                }
            }
        }
    }
}

class FriendlyObject extends Block {
    constructor(x, y, width, height, draw, color) {
        super(x, y, width, height, draw, color);
        this.touched = false;
        this.img = images[6 + world_det];
    }
    draw_obj() {
        if (this.draw) {
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        }
    }
    check_for_collision() {
        if (this.draw) {
            if (
                player.x + player.width / 2 > this.x &&
                player.x <= this.x + this.width &&
                player.y + player.y / 2 > this.y &&
                player.y <= this.y + this.height &&
                !this.touched
            ) {
                points++;
                sfx.success.play();
                this.touched = true;
                this.draw = false;
            }
        }
    }
}

class Shot extends Block {
    constructor(x, y, width, height, draw, color) {
        super(x, y, width, height, draw, color);
        shots.push(this);
    }
    collision(platform) {
        if (
            this.x >= platform.obstacle.x &&
            this.x <= platform.obstacle.x + platform.obstacle.width &&
            this.y >= platform.obstacle.y &&
            this.y <= platform.obstacle.y + platform.obstacle.height &&
            platform.obstacle.draw 
        ) {
            // collided
            this.draw = false;
            platform.obstacle.draw = false;
            sfx.hit.play();
        }
    }
    move() {
        if (this.draw) {
            this.x += player.dx / 8;
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
        this.prevent_from_going_up = true;
        this.pressed = false;
        this.img = images[2 + world_det];
    }
}

function setup() {
    if (!img_loaded) {
        return;
    }
    player = new Player(
        300,
        100,
        player_width,
        player_height,
        player_dx,
        player_dy_up,
        player_dy_down
    );
    platform1 = new Platform(
        200,
        max_y_platform,
        canvas.width,
        30,
        true,
        "#942037"
    );
    platform2 = new Platform(
        200,
        min_y_platform,
        canvas.width,
        30,
        false,
        "#942037"
    );
    // flag setup
    pressed = false;
    platform_to_check = 1;
    draw_platform_1 = true;
    draw_platform_2 = false;
    // display setup
    blocks_jumped = 0;
    jump_counter = 0;
    points = 0;
    // shots
    shots = [];
}
//setup();

function gameLoop() {
    if (!img_loaded) {
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw background
    ctx.drawImage(images[0 + world_det], 0, 0, canvas.width, canvas.height);
    // Draw player
    ctx.drawImage(player.img, player.x, player.y, player.width, player.height);
    // Draw display
    draw_display();
    // Draw platforms
    platform1.draw_obj(platform2);
    platform2.draw_obj(platform1);

    if (platform1.x + platform1.width < 0) {
        platform1.draw = false;
    }
    if (platform2.x + platform2.width < 0) {
        platform2.draw = false;
    }
    // make blocks move backwards at the same speed
    platform1.x -= player.dx / 4;
    platform2.x -= player.dx / 4;
    if (pressed) {
        // check if player.y reached max
        if (player.y < 0) {
            pressed = false;
            player.prevent_from_going_up = true;
        } else {
            player.y -= player.dy_up;
            player.dy_up *= acceleration_up;
            if (player.dy_up < 3) {
                player.prevent_from_going_up = true;
                pressed = false;
            }
        }
    }
    if (!pressed) {
        platform_to_check == 1
            ? platform1.check_platform()
            : platform2.check_platform();
        player.dy_up = player_dy_up;
    }
    if (blocks_jumped % 3 == 0 && blocks_jumped != 0) {
        // increase speed
        player.dx += 0.04;
    }
    // shots
    for (let i = 0; i < shots.length; i++) {
        if (shots[i].draw) {
            shots[i].draw_obj();
            shots[i].move();
            // check for collision
            let platform = platform_to_check == 1 ? platform1 : platform2;
            shots[i].collision(platform);
        }
        if (shots[i].x >= canvas.width) {
            shots.shift();
        }
    }
    // check obstacle collision
    platform1.obstacle.check_for_collision();
    platform2.obstacle.check_for_collision();
    platform1.friendlyObject.check_for_collision();
    platform2.friendlyObject.check_for_collision();

    requestAnimationFrame(gameLoop);
}

function randomIntFromInterval(min, max) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// pressed
document.addEventListener("keydown", keyDownHandler, false);
function keyDownHandler(e) {
    if (e.keyCode == 83 && img_loaded && !start_pressed) {
        start_pressed = true;
        setup();
        console.log("setup terminates... calling game loop");
        gameLoop();
        //music.game_music.play();
        return;
    }
    if (e.keyCode == 38) {
        collider = false;
        if (player.prevent_from_going_up) {
            return;
        }
        if (!jump_sound_plays) {
            jump_sound_plays = true;
            //sfx.jump.play();
        }
        pressed = true;
    }
    // shot
    if (e.keyCode == 32) {
        new Shot(player.x + player.width, player.y + player.height / 2, 6, 6, true, "black");
    } 
}

// released
document.addEventListener("keyup", keyUpHandler, false);
function keyUpHandler(e) {
    if (e.keyCode == 38) {
        player.prevent_from_going_up = true;
        pressed = false;
    }
    if (e.keyCode == 87) {
        // change world
        world_det = 1 - world_det;
    }
}

function draw_display() {
    ctx.font = "bold " + canvas.width * 0.02 + "px Courier New";
    ctx.fillStyle = "#1c1b1b";
    ctx.fillText("POINTS : " + points, canvas.width - canvas.width * 0.15, canvas.height * 0.05);
    ctx.font = "bold " + canvas.width * 0.02 + "px Courier New";
    ctx.fillStyle = "#1c1b1b";
    ctx.fillText( "RECORD : " + record, canvas.width - canvas.width * 0.15, canvas.height * 0.1);
    // Control
    ctx.font = "bold " + canvas.width * 0.02 + "px Courier New";
    ctx.fillStyle = "#1c1b1b";
    ctx.fillText("JUMP : KEY UP", 2, canvas.height * 0.05);
    ctx.font = "bold " + canvas.width * 0.02 + "px Courier New";
    ctx.fillStyle = "#1c1b1b";
    ctx.fillText("SHOOT: SPACE", 2, canvas.height * 0.1);
    ctx.font = "bold " + canvas.width * 0.02 + "px Courier New";
    ctx.fillStyle = "#1c1b1b";
    ctx.fillText("WORLD: w", 2, canvas.height * 0.15);
}

function gameOver() {
    record = record < jump_counter ? jump_counter : record;
    sfx.gameOver.play();
    setup();
}