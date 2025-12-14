// AI-controlled enemy vehicle class
class EnemyVehicle extends Vehicle {
  constructor(x, y, image, taille = 40) {
    super(x, y, image, color(255, 100, 100), taille);
    this.maxSpeed = 3.5;
    this.maxForce = 0.25;
    this.shootCooldown = 0;
    this.shootRate = random(60, 120); // frames between shots
    this.behavior = random(['wander', 'seek', 'evade']);
    this.behaviorChangeRate = 300; // frames before changing behavior
    this.behaviorTimer = 0;
    this.target = null; // Will be set to player
  }

  // Decide behavior and apply AI
  updateBehavior(playerVehicle, enemies) {
    this.behaviorTimer++;
    
    // Randomly change behavior
    if (this.behaviorTimer > this.behaviorChangeRate) {
      this.behavior = random(['wander', 'seek', 'evade']);
      this.behaviorTimer = 0;
      this.shootRate = random(60, 150);
    }

    // Apply behavior
    switch(this.behavior) {
      case 'wander':
        this.wander();
        break;
      case 'seek':
        this.applyForce(this.seek(playerVehicle.pos));
        break;
      case 'evade':
        this.applyForce(this.flee(playerVehicle.pos));
        break;
    }
  }

  // Can shoot
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

  // Update cooldown and behavior
  update(playerVehicle, enemies, obstacles = []) {
    this.updateBehavior(playerVehicle, enemies);
    
    // Avoid obstacles
    if (obstacles.length > 0) {
      let avoidForce = this.avoidObstacles(obstacles);
      this.applyForce(avoidForce);
    }
    
    // Update cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown--;
    }

    super.update();
  }

  // Custom display for enemy
  show() {
    // Draw trail
    this.path.forEach((p, index) => {
      if (!(index % 2)) {
        stroke(255, 100, 100, 80);
        fill(255, 100, 100, 80);
        circle(p.x, p.y, this.r * 0.1);
      }
    });

    // Draw enemy vehicle with threat color
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading() - PI / 2);
    
    imageMode(CENTER);
    tint(this.pathColor);
    image(this.image, 0, 0, this.r * 2, this.r * 2);
    pop();

    // Draw health indicator or behavior label for debug
    if (Vehicle.debug) {
      fill(this.pathColor);
      textSize(10);
      text(this.behavior, this.pos.x - 20, this.pos.y - this.r - 10);
    }
  }
}
