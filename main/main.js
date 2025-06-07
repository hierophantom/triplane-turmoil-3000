//File name and path: main/main.js
//File role: Main frame JS works

/*--------------------
  GLOBAL STATE
--------------------*/
let currentMode = 'tabs'; // 'tabs' or 'briefing'
let briefingController = null;

/*--------------------
  SAVE STATE SERVICE
--------------------*/
class SaveStateService {
  constructor() {
    this.storageKey = 'triplane-turmoil-settings';
    this.autoSaveDelay = 500; // ms
    this.saveTimeout = null;
    
    console.log('SaveStateService initialized');
  }

  // Get current state of all briefing room settings
  getCurrentState() {
    const state = {
      players: {},
      globalSettings: {},
      timestamp: Date.now()
    };

    // Get player settings
    const playerColors = ['yellow', 'red', 'green', 'blue'];
    playerColors.forEach(color => {
      state.players[color] = {
        type: this.getPlayerType(color),
        ammo: this.getSliderValue(`${color}-ammo`),
        bombs: this.getSliderValue(`${color}-bombs`),
        gas: this.getSliderValue(`${color}-gas`)
      };
    });

    // Get global settings
    state.globalSettings = {
      lives: this.getSliderValue('number-of-lives')
    };

    return state;
  }

  getPlayerType(color) {
    const quadrants = document.querySelectorAll('.player-quadrant');
    const colorIndex = ['yellow', 'red', 'green', 'blue'].indexOf(color);
    
    if (quadrants[colorIndex]) {
      const activeButton = quadrants[colorIndex].querySelector('.button-group .button.active');
      if (activeButton) {
        const buttons = quadrants[colorIndex].querySelectorAll('.button-group .button');
        for (let i = 0; i < buttons.length; i++) {
          if (buttons[i] === activeButton) {
            return i; // 0=Human, 1=AI, 2=Off
          }
        }
      }
    }
    return 0; // Default to Human
  }

  getSliderValue(sliderId) {
    const slider = document.getElementById(sliderId);
    return slider ? parseInt(slider.value) : 50; // Default value
  }

  // Save state to localStorage
  saveState() {
    try {
      const state = this.getCurrentState();
      const stateJson = JSON.stringify(state);
      localStorage.setItem(this.storageKey, stateJson);
      console.log('State saved:', state);
      return true;
    } catch (error) {
      console.error('Failed to save state:', error);
      return false;
    }
  }

  // Load state from localStorage
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

  // Apply loaded state to the UI
  applyState(state) {
    if (!state) return;

    // Apply player settings
    Object.keys(state.players).forEach(color => {
      const playerData = state.players[color];
      
      // Set player type
      this.setPlayerType(color, playerData.type);
      
      // Set resource sliders
      this.setSliderValue(`${color}-ammo`, playerData.ammo);
      this.setSliderValue(`${color}-bombs`, playerData.bombs);
      this.setSliderValue(`${color}-gas`, playerData.gas);
    });

    // Apply global settings
    if (state.globalSettings) {
      this.setSliderValue('number-of-lives', state.globalSettings.lives);
    }

    console.log('State applied successfully');
  }

  setPlayerType(color, typeIndex) {
    const quadrants = document.querySelectorAll('.player-quadrant');
    const colorIndex = ['yellow', 'red', 'green', 'blue'].indexOf(color);
    
    if (quadrants[colorIndex]) {
      const buttons = quadrants[colorIndex].querySelectorAll('.button-group .button');
      if (buttons[typeIndex]) {
        // Remove active from all buttons
        buttons.forEach(btn => btn.classList.remove('active'));
        // Set active on the correct button
        buttons[typeIndex].classList.add('active');
      }
    }
  }

  setSliderValue(sliderId, value) {
    const slider = document.getElementById(sliderId);
    if (slider) {
      slider.value = value;
      // Trigger input event in case there are listeners
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  // Auto-save with debouncing (waits for user to stop making changes)
  scheduleAutoSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(() => {
      this.saveState();
    }, this.autoSaveDelay);
  }

  // Set up auto-save listeners
  setupAutoSave() {
    // Listen for button clicks (player type changes)
    document.addEventListener('click', (e) => {
      if (e.target.matches('.button-group .button')) {
        console.log('Player type changed, scheduling auto-save');
        this.scheduleAutoSave();
      }
    });

    // Listen for slider changes (resource/lives changes)
    document.addEventListener('input', (e) => {
      if (e.target.matches('input[type="range"]')) {
        console.log('Slider changed, scheduling auto-save');
        this.scheduleAutoSave();
      }
    });

    // Listen for keyboard changes (when using briefing controller)
    document.addEventListener('keyup', (e) => {
      if (currentMode === 'briefing' && ['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        console.log('Keyboard setting change, scheduling auto-save');
        this.scheduleAutoSave();
      }
    });

    console.log('Auto-save listeners set up');
  }

  // Manual save (could be triggered by a save button)
  manualSave() {
    const success = this.saveState();
    if (success) {
      // You could show a notification here
      console.log('Manual save completed');
    }
    return success;
  }

  // Clear saved state
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

  // Get save info (when was it last saved, etc.)
  getSaveInfo() {
    try {
      const stateJson = localStorage.getItem(this.storageKey);
      if (!stateJson) return null;
      
      const state = JSON.parse(stateJson);
      return {
        timestamp: state.timestamp,
        date: new Date(state.timestamp),
        playersConfigured: Object.keys(state.players).length,
        hasGlobalSettings: !!state.globalSettings
      };
    } catch (error) {
      console.error('Failed to get save info:', error);
      return null;
    }
  }
}

// Create global save service instance
let saveStateService = null;

/*--------------------
  MAIN CONTROLLER
--------------------*/

document.addEventListener('DOMContentLoaded', () => {
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const contents = document.querySelectorAll('.tab-content');
  const mainWrapper = document.getElementById('main-content');

  // Initialize services
  briefingController = new BriefingRoomController();
  saveStateService = new SaveStateService();
  
  console.log('Main controller initialized'); // Debug

  // Load saved state on startup
  saveStateService.loadState();
  
  // Set up auto-save
  saveStateService.setupAutoSave();

  // Helper: focus tab by index AND activate its content
  function focusTab(index) {
    if (index >= 0 && index < tabs.length) {
      const targetTab = tabs[index];
      targetTab.focus();

      // Deactivate all tab contents
      contents.forEach(section => section.classList.remove('active'));

      // Activate the content corresponding to the focused tab
      const targetId = targetTab.dataset.tab;
      document.getElementById(targetId).classList.add('active');
      
      console.log('Focused tab:', targetId); // Debug
    }
  }

  // Focus the first tab by default
  focusTab(0);

  // Find index of focused tab
  function currentTabIndex() {
    return tabs.findIndex(tab => tab === document.activeElement);
  }

  /*--------------------
    KEYBOARD BINDINGS
  --------------------*/

  // LEFT ARROW
  Mousetrap.bind('left', (e) => {
    console.log(`Left pressed in mode: ${currentMode}`); // Debug
    
    if (currentMode === 'tabs') {
      // Tab navigation
      const idx = currentTabIndex();
      if (idx > 0) {
        e.preventDefault();
        focusTab(idx - 1);
        return false;
      }
    } else if (currentMode === 'briefing') {
      // Briefing room control
      e.preventDefault();
      briefingController.adjustCurrentSetting(-1);
      return false;
    }
  });

  // RIGHT ARROW  
  Mousetrap.bind('right', (e) => {
    console.log(`Right pressed in mode: ${currentMode}`); // Debug
    
    if (currentMode === 'tabs') {
      // Tab navigation
      const idx = currentTabIndex();
      if (idx < tabs.length - 1) {
        e.preventDefault();
        focusTab(idx + 1);
        return false;
      }
    } else if (currentMode === 'briefing') {
      // Briefing room control
      e.preventDefault();
      briefingController.adjustCurrentSetting(1);
      return false;
    }
  });

  // DOWN ARROW
  Mousetrap.bind('down', (e) => {
    console.log(`Down pressed in mode: ${currentMode}`); // Debug
    
    if (currentMode === 'tabs') {
      // Check if we're on briefing room tab
      const activeContent = document.querySelector('.tab-content.active');
      if (activeContent && activeContent.id === 'briefing-room') {
        e.preventDefault();
        console.log('Switching to briefing mode'); // Debug
        currentMode = 'briefing';
        briefingController.activate();
        mainWrapper.focus();
        return false;
      }
    } else if (currentMode === 'briefing') {
      // Navigate down in briefing room
      e.preventDefault();
      briefingController.navigateDown();
      return false;
    }
  });

  // UP ARROW
  Mousetrap.bind('up', (e) => {
    console.log(`Up pressed in mode: ${currentMode}`); // Debug
    
    if (currentMode === 'briefing') {
      // Try to navigate up in briefing room
      if (briefingController.currentFocusIndex > 0) {
        e.preventDefault();
        briefingController.navigateUp();
        return false;
      } else {
        // If at top of briefing room, go back to tabs
        e.preventDefault();
        console.log('Switching back to tabs mode'); // Debug
        currentMode = 'tabs';
        briefingController.deactivate();
        
        // Focus the briefing room tab
        const briefingTab = tabs.find(tab => tab.dataset.tab === 'briefing-room');
        if (briefingTab) {
          briefingTab.focus();
        }
        return false;
      }
    } else if (currentMode === 'tabs') {
      // Move from main content back to tabs (if somehow in main content)
      if (document.activeElement === mainWrapper) {
        e.preventDefault();
        const activeContent = document.querySelector('.tab-content.active');
        if (activeContent) {
          const activeTabId = activeContent.id;
          const correspondingTab = tabs.find(tab => tab.dataset.tab === activeTabId);
          if (correspondingTab) {
            correspondingTab.focus();
          }
        }
        return false;
      }
    }
  });

  // ENTER
  Mousetrap.bind('enter', (e) => {
    console.log(`Enter pressed in mode: ${currentMode}`); // Debug
    
    if (currentMode === 'briefing') {
      e.preventDefault();
      briefingController.handleEnter();
      return false;
    }
  });

  /*--------------------
    CLICK HANDLERS
  --------------------*/
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const clickedTabIndex = tabs.findIndex(t => t === tab);
      currentMode = 'tabs'; // Reset to tab mode on click
      if (briefingController) {
        briefingController.deactivate();
      }
      focusTab(clickedTabIndex);
    });
  });

  /*--------------------
    GLOBAL FUNCTIONS (for console debugging)
  --------------------*/
  
  // Make save functions available globally for testing/debugging
  window.saveGame = () => saveStateService.manualSave();
  window.loadGame = () => saveStateService.loadState();
  window.clearSave = () => saveStateService.clearSavedState();
  window.getSaveInfo = () => saveStateService.getSaveInfo();
  
  console.log('Available console commands: saveGame(), loadGame(), clearSave(), getSaveInfo()');
});