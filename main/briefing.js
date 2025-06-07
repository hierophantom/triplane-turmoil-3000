//File name and path: main/briefing.js
//File role: Briefing Room keyboard navigation and interactions

class BriefingRoomController {
  constructor() {
    this.focusableElements = [];
    this.currentFocusIndex = 0;
    this.isActive = false;
    
    console.log('BriefingRoomController initialized'); // Debug
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
    console.log('Setting up BriefingRoomController'); // Debug
    this.addFocusStyles();
    this.buildFocusableElementsList();
    this.setupKeyboardBindings();
  }

  buildFocusableElementsList() {
    console.log('Building focusable elements list'); // Debug
    this.focusableElements = [];
    
    // Get all player quadrants in order (Yellow, Red, Green, Blue)
    const playerQuadrants = document.querySelectorAll('.player-quadrant');
    console.log('Found player quadrants:', playerQuadrants.length); // Debug
    
    // Process each quadrant
    playerQuadrants.forEach((quadrant, quadrantIndex) => {
      const playerColors = ['yellow', 'red', 'green', 'blue'];
      const color = playerColors[quadrantIndex];
      
      console.log(`Processing ${color} quadrant`); // Debug
      
      // Add player type buttons as a group
      const buttonGroup = quadrant.querySelector('.button-group');
      if (buttonGroup) {
        this.focusableElements.push({
          element: buttonGroup,
          type: 'button-group',
          id: `${color}-player-type`,
          label: `${color} player type`,
          playerColor: color,
          currentIndex: this.getActiveButtonIndex(buttonGroup)
        });
        console.log(`Added button group: ${color}-player-type`); // Debug
      }
      
      // Add sliders
      const sliders = quadrant.querySelectorAll('input[type="range"]');
      sliders.forEach((slider, sliderIndex) => {
        const resources = ['ammo', 'bombs', 'gas'];
        this.focusableElements.push({
          element: slider,
          type: 'slider',
          id: slider.id,
          label: `${color} ${resources[sliderIndex]}`,
          playerColor: color,
          resource: resources[sliderIndex]
        });
        console.log(`Added slider: ${slider.id}`); // Debug
      });
    });
    
    // Add global settings
    const livesSlider = document.getElementById('number-of-lives');
    if (livesSlider) {
      this.focusableElements.push({
        element: livesSlider,
        type: 'slider',
        id: 'number-of-lives',
        label: 'Number of lives'
      });
      console.log('Added lives slider'); // Debug
    }
    
    const fightButton = document.querySelector('.fight-button');
    if (fightButton) {
      this.focusableElements.push({
        element: fightButton,
        type: 'action-button',
        id: 'fight-button',
        label: 'Fight!'
      });
      console.log('Added fight button'); // Debug
    }
    
    console.log('Total focusable elements:', this.focusableElements.length); // Debug
  }

  getActiveButtonIndex(buttonGroup) {
    const buttons = buttonGroup.querySelectorAll('.button');
    for (let i = 0; i < buttons.length; i++) {
      if (buttons[i].classList.contains('active')) {
        return i;
      }
    }
    return 0; // Default to first button
  }

  setupKeyboardBindings() {
    console.log('Setting up keyboard bindings'); // Debug
    
    // Navigation within briefing room
    Mousetrap.bind('up', (e) => {
      if (this.isActive) {
        console.log('Up pressed, navigating up'); // Debug
        e.preventDefault();
        this.navigateUp();
        return false;
      }
    });

    Mousetrap.bind('down', (e) => {
      if (this.isActive) {
        console.log('Down pressed, navigating down'); // Debug
        e.preventDefault();
        this.navigateDown();
        return false;
      }
    });

    // Direct control with left/right
    Mousetrap.bind('left', (e) => {
      if (this.isActive) {
        console.log('Left pressed, adjusting setting'); // Debug
        e.preventDefault();
        this.adjustCurrentSetting(-1);
        return false;
      }
    });

    Mousetrap.bind('right', (e) => {
      if (this.isActive) {
        console.log('Right pressed, adjusting setting'); // Debug
        e.preventDefault();
        this.adjustCurrentSetting(1);
        return false;
      }
    });

    // Enter to activate Fight button
    Mousetrap.bind('enter', (e) => {
      if (this.isActive) {
        console.log('Enter pressed'); // Debug
        e.preventDefault();
        this.handleEnter();
        return false;
      }
    });
  }

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
    console.log(`Setting focus to index ${index}`); // Debug
    
    // Remove previous focus
    if (this.focusableElements[this.currentFocusIndex]) {
      this.removeFocusFromElement(this.focusableElements[this.currentFocusIndex]);
    }
    
    this.currentFocusIndex = index;
    const current = this.focusableElements[this.currentFocusIndex];
    
