// VehicleShooter Game - Main Sketch
let player;
let enemies = [];
let playerProjectiles = [];
let enemyProjectiles = [];
let obstacles = [];
let imageFusee;

// Game state
let score = 0;
let enemiesDestroyed = 0;
let gameOver = false;
let gameStarted = false;
let navbarHeight = 100;

// Game parameters
let sliderEnemyCount;
let sliderEnemySpeed;
let sliderPlayerSpeed;
let sliderShootRate;
let sliderProjectileSpeed;
let sliderDifficulty;
let checkboxMouseControl;

function preload() {
  // Load vehicle sprite image
  imageFusee = loadImage('./assets/vehicule.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight - navbarHeight);
  
  // Initialize player
  player = new PlayerVehicle(
    width / 2,
    height / 2,
    imageFusee,
    50
  );

  // Create initial enemies
  createEnemies(3); // Moins d'ennemis au début

  // Create obstacles
  createObstacles(5);

  // Create UI controls
  createGameControls();

  // Setup keyboard listeners
  setupKeyboardListeners();
}

// Create obstacles with minimum distance to avoid clustering
function createObstacles(count) {
  const minDistance = 200; // minimum distance between obstacle centers
  let attempts = 0;
  const maxAttempts = 100;

  for (let i = 0; i < count && attempts < maxAttempts * count; i++) {
    let x = random(100, width - 100);
    let y = random(navbarHeight + 100, height - 100);
    let r = random(25, 40);

    // Check distance from all existing obstacles
    let tooClose = false;
    for (let obs of obstacles) {
      if (p5.Vector.dist(createVector(x, y), obs.pos) < minDistance + obs.r + r) {
        tooClose = true;
        break;
      }
    }

    if (!tooClose) {
      obstacles.push(new Obstacle(x, y, r));
    } else {
      attempts++;
    }
  }
}

// Create initial enemy waves
function createEnemies(count) {
  for (let i = 0; i < count; i++) {
    let x = random(50, width - 50);
    let y = random(navbarHeight + 50, height - 50);
    let enemy = new EnemyVehicle(x, y, imageFusee, random(30, 45));
    enemies.push(enemy);
  }
}

// Setup keyboard input listeners
function setupKeyboardListeners() {
  window.addEventListener('keydown', (e) => {
    // Start game on ENTER
    if (e.code === 'Enter' && !gameStarted) {
      gameStarted = true;
      e.preventDefault();
      return;
    }

    player.keys[e.key] = true;
    
    // Shoot on spacebar
    if (e.code === 'Space') {
      if (player.shoot()) {
        createPlayerProjectile();
      }
      e.preventDefault();
    }

    // Anti-missile shot on P
    if (e.key === 'p' || e.key === 'P') {
      if (player.shoot()) {
        createPlayerInterceptor();
      }
      e.preventDefault();
    }

    // Debug mode
    if (e.key === 'd' || e.key === 'D') {
      Vehicle.debug = !Vehicle.debug;
    }
  });

  window.addEventListener('keyup', (e) => {
    player.keys[e.key] = false;
  });
}

// Create player projectile
function createPlayerProjectile() {
  let heading = p5.Vector.fromAngle(player.vel.heading());
  // fire forward in direction of movement
  let spawn = p5.Vector.add(player.pos, p5.Vector.mult(heading, player.r));
  let projectile = new Projectile(
    spawn.x,
    spawn.y,
    heading.x,
    heading.y,
    sliderProjectileSpeed.value(),
    color(0, 255, 100),
    true
  );
  playerProjectiles.push(projectile);
}

// Create anti-missile projectile
function createPlayerInterceptor() {
  let baseHeading = player.vel.copy();
  if (baseHeading.magSq() === 0) {
    baseHeading = createVector(0, -1);
  }
  baseHeading.normalize();
  baseHeading.mult(-1); // fire opposite to movement
  let spawn = p5.Vector.add(player.pos, p5.Vector.mult(baseHeading, player.r * 0.8));

  // Fan spread angles
  const spreadAngles = [-0.35, -0.18, 0, 0.18, 0.35];
  spreadAngles.forEach(a => {
    const dir = baseHeading.copy().rotate(a);
    const proj = new Projectile(
      spawn.x,
      spawn.y,
      dir.x,
      dir.y,
      sliderProjectileSpeed.value(),
      color(0, 180, 255),
      true,
      true
    );
    playerProjectiles.push(proj);
  });
}

// Create enemy projectile
function createEnemyProjectile(enemy) {
  let direction = p5.Vector.sub(player.pos, enemy.pos);
  direction.normalize();
  
  let projectile = new Projectile(
    enemy.pos.x + direction.x * enemy.r,
    enemy.pos.y + direction.y * enemy.r,
    direction.x,
    direction.y,
    sliderProjectileSpeed.value() * 0.7,
    color(255, 100, 100),
    false,
    false,
    player,
    0.25
  );
  enemyProjectiles.push(projectile);
}

// Create UI controls
function createGameControls() {
  let controlsDiv = createDiv('');
  controlsDiv.id('controls');

  // Title
  let titre = createElement('h3', '🎮 VehicleShooter');
  titre.parent(controlsDiv);

  // Score display
  let scoreDiv = createDiv('');
  scoreDiv.id('score-display');
  scoreDiv.parent(controlsDiv);
  scoreDiv.style('color', '#00ff64');
  scoreDiv.style('font-size', '16px');
  scoreDiv.style('font-weight', 'bold');

  // Game info
  let infoDiv = createDiv('');
  infoDiv.id('info-display');
  infoDiv.parent(controlsDiv);
  infoDiv.style('color', '#aaaaaa');
  infoDiv.style('font-size', '12px');

  // Enemy count slider
  creerControlGroupe(controlsDiv, 'Enemies', 1, 10, 3, 1, (s) => {
    sliderEnemyCount = s;
  });

  // Enemy speed slider
  creerControlGroupe(controlsDiv, 'Enemy Speed', 1, 6, 2.5, 0.5, (s) => {
    sliderEnemySpeed = s;
  });

  // Player speed slider
  creerControlGroupe(controlsDiv, 'Player Speed', 2, 10, 7, 0.5, (s) => {
    sliderPlayerSpeed = s;
  });

  // Shoot rate slider
  creerControlGroupe(controlsDiv, 'Shoot Rate', 1, 20, 6, 1, (s) => {
    sliderShootRate = s;
  });

  // Projectile speed slider
  creerControlGroupe(controlsDiv, 'Projectile Speed', 4, 12, 9, 0.5, (s) => {
    sliderProjectileSpeed = s;
  });

  // Difficulty slider
  creerControlGroupe(controlsDiv, 'Difficulty', 0.3, 2, 0.7, 0.1, (s) => {
    sliderDifficulty = s;
  });

  // Mouse control toggle
  let mouseGroup = createDiv('');
  mouseGroup.class('control-group');
  mouseGroup.parent(controlsDiv);
  checkboxMouseControl = createCheckbox('Mouse Control', true);
  checkboxMouseControl.parent(mouseGroup);
}

// Helper to create control groups
function creerControlGroupe(parent, label, min, max, val, step, callback) {
  let groupe = createDiv('');
  groupe.class('control-group');
  groupe.parent(parent);

  let labelElement = createElement('label', label);
  labelElement.parent(groupe);

  let slider = createSlider(min, max, val, step);
  slider.parent(groupe);

  let valueDisplay = createSpan(val.toString());
  valueDisplay.class('value-display');
  valueDisplay.parent(groupe);

  slider.input(() => {
    valueDisplay.html(slider.value().toFixed(1));
  });

  callback(slider);
}

// Main draw loop
function draw() {
  background(5, 5, 15);

  // Show instructions screen if game not started
  if (!gameStarted) {
    drawInstructionsScreen();
    return;
  }

  // Update player parameters from sliders
  player.maxSpeed = sliderPlayerSpeed.value();
  player.shootRate = round(sliderShootRate.value());
  if (checkboxMouseControl) {
    player.useMouseControl = checkboxMouseControl.checked();
  }

  // Update enemy parameters
  enemies.forEach(enemy => {
    enemy.maxSpeed = sliderEnemySpeed.value();
  });

  // Display obstacles
  obstacles.forEach(obstacle => {
    obstacle.show();
  });

  // Player avoids obstacles before integrating motion
  let avoidForce = player.avoidObstacles(obstacles);
  player.applyForce(avoidForce);
  // Update and display player
  player.update();
  player.show();
  player.edges();

  // Update and display enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].update(player, enemies, obstacles);
    enemies[i].show();
    enemies[i].edges();

    // Enemy shooting (moins fréquent)
    if (enemies[i].shoot() && random() < 0.4) {
      createEnemyProjectile(enemies[i]);
    }
  }

  // Update and display player projectiles
  for (let i = playerProjectiles.length - 1; i >= 0; i--) {
    const proj = playerProjectiles[i];
    proj.update();
    proj.show();

    if (proj.interceptor) {
      let destroyed = false;
      for (let j = enemyProjectiles.length - 1; j >= 0; j--) {
        if (proj.collidesWithProjectile(enemyProjectiles[j])) {
          enemyProjectiles.splice(j, 1);
          destroyed = true;
          break;
        }
      }
      if (destroyed) {
        playerProjectiles.splice(i, 1);
        continue;
      }
    } else {
      // Check collisions with enemies
      for (let j = enemies.length - 1; j >= 0; j--) {
        if (proj.collidesWith(enemies[j])) {
          playerProjectiles.splice(i, 1);
          enemies.splice(j, 1);
          score += 100;
          enemiesDestroyed++;
          i--;
          break;
        }
      }
    }

    // Remove dead projectiles
    if (i >= 0 && playerProjectiles[i] && !playerProjectiles[i].alive) {
      playerProjectiles.splice(i, 1);
    }
  }

  // Update and display enemy projectiles
  for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
    enemyProjectiles[i].update();
    enemyProjectiles[i].show();

    // Check collision with player
    if (enemyProjectiles[i].collidesWith(player)) {
      enemyProjectiles.splice(i, 1);
      if (player.takeDamage()) {
        gameOver = true;
      }
      i--;
      continue;
    }

    // Remove dead projectiles
    if (i >= 0 && !enemyProjectiles[i].alive) {
      enemyProjectiles.splice(i, 1);
    }
  }

  // Spawn new enemies based on wave system
  if (enemies.length < sliderEnemyCount.value()) {
    let x = random(50, width - 50);
    let y = random(navbarHeight + 50, height - 50);
    let enemy = new EnemyVehicle(x, y, imageFusee, random(30, 45));
    enemies.push(enemy);
  }

  // Increase difficulty
  let difficultyMultiplier = sliderDifficulty.value();
  enemies.forEach(enemy => {
    enemy.maxForce *= 1.0 + (0.001 * difficultyMultiplier);
    enemy.shootRate *= 0.9995;
  });

  // Update HUD
  updateHUD();

  // Draw game over screen
  if (gameOver) {
    drawGameOverScreen();
  }
}

