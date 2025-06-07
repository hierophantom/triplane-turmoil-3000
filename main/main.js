//File name and path: main/main.js
//File role: Main application controller

/*--------------------
  GLOBAL STATE
--------------------*/
let navigationController = null;
let saveStateService = null;

/*--------------------
  SAVE STATE SERVICE
--------------------*/
class SaveStateService {
  constructor() {
    this.storageKey = 'triplane-turmoil-settings';
    this.autoSaveDelay = 500;
    this.saveTimeout = null;
    
    console.log('SaveStateService initialized');
  }

  getCurrentState() {
    const state = {
      players: {},
      gameSettings: {},
      timestamp: Date.now()
    };

    // Get player settings (1-4)
    for (let i = 1; i <= 4; i++) {
      const playerCard = document.querySelector(`[data-player="${i}"]`);
      if (playerCard) {
        const colors = ['', 'yellow', 'red', 'green', 'blue'];
        const color = colors[i];
        
        state.players[color] = {
          name: this.getPlayerName(playerCard),
          control: this.getPlayerControl(playerCard),
          plane: this.getPlayerPlane(playerCard)
        };
      }
    }

    // Get game settings
    state.gameSettings = {
      mapType: this.getSelectedValue('[data-control="map-type"]'),
      lives: this.getSliderValue('[data-setting="lives"]'),
      duration: this.getSelectedValue('[data-control="duration"]')
    };

    return state;
  }

  getPlayerName(playerCard) {
    const nameInput = playerCard.querySelector('.player-name');
    return nameInput ? nameInput.value : '';
  }

  getPlayerControl(playerCard) {
    const activeBtn = playerCard.querySelector('[data-control="player-type"] .control-btn.active');
    return activeBtn ? activeBtn.dataset.value : 'human';
  }

  getPlayerPlane(playerCard) {
    const activeBtn = playerCard.querySelector('[data-control="plane-type"] .control-btn.active');
    return activeBtn ? activeBtn.dataset.value : 'fighter';
  }

  getSelectedValue(selector) {
    const activeBtn = document.querySelector(`${selector} .control-btn.active`);
    return activeBtn ? activeBtn.dataset.value : null;
  }

  getSliderValue(selector) {
    const slider = document.querySelector(selector);
    return slider ? parseInt(slider.value) : 50;
  }

  saveState() {
    try {
      const state = this.getCurrentState();
      localStorage.setItem(this.storageKey, JSON.stringify(state));
      console.log('State saved:', state);
      return true;
    } catch (error) {
      console.error('Failed to save state:', error);
      return false;
    }
  }

  loadState() {
    try {
      const stateJson = localStorage.getItem(this.storageKey);
      if (!stateJson) {
        console.log('No saved state found');
        return null;
      }

      const state = JSON.parse(stateJson);
      console.log('Loading saved state:', state);
      
      this.applyState(state);
      return state;
    } catch (error) {
      console.error('Failed to load state:', error);
      return null;
    }
  }

  applyState(state) {
    if (!state) return;

    // Apply player settings
    Object.keys(state.players).forEach((color, index) => {
      const playerData = state.players[color];
      const playerCard = document.querySelector(`[data-player="${index + 1}"]`);
      
      if (playerCard && playerData) {
        // Set player name
        const nameInput = playerCard.querySelector('.player-name');
        if (nameInput && playerData.name) {
          nameInput.value = playerData.name;
        }
        
        // Set player control
        this.setButtonGroupValue(playerCard, '[data-control="player-type"]', playerData.control);
        
        // Set plane type
        this.setButtonGroupValue(playerCard, '[data-control="plane-type"]', playerData.plane);
      }
    });

    // Apply game settings
    if (state.gameSettings) {
      this.setButtonGroupValue(document, '[data-control="map-type"]', state.gameSettings.mapType);
      this.setButtonGroupValue(document, '[data-control="duration"]', state.gameSettings.duration);
      
      const livesSlider = document.querySelector('[data-setting="lives"]');
      if (livesSlider && state.gameSettings.lives) {
        livesSlider.value = state.gameSettings.lives;
      }
    }

    console.log('State applied successfully');
  }

  setButtonGroupValue(container, selector, value) {
    const buttonGroup = container.querySelector(selector);
    if (buttonGroup && value) {
      const buttons = buttonGroup.querySelectorAll('.control-btn');
      buttons.forEach(btn => btn.classList.remove('active'));
      
      const targetBtn = buttonGroup.querySelector(`[data-value="${value}"]`);
      if (targetBtn) {
        targetBtn.classList.add('active');
      }
    }
  }

  scheduleAutoSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(() => {
      this.saveState();
    }, this.autoSaveDelay);
  }

  setupAutoSave() {
    // Listen for input changes
    document.addEventListener('input', (e) => {
      if (e.target.matches('.player-name, .setting-slider')) {
        console.log('Input changed, scheduling auto-save');
        this.scheduleAutoSave();
      }
    });

    // Listen for button clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('.control-btn')) {
        console.log('Button changed, scheduling auto-save');
        this.scheduleAutoSave();
      }
    });

    // Listen for keyboard changes
    document.addEventListener('keyup', (e) => {
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        console.log('Keyboard setting change, scheduling auto-save');
        this.scheduleAutoSave();
      }
    });

    console.log('Auto-save listeners set up');
  }

  clearSavedState() {
    try {
      localStorage.removeItem(this.storageKey);
      console.log('Saved state cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear saved state:', error);
      return false;
    }
  }
}

/*--------------------
  MAIN INITIALIZATION
--------------------*/

document.addEventListener('DOMContentLoaded', () => {
  console.log('Main application initializing...');

  // Initialize services
  navigationController = new NavigationController();
  saveStateService = new SaveStateService();

  // Load saved state after a short delay to ensure DOM is ready
  setTimeout(() => {
    saveStateService.loadState();
    saveStateService.setupAutoSave();
  }, 100);

  /*--------------------
    GLOBAL FUNCTIONS (for debugging)
  --------------------*/
  
  window.saveGame = () => saveStateService.saveState();
  window.loadGame = () => saveStateService.loadState();
  window.clearSave = () => saveStateService.clearSavedState();
  window.goToScreen = (screenId) => navigationController.activateScreen(screenId);
  
  console.log('Available console commands: saveGame(), loadGame(), clearSave(), goToScreen("screen-id")');
  console.log('Main application initialized successfully');
});