//File name and path: objects/control-systems.js
//File role: Input handling and control schemes for all players

class ControlSystems {
  constructor() {
    this.players = [];
    this.controlSchemes = {};
    this.gamepadSupport = false;
    this.keyStates = {};
    
    console.log('ControlSystems initialized');
    this.setupControlSchemes();
    this.setupEventListeners();
    this.checkGamepadSupport();
  }

  /*--------------------
    CONTROL SCHEMES
  --------------------*/

  setupControlSchemes() {
    // Player 1: WASD + E/R/T/Q
    this.controlSchemes.player1 = {
      type: 'keyboard',
      layout: 'wasd',
      keys: {
        'KeyW': 'noseDown',
        'KeyS': 'noseUp', 
        'KeyA': 'turnLeft',
        'KeyD': 'turnRight',
        'KeyE': 'throttle',
        'KeyR': 'fireGun',
        'KeyT': 'dropBomb',
        'KeyQ': 'hangar'
      }
    };

    // Player 2: Arrow keys + Numpad
    this.controlSchemes.player2 = {
      type: 'keyboard',
      layout: 'arrows',
      keys: {
        'ArrowUp': 'noseDown',
        'ArrowDown': 'noseUp',
        'ArrowLeft': 'turnLeft', 
        'ArrowRight': 'turnRight',
        'Numpad0': 'throttle',
        'Numpad1': 'fireGun',
        'Numpad2': 'dropBomb',
        'Numpad3': 'hangar'
      }
    };

    // Player 3: Gamepad 1
    this.controlSchemes.player3 = {
      type: 'gamepad',
      gamepadIndex: 0,
      buttons: {
        0: 'fireGun',      // A button
        1: 'dropBomb',     // B button  
        2: 'hangar',       // X button
        3: 'throttle'      // Y button
      },
      axes: {
        0: 'turn',         // Left stick X
        1: 'pitch',        // Left stick Y
        2: 'throttle'      // Right trigger
      }
    };

    // Player 4: Gamepad 2
    this.controlSchemes.player4 = {
      type: 'gamepad',
      gamepadIndex: 1,
      buttons: {
        0: 'fireGun',
        1: 'dropBomb', 
        2: 'hangar',
        3: 'throttle'
      },
      axes: {
        0: 'turn',
        1: 'pitch', 
        2: 'throttle'
      }
    };

    console.log('Control schemes configured');
  }

  /*--------------------
    PLAYER REGISTRATION
  --------------------*/

  registerPlayer(playerId, controlScheme) {
    this.players[playerId] = {
      id: playerId,
      scheme: controlScheme || `player${playerId + 1}`,
      controls: {
        noseDown: false,
        noseUp: false,
        turnLeft: false,
        turnRight: false,
        throttle: false,
        fireGun: false,
        dropBomb: false,
        hangar: false
      },
      // Analog values for gamepad
      analog: {
        turn: 0,        // -1 to 1
        pitch: 0,       // -1 to 1  
        throttle: 0     // 0 to 1
      }
    };

    console.log(`Player ${playerId} registered with scheme: ${this.players[playerId].scheme}`);
    return this.players[playerId];
  }

  /*--------------------
    EVENT LISTENERS
  --------------------*/

  setupEventListeners() {
    // Keyboard events
    document.addEventListener('keydown', (event) => {
      this.handleKeyDown(event);
    });

    document.addEventListener('keyup', (event) => {
      this.handleKeyUp(event);
    });

    // Gamepad events (if supported)
    window.addEventListener('gamepadconnected', (event) => {
      console.log(`Gamepad connected: ${event.gamepad.id}`);
      this.gamepadSupport = true;
    });

    window.addEventListener('gamepaddisconnected', (event) => {
      console.log(`Gamepad disconnected: ${event.gamepad.id}`);
    });

    console.log('Event listeners set up');
  }

  /*--------------------
    KEYBOARD HANDLING
  --------------------*/

  handleKeyDown(event) {
    event.preventDefault();
    
    // Find which player(s) use this key
    this.players.forEach(player => {
      if (!player) return;
      
      const scheme = this.controlSchemes[player.scheme];
      if (scheme && scheme.type === 'keyboard') {
        const action = scheme.keys[event.code];
        if (action) {
          player.controls[action] = true;
          console.log(`Player ${player.id}: ${action} ON`);
        }
      }
    });
  }

  handleKeyUp(event) {
    event.preventDefault();
    
    // Find which player(s) use this key
    this.players.forEach(player => {
      if (!player) return;
      
      const scheme = this.controlSchemes[player.scheme];
      if (scheme && scheme.type === 'keyboard') {
        const action = scheme.keys[event.code];
        if (action) {
          player.controls[action] = false;
        }
      }
    });
  }

  /*--------------------
    GAMEPAD HANDLING
  --------------------*/

  checkGamepadSupport() {
    this.gamepadSupport = 'getGamepads' in navigator;
    if (this.gamepadSupport) {
      console.log('Gamepad support available');
    } else {
      console.log('Gamepad support not available');
    }
  }

  updateGamepads() {
    if (!this.gamepadSupport) return;

    const gamepads = navigator.getGamepads();
    
    this.players.forEach(player => {
      if (!player) return;
      
      const scheme = this.controlSchemes[player.scheme];
      if (scheme && scheme.type === 'gamepad') {
        const gamepad = gamepads[scheme.gamepadIndex];
        if (gamepad) {
          this.updateGamepadInput(player, gamepad, scheme);
        }
      }
    });
  }

  updateGamepadInput(player, gamepad, scheme) {
    // Handle buttons
    Object.keys(scheme.buttons).forEach(buttonIndex => {
      const action = scheme.buttons[buttonIndex];
      const button = gamepad.buttons[buttonIndex];
      
      if (button) {
        player.controls[action] = button.pressed;
      }
    });

    // Handle analog axes
    Object.keys(scheme.axes).forEach(axisIndex => {
      const control = scheme.axes[axisIndex];
      const value = gamepad.axes[axisIndex];
      
      if (control === 'turn') {
        player.analog.turn = value;
        // Convert to digital controls
        player.controls.turnLeft = value < -0.3;
        player.controls.turnRight = value > 0.3;
      } else if (control === 'pitch') {
        player.analog.pitch = value;
        // Convert to digital controls  
        player.controls.noseDown = value < -0.3;
        player.controls.noseUp = value > 0.3;
      } else if (control === 'throttle') {
        player.analog.throttle = (value + 1) / 2; // Convert -1,1 to 0,1
        player.controls.throttle = player.analog.throttle > 0.1;
      }
    });
  }

  /*--------------------
    PUBLIC API
  --------------------*/

  // Get controls for specific player
  getPlayerControls(playerId) {
    return this.players[playerId] ? this.players[playerId].controls : null;
  }

  // Get analog values for specific player (useful for smooth gamepad control)
  getPlayerAnalog(playerId) {
    return this.players[playerId] ? this.players[playerId].analog : null;
  }

  // Update all inputs (call this every frame)
  update() {
    this.updateGamepads();
  }

  /*--------------------
    CUSTOMIZATION
  --------------------*/

  // Change control scheme for a player
  setPlayerControlScheme(playerId, schemeName) {
    if (this.players[playerId] && this.controlSchemes[schemeName]) {
      this.players[playerId].scheme = schemeName;
      console.log(`Player ${playerId} control scheme changed to: ${schemeName}`);
      return true;
    }
    return false;
  }

  // Add custom control scheme
  addControlScheme(name, scheme) {
    this.controlSchemes[name] = scheme;
    console.log(`Added custom control scheme: ${name}`);
  }

  // Remap a key for a player
  remapKey(playerId, oldKey, newKey) {
    const player = this.players[playerId];
    if (!player) return false;
    
    const scheme = this.controlSchemes[player.scheme];
    if (scheme && scheme.type === 'keyboard') {
      const action = scheme.keys[oldKey];
      if (action) {
        delete scheme.keys[oldKey];
        scheme.keys[newKey] = action;
        console.log(`Player ${playerId}: Remapped ${oldKey} to ${newKey} for ${action}`);
        return true;
      }
    }
    return false;
  }

  /*--------------------
    DEBUG & INFO
  --------------------*/

  getControlsDebugInfo() {
    const info = {};
    this.players.forEach((player, index) => {
      if (player) {
        info[`Player ${index}`] = {
          scheme: player.scheme,
          controls: player.controls,
          analog: player.analog
        };
      }
    });
    return info;
  }

  logControlSchemes() {
    console.log('Available control schemes:', Object.keys(this.controlSchemes));
    console.log('Active players:', this.players.filter(p => p).length);
  }
}

// Export for use in game engine
window.ControlSystems = ControlSystems;