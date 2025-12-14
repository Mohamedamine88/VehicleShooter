# VehicleShooter — Jeu de tir à IA réactive

## Présentation générale

VehicleShooter est un jeu de tir en vue du dessus développé avec **p5.js**, dans le cadre du module d’**IA réactive**.  
Le projet consiste à transformer les comportements vus en TP (seek, flee, wander, arrive, avoidance…) en un jeu jouable et cohérent.

Le joueur contrôle un véhicule vert et doit survivre le plus longtemps possible en détruisant des véhicules ennemis rouges, tout en évitant leurs tirs et les obstacles présents sur la carte.

L’objectif principal du projet n’est pas la complexité du gameplay, mais la **mise en pratique claire et fidèle des algorithmes d’IA réactive vus en cours**.

---

## Principe du jeu

- Le joueur contrôle un véhicule dans une arène unique.
- Des ennemis apparaissent régulièrement et se déplacent de manière autonome.
- Le joueur peut tirer pour détruire les ennemis.
- Les ennemis tirent également des projectiles vers le joueur.
- Des obstacles fixes sont présents et doivent être évités par tous les agents.
- La partie se termine lorsque le joueur n’a plus de vie.

Le score augmente à chaque ennemi détruit.

---

## Contrôles

- **Souris** : déplacement du joueur vers le curseur (comportement `arrive()`)
- **Clavier (WASD ou flèches)** : déplacement manuel
- **Espace** : tirer un projectile
- **P** : lancer des projectiles anti-missiles (défense)
- **D** : activer / désactiver le mode debug
- **Entrée** : démarrer la partie
- **R** : recommencer après un Game Over

---

## Mécaniques principales

### Joueur
- Le joueur possède **3 points de vie**.
- Chaque impact d’un projectile ennemi enlève 1 vie.
- Après avoir été touché, le joueur devient invincible pendant un court instant.
- Le déplacement à la souris utilise `arrive()` pour éviter les mouvements brusques.

### Ennemis
- Les ennemis sont entièrement contrôlés par l’IA.
- Ils alternent aléatoirement entre trois comportements :
  - **Wander** : errance aléatoire
  - **Seek** : poursuite directe du joueur
  - **Flee / Evade** : fuite du joueur
- Le changement de comportement se fait toutes les quelques secondes.
- Les ennemis tirent des projectiles à tête chercheuse vers le joueur.
- Ils évitent les obstacles de manière autonome.

### Projectiles
- Les projectiles du joueur vont droit devant.
- Les projectiles ennemis utilisent une poursuite simple vers la position du joueur.
- Tous les projectiles disparaissent après un certain temps ou en cas de collision.

### Obstacles
- Obstacles circulaires fixes sur la carte.
- Tous les véhicules utilisent un **algorithme d’évitement**, sans rebond (“bouncing”).

---

## Algorithmes d’IA utilisés

Le jeu repose uniquement sur les **comportements de steering vus en TP** :

- **Seek** : poursuite d’une cible (ennemis vers le joueur)
- **Flee / Evade** : fuite par inversion du vecteur de seek
- **Wander** : déplacement aléatoire fluide à l’aide d’un cercle projeté devant le véhicule
- **Arrive** : ralentissement progressif à l’approche d’une cible (joueur à la souris)
- **Avoid Obstacles** :
  - prédiction de la position future (look-ahead)
  - détection de l’obstacle menaçant
  - application d’une force latérale pour le contourner

Les forces sont **additionnées à chaque frame**, puis appliquées via `applyForce()`, conformément au modèle physique vu en TP.

---

## Structure du code

Le projet repose sur une structure simple et proche des TPs :

- **Vehicle** (classe de base)
  - gestion de la physique (position, vitesse, accélération)
  - implémentation de tous les comportements IA
- **PlayerVehicle** (hérite de `Vehicle`)
  - gestion des entrées clavier / souris
  - système de vie et de tir
- **EnemyVehicle** (hérite de `Vehicle`)
  - changement de comportement automatique
  - tir vers le joueur
- **Projectile**
  - entité simple, sans héritage de `Vehicle`
- **Obstacle**
  - objet statique servant uniquement à l’évitement

---

## Conclusion

VehicleShooter illustre comment des **comportements réactifs simples**, bien combinés, peuvent produire un gameplay dynamique et crédible.  

---

## Auteurs

Projet réalisé par :

- **Mohamed Amine ELIDRISSI**
- **Ali CHKOUKOUT**
