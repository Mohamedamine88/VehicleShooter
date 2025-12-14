// Projectile class for player and enemy shots
class Projectile {
  constructor(x, y, vx, vy, speed = 8, color = color(0, 255, 100), isPlayerShot = true, interceptor = false, homingTarget = null, homingTurnRate = 0.2) {
    this.pos = createVector(x, y);
    this.vel = createVector(vx, vy);
    this.vel.normalize();
    this.baseSpeed = speed;
    this.vel.mult(this.baseSpeed);
    this.color = color;
    this.isPlayerShot = isPlayerShot;
    this.interceptor = interceptor;
    this.homingTarget = homingTarget;
    this.homingTurnRate = homingTurnRate;
    this.r = 5;
    this.alive = true;
    this.lifespan = 300; // frames until despawn
    this.age = 0;
  }

  // Update position and age
  update() {
    // Homing behavior
    if (this.homingTarget) {
      const desired = p5.Vector.sub(this.homingTarget.pos, this.pos);
      desired.setMag(this.baseSpeed);
      const steer = p5.Vector.sub(desired, this.vel);
      steer.limit(this.homingTurnRate);
      this.vel.add(steer);
      this.vel.setMag(this.baseSpeed);
    }

    this.pos.add(this.vel);
    this.age++;

    // Check if out of bounds or too old
    if (this.age > this.lifespan || 
        this.pos.x < 0 || this.pos.x > width ||
        this.pos.y < 0 || this.pos.y > height) {
      this.alive = false;
    }
  }

  // Display projectile
  show() {
    push();
    translate(this.pos.x, this.pos.y);
    
    // Glow effect
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = this.color;
    
    fill(this.color);
    stroke(255);
    strokeWeight(1);
    circle(0, 0, this.r * 2);
    
    // Draw trail
    stroke(this.color);
    strokeWeight(1);
    line(0, 0, -this.vel.x * 2, -this.vel.y * 2);
    
    pop();
  }

  // Check collision with vehicle
  collidesWith(vehicle) {
    let distance = p5.Vector.dist(this.pos, vehicle.pos);
    return distance < this.r + vehicle.r;
  }

  // Collision with another projectile
  collidesWithProjectile(other) {
    let distance = p5.Vector.dist(this.pos, other.pos);
    return distance < this.r + other.r;
  }
}