    if (current) {
      console.log(`Focusing element:`, current.label); // Debug
      this.addFocusToElement(current);
      current.element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  addFocusToElement(item) {
    if (item.type === 'button-group') {
      // Highlight the entire button group
      item.element.classList.add('kb-focused');
      // Also highlight the currently active button
      const buttons = item.element.querySelectorAll('.button');
      if (buttons[item.currentIndex]) {
        buttons[item.currentIndex].classList.add('kb-focused-active');
      }
    } else {
      item.element.classList.add('kb-focused');
    }
  }

  removeFocusFromElement(item) {
    if (item.type === 'button-group') {
      item.element.classList.remove('kb-focused');
      const buttons = item.element.querySelectorAll('.button');
      buttons.forEach(btn => btn.classList.remove('kb-focused-active'));
    } else {
      item.element.classList.remove('kb-focused');
    }
  }

  adjustCurrentSetting(direction) {
    const current = this.focusableElements[this.currentFocusIndex];
    if (!current) {
      console.log('No current element to adjust'); // Debug
      return;
    }

    console.log(`Adjusting ${current.label} (type: ${current.type}) by ${direction}`); // Debug

    if (current.type === 'button-group') {
      this.adjustButtonGroup(current, direction);
    } else if (current.type === 'slider') {
      this.adjustSlider(current, direction);
    } else {
      console.log(`Cannot adjust element of type: ${current.type}`); // Debug
    }
  }

  adjustButtonGroup(item, direction) {
    const buttons = item.element.querySelectorAll('.button');
    const maxIndex = buttons.length - 1;
    
    // Remove focus from current button
    if (buttons[item.currentIndex]) {
      buttons[item.currentIndex].classList.remove('kb-focused-active');
    }
    
    // Calculate new index
    let newIndex = item.currentIndex + direction;
    if (newIndex < 0) newIndex = maxIndex;
    if (newIndex > maxIndex) newIndex = 0;
    
    // Update active states
    buttons.forEach(btn => btn.classList.remove('active'));
    buttons[newIndex].classList.add('active');
    buttons[newIndex].classList.add('kb-focused-active');
    
    // Update stored index
    item.currentIndex = newIndex;
    
    console.log(`Button group switched to index ${newIndex}`); // Debug
  }

  adjustSlider(item, direction) {
    const slider = item.element;
    const currentValue = parseInt(slider.value);
    const min = parseInt(slider.min);
    const max = parseInt(slider.max);
    const step = 5; // Adjust by 5 each time
    
    let newValue = currentValue + (direction * step);
    newValue = Math.max(min, Math.min(max, newValue));
    
    slider.value = newValue;
    console.log(`Slider ${item.label} adjusted to: ${newValue}`); // Debug
    
    // Trigger any change events
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  }

  handleEnter() {
    const current = this.focusableElements[this.currentFocusIndex];
    if (!current) return;

    console.log(`Enter pressed on:`, current.label); // Debug

    if (current.type === 'action-button') {
      console.log('Triggering action button'); // Debug
      current.element.click();
    }
    // For other elements, Enter does nothing in this simplified version
  }

  activate() {
    console.log('Activating BriefingRoomController'); // Debug
    this.isActive = true;
    this.currentFocusIndex = 0;
    
    // Rebuild elements list in case DOM changed
    this.buildFocusableElementsList();
    
    // Set initial focus
    if (this.focusableElements.length > 0) {
      this.setFocus(0);
    }
  }

  deactivate() {
    console.log('Deactivating BriefingRoomController'); // Debug
    this.isActive = false;
    
    // Remove all focus indicators
    this.focusableElements.forEach(item => {
      if (item && item.element) {
        this.removeFocusFromElement(item);
      }
    });
  }

  addFocusStyles() {
    if (!document.getElementById('briefing-focus-styles')) {
      console.log('Adding focus styles'); // Debug
      const style = document.createElement('style');
      style.id = 'briefing-focus-styles';
      style.textContent = `
        .kb-focused {
          outline: 3px solid #FFD700 !important;
          outline-offset: 3px !important;
          box-shadow: 0 0 10px rgba(255, 215, 0, 0.8) !important;
          background-color: rgba(255, 215, 0, 0.1) !important;
        }
        
        .kb-focused-active {
          outline: 3px solid #00FF00 !important;
          outline-offset: 3px !important;
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.8) !important;
          background-color: rgba(0, 255, 0, 0.1) !important;
          transform: scale(1.05);
          transition: transform 0.2s ease;
        }
        
        .button-group.kb-focused {
          background-color: rgba(255, 215, 0, 0.05) !important;
          border-radius: 4px;
          padding: 2px;
        }
        
        input[type="range"].kb-focused {
          transform: scale(1.05);
          transition: transform 0.2s ease;
        }
        
        .fight-button.kb-focused {
          transform: scale(1.1);
          transition: transform 0.2s ease;
        }
      `;
      document.head.appendChild(style);
    }
  }
}

// Export for use in main.js
window.BriefingRoomController = BriefingRoomController;