// Draw instructions screen
function drawInstructionsScreen() {
  push();
  fill(0, 0, 0, 200);
  rect(0, 0, width, height);

  fill(0, 255, 100);
  textSize(40);
  textAlign(CENTER, TOP);
  text('VEHICLE SHOOTER', width / 2, 8);

  fill(200, 200, 200);
  textSize(16);
  textAlign(CENTER, TOP);
  
  let y = 55;
  const lineHeight = 25;
  
  text('OBJECTIF: Détruire les ennemis et survire le plus longtemps possible', width / 2, y);
  y += lineHeight;
  
  fill(200, 200, 200);
  text('CONTRÔLES:', width / 2, y);
  y += lineHeight;
  fill(150, 200, 255);
  textSize(13);
  text('SOURIS: Déplacer | WASD/Flèches: Déplacer | SPACE: Tirer devant | P: Anti-missiles (×5) | D: Debug', width / 2, y);
  y += lineHeight;
  
  fill(200, 200, 200);
  textSize(16);
  text('CONSEILS: Utilise P pour détruire les missiles | Les ennemis te poursuivront', width / 2, y);
  y += lineHeight;
  
  fill(255, 50, 200);
  textSize(16);
  text('⚠ Mode plein écran conseillé (F11) pour meilleure expérience', width / 2, y);
  y += lineHeight;
  
  fill(0, 255, 100);
  textSize(18);
  y += lineHeight * 0.2;
  text('Appuie sur ENTER pour commencer', width / 2, y);
  
  pop();
}

