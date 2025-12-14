// Base Vehicle class with AI behaviors
class Vehicle {
  static debug = false;

  constructor(x, y, image, pathColor = "white", taille = 46) {
    this.pos = createVector(x, y);
    this.vel = createVector(1, 0);
    this.acc = createVector(0, 0);
    this.maxSpeed = 4;
    this.maxForce = 0.2;
    this.r = taille;

    // sprite image du véhicule
    this.image = image;

    // pour comportement wander
    this.distanceCercle = 150;
    this.wanderRadius = 50;
    this.wanderTheta = -Math.PI / 2;
    this.displaceRange = 0.3;

    // trainée derrière les véhicules
    this.path = [];
    this.pathColor = pathColor;
    this.maxPathLength = 50;

    // Debug info for avoidance visuals
    this.lastAvoidDebug = null;
  }

  // Wander behavior
  // Crée un cercle devant le véhicule et choisit un point aléatoire sur ce cercle
  // Le point se déplace lissément (random walk du theta) pour éviter les à-coups
  wander() {
    // Calcul du centre du cercle (devant le véhicule)
    let pointDevant = this.vel.copy();
    pointDevant.setMag(this.distanceCercle);
    pointDevant.add(this.pos);

    // Angle sur le cercle = angle de déplacement actuel + variation aléatoire
    let theta = this.wanderTheta + this.vel.heading();
    let pointSurLeCercle = createVector(0, 0);
    pointSurLeCercle.x = this.wanderRadius * cos(theta);
    pointSurLeCercle.y = this.wanderRadius * sin(theta);

    pointSurLeCercle.add(pointDevant);

    // Mise à jour du theta pour lissé le changement à chaque frame
    this.wanderTheta += random(-this.displaceRange, this.displaceRange);

    // Force vers le point = steering pour chercher ce point
    let force = p5.Vector.sub(pointSurLeCercle, this.pos);
    force.setMag(this.maxForce);
    this.applyForce(force);

    return force;
  }

  // Seek behavior
  // Formule = vitesse_désirée - vitesse_actuelle
  // La vitesse désirée pointe vers la cible à vitesse max
  seek(target) {
    // Direction vers la cible
    let force = p5.Vector.sub(target, this.pos);
    // Magnitude = maxSpeed (on veut aller à pleine vitesse)
    force.setMag(this.maxSpeed);
    // Retire la vitesse actuelle pour obtenir le steering nécessaire
    force.sub(this.vel);
    // Limite la force pour éviter les accélérations impossibles
    force.limit(this.maxForce);
    return force;
  }

  // Arrive behavior (seek with slowdown)
  // Comme seek, mais ralentit progressivement en approchant (slowRadius = 100px)
  // Permet d'arriver lissément sans dépasser la cible
  arrive(target) {
    let force = p5.Vector.sub(target, this.pos);
    let desiredSpeed = this.maxSpeed;
    let slowRadius = 100;
    let distance = force.mag();
    
    // Si près de la cible, ralentis progressivement
    if (distance < slowRadius) {
      desiredSpeed = map(distance, 0, slowRadius, 0, this.maxSpeed);
    }
    
    force.setMag(desiredSpeed);
    force.sub(this.vel);
    force.limit(this.maxForce);
    return force;
  }

  // Flee behavior
  // Inverse du seek : fuit la cible en appliquant une force opposée
  flee(target) {
    let force = this.seek(target);
    force.mult(-1);
    return force;
  }

