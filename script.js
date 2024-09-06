const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 480;
canvas.height = 640;

// Game state variables
const player = {
    width: 60,
    height: 20,
    x: canvas.width / 2 - 30,
    y: canvas.height - 30,
    speed: 5,
    dx: 0
};

const bullets = [];
let bulletSpeed = 4;

const invaders = [];
const rows = 5;
const columns = 7;
const invaderSize = 45;
const invaderPadding = 8;
const invaderOffsetTop = 20;
const invaderOffsetLeft = 20;
let invaderSpeed = 0.5;
let invaderSpeedIncrease = 0.02;
let invaderDirection = 1;

const powerUps = [];
const powerUpTypes = {
    shield: { color: '#4caf50', rarity: 0.01 },
    rapidFire: { color: '#ff9800', rarity: 0.01 },
    spreadShot: { color: '#2196f3', rarity: 0.005 },
    deathDrop: { color: '#ff5722', rarity: 0.005 }
};
const powerUpDuration = 5000; // Duration for power-ups

let score = 0;
let lives = 3;
let highScore = localStorage.getItem('highScore') || 0;
let shieldActive = false; // New state for shield power-up
let shieldTimer = 0; // Timer for shield duration
let spreadShotActive = false; // State for spread shot power-up

// Initialize game state
function initGame() {
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height - 10;
    player.dx = 0;

    bullets.length = 0;
    bulletSpeed = 4;

    invaders.length = 0;
    invaderSpeed = 0.5;
    invaderSpeedIncrease = 0.02;
    invaderDirection = 1;

    powerUps.length = 0;
    score = 0;
    lives = 3;
    shieldActive = false;
    shieldTimer = 0; // Reset shield timer
    spreadShotActive = false;

    spawnInvaders(); // Initial spawn
    highScore = localStorage.getItem('highScore') || 0;
    document.getElementById('score').innerText = `Score: ${score}`;
}

function drawPlayer() {
    ctx.fillStyle = '#00bfae';
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawBullet(bullet) {
    ctx.fillStyle = '#ff6f61';
    ctx.fillRect(bullet.x, bullet.y, 6, 20);
}

function drawHeart(x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x + size / 2, y + size / 4);
    ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
    ctx.bezierCurveTo(x, y + size / 2, x + size / 4, y + size * 3 / 4, x + size / 2, y + size);
    ctx.bezierCurveTo(x + size * 3 / 4, y + size * 3 / 4, x + size, y + size / 2, x + size, y + size / 4);
    ctx.bezierCurveTo(x + size, y, x + size / 2, y, x + size / 2, y + size / 4);
    ctx.fillStyle = '#ff6f61';
    ctx.fill();
}

function drawInvader(invader) {
    drawHeart(invader.x, invader.y, invaderSize);
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        ctx.fillStyle = powerUpTypes[powerUp.type].color;
        ctx.fillRect(powerUp.x, powerUp.y, 30, 30);
    });
}

