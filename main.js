// setting canvas size manually if neccessary
// so that relationship between width and height is more or less like 2 * height = width
const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth; // 1500
canvas.height = window.innerHeight; // 705
const ref_scale_value = 1500 / 705;
console.log("Canvas Width: " + canvas.width);
console.log("Canvas Height: " + canvas.height);
if (canvas.width >= 1500 && canvas.height >= 705) {
    canvas.width = 1500;
    canvas.height = 705;
}
if (canvas.width / canvas.height < ref_scale_value - 0.2) {
    canvas.height = canvas.width / ref_scale_value;
}
if (canvas.width / canvas.height > ref_scale_value + 0.2) {
    canvas.width = canvas.height * ref_scale_value;
}
console.log("Canvas Width: " + canvas.width);
console.log("Canvas Height: " + canvas.height);
const ctx = canvas.getContext("2d"); // context

// handle images
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

const images = []; // array to store the image elements when loaded
let img_load_count = 0;
let img_loaded = false;
let world_det = 0; // 0 => space, 1 => ???
let start_pressed = false;

// load images and create start screen
image_paths.forEach((src) => {
    const img = new Image();
    img.src = src;
    images.push(img);
    img.onload = () => {
        img_load_count++;
        if (img_load_count === image_paths.length) {
            img_loaded = true;
            console.log("images loaded");
            ctx.drawImage(
                images[0 + world_det],
                0,
                0,
                canvas.width,
                canvas.height
            );
            ctx.font = canvas.width * 0.025 + "px Courier New";
            ctx.fillStyle = "#1c1b1b";
            ctx.fillText("JUMP : ARROW KEY UP", canvas.width / 3, 100);

            ctx.font = canvas.width * 0.025 + "px Courier New";
            ctx.fillStyle = "#1c1b1b";
            ctx.fillText("SHOOT: SPACE BAR", canvas.width / 3, 150);

            ctx.font = canvas.width * 0.025 + "px Courier New";
            ctx.fillStyle = "#1c1b1b";
            ctx.fillText("CHANGE WORLD: w", canvas.width / 3, 200);

            ctx.font = canvas.width * 0.025 + "px Courier New";
            ctx.fillStyle = "#1c1b1b";
            ctx.fillText("RIGHT/LEFT: ARROW KEYS", canvas.width / 3, 250);

            ctx.font = "bold " + canvas.width * 0.03 + "px Courier New";
            ctx.fillStyle = "#1c1b1b";
            ctx.fillText("PRESS S TO START", canvas.width / 3, 350);
        }
    };
});

// handle music sources
let game_music = new Audio("./assets/neon_game_music.mp3");
let game_over_sound = new Audio("./assets/error.mp3");
let error_sound = new Audio("./assets/error3.mp3");
let hit_sound = new Audio("./assets/hit.mp3");
let success_sound = new Audio("./assets/win2.mp3");

// various constants with values that depend on canvas size
const acceleration_down = 1.01;
const acceleration_up = 0.94;
const player_dx = canvas.width * 0.04;
const player_dy_up = canvas.height * 0.03;
const player_dy_down = canvas.height * 0.015;
const player_width = player_dy_down * 4;
const player_height = player_dy_down * 4;
const max_x_platform = canvas.width;
const min_x_platform = canvas.width * 0.8;
const min_y_platform =
    Math.round(canvas.height / 2 / player_height) * player_height;
const max_y_platform =
    Math.round((canvas.height * 0.6) / player_height) * player_height;

// number which is used to calc the distance between platform 1 & platform 2
let gap_det;

// variables that will reference the main elements of the game
let player, platform1, platform2;

// Flags to determine the state of the game
let pressed, draw_platform_1, draw_platform_2, collider, platform_to_check;

// array which stores all relevant shots
let shots = [];

// variables that are used to display current points, records and time
let points;
let jump_counter;
let blocks_jumped;
let record = 0;
let timer;
let seconds;
let minutes;