// Update HUD display
function updateHUD() {
  let scoreDiv = document.getElementById('score-display');
  if (scoreDiv) {
    scoreDiv.innerHTML = `Score: ${score} | Enemies: ${enemiesDestroyed} | Vies: ${'❤️'.repeat(player.health)} ${player.health}/${player.maxHealth}`;
  }

  let infoDiv = document.getElementById('info-display');
  if (infoDiv) {
    let invincibleText = player.invincible ? ' | ⚡ INVINCIBLE' : '';
    let controlText = player.useMouseControl ? 'Souris: viser/déplacer' : 'WASD: Move';
    infoDiv.innerHTML = `${controlText} | SPACE: Shoot | P: Anti-missile | D: Debug${invincibleText}`;
  }
}

// Draw game over screen
function drawGameOverScreen() {
  push();
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);

  fill(255, 100, 100);
  textSize(48);
  textAlign(CENTER, CENTER);
  text('GAME OVER', width / 2, height / 2 - 50);

  fill(200, 200, 200);
  textSize(24);
  text(`Final Score: ${score}`, width / 2, height / 2 + 20);
  text(`Enemies Destroyed: ${enemiesDestroyed}`, width / 2, height / 2 + 60);

  fill(100, 200, 255);
  textSize(16);
  text('Press R to Restart', width / 2, height / 2 + 120);

  pop();
}

// Restart game
function keyPressed() {
  if ((key === 'r' || key === 'R') && gameOver) {
    score = 0;
    enemiesDestroyed = 0;
    gameOver = false;
    enemies = [];
    playerProjectiles = [];
    enemyProjectiles = [];
    obstacles = [];
    player = new PlayerVehicle(width / 2, height / 2, imageFusee, 50);
    createEnemies(3);
    createObstacles(5);
  }
}

// Handle window resize
function windowResized() {
  resizeCanvas(windowWidth, windowHeight - navbarHeight);
}
