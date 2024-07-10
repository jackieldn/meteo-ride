const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nameInput = document.getElementById('nameInput');
const startButton = document.getElementById('startButton');
const restartButton = document.createElement('button');
restartButton.id = 'restartButton';
restartButton.textContent = 'Start Again';
restartButton.style.display = 'none';
document.body.appendChild(restartButton);

let playerName = '';

// Load image function
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
}

// Load all necessary images
Promise.all([
    loadImage('spaceship.png'),
    loadImage('asteroid-1.png'),
    loadImage('explosion.png'),
    loadImage('full_heart.png'),
    loadImage('empty_heart.png'),
    loadImage('life_heal.png'),
    loadImage('shield.png')
]).then(([spaceshipImg, asteroidImg, explosionImg, fullHeartImg, emptyHeartImg, lifeHealImg, shieldImg]) => {
    // Spaceship properties
    const spaceship = {
        x: canvas.width / 2 - 25,
        y: canvas.height - 60,
        width: 50,
        height: 50,
        speed: 5,
        dx: 0,
        dy: 0,
        shieldActive: false,
        shieldEndTime: 0
    };

    // Game properties
    let score = 0;
    let lives = 5;
    const maxLives = 5;
    let gameState = 'start';

    // Asteroid properties
    const asteroids = [];
    const asteroidSpawnInterval = 2000; // Spawn a new asteroid every 2 seconds

    // Projectile properties
    const projectiles = [];
    const projectileSpeed = 7;

    // Explosion properties
    const explosions = [];

    // Power-up properties
    const powerUps = [];
    const powerUpSpawnInterval = 10000; // Spawn a new power-up every 10 seconds

    // Key event handlers
    function keyDown(e) {
        if (e.key === 'ArrowRight' || e.key === 'Right') {
            spaceship.dx = spaceship.speed;
        } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
            spaceship.dx = -spaceship.speed;
        } else if (e.key === 'ArrowUp' || e.key === 'Up') {
            spaceship.dy = -spaceship.speed;
        } else if (e.key === 'ArrowDown' || e.key === 'Down') {
            spaceship.dy = spaceship.speed;
        } else if (e.key === ' ' || e.key === 'Spacebar') {
            shoot();
        }
    }

    function keyUp(e) {
        if (
            e.key === 'ArrowRight' ||
            e.key === 'Right' ||
            e.key === 'ArrowLeft' ||
            e.key === 'Left' ||
            e.key === 'ArrowUp' ||
            e.key === 'Up' ||
            e.key === 'ArrowDown' ||
            e.key === 'Down'
        ) {
            spaceship.dx = 0;
            spaceship.dy = 0;
        }
    }

    // Shoot a projectile
    function shoot() {
        if (gameState !== 'playing') return;
        const x = spaceship.x + spaceship.width / 2 - 1; // Center the projectile
        const y = spaceship.y;
        projectiles.push({ x, y, width: 2, height: 10 });
    }

    // Draw spaceship
    function drawSpaceship() {
        if (spaceship.shieldActive) {
            ctx.beginPath();
            ctx.arc(spaceship.x + spaceship.width / 2, spaceship.y + spaceship.height / 2, 40, 0, Math.PI * 2);
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 5;
            ctx.stroke();
            ctx.closePath();
        }
        ctx.drawImage(spaceshipImg, spaceship.x, spaceship.y, spaceship.width, spaceship.height);
    }

    // Draw asteroids
    function drawAsteroids() {
        asteroids.forEach(asteroid => {
            ctx.drawImage(asteroidImg, asteroid.x, asteroid.y, asteroid.width, asteroid.height);
        });
    }

    // Draw projectiles
    function drawProjectiles() {
        projectiles.forEach(projectile => {
            ctx.fillStyle = 'red';
            ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
        });
    }

    // Draw explosions
    function drawExplosions() {
        explosions.forEach(explosion => {
            const frame = Math.floor(explosion.frame);
            const spriteX = (frame % 4) * 64;
            const spriteY = Math.floor(frame / 4) * 64;
            ctx.drawImage(explosionImg, spriteX, spriteY, 64, 64, explosion.x, explosion.y, 64, 64);
            explosion.frame += 0.2; // Adjust speed of animation
            if (explosion.frame >= 16) {
                explosions.splice(explosions.indexOf(explosion), 1); // Remove explosion after animation
            }
        });
    }

    // Draw score
    function drawScore() {
        ctx.font = '20pt Courier';
        ctx.fillStyle = 'red';
        ctx.fillText(score.toString().padStart(4, '0'), canvas.width - 70, 30);
    }

    // Draw lives
    function drawLives() {
        for (let i = 0; i < maxLives; i++) {
            const img = i < lives ? fullHeartImg : emptyHeartImg;
            ctx.drawImage(img, 10 + i * 30, 10, 25, 25);
        }
    }

    // Draw game over message
    function drawGameOver() {
        ctx.font = '45pt Courier';
        ctx.fillStyle = 'red';
        ctx.fillText('Game Over', canvas.width / 2 - 150, canvas.height / 2 - 20);
        ctx.font = '20pt Courier';
        ctx.fillStyle = 'red';
        ctx.fillText('Start Again', canvas.width / 2 - 75, canvas.height / 2 + 40);
    }

    // Draw start game message
    function drawStartGame() {
        ctx.font = '45pt Courier';
        ctx.fillStyle = 'white';
        ctx.fillText('Space Shooter', canvas.width / 2 - 180, canvas.height / 2 - 100);
        ctx.font = '20pt Courier';
        ctx.fillStyle = 'white';
        ctx.fillText('Start Game', canvas.width / 2 - 75, canvas.height / 2);
    }

    // Draw power-ups
    function drawPowerUps() {
        powerUps.forEach(powerUp => {
            if (powerUp.type === 'life') {
                ctx.drawImage(lifeHealImg, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
            } else if (powerUp.type === 'shield') {
                ctx.drawImage(shieldImg, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
            }
        });
    }

    // Draw scoreboard
    function drawScoreboard(scores) {
        const scoreboardDiv = document.getElementById('scoreboard');
        scoreboardDiv.innerHTML = '<h2>Scoreboard</h2>';
        scores.slice(0, 10).forEach((score, index) => {
            const scoreEntry = document.createElement('p');
            scoreEntry.textContent = `${index + 1}. ${score.name}: ${score.score}`;
            scoreboardDiv.appendChild(scoreEntry);
        });
    }

    // Fetch scoreboard from static JSON file
    async function fetchScoreboard() {
        const response = await fetch('scores.json');
        return response.json();
    }

    // Spawn a new asteroid
    function spawnAsteroid() {
        if (gameState !== 'playing') return;
        const x = Math.random() * (canvas.width - 50);
        const y = -50; // Start above the canvas
        const width = 50;
        const height = 50;
        const speed = Math.random() * 3 + 2; // Random speed between 2 and 5

        asteroids.push({ x, y, width, height, speed });
    }

    // Spawn a new power-up
    function spawnPowerUp() {
        if (gameState !== 'playing') return;
        const x = Math.random() * (canvas.width - 30);
        const y = -30; // Start above the canvas
        const width = 30;
        const height = 30;
        const speed = 2;
        const type = Math.random() > 0.5 ? 'life' : 'shield';

        powerUps.push({ x, y, width, height, speed, type });
    }

    // Move asteroids
    function moveAsteroids() {
        asteroids.forEach(asteroid => {
            asteroid.y += asteroid.speed;
        });

        // Remove asteroids that have moved off the screen and decrease lives
        for (let i = asteroids.length - 1; i >= 0; i--) {
            if (asteroids[i].y > canvas.height) {
                asteroids.splice(i, 1);
                if (!spaceship.shieldActive) {
                    lives--;
                }
            }
        }
    }

    // Move power-ups
    function movePowerUps() {
        powerUps.forEach(powerUp => {
            powerUp.y += powerUp.speed;
        });

        // Remove power-ups that have moved off the screen
        for (let i = powerUps.length - 1; i >= 0; i--) {
            if (powerUps[i].y > canvas.height) {
                powerUps.splice(i, 1);
            }
        }
    }

    // Move projectiles
    function moveProjectiles() {
        projectiles.forEach(projectile => {
            projectile.y -= projectileSpeed;
        });

        // Remove projectiles that have moved off the screen
        for (let i = projectiles.length - 1; i >= 0; i--) {
            if (projectiles[i].y < 0) {
                projectiles.splice(i, 1);
            }
        }
    }

    // Check for collisions
    function checkCollisions() {
        const asteroidsToRemove = [];
        const projectilesToRemove = [];
        const powerUpsToRemove = [];

        asteroids.forEach((asteroid, aIndex) => {
            projectiles.forEach((projectile, pIndex) => {
                if (
                    projectile.x < asteroid.x + asteroid.width &&
                    projectile.x + projectile.width > asteroid.x &&
                    projectile.y < asteroid.y + asteroid.height &&
                    projectile.y + projectile.height > asteroid.y
                ) {
                    // Collision detected
                    asteroidsToRemove.push(aIndex);
                    projectilesToRemove.push(pIndex);
                    explosions.push({ x: asteroid.x, y: asteroid.y, frame: 0 });
                    score++;
                }
            });

            // Check collision with spaceship
            if (
                asteroid.x < spaceship.x + spaceship.width &&
                asteroid.x + asteroid.width > spaceship.x &&
                asteroid.y < spaceship.y + spaceship.height &&
                asteroid.y + asteroid.height > spaceship.y
            ) {
                asteroidsToRemove.push(aIndex);
                explosions.push({ x: asteroid.x, y: asteroid.y, frame: 0 });
                if (!spaceship.shieldActive) {
                    lives--;
                }
            }
        });

        powerUps.forEach((powerUp, pIndex) => {
            if (
                powerUp.x < spaceship.x + spaceship.width &&
                powerUp.x + powerUp.width > spaceship.x &&
                powerUp.y < spaceship.y + spaceship.height &&
                powerUp.y + powerUp.height > spaceship.y
            ) {
                // Power-up collected
                powerUpsToRemove.push(pIndex);
                if (powerUp.type === 'life' && lives < maxLives) {
                    lives++;
                } else if (powerUp.type === 'shield') {
                    spaceship.shieldActive = true;
                    spaceship.shieldEndTime = Date.now() + 7000; // 7 seconds shield
                }
            }
        });

        // Remove collided asteroids and projectiles
        asteroidsToRemove.reverse().forEach(index => asteroids.splice(index, 1));
        projectilesToRemove.reverse().forEach(index => projectiles.splice(index, 1));
        powerUpsToRemove.reverse().forEach(index => powerUps.splice(index, 1));
    }

    // Clear canvas
    function clear() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Update game objects
    function update() {
        clear();
        if (gameState === 'playing') {
            drawSpaceship();
            drawAsteroids();
            drawProjectiles();
            drawExplosions();
            drawPowerUps();
            drawScore();
            drawLives();

            // Change spaceship position
            spaceship.x += spaceship.dx;
            spaceship.y += spaceship.dy;

            // Prevent spaceship from going out of bounds
            if (spaceship.x < 0) spaceship.x = 0;
            if (spaceship.x + spaceship.width > canvas.width) spaceship.x = canvas.width - spaceship.width;
            if (spaceship.y < 0) spaceship.y = 0;
            if (spaceship.y + spaceship.height > canvas.height) spaceship.y = canvas.height - spaceship.height;

            // Check shield duration
            if (spaceship.shieldActive && Date.now() > spaceship.shieldEndTime) {
                spaceship.shieldActive = false;
            }

            moveAsteroids();
            moveProjectiles();
            movePowerUps();
            checkCollisions();

            // Check if game over
            if (lives <= 0) {
                gameState = 'gameOver';
                fetchScoreboard().then(drawScoreboard);
            }
        } else if (gameState === 'start') {
            drawStartGame();
        } else if (gameState === 'gameOver') {
            drawGameOver();
        }

        requestAnimationFrame(update);
    }

    // Event listeners
    document.addEventListener('keydown', keyDown);
    document.addEventListener('keyup', keyUp);

    // Start the game loop
    update();

    // Handle click events
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (gameState === 'start') {
            if (x > canvas.width / 2 - 75 && x < canvas.width / 2 + 75 && y > canvas.height / 2 - 20 && y < canvas.height / 2 + 20) {
                playerName = nameInput.value.trim();
                if (playerName.length === 0 || playerName.length > 5) {
                    alert('Please enter a valid name (1-5 characters).');
                    return;
                }
                gameState = 'playing';
                score = 0;
                lives = 5;
                asteroids.length = 0; // Clear asteroids array
                projectiles.length = 0; // Clear projectiles array
                powerUps.length = 0; // Clear power-ups array
                nameInput.style.display = 'none';
                startButton.style.display = 'none';
                restartButton.style.display = 'none';
            }
        } else if (gameState === 'gameOver') {
            if (x > canvas.width / 2 - 75 && x < canvas.width / 2 + 75 && y > canvas.height / 2 + 20 && y < canvas.height / 2 + 60) {
                gameState = 'playing';
                score = 0;
                lives = 5;
                asteroids.length = 0; // Clear asteroids array
                projectiles.length = 0; // Clear projectiles array
                powerUps.length = 0; // Clear power-ups array
                restartButton.style.display = 'none';
            }
        }
    });

    // Handle start button click
    startButton.addEventListener('click', () => {
        playerName = nameInput.value.trim();
        if (playerName.length === 0 || playerName.length > 5) {
            alert('Please enter a valid name (1-5 characters).');
            return;
        }
        gameState = 'playing';
        score = 0;
        lives = 5;
        asteroids.length = 0; // Clear asteroids array
        projectiles.length = 0; // Clear projectiles array
        powerUps.length = 0; // Clear power-ups array
        nameInput.style.display = 'none';
        startButton.style.display = 'none';
    });

    // Spawn asteroids at intervals
    setInterval(spawnAsteroid, asteroidSpawnInterval);

    // Spawn power-ups at intervals
    setInterval(spawnPowerUp, powerUpSpawnInterval);

}).catch(err => {
    console.error('Failed to load images', err);
});