// class that is used by nearly all elements of the game
class Block {
    constructor(x, y, width, height, draw, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.draw = draw; // boolean to decide if the object should be drawn on the canvas or not
        this.color = color;
    }
    // draw object on the canvas only if draw property is true
    draw_obj() {
        if (this.draw) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
    // move object if draw property is true
    move() {
        if (this.draw) {
            this.x -= player.dx / 4;
            this.draw = this.x + this.width <= 0 ? false : true;
        }
    }
}

// class for platform 1 and platform 2
// class has two elements (obstacle/enemy and friendlyObject) that are bound to an platform
// and only exists if platform exists
class Platform extends Block {
    constructor(x, y, width, height, draw, color) {
        super(x, y, width, height, draw, color);
        this.touched = false;
        this.obstacle = new Obstacle(
            this.x + this.width / 2,
            this.y - canvas.height * 0.1,
            canvas.height * 0.1,
            canvas.width * 0.1,
            false,
            "red"
        );
        this.obstacle.height = this.y - this.obstacle.y;
        this.friendlyObject = new FriendlyObject(
            this.x + this.width * 0.7,
            this.y -
                randomIntFromInterval(
                    Math.round(canvas.height / 4.7),
                    Math.round(canvas.height / 2.8)
                ),
            Math.round(canvas.width / 30),
            Math.round(canvas.width / 30),
            true,
            "green"
        );
    }
    // reset adapts all properties of a platform so that it seems as if a new one is created
    // -> different length, different obstacle/enemy, different friendly object
    reset() {
        this.x = canvas.width;
        this.y = randomIntFromInterval(min_y_platform, max_y_platform);
        this.y = Math.round(this.y / player.height) * player.height;
        this.width = randomIntFromInterval(min_x_platform, max_x_platform);
        this.height = Math.round(canvas.height * 0.0426);
        this.touched = false;
        this.draw = true;
        this.obstacle = new Obstacle(
            this.x +
                this.width / 2 +
                randomIntFromInterval(
                    (this.width / 2) * -1,
                    this.width / 2 - Math.round(canvas.height / 7.05) * 0.85
                ),
            this.y - Math.round(canvas.height / 7.05),
            Math.round(canvas.height / 7.05) * 0.85,
            Math.round(canvas.height / 7.05),
            true,
            "red"
        );
        // "randomise" obstacles
        // 66.66 % chance that obstacle gets drawn
        let random = randomIntFromInterval(1, 3);
        if (random == 1) {
            this.obstacle.draw = false;
        }
        this.obstacle.height = this.y - this.obstacle.y;
        this.friendlyObject = new FriendlyObject(
            this.x + this.width * 0.7,
            this.y -
                randomIntFromInterval(
                    Math.round(canvas.height / 4.7),
                    Math.round(canvas.height / 2.8)
                ),
            Math.round(canvas.width / 30),
            Math.round(canvas.width / 30),
            true,
            "green"
        );
        // "randomise" friend
        // 66.66 % chance that friend gets drawn
        random = randomIntFromInterval(1, 3);
        if (random == 1) {
            this.friendlyObject.draw = false;
        }
    }
    // checkPlatform() function gets called every gameLoop-execution if player is not currently jumping
    // if player is somewhere over the platform -> player moves down
    // if player is under the platform -> gameOver
    // if player is located on the platform and is currently touching it
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
            if (!this.touched) {
                // is only executed once for every platform state
                blocks_jumped++;
                points++;
            }
            jump_counter = collider == false ? jump_counter + 1 : jump_counter;
            this.touched = true;
            collider = true;
            player.prevent_from_going_up = false;
            player.dy_down = player_dy_down;
            player.y = this.y - player.height;
        }
        if (player.x > this.x + this.width) {
            platform_to_check = platform_to_check == 1 ? 2 : 1;
        }
    }
    // draws platform and its dependent obstacle and friendly object on the canvas
    // calls reset
    draw_obj(other_platform) {
        super.draw_obj();
        if (this.draw) {
            this.obstacle.draw_obj();
            this.obstacle.move();
            this.friendlyObject.draw_obj();
            this.friendlyObject.move();
        } else if (
            other_platform.x + other_platform.width <
            other_platform.width * gap_det
        ) {
            this.reset();
        }
    }
}

// obstacle/enemy class
class Obstacle extends Block {
    constructor(x, y, width, height, draw, color) {
        super(x, y, width, height, draw, color);
        this.shot = false;
        // world_det can only be 0 or 1
        // the images for the 2 different obstacles are located at indexes 4 and 5
        this.img = images[4 + world_det];
    }
    draw_obj() {
        if (this.draw) {
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        }
    }
    // check collision with player
    check_for_collision() {
        if (this.draw) {
            if (
                player.x + player.width / 2 > this.x * 1.1 &&
                player.x < this.x * 0.9 + this.width &&
                player.y + player.y / 2 > this.y * 1.1 &&
                player.y < this.y * 0.9 + this.height &&
                !this.shot
            ) {
                points -= 3;
                error_sound.play();
                this.shot = true;
                if (points < 0) {
                    gameOver();
                }
            }
        }
    }
}

// friendly object class
class FriendlyObject extends Block {
    constructor(x, y, width, height, draw, color) {
        super(x, y, width, height, draw, color);
        this.touched = false;
        // world_det can only be 0 or 1
        // the images for the 2 different friendly objects are located at indexes 6 and 7
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
                // make sure sound is played
                if (!success_sound.ended) {
                    success_sound.load();
                }
                success_sound.play();
                this.touched = true;
                this.draw = false;
            }
        }
    }
}