function drawUI() {
    ctx.fillStyle = '#ff69b4';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Lives: ${lives}`, 10, 50);
    ctx.fillText(`High Score: ${highScore}`, 10, 80);

    // Draw shield timer
    if (shieldActive) {
        const timeLeft = Math.max(0, Math.ceil(shieldTimer / 1000));
        ctx.fillText(`Shield Time: ${timeLeft}s`, 10, 110);
    }
}

function drawGameOver() {
    ctx.fillStyle = '#ff69b4';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '20px Arial';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.font = '20px Arial';
    ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 60);
}

function updatePlayer() {
    player.x += player.dx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}

function updateBullets() {
    bullets.forEach(bullet => {
        bullet.y -= bulletSpeed;
        if (bullet.y < 0) {
            bullets.splice(bullets.indexOf(bullet), 1);
        }
    });
}

function updateInvaders() {
    let edgeReached = false;
    invaders.forEach(invader => {
        invader.x += invaderSpeed * invaderDirection;
        if (invader.x + invaderSize > canvas.width || invader.x < 0) {
            edgeReached = true;
        }
    });

    if (edgeReached) {
        invaderDirection *= -1;
        invaders.forEach(invader => {
            invader.y += invaderSize / 6; // Slower descent speed
        });
        invaderSpeed += invaderSpeedIncrease; // Slower speed increase
    }

    // Continuously spawn new invaders in batches if not enough
    if (invaders.length < rows * columns) {
        spawnInvaders();
    }
}

function updatePowerUps() {
    // Add power-ups based on their rarity
    Object.keys(powerUpTypes).forEach(type => {
        if (Math.random() < powerUpTypes[type].rarity) {
            powerUps.push({
                x: Math.random() * (canvas.width - 30),
                y: -30,
                type
            });
        }
    });

    powerUps.forEach(powerUp => {
        powerUp.y += 2;
        if (powerUp.y > canvas.height) {
            powerUps.splice(powerUps.indexOf(powerUp), 1);
        }
    });
}

function detectCollisions() {
    bullets.forEach(bullet => {
        invaders.forEach(invader => {
            if (
                bullet.x < invader.x + invaderSize &&
                bullet.x + 6 > invader.x &&
                bullet.y < invader.y + invaderSize &&
                bullet.y + 20 > invader.y
            ) {
                bullets.splice(bullets.indexOf(bullet), 1);
                invaders.splice(invaders.indexOf(invader), 1);
                score += 10;
                document.getElementById('score').innerText = `Score: ${score}`;
            }
        });
    });

    powerUps.forEach(powerUp => {
        if (
            powerUp.x < player.x + player.width &&
            powerUp.x + 30 > player.x &&
            powerUp.y < player.y + player.height &&
            powerUp.y + 30 > player.y
        ) {
            if (powerUp.type === 'deathDrop') {
                if (!shieldActive) {
                    lives = 0; // Immediately lose a life on contact with death drop if shield is not active
                }
                powerUps.splice(powerUps.indexOf(powerUp), 1);
                return; // Exit the function to avoid further collisions
            } else {
                powerUps.splice(powerUps.indexOf(powerUp), 1);
                activatePowerUp(powerUp.type);
            }
        }
    });

    invaders.forEach(invader => {
        if (invader.y + invaderSize > player.y) {
            if (!shieldActive) {
                lives -= 1;
                if (lives <= 0) {
                    if (score > highScore) {
                        localStorage.setItem('highScore', score);
                        highScore = score;
                    }
                    return;
                }
            }
            invaders.splice(invaders.indexOf(invader), 1);
        }
    });
}

function activatePowerUp(type) {
    if (type === 'shield') {
        shieldActive = true;
        shieldTimer = powerUpDuration;
    } else if (type === 'rapidFire') {
        bulletSpeed = 8;
        setTimeout(() => bulletSpeed = 4, powerUpDuration);
    } else if (type === 'spreadShot') {
        spreadShotActive = true;
        setTimeout(() => spreadShotActive = false, powerUpDuration);
    }
}

function shootBullets() {
    if (spreadShotActive) {
        bullets.push(
            { x: player.x + player.width / 2 - 3, y: player.y, dx: 0, dy: -bulletSpeed },
            { x: player.x + player.width / 2 - 15, y: player.y, dx: -2, dy: -bulletSpeed },
            { x: player.x + player.width / 2 + 9, y: player.y, dx: 2, dy: -bulletSpeed }
        );
    } else {
        bullets.push({ x: player.x + player.width / 2 - 3, y: player.y, dx: 0, dy: -bulletSpeed });
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    bullets.forEach(drawBullet);
    invaders.forEach(drawInvader);
    drawPowerUps();
    drawUI();

    if (lives <= 0) {
        drawGameOver();
        return;
    }
}

function update() {
    if (lives > 0) {
        updatePlayer();
        updateBullets();
        updateInvaders();
        updatePowerUps();
        detectCollisions();

        // Update shield timer
        if (shieldActive) {
            shieldTimer -= 1000 / 60; // Assume 60 FPS
            if (shieldTimer <= 0) {
                shieldActive = false;
                shieldTimer = 0;
            }
        }
    }
}

function gameLoop() {
    draw();
    update();
    requestAnimationFrame(gameLoop);
}

function spawnInvaders() {
    const numInvadersToSpawn = 5;
    for (let i = 0; i < numInvadersToSpawn; i++) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * columns);
        invaders.push({
            x: invaderOffsetLeft + col * (invaderSize + invaderPadding),
            y: invaderOffsetTop + row * (invaderSize + invaderPadding),
            type: Math.random() < 0.1 ? 'fast' : 'normal'
        });
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        player.dx = -player.speed;
    }
    if (e.key === 'ArrowRight') {
        player.dx = player.speed;
    }
    if (e.key === ' ') {
        shootBullets();
    }
    if (e.key === 'r' && lives <= 0) {
        initGame(); // Restart the game
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        player.dx = 0;
    }
});

// Initialize and start the game
initGame();
gameLoop();