  // Avoid obstacles : anticipation et steering perpendiculaire
  // ÉTAPE 1 : Prédire collision en regardant devant (look ahead)
  // ÉTAPE 2 : Trouver l'obstacle menaçant le plus proche
  // ÉTAPE 3 : Calculer force de contournement (perpendiculaire à la vitesse)
  avoidObstacles(obstacles) {
    if (!obstacles || obstacles.length === 0) {
      return createVector(0, 0);
    }

    const velocityDir = this.vel.copy();
    if (velocityDir.magSq() === 0) {
      return createVector(0, 0);
    }

    velocityDir.normalize();

    // ÉTAPE 1 : Anticipation - regarde devant selon la vitesse
    // Plus on va vite, plus on doit regarder loin pour avoir le temps de tourner
    const lookAhead = map(this.vel.mag(), 0, this.maxSpeed, this.r * 2.0, this.r * 5.5);
    const ahead = p5.Vector.add(this.pos, p5.Vector.mult(velocityDir, lookAhead));

    // ÉTAPE 2 : Détection - quel obstacle menace le chemin prédit ?
    let mostThreatening = null;
    let minDistance = Infinity;
    const clearance = this.r * 1.0; // zone de sécurité autour du véhicule

    for (let obstacle of obstacles) {
      // Distance du centre de l'obstacle à la ligne [pos, ahead]
      const distToPath = this._distancePointToSegment(obstacle.pos, this.pos, ahead);
      const combinedClearance = obstacle.r + clearance;
      const distFromVehicle = p5.Vector.dist(this.pos, obstacle.pos);

      // L'obstacle menace si son rayon atteint notre chemin AND qu'il est devant
      if (distToPath < combinedClearance && distFromVehicle < minDistance) {
        minDistance = distFromVehicle;
        mostThreatening = obstacle;
      }
    }

    // Stock info pour affichage debug
    this.lastAvoidDebug = {
      ahead,
      lookAhead,
      mostThreatening,
      clearance: mostThreatening ? mostThreatening.r + clearance : null,
    };

    // Cas critique : véhicule déjà collide l'obstacle → push out radial immédiat
    for (let obstacle of obstacles) {
      const distFromVehicle = p5.Vector.dist(this.pos, obstacle.pos);
      if (distFromVehicle < obstacle.r + clearance) {
        // Direction opposée = loin de l'obstacle
        const away = p5.Vector.sub(this.pos, obstacle.pos);
        away.normalize();
        // Force d'éjection forte + freinage pour arrêter la pénétration
        const push = p5.Vector.mult(away, this.maxForce * 3.2);
        const brake = p5.Vector.mult(velocityDir, -this.maxForce * 1.2);
        push.add(brake);
        return push;
      }
    }

    // ÉTAPE 3 : Steering perpendiculaire pour contourner en douceur
    // Au lieu de freiner brutalement, on tourne latéralement = mouvement fluide
    if (mostThreatening) {
      // Quel côté de l'obstacle est-on ? (vecteur perpendiculaire à la vélocité)
      const toObstacle = p5.Vector.sub(mostThreatening.pos, ahead);
      const side = createVector(-velocityDir.y, velocityDir.x); // 90° perpendiculaire
      const sideSign = Math.sign(toObstacle.dot(side)) || 1; // quel côté ?
      side.mult(sideSign);

      // Désir = avancer un peu + dévier latéralement pour tourner en douceur
      const desired = p5.Vector.add(
        p5.Vector.mult(velocityDir, this.maxSpeed),
        p5.Vector.mult(side, this.maxSpeed * 0.6) // 60% de la force vers le côté
      );

      let steering = p5.Vector.sub(desired, this.vel);
      // Plus on est proche, plus on tire fort sur le steering
      const combinedRadius = mostThreatening.r + this.r;
      const closeFactor = constrain(1.0 - (minDistance / (combinedRadius * 2)), 0, 1);
      steering.limit(this.maxForce * (1.4 + closeFactor * 1.8));
      return steering;
    }

    return createVector(0, 0);
  }

  // Helper: distance from point p to segment ab
  _distancePointToSegment(p, a, b) {
    const ab = p5.Vector.sub(b, a);
    const ap = p5.Vector.sub(p, a);
    const proj = constrain(ap.dot(ab) / ab.magSq(), 0, 1);
    const closest = p5.Vector.add(a, p5.Vector.mult(ab, proj));
    return p5.Vector.dist(p, closest);
  }

  // Apply force (Newton's second law)
  applyForce(force) {
    this.acc.add(force);
  }

  // Update position
  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.set(0, 0);

    // Add path trace
    this.path.push(this.pos.copy());
    if (this.path.length > this.maxPathLength) {
      this.path.shift();
    }
  }

  // Display vehicle with trail
  show() {
    // Draw trail
    this.path.forEach((p, index) => {
      if (!(index % 3)) {
        stroke(this.pathColor);
        fill(this.pathColor);
        let alpha = map(index, 0, this.path.length, 50, 200);
        circle(p.x, p.y, this.r * 0.1);
      }
    });

    // Draw vehicle with image
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading() - PI / 2);
    imageMode(CENTER);
    tint(this.pathColor);
    image(this.image, 0, 0, this.r * 2, this.r * 2);
    pop();

    // Debug visuals for obstacle avoidance
    if (Vehicle.debug && this.lastAvoidDebug) {
      const dbg = this.lastAvoidDebug;
      push();
      noFill();
      stroke(0, 200, 255, 160);
      drawingContext.setLineDash([6, 10]);
      line(this.pos.x, this.pos.y, dbg.ahead.x, dbg.ahead.y);
      drawingContext.setLineDash([]);
      circle(dbg.ahead.x, dbg.ahead.y, this.r * 1.6);

      if (dbg.mostThreatening && dbg.clearance) {
        stroke(255, 120, 120, 180);
        noFill();
        circle(dbg.mostThreatening.pos.x, dbg.mostThreatening.pos.y, dbg.clearance * 2);
      }
      pop();
    }
  }

  // Boundary wrapping
  edges() {
    let navbarHeight = 80;
    let margin = this.r;

    if (this.pos.x > width + margin) {
      this.pos.x = -margin;
    } else if (this.pos.x < -margin) {
      this.pos.x = width + margin;
    }

    if (this.pos.y > height + margin) {
      this.pos.y = navbarHeight - margin;
    } else if (this.pos.y < navbarHeight - margin) {
      this.pos.y = height + margin;
    }
  }
}
