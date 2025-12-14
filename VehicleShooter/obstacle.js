// Obstacle class - Static or moving obstacles to avoid
class Obstacle {
  constructor(x, y, r = 40) {
    this.pos = createVector(x, y);
    this.r = r;
    this.color = color(150, 150, 200);
  }

  // Display obstacle
  show() {
    push();
    translate(this.pos.x, this.pos.y);
    
    // Outer glow effect
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = color(100, 100, 150);
    
    fill(this.color);
    stroke(200, 200, 255);
    strokeWeight(2);
    circle(0, 0, this.r * 2);
    
    // Inner pattern
    noFill();
    stroke(200, 200, 255, 100);
    circle(0, 0, this.r * 1.5);
    circle(0, 0, this.r);
    
    pop();
  }
}
