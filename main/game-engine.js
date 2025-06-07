//File name and path: main/game-engine.js
//File role: Main game engine with 4-player split screen

class GameEngine {
  constructor() {
    this.scene = null;
    this.renderer = null;
    this.cameras = [];
    this.players = [];
    this.worldBounds = {
      x: 5000,  // Half of 10,000
      z: 5000,  // Half of 10,000  
      y: 700    // Height limit
    };
    
    this.isRunning = false;
    this.clock = new THREE.Clock();
    this.frameCount = 0;
    
    console.log('GameEngine initialized');
    this.init();
  }

  init() {
    this.setupRenderer();
    this.setupScene();
    this.setupLighting();
    this.setupWorld();
    this.setupPlayers();
    this.setupCameras();
    this.setupControls();
    this.setupUI();
    this.start();
  }

  /*--------------------
    RENDERER SETUP
  --------------------*/

  setupRenderer() {
    const canvas = document.getElementById('game-canvas');
    
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
    const startPositions = [
      { x: -500, y: 100, z: -500 },
      { x: 500, y: 100, z: -500 },
      { x: -500, y: 100, z: 500 },
      { x: 500, y: 100, z: 500 }
    ];

    for (let i = 0; i < 4; i++) {
      const player = this.createPlayer(i, playerColors[i], startPositions[i]);
      this.players.push(player);
      this.scene.add(player.mesh);
    }

    console.log('Players setup complete');
  }

  createPlayer(id, color, position) {
    // Simple cube for now (will be aircraft later)
    const geometry = new THREE.BoxGeometry(50, 20, 100);
    const material = new THREE.MeshLambertMaterial({ color: color });
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.set(position.x, position.y, position.z);
    mesh.castShadow = true;
    
    return {
      id: id,
      mesh: mesh,
      velocity: new THREE.Vector3(0, 0, 0),
      isActive: id === 0, // Only player 1 active for now
      controls: {
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false,
        down: false
      }
    };
  }

  /*--------------------
    CAMERAS SETUP
  --------------------*/

  setupCameras() {
    const aspect = (window.innerWidth / 2) / (window.innerHeight / 2); // Split screen aspect ratio
    
    for (let i = 0; i < 4; i++) {
      const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 10000);
      this.cameras.push(camera);
    }

    this.updateCameras();
    console.log('Cameras setup complete');
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
    CONTROLS SETUP
  --------------------*/

  setupControls() {
    // Player 1 controls (WASD)
    Mousetrap.bind('w', () => { this.players[0].controls.forward = true; });
    Mousetrap.bind('s', () => { this.players[0].controls.backward = true; });
    Mousetrap.bind('a', () => { this.players[0].controls.left = true; });
    Mousetrap.bind('d', () => { this.players[0].controls.right = true; });
    Mousetrap.bind('space', () => { this.players[0].controls.up = true; });
    Mousetrap.bind('shift', () => { this.players[0].controls.down = true; });

    // Key release events
    document.addEventListener('keyup', (event) => {
      const player = this.players[0];
      switch(event.code) {
        case 'KeyW': player.controls.forward = false; break;
        case 'KeyS': player.controls.backward = false; break;
        case 'KeyA': player.controls.left = false; break;
        case 'KeyD': player.controls.right = false; break;
        case 'Space': player.controls.up = false; break;
        case 'ShiftLeft': player.controls.down = false; break;
      }
    });

    console.log('Controls setup complete');
  }

  /*--------------------
    UI SETUP
  --------------------*/

  setupUI() {
    // Exit button
    document.getElementById('exit-game').addEventListener('click', () => {
      this.stop();
      // Return to main menu (you'll need to implement this)
      window.history.back();
    });

    // Window resize handling
    window.addEventListener('resize', () => {
      this.onWindowResize();
    });

    console.log('UI setup complete');
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
    
    this.updatePlayers(deltaTime);
    this.updateCameras();
    this.updateUI();
    this.render();
    
    requestAnimationFrame(() => this.gameLoop());
  }

  updatePlayers(deltaTime) {
    this.players.forEach(player => {
      if (!player.isActive) return;

      const speed = 300; // Units per second
      const moveDistance = speed * deltaTime;

      // Apply controls
      if (player.controls.forward) player.velocity.z += moveDistance;
      if (player.controls.backward) player.velocity.z -= moveDistance;
      if (player.controls.left) player.velocity.x -= moveDistance;
      if (player.controls.right) player.velocity.x += moveDistance;
      if (player.controls.up) player.velocity.y += moveDistance;
      if (player.controls.down) player.velocity.y -= moveDistance;

      // Apply drag
      player.velocity.multiplyScalar(0.9);

      // Update position
      player.mesh.position.add(player.velocity.clone().multiplyScalar(deltaTime));

      // Apply world boundaries
      this.applyBoundaries(player);
    });
  }

  applyBoundaries(player) {
    const pos = player.mesh.position;
    
    // X boundaries
    if (pos.x > this.worldBounds.x) {
      pos.x = this.worldBounds.x;
      player.velocity.x = 0;
    }
    if (pos.x < -this.worldBounds.x) {
      pos.x = -this.worldBounds.x;
      player.velocity.x = 0;
    }
    
    // Z boundaries
    if (pos.z > this.worldBounds.z) {
      pos.z = this.worldBounds.z;
      player.velocity.z = 0;
    }
    if (pos.z < -this.worldBounds.z) {
      pos.z = -this.worldBounds.z;
      player.velocity.z = 0;
    }
    
    // Y boundaries
    if (pos.y > this.worldBounds.y) {
      pos.y = this.worldBounds.y;
      player.velocity.y = 0;
    }
    if (pos.y < 10) { // Ground level
      pos.y = 10;
      player.velocity.y = 0;
    }
  }

  updateUI() {
    // FPS counter
    this.frameCount++;
    if (this.frameCount % 60 === 0) { // Update every 60 frames
      const fps = Math.round(1 / this.clock.getDelta());
      document.getElementById('fps-counter').textContent = fps;
    }

    // Player position
    const player1 = this.players[0];
    const pos = player1.mesh.position;
    document.getElementById('player-pos').textContent = 
      `${Math.round(pos.x)}, ${Math.round(pos.y)}, ${Math.round(pos.z)}`;
  }

  render() {
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
      this.renderer.setViewport(viewport.x, viewport.y, viewport.width, viewport.height);
      this.renderer.setScissor(viewport.x, viewport.y, viewport.width, viewport.height);
      this.renderer.setScissorTest(true);
      
      this.renderer.render(this.scene, this.cameras[index]);
    });
  }
}

/*--------------------
  INITIALIZATION
--------------------*/

let gameEngine = null;

// Function to be called by navigation system
window.initializeGame = () => {
  if (!gameEngine) {
    console.log('Starting game engine...');
    gameEngine = new GameEngine();
  }
};

// Make it available globally for debugging
window.gameEngine = gameEngine;