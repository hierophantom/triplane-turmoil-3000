//File name and path: main/airplane-models.js
//File role: Airplane geometries, types, and characteristics

class AirplaneModels {
  constructor() {
    console.log('AirplaneModels initialized');
  }

  /*--------------------
    AIRPLANE TYPES
  --------------------*/

  // Get airplane specifications by type
  getAirplaneSpecs(type) {
    const specs = {
      fighter: {
        name: 'Fighter',
        maxSpeed: 900,
        acceleration: 1.2,
        turnRate: 2.0,
        weight: 1.0,
        durability: 3, // hits to destroy
        fuelCapacity: 8,
        ammoCapacity: 8,
        bombCapacity: 4
      },
      bomber: {
        name: 'Bomber', 
        maxSpeed: 600,
        acceleration: 0.8,
        turnRate: 1.2,
        weight: 1.5,
        durability: 5,
        fuelCapacity: 12,
        ammoCapacity: 4,
        bombCapacity: 8
      },
      scout: {
        name: 'Scout',
        maxSpeed: 1100,
        acceleration: 1.5,
        turnRate: 2.5,
        weight: 0.8,
        durability: 2,
        fuelCapacity: 6,
        ammoCapacity: 6,
        bombCapacity: 2
      }
    };

    return specs[type] || specs.fighter;
  }

  /*--------------------
    AIRPLANE CREATION
  --------------------*/

  createAirplane(type, color, playerId) {
    const specs = this.getAirplaneSpecs(type);
    const model = this.createAirplaneModel(type, color);
    
    return {
      // Visual
      mesh: model,
      type: type,
      color: color,
      playerId: playerId,
      
      // Performance (from specs)
      maxSpeed: specs.maxSpeed,
      acceleration: specs.acceleration,
      turnRate: specs.turnRate,
      baseWeight: specs.weight,
      durability: specs.durability,
      
      // Resources
      fuel: specs.fuelCapacity,
      maxFuel: specs.fuelCapacity,
      ammo: specs.ammoCapacity,
      maxAmmo: specs.ammoCapacity,
      bombs: specs.bombCapacity,
      maxBombs: specs.bombCapacity,
      
      // Current state
      health: specs.durability,
      weight: this.calculateWeight(specs),
      
      // Flight state
      velocity: new THREE.Vector3(0, 0, 0),
      acceleration: new THREE.Vector3(0, 0, 0),
      direction: new THREE.Vector3(0, 0, 1),
      banking: 0,
      pitch: 0,
      throttlePower: 0,
      speed: 0
    };
  }

  calculateWeight(specs) {
    // Base weight + fuel + ammo + bombs
    // This will be dynamic based on current resources
    return specs.weight + 
           (specs.fuelCapacity * 0.1) + 
           (specs.ammoCapacity * 0.05) + 
           (specs.bombCapacity * 0.15);
  }

  /*--------------------
    VISUAL MODELS
  --------------------*/

  createAirplaneModel(type, color) {
    switch(type) {
      case 'fighter':
        return this.createFighterModel(color);
      case 'bomber':
        return this.createBomberModel(color);
      case 'scout':
        return this.createScoutModel(color);
      default:
        return this.createFighterModel(color);
    }
  }

  createFighterModel(color) {
    const group = new THREE.Group();
    
    // Main body (sleek and narrow)
    const bodyGeometry = new THREE.BoxGeometry(70, 18, 35);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);
    
    // Wings (narrow for speed)
    const wingGeometry = new THREE.BoxGeometry(100, 4, 12);
    const wings = new THREE.Mesh(wingGeometry, bodyMaterial);
    wings.position.set(0, -2, 0);
    group.add(wings);
    
    // Wheels
    this.addWheels(group);
    
    // Fast propeller
    const propeller = this.createPropeller(0x444444);
    propeller.position.set(40, 0, 0);
    group.add(propeller);
    group.userData.propeller = propeller;
    
    return group;
  }

  createBomberModel(color) {
    const group = new THREE.Group();
    
    // Main body (larger and wider)
    const bodyGeometry = new THREE.BoxGeometry(90, 25, 45);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);
    
    // Wings (wide for stability)
    const wingGeometry = new THREE.BoxGeometry(140, 6, 18);
    const wings = new THREE.Mesh(wingGeometry, bodyMaterial);
    wings.position.set(0, -3, 0);
    group.add(wings);
    
    // Bomb bay (visual indicator)
    const bombBayGeometry = new THREE.BoxGeometry(40, 8, 20);
    const bombBayMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    const bombBay = new THREE.Mesh(bombBayGeometry, bombBayMaterial);
    bombBay.position.set(0, -15, 0);
    group.add(bombBay);
    
    // Wheels (larger)
    this.addWheels(group, 10);
    
    // Propeller
    const propeller = this.createPropeller(0x444444);
    propeller.position.set(50, 0, 0);
    group.add(propeller);
    group.userData.propeller = propeller;
    
    return group;
  }

  createScoutModel(color) {
    const group = new THREE.Group();
    
    // Main body (small and light)
    const bodyGeometry = new THREE.BoxGeometry(60, 15, 30);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);
    
    // Wings (medium size)
    const wingGeometry = new THREE.BoxGeometry(110, 3, 10);
    const wings = new THREE.Mesh(wingGeometry, bodyMaterial);
    wings.position.set(0, -1, 0);
    group.add(wings);
    
    // Wheels (smaller)
    this.addWheels(group, 6);
    
    // Propeller (high performance)
    const propeller = this.createPropeller(0x444444);
    propeller.position.set(35, 0, 0);
    group.add(propeller);
    group.userData.propeller = propeller;
    
    return group;
  }

  /*--------------------
    SHARED COMPONENTS
  --------------------*/

  addWheels(group, wheelRadius = 8) {
    const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 4, 8);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    
    // Left wheel
    const leftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    leftWheel.position.set(-25, -15, 5);
    leftWheel.rotation.z = Math.PI / 2;
    group.add(leftWheel);
    
    // Right wheel  
    const rightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rightWheel.position.set(25, -15, 5);
    rightWheel.rotation.z = Math.PI / 2;
    group.add(rightWheel);
  }

  createPropeller(color) {
    const propGeometry = new THREE.BoxGeometry(2, 40, 2);
    const propMaterial = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(propGeometry, propMaterial);
  }

  /*--------------------
    ANIMATION & UPDATES
  --------------------*/

  updateAirplaneVisuals(airplane, deltaTime) {
    // Update propeller animation
    this.animatePropeller(airplane, deltaTime);
    
    // Update airplane orientation
    this.updateOrientation(airplane);
  }

  animatePropeller(airplane, deltaTime) {
    const propeller = airplane.mesh.userData.propeller;
    if (propeller) {
      // Spin speed based on throttle and airplane type
      let baseSpeed = 25;
      if (airplane.type === 'scout') baseSpeed = 30;
      if (airplane.type === 'bomber') baseSpeed = 20;
      
      const spinSpeed = airplane.throttlePower * baseSpeed;
      propeller.rotation.x += spinSpeed * deltaTime;
    }
  }

  updateOrientation(airplane) {
    // Make airplane face movement direction
    const forward = airplane.direction.clone();
    airplane.mesh.lookAt(
      airplane.mesh.position.x + forward.x,
      airplane.mesh.position.y + forward.y,
      airplane.mesh.position.z + forward.z
    );

    // Apply banking (roll) for turns
    airplane.mesh.rotation.z = airplane.banking;
    
    // Apply pitch
    airplane.mesh.rotation.x = airplane.pitch;
  }

  /*--------------------
    RESOURCE MANAGEMENT
  --------------------*/

  updateWeight(airplane) {
    const specs = this.getAirplaneSpecs(airplane.type);
    
    // Dynamic weight based on current resources
    airplane.weight = specs.weight + 
                     (airplane.fuel * 0.1) + 
                     (airplane.ammo * 0.05) + 
                     (airplane.bombs * 0.15);
  }

  consumeFuel(airplane, amount) {
    airplane.fuel = Math.max(0, airplane.fuel - amount);
    this.updateWeight(airplane);
    return airplane.fuel > 0;
  }

  consumeAmmo(airplane, amount = 1) {
    if (airplane.ammo > 0) {
      airplane.ammo = Math.max(0, airplane.ammo - amount);
      this.updateWeight(airplane);
      return true;
    }
    return false;
  }

  consumeBomb(airplane) {
    if (airplane.bombs > 0) {
      airplane.bombs = Math.max(0, airplane.bombs - 1);
      this.updateWeight(airplane);
      return true;
    }
    return false;
  }
}

// Export for use in game engine
window.AirplaneModels = AirplaneModels;