// shot instance is created when user presses space
class Shot extends Block {
    constructor(x, y, width, height, draw, color) {
        super(x, y, width, height, draw, color);
        // current instance of Shot gets pushed in shot array
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
            hit_sound.play();
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

// setup gets called before every game start to reset all relevant variables
function setup() {
    // wait for images to be loaded
    if (!img_loaded) {
        return;
    }
    // create player instance
    player = new Player(
        canvas.width * 0.2,
        canvas.height * 0.141,
        player_width,
        player_height,
        player_dx,
        player_dy_up,
        player_dy_down
    );
    // create platform instance for platform1
    platform1 = new Platform(
        Math.round(canvas.width * 0.1333),
        max_y_platform,
        canvas.width,
        Math.round(canvas.height * 0.0426),
        true,
        "#942037"
    );
    // create plafrom instance for platform2
    platform2 = new Platform(
        Math.round(canvas.width * 0.1333),
        min_y_platform,
        canvas.width,
        Math.round(canvas.height * 0.0426),
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
    // gap
    gap_det = 0.75;
    // timer
    seconds = 0;
    minutes = 0;
    timer = setInterval(timer_loop, 1000);
}

function gameLoop() {
    // wait for images to be loaded
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
        gap_det -= gap_det * 0.0007;
    }
    // shots
    // loop through shot array
    // draw and move each shot
    // check collision with enemy for every shot
    for (let i = 0; i < shots.length; i++) {
        if (shots[i].draw) {
            shots[i].draw_obj();
            shots[i].move();
            // check for collision
            let platform = platform_to_check == 1 ? platform1 : platform2;
            shots[i].collision(platform);
        }
        // delete shots so that array keeps clean
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

// key listeners

// pressed
document.addEventListener("keydown", keyDownHandler, false);
function keyDownHandler(e) {
    // s
    if (e.keyCode == 83 && img_loaded && !start_pressed) {
        start_pressed = true;
        setup();
        console.log("setup terminates... calling game loop");
        gameLoop();
        game_music.loop = true;
        game_music.play();
        return;
    }
    // Arrow up
    if (e.keyCode == 38) {
        collider = false;
        if (player.prevent_from_going_up) {
            return;
        }
        pressed = true;
    }
    // shot
    if (e.keyCode == 32) {
        new Shot(
            player.x + player.width,
            player.y + player.height / 2,
            6,
            6,
            true,
            "black"
        );
    }
    // Arrow Left
    if (e.keyCode == 37) {
        if (player.x > canvas.width * 0.2) {
            player.x -= 10;
        } else {
            player.x = canvas.width * 0.2;
        }
    }
    // Arrow Right
    if (e.keyCode == 39) {
        if (player.x < canvas.width / 3 - player_width) {
            player.x += 10;
        }
    }
}

// released
document.addEventListener("keyup", keyUpHandler, false);
function keyUpHandler(e) {
    // Arrow up
    if (e.keyCode == 38) {
        player.prevent_from_going_up = true;
        pressed = false;
    }
    // w
    if (e.keyCode == 87) {
        // change world
        world_det = 1 - world_det;
    }
}

function draw_display() {
    ctx.font = "bold " + canvas.width * 0.02 + "px Courier New";
    ctx.fillStyle = "#1c1b1b";
    ctx.fillText(
        "POINTS : " + points,
        canvas.width - canvas.width * 0.15,
        canvas.height * 0.05
    );
    ctx.font = "bold " + canvas.width * 0.02 + "px Courier New";
    ctx.fillStyle = "#1c1b1b";
    ctx.fillText(
        "RECORD : " + record,
        canvas.width - canvas.width * 0.15,
        canvas.height * 0.1
    );
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
    // Timer
    ctx.font = "bold " + canvas.width * 0.02 + "px Courier New";
    ctx.fillStyle = "#1c1b1b";
    ctx.fillText(
        fill_lead_zeros(minutes, 2) + ":" + fill_lead_zeros(seconds, 2),
        canvas.width / 2 - canvas.width * 0.05,
        canvas.height * 0.05
    );
}

// helper functions

function randomIntFromInterval(min, max) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function timer_loop() {
    if (seconds === 59) {
        seconds = 0;
        minutes++;
    } else {
        seconds++;
    }
}

// fill timer display with leading zeros
function fill_lead_zeros(number, size) {
    number = number.toString();
    while (number.length < size) {
        number = "0" + number;
    }
    return number;
}

function gameOver() {
    record = record < jump_counter ? jump_counter : record;
    game_over_sound.play();
    clearInterval(timer);
    setup();
}