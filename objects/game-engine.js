//File name and path: objects/game-engine.js
//File role: Main game engine with 4-player split screen

class GameEngine {
  constructor() {
    this.scene = null;
    this.renderer = null;
    this.cameras = [];
    this.players = [];
    this.controlSystems = null; // Add this line
    this.worldBounds = {
      x: 5000,  // Half of 10,000
      z: 5000,  // Half of 10,000  
      y: 700    // Height limit
    };
    
    this.isRunning = false;
    this.clock = new THREE.Clock();
    this.frameCount = 0;
    
    console.log('GameEngine initialized with modular systems');
    this.init();
  }

  init() {
    console.log('GameEngine initializing...');
    try {
      this.setupRenderer();
      this.setupScene();
      this.setupLighting();
      this.setupWorld();
      this.setupPlayers();
      this.setupCameras();
      this.setupUI();
      
      // Initialize control systems
      if (window.ControlSystems) {
        this.controlSystems = new window.ControlSystems();
        console.log('ControlSystems instance created');
      }
      
      this.start();
      console.log('GameEngine initialization complete');
    } catch (error) {
      console.error('GameEngine initialization failed:', error);
    }
  }

  /*--------------------
    RENDERER SETUP
  --------------------*/

  setupRenderer() {
    console.log('Setting up renderer...');
    let canvas = document.getElementById('game-canvas');
    
    if (!canvas) {
      console.log('Canvas not found, creating one...');
      // Create canvas element if it doesn't exist
      canvas = document.createElement('canvas');
      canvas.id = 'game-canvas';
      document.body.appendChild(canvas);
    }
    
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: canvas,
      antialias: true 
    });
    
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x87CEEB); // Sky blue background
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    console.log('Renderer setup complete');
  }

  /*--------------------
    SCENE SETUP
  --------------------*/

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x87CEEB, 2000, 8000); // Atmospheric fog
    
    console.log('Scene setup complete');
  }

  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 50;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -500;
    directionalLight.shadow.camera.right = 500;
    directionalLight.shadow.camera.top = 500;
    directionalLight.shadow.camera.bottom = -500;
    
    this.scene.add(directionalLight);
    
    console.log('Lighting setup complete');
  }

  /*--------------------
    WORLD SETUP
  --------------------*/

  setupWorld() {
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(this.worldBounds.x * 2, this.worldBounds.z * 2);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x228B22, // Forest green
      side: THREE.DoubleSide 
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // World boundaries (invisible walls)
    this.createBoundaryWalls();
    
    // Simple landmarks for navigation
    this.createLandmarks();
    
    console.log('World setup complete');
  }

  createBoundaryWalls() {
    const wallMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff0000, 
      transparent: true, 
      opacity: 0.1,
      wireframe: true 
    });

    // North wall
    const northWall = new THREE.Mesh(
      new THREE.PlaneGeometry(this.worldBounds.x * 2, this.worldBounds.y * 2),
      wallMaterial
    );
    northWall.position.set(0, this.worldBounds.y, this.worldBounds.z);
    this.scene.add(northWall);

    // South wall
    const southWall = new THREE.Mesh(
      new THREE.PlaneGeometry(this.worldBounds.x * 2, this.worldBounds.y * 2),
      wallMaterial
    );
    southWall.position.set(0, this.worldBounds.y, -this.worldBounds.z);
    southWall.rotation.y = Math.PI;
    this.scene.add(southWall);

    // East wall
    const eastWall = new THREE.Mesh(
      new THREE.PlaneGeometry(this.worldBounds.z * 2, this.worldBounds.y * 2),
      wallMaterial
    );
    eastWall.position.set(this.worldBounds.x, this.worldBounds.y, 0);
    eastWall.rotation.y = Math.PI / 2;
    this.scene.add(eastWall);

    // West wall
    const westWall = new THREE.Mesh(
      new THREE.PlaneGeometry(this.worldBounds.z * 2, this.worldBounds.y * 2),
      wallMaterial
    );
    westWall.position.set(-this.worldBounds.x, this.worldBounds.y, 0);
    westWall.rotation.y = -Math.PI / 2;
    this.scene.add(westWall);

    console.log('Boundary walls created');
  }

  createLandmarks() {
    // Simple cube landmarks for reference
    const landmarkGeometry = new THREE.BoxGeometry(100, 100, 100);
    const landmarkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown

    const landmarks = [
      { x: 1000, z: 1000 },
      { x: -1000, z: 1000 },
      { x: 1000, z: -1000 },
      { x: -1000, z: -1000 },
      { x: 0, z: 0 } // Center landmark
    ];

    landmarks.forEach(pos => {
      const landmark = new THREE.Mesh(landmarkGeometry, landmarkMaterial);
      landmark.position.set(pos.x, 50, pos.z);
      landmark.castShadow = true;
      this.scene.add(landmark);
    });

    console.log('Landmarks created');
  }

  /*--------------------
    PLAYERS SETUP
  --------------------*/

  setupPlayers() {
    const playerColors = [0xf1c40f, 0xe74c3c, 0x2ecc71, 0x3498db]; // Yellow, Red, Green, Blue
    const playerTypes = ['fighter', 'fighter', 'scout', 'bomber']; // Different types for variety
    const startPositions = [
      { x: -500, y: 100, z: -500 },
      { x: 500, y: 100, z: -500 },
      { x: -500, y: 100, z: 500 },
      { x: 500, y: 100, z: 500 }
    ];

    for (let i = 0; i < 4; i++) {
      let airplane;
      
      // Create airplane using AirplaneModels if available
      if (window.AirplaneModels) {
        const airplaneModels = new window.AirplaneModels();
        airplane = airplaneModels.createAirplane(
          playerTypes[i], 
          playerColors[i], 
          i
        );
      } else {
        // Fallback airplane creation
        airplane = this.createPlayer(i, playerColors[i], startPositions[i]);
      }
      
      // Set position
      airplane.mesh.position.set(
        startPositions[i].x, 
        startPositions[i].y, 
        startPositions[i].z
      );
      
      // Register with control system
      if (this.controlSystems) {
        this.controlSystems.registerPlayer(i);
      }
      
      airplane.isActive = i === 0; // Only player 1 active for now
      
      this.players.push(airplane);
      this.scene.add(airplane.mesh);
    }

    console.log('Players setup complete');
  }

  createPlayer(id, color, position) {
    // Create airplane geometry instead of simple cube
    const airplane = this.createAirplaneModel(color);
    
    airplane.position.set(position.x, position.y, position.z);
    airplane.castShadow = true;
    airplane.receiveShadow = true;
    
    return {
      id: id,
      mesh: airplane,
      velocity: new THREE.Vector3(0, 0, 0),
      acceleration: new THREE.Vector3(0, 0, 0),
      maxSpeed: 800,
      weight: 1.0, // Will vary based on fuel/ammo
      isActive: id === 0, // Only player 1 active for now
      
      // Flight characteristics
      speed: 0,
      direction: new THREE.Vector3(0, 0, 1), // Forward direction
      banking: 0, // For turns
      pitch: 0,   // For up/down
      throttlePower: 0, // Current throttle level (0-1)
      turnRate: 2.0,
      type: 'fighter'
    };
  }

  createAirplaneModel(color) {
    const group = new THREE.Group();
    
    // Main body (cube)
    const bodyGeometry = new THREE.BoxGeometry(80, 20, 40); // width, height, depth
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0, 0);
    group.add(body);
    
    // Wings (simple flat rectangles)
    const wingGeometry = new THREE.BoxGeometry(120, 4, 15); // wide, thin wings
    const wingMaterial = new THREE.MeshLambertMaterial({ color: color });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.set(0, -2, 0); // Slightly below body
    group.add(wings);
    
    // Left wheel
    const wheelGeometry = new THREE.CylinderGeometry(8, 8, 4, 8); // radius, radius, height, segments
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 }); // Dark gray
    const leftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    leftWheel.position.set(-25, -15, 5); // Left side, below body, slightly forward
    leftWheel.rotation.z = Math.PI / 2; // Rotate to be like a wheel
    group.add(leftWheel);
    
    // Right wheel  
    const rightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rightWheel.position.set(25, -15, 5); // Right side, below body, slightly forward
    rightWheel.rotation.z = Math.PI / 2; // Rotate to be like a wheel
    group.add(rightWheel);
    
    // Simple propeller (just a thin rectangle)
    const propGeometry = new THREE.BoxGeometry(2, 40, 2); // thin, long blade
    const propMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const propeller = new THREE.Mesh(propGeometry, propMaterial);
    propeller.position.set(45, 0, 0); // Front of the plane
    group.add(propeller);
    
    // Store propeller reference for animation
    group.userData.propeller = propeller;
    
    return group;
  }

  /*--------------------
    CAMERAS SETUP
  --------------------*/

  setupCameras() {
    console.log('Setting up cameras...');
    const aspect = (window.innerWidth / 2) / (window.innerHeight / 2); // Split screen aspect ratio
    
    for (let i = 0; i < 4; i++) {
      const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 10000);
      // Set initial camera position for debugging
      camera.position.set(0, 200, -300);
      camera.lookAt(0, 0, 0);
      this.cameras.push(camera);
    }

    this.updateCameras();
    console.log('Cameras setup complete, camera count:', this.cameras.length);
  }

  updateCameras() {
    this.cameras.forEach((camera, index) => {
      const player = this.players[index];
      if (player) {
        // Position camera behind and above the player
        const offset = new THREE.Vector3(0, 100, -200);
        const playerPosition = player.mesh.position.clone();
        
        camera.position.copy(playerPosition).add(offset);
        camera.lookAt(playerPosition);
      }
    });
  }

  /*--------------------
    UI SETUP
  --------------------*/

  setupUI() {
    // Create basic UI elements if they don't exist
    this.createUIElements();

    // Exit button
    const exitBtn = document.getElementById('exit-game');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        this.stop();
        // Return to main menu (you'll need to implement this)
        window.history.back();
      });
    }

    // Window resize handling
    window.addEventListener('resize', () => {
      this.onWindowResize();
    });

    console.log('UI setup complete');
  }

  createUIElements() {
    // Create game container if it doesn't exist
    let gameContainer = document.getElementById('game-container');
    if (!gameContainer) {
      gameContainer = document.createElement('div');
      gameContainer.id = 'game-container';
      document.body.appendChild(gameContainer);
    }

    // Create HUD overlay
    let gameHUD = document.getElementById('game-hud');
    if (!gameHUD) {
      gameHUD = document.createElement('div');
      gameHUD.id = 'game-hud';
      gameContainer.appendChild(gameHUD);

      // Create exit button
      const exitBtn = document.createElement('button');
      exitBtn.id = 'exit-game';
      exitBtn.textContent = 'Exit Game';
      gameHUD.appendChild(exitBtn);

      // Create debug info
      const debugInfo = document.createElement('div');
      debugInfo.id = 'debug-info';
      debugInfo.innerHTML = `
        <div id="fps-counter">FPS: 0</div>
        <div id="player-pos">Position: 0, 0, 0</div>
        <div id="speed-display">Speed: 0</div>
        <div id="throttle-display">Throttle: OFF</div>
        <div id="type-display">Type: fighter</div>
      `;
      gameHUD.appendChild(debugInfo);
    }
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.renderer.setSize(width, height);
    
    // Update camera aspect ratios
    const newAspect = (width / 2) / (height / 2);
    this.cameras.forEach(camera => {
      camera.aspect = newAspect;
      camera.updateProjectionMatrix();
    });
  }

  /*--------------------
    GAME LOOP
  --------------------*/

  start() {
    this.isRunning = true;
    this.gameLoop();
    console.log('Game started');
  }

  stop() {
    this.isRunning = false;
    console.log('Game stopped');
  }

  gameLoop() {
    if (!this.isRunning) return;

    const deltaTime = this.clock.getDelta();
    
    // Update input systems
    if (this.controlSystems) {
      this.controlSystems.update();
    }
    
    this.updatePlayers(deltaTime);
    this.updateCameras();
    this.updateUI();
    this.render();
    
    requestAnimationFrame(() => this.gameLoop());
  }


  updatePlayers(deltaTime) {
  this.players.forEach((airplane, index) => {
    if (!airplane.isActive) return;

    const controls = this.controlSystems ? this.controlSystems.getPlayerControls(index) : {};
    if (!controls) return;

    // Only log when something interesting happens
    if (controls.throttle && airplane.throttlePower < 0.1) {
      console.log('Starting throttle for player', index);
    }

    this.applyFlightPhysics(airplane, controls, deltaTime);
    
    if (window.AirplaneModels) {
      const airplaneModels = new window.AirplaneModels();
      airplaneModels.updateAirplaneVisuals(airplane, deltaTime);
    }

    this.applyBoundaries(airplane);
  });
}

  applyFlightPhysics(airplane, controls, deltaTime) {

      if (controls.throttle || controls.turnLeft || controls.turnRight || controls.noseUp || controls.noseDown) {
    console.log('Active controls detected:', controls);
    console.log('Airplane position before:', airplane.mesh.position.clone());
  }
    // Flight physics constants (could be moved to airplane specs)
    const thrustPower = 1000 * (airplane.acceleration || 1.0);
    const dragCoefficient = 0.95;
    const liftCoefficient = 0.03;
    const gravityForce = 400;

    // Handle throttle
    if (controls.throttle) {
      airplane.throttlePower = Math.min(airplane.throttlePower + deltaTime * 2.0, 1.0);
    } else {
      airplane.throttlePower = Math.max(airplane.throttlePower - deltaTime * 1.5, 0.0);
    }

    // Calculate thrust vector
    const thrustVector = airplane.direction.clone().multiplyScalar(
      airplane.throttlePower * thrustPower * deltaTime / airplane.weight
    );
    airplane.acceleration.add(thrustVector);

    // Handle turning with airplane's turn rate
    const turnRate = airplane.turnRate;
    if (controls.turnLeft) {
      airplane.banking = Math.max(airplane.banking - turnRate * deltaTime, -0.8);
      const turnAngle = -turnRate * deltaTime;
      airplane.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), turnAngle);
    } else if (controls.turnRight) {
      airplane.banking = Math.min(airplane.banking + turnRate * deltaTime, 0.8);
      const turnAngle = turnRate * deltaTime;
      airplane.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), turnAngle);
    } else {
      airplane.banking *= 0.92;
    }

    // Handle pitch (nose up/down)
    const pitchRate = 1.5;
    if (controls.noseDown) {
      airplane.pitch = Math.max(airplane.pitch - pitchRate * deltaTime, -0.8);
      airplane.direction.y = Math.max(airplane.direction.y - pitchRate * deltaTime * 0.4, -0.6);
    } else if (controls.noseUp) {
      airplane.pitch = Math.min(airplane.pitch + pitchRate * deltaTime, 0.8);
      airplane.direction.y = Math.min(airplane.direction.y + pitchRate * deltaTime * 0.4, 0.6);
    } else {
      airplane.pitch *= 0.96;
      airplane.direction.y *= 0.98;
    }

    // Normalize direction
    airplane.direction.normalize();

    // Apply gravity
    airplane.acceleration.y -= gravityForce * deltaTime;

    // Generate lift based on speed
    const currentSpeed = airplane.velocity.length();
    const liftForce = currentSpeed * liftCoefficient;
    airplane.acceleration.y += liftForce * deltaTime;

    // Apply drag
    const dragForce = airplane.velocity.clone().multiplyScalar(-dragCoefficient * deltaTime);
    airplane.acceleration.add(dragForce);

    // Update velocity
    airplane.velocity.add(airplane.acceleration.clone().multiplyScalar(deltaTime));
    
    // Apply speed limit
    if (airplane.velocity.length() > airplane.maxSpeed) {
      airplane.velocity.normalize().multiplyScalar(airplane.maxSpeed);
    }

    // Update position
    airplane.mesh.position.add(airplane.velocity.clone().multiplyScalar(deltaTime));

    // Reset acceleration for next frame
    airplane.acceleration.set(0, 0, 0);

    // Update current speed
    airplane.speed = airplane.velocity.length();
  }

  applyBoundaries(airplane) {
    const pos = airplane.mesh.position;
    
    // X boundaries
    if (pos.x > this.worldBounds.x) {
      pos.x = this.worldBounds.x;
      airplane.velocity.x = 0;
    }
    if (pos.x < -this.worldBounds.x) {
      pos.x = -this.worldBounds.x;
      airplane.velocity.x = 0;
    }
    
    // Z boundaries
    if (pos.z > this.worldBounds.z) {
      pos.z = this.worldBounds.z;
      airplane.velocity.z = 0;
    }
    if (pos.z < -this.worldBounds.z) {
      pos.z = -this.worldBounds.z;
      airplane.velocity.z = 0;
    }
    
    // Y boundaries
    if (pos.y > this.worldBounds.y) {
      pos.y = this.worldBounds.y;
      airplane.velocity.y = 0;
    }
    if (pos.y < 10) { // Ground level
      pos.y = 10;
      airplane.velocity.y = 0;
    }
  }

  updateUI() {
    // FPS counter
    this.frameCount++;
    if (this.frameCount % 60 === 0) {
      const fps = Math.round(1 / this.clock.getDelta());
      const fpsCounter = document.getElementById('fps-counter');
      if (fpsCounter) {
        fpsCounter.textContent = `FPS: ${fps}`;
      }
    }

    // Player flight data
    const player1 = this.players[0];
    if (!player1) return;
    
    const pos = player1.mesh.position;
    const speed = Math.round(player1.speed);
    const throttle = Math.round(player1.throttlePower * 100);
    const controls = this.controlSystems ? this.controlSystems.getPlayerControls(0) : {};
    const throttleStatus = controls && controls.throttle ? 'ON' : 'OFF';
    
    // Update position display
    const playerPosEl = document.getElementById('player-pos');
    if (playerPosEl) {
      playerPosEl.textContent = `Position: ${Math.round(pos.x)}, ${Math.round(pos.y)}, ${Math.round(pos.z)}`;
    }

    // Update flight data
    const speedDisplay = document.getElementById('speed-display');
    if (speedDisplay) {
      speedDisplay.textContent = `Speed: ${speed} units/s`;
    }
    
    const throttleDisplay = document.getElementById('throttle-display');
    if (throttleDisplay) {
      throttleDisplay.textContent = `Throttle: ${throttleStatus} (${throttle}%)`;
    }

    const typeDisplay = document.getElementById('type-display');
    if (typeDisplay) {
      typeDisplay.textContent = `Type: ${player1.type} (${player1.maxSpeed} max)`;
    }
  }

  render() {
    if (!this.renderer || !this.scene || this.cameras.length === 0) {
      console.error('Render failed: Missing renderer, scene, or cameras');
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Clear the entire screen
    this.renderer.setViewport(0, 0, width, height);
    this.renderer.clear();

    // Render each viewport
    const viewports = [
      { x: 0, y: height/2, width: width/2, height: height/2 },           // Top-left (Player 1)
      { x: width/2, y: height/2, width: width/2, height: height/2 },      // Top-right (Player 2)
      { x: 0, y: 0, width: width/2, height: height/2 },                  // Bottom-left (Player 3)
      { x: width/2, y: 0, width: width/2, height: height/2 }             // Bottom-right (Player 4)
    ];

    viewports.forEach((viewport, index) => {
      if (this.cameras[index]) {
        this.renderer.setViewport(viewport.x, viewport.y, viewport.width, viewport.height);
        this.renderer.setScissor(viewport.x, viewport.y, viewport.width, viewport.height);
        this.renderer.setScissorTest(true);
        
        this.renderer.render(this.scene, this.cameras[index]);
      }
    });

    // Disable scissor test after rendering
    this.renderer.setScissorTest(false);
  }
}

/*--------------------
  INITIALIZATION
--------------------*/

let gameEngine = null;

// Function to be called by navigation system
window.initializeGame = () => {
  console.log('initializeGame called');
  if (!gameEngine) {
    console.log('Creating new GameEngine...');
    gameEngine = new GameEngine();
  } else {
    console.log('GameEngine already exists, restarting...');
    gameEngine.stop();
    gameEngine = new GameEngine();
  }
};

// Debug function to check game state
window.debugGame = () => {
  if (!gameEngine) {
    console.log('❌ GameEngine not initialized');
    return;
  }
  
  console.log('🎮 GameEngine Debug Info:');
  console.log('- Scene objects:', gameEngine.scene ? gameEngine.scene.children.length : 'No scene');
  console.log('- Players:', gameEngine.players ? gameEngine.players.length : 'No players');
  console.log('- Cameras:', gameEngine.cameras ? gameEngine.cameras.length : 'No cameras');
  console.log('- Renderer:', gameEngine.renderer ? 'Present' : 'Missing');
  console.log('- Running:', gameEngine.isRunning);
  
  if (gameEngine.players && gameEngine.players.length > 0) {
    const p1 = gameEngine.players[0];
    console.log('- Player 1 position:', p1.mesh.position);
    console.log('- Player 1 throttle:', p1.throttlePower);
  }
};

// Make it available globally for debugging
window.gameEngine = gameEngine;