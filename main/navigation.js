//File name and path: main/navigation.js
//File role: Clean screen navigation system

class NavigationController {
  constructor() {
    this.currentScreen = 'main-menu';
    this.currentMode = 'navigation'; // 'navigation' or 'editing'
    this.focusableElements = [];
    this.currentFocusIndex = 0;
    
    console.log('NavigationController initialized');
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.setupKeyboardBindings();
    this.setupClickHandlers();
    this.activateScreen('main-menu');
  }

  /*--------------------
    SCREEN MANAGEMENT
  --------------------*/

  activateScreen(screenId) {
    console.log(`Activating screen: ${screenId}`);
    
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });
   
    // Special handling for game screen
    if (screenId === 'game' && typeof window.initializeGame === 'function') {
      window.initializeGame();
    }
    
    // Show target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.classList.add('active');
      this.currentScreen = screenId;
      
      // Reset navigation state
      this.currentMode = 'navigation';
      this.buildFocusableElements();
      this.setFocus(0);
    }
  }

  /*--------------------
    FOCUSABLE ELEMENTS
  --------------------*/

  buildFocusableElements() {
    this.focusableElements = [];
    const activeScreen = document.getElementById(this.currentScreen);
    
    if (!activeScreen) return;

    // Get all focusable elements in order
    const focusable = activeScreen.querySelectorAll('.focusable');
    
    focusable.forEach((element, index) => {
      this.focusableElements.push({
        element: element,
        index: index,
        type: this.getElementType(element),
        screen: this.currentScreen
      });
    });

    console.log(`Built ${this.focusableElements.length} focusable elements for ${this.currentScreen}`);
  }

  getElementType(element) {
    if (element.classList.contains('menu-item')) return 'menu-item';
    if (element.classList.contains('button') && element.dataset.action === 'exit') return 'exit-btn';
    if (element.classList.contains('launch-btn')) return 'action-btn';
    if (element.classList.contains('button-group')) return 'button-group';
    if (element.tagName === 'INPUT' && element.type === 'text') return 'text-input';
    if (element.tagName === 'INPUT' && element.type === 'range') return 'slider';
    return 'button';
  }

  /*--------------------
    NAVIGATION
  --------------------*/

  navigateUp() {
    if (this.currentFocusIndex > 0) {
      this.setFocus(this.currentFocusIndex - 1);
    }
  }

  navigateDown() {
    if (this.currentFocusIndex < this.focusableElements.length - 1) {
      this.setFocus(this.currentFocusIndex + 1);
    }
  }

  setFocus(index) {
    // Remove old focus
    if (this.focusableElements[this.currentFocusIndex]) {
      this.removeFocus(this.focusableElements[this.currentFocusIndex]);
    }

    // Set new focus
    this.currentFocusIndex = index;
    const current = this.focusableElements[this.currentFocusIndex];
    
    if (current) {
      this.addFocus(current);
      current.element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      console.log(`Focused: ${current.type} (${index})`);
    }
  }

  addFocus(item) {
    item.element.classList.add('kb-focused');
    
    // Special handling for button groups
    if (item.type === 'button-group') {
      const activeBtn = item.element.querySelector('.button.active');
      if (activeBtn) {
        activeBtn.classList.add('kb-focused-active');
      }
    }
  }

  removeFocus(item) {
    item.element.classList.remove('kb-focused');
    
    // Special handling for button groups
    if (item.type === 'button-group') {
      const buttons = item.element.querySelectorAll('.button');
      buttons.forEach(btn => btn.classList.remove('kb-focused-active'));
    }
  }

  /*--------------------
    INTERACTIONS
  --------------------*/

  handleEnter() {
    const current = this.focusableElements[this.currentFocusIndex];
    if (!current) return;

    console.log(`Enter pressed on: ${current.type}`);

    switch (current.type) {
      case 'menu-item':
        this.handleMenuItemActivation(current.element);
        break;
      case 'exit-btn':
        this.handleExit();
        break;
      case 'action-btn':
        this.handleActionButton(current.element);
        break;
      case 'text-input':
        this.enterEditMode(current);
        break;
      case 'launch-game':
        console.log('Launching game!');
        this.activateScreen('game'); // ← Change this line
        break;
      default:
        // For other elements, just trigger click
        current.element.click();
    }
  }

  handleMenuItemActivation(element) {
    const action = element.dataset.action;
    
    switch (action) {
      case 'start-game':
        this.activateScreen('start-game');
        break;
      case 'configurations':
        this.activateScreen('configurations');
        break;
      default:
        console.log(`Unknown menu action: ${action}`);
    }
  }

  handleExit() {
    // Always return to main menu
    this.activateScreen('main-menu');
  }

  handleActionButton(element) {
    const id = element.id;
    
    switch (id) {
      case 'launch-game':
        console.log('Launching game!');
        // TODO: Launch actual game
        break;
      default:
        element.click();
    }
  }

  handleLeftRight(direction) {
    const current = this.focusableElements[this.currentFocusIndex];
    if (!current) return;

    console.log(`${direction > 0 ? 'Right' : 'Left'} pressed on: ${current.type}`);

    switch (current.type) {
      case 'button-group':
        this.adjustButtonGroup(current.element, direction);
        break;
      case 'slider':
        this.adjustSlider(current.element, direction);
        break;
    }
  }

  adjustButtonGroup(buttonGroup, direction) {
    const buttons = buttonGroup.querySelectorAll('.button');
    const activeButton = buttonGroup.querySelector('.button.active');
    
    if (!activeButton || buttons.length === 0) return;

    let currentIndex = Array.from(buttons).indexOf(activeButton);
    let newIndex = currentIndex + direction;
    
    // Wrap around
    if (newIndex < 0) newIndex = buttons.length - 1;
    if (newIndex >= buttons.length) newIndex = 0;

    // Update buttons
    buttons.forEach(btn => btn.classList.remove('active', 'kb-focused-active'));
    buttons[newIndex].classList.add('active', 'kb-focused-active');

    console.log(`Button group changed to index ${newIndex}`);
  }

  adjustSlider(slider, direction) {
    const current = parseInt(slider.value);
    const min = parseInt(slider.min);
    const max = parseInt(slider.max);
    const step = 5;

    let newValue = current + (direction * step);
    newValue = Math.max(min, Math.min(max, newValue));

    slider.value = newValue;
    slider.dispatchEvent(new Event('input', { bubbles: true }));

    console.log(`Slider adjusted to ${newValue}`);
  }

  /*--------------------
    EDIT MODE (for text inputs)
  --------------------*/

  enterEditMode(item) {
    this.currentMode = 'editing';
    item.element.classList.add('kb-editing');
    item.element.focus();
    
    console.log('Entered edit mode');
  }

  exitEditMode() {
    const current = this.focusableElements[this.currentFocusIndex];
    if (current && current.element) {
      current.element.classList.remove('kb-editing');
      current.element.blur();
    }
    
    this.currentMode = 'navigation';
    console.log('Exited edit mode');
  }

  /*--------------------
    KEYBOARD BINDINGS
  --------------------*/

  setupKeyboardBindings() {
    console.log('Setting up keyboard bindings');

    Mousetrap.bind('up', (e) => {
      if (this.currentMode === 'navigation') {
        e.preventDefault();
        this.navigateUp();
        return false;
      }
    });

    Mousetrap.bind('down', (e) => {
      if (this.currentMode === 'navigation') {
        e.preventDefault();
        this.navigateDown();
        return false;
      }
    });

    Mousetrap.bind('left', (e) => {
      if (this.currentMode === 'navigation') {
        e.preventDefault();
        this.handleLeftRight(-1);
        return false;
      }
    });

    Mousetrap.bind('right', (e) => {
      if (this.currentMode === 'navigation') {
        e.preventDefault();
        this.handleLeftRight(1);
        return false;
      }
    });

    Mousetrap.bind('enter', (e) => {
      e.preventDefault();
      if (this.currentMode === 'editing') {
        this.exitEditMode();
      } else {
        this.handleEnter();
      }
      return false;
    });

    Mousetrap.bind('escape', (e) => {
      e.preventDefault();
      if (this.currentMode === 'editing') {
        this.exitEditMode();
      } else if (this.currentScreen !== 'main-menu') {
        this.handleExit();
      }
      return false;
    });
  }

  /*--------------------
    CLICK HANDLERS
  --------------------*/

  setupClickHandlers() {
    // Menu items
    document.addEventListener('click', (e) => {
      if (e.target.closest('.menu-item')) {
        const menuItem = e.target.closest('.menu-item');
        this.handleMenuItemActivation(menuItem);
      }
    });

    // Exit buttons
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="exit"]')) {
        this.handleExit();
      }
    });

    // Button groups
    document.addEventListener('click', (e) => {
      if (e.target.matches('.button-group .button')) {
        const buttonGroup = e.target.closest('.button-group');
        const buttons = buttonGroup.querySelectorAll('.button');
        
        buttons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
      }
    });
  }
}

// Export for main.js
window.NavigationController = NavigationController;