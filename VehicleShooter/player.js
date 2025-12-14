// Player-controlled vehicle class
class PlayerVehicle extends Vehicle {
  constructor(x, y, image, taille = 46) {
    super(x, y, image, color(0, 255, 100), taille);
    this.maxSpeed = 6;
    this.maxForce = 0.3;
    this.keys = {};
    this.shootCooldown = 0;
    this.shootRate = 8; // frames between shots
    this.health = 3; // 3 vies au lieu de 1
    this.maxHealth = 3;
    this.invincible = false;
    this.invincibleTime = 0;
    this.useMouseControl = true;
  }

  // Handle keyboard input
  handleInput() {
    if (this.useMouseControl) {
      // Mouse steering: arrive smoothly at cursor position
      if (this._mouseInsideCanvas()) {
        const target = createVector(mouseX, mouseY);
        const distance = p5.Vector.dist(this.pos, target);

        if (distance > 20) {
          // Aggressive seek with higher desired speed for responsiveness
          let desired = p5.Vector.sub(target, this.pos);
          desired.setMag(this.maxSpeed * 1.4);
          let steer = p5.Vector.sub(desired, this.vel);
          steer.limit(this.maxForce * 3.0);
          this.applyForce(steer);
        } else {
          // Close to target: gentle arrive to reduce jitter
          const arriveForce = this.arrive(target);
          arriveForce.limit(this.maxForce * 1.6);
          this.applyForce(arriveForce);
        }
      }
    } else {
      let force = createVector(0, 0);

      // WASD or Arrow keys for movement
      if (this.keys['w'] || this.keys['ArrowUp']) {
        force.y -= 1;
      }
      if (this.keys['s'] || this.keys['ArrowDown']) {
        force.y += 1;
      }
      if (this.keys['a'] || this.keys['ArrowLeft']) {
        force.x -= 1;
      }
      if (this.keys['d'] || this.keys['ArrowRight']) {
        force.x += 1;
      }

      // Normalize and apply force
      if (force.mag() > 0) {
        force.normalize();
        force.mult(this.maxForce);
        this.applyForce(force);
      }
    }

    // Update cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown--;
    }
  }

  _mouseInsideCanvas() {
    return mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;
  }

  // Check if player can shoot
  canShoot() {
    return this.shootCooldown <= 0;
  }

  // Trigger shoot
  shoot() {
    if (this.canShoot()) {
      this.shootCooldown = this.shootRate;
      return true;
    }
    return false;
  }

  // Take damage
  takeDamage() {
    if (!this.invincible) {
      this.health--;
      this.invincible = true;
      this.invincibleTime = 120; // 2 secondes d'invincibilité
      return this.health <= 0;
    }
    return false;
  }

  // Update movement
  update() {
    this.handleInput();
    
    // Update invincibility
    if (this.invincible) {
      this.invincibleTime--;
      if (this.invincibleTime <= 0) {
        this.invincible = false;
      }
    }
    
    super.update();
  }

  // Custom display for player
  show() {
    // Draw trail with glow effect
    this.path.forEach((p, index) => {
      if (!(index % 2)) {
        stroke(0, 255, 100, 100);
        fill(0, 255, 100, 100);
        circle(p.x, p.y, this.r * 0.12);
      }
    });

    // Draw player vehicle with glow
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading() - PI / 2);
    
    // Glow effect (flashing when invincible)
    if (this.invincible && frameCount % 10 < 5) {
      drawingContext.shadowBlur = 30;
      drawingContext.shadowColor = color(255, 255, 0);
    } else {
      drawingContext.shadowBlur = 20;
      drawingContext.shadowColor = color(0, 255, 100);
    }
    
    imageMode(CENTER);
    // Flash yellow when invincible
    if (this.invincible && frameCount % 10 < 5) {
      tint(255, 255, 100);
    } else {
      tint(this.pathColor);
    }
    image(this.image, 0, 0, this.r * 2.2, this.r * 2.2);
    pop();
  }
}
