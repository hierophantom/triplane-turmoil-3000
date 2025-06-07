//File name and path: main/briefing.js
//File role: Briefing Room keyboard navigation - simplified

class BriefingRoomController {
  constructor() {
    this.focusableElements = [];
    this.currentFocusIndex = 0;
    this.isActive = false;
    
    console.log('BriefingRoomController created'); // Debug
    this.setupStyles();
    this.buildElementsList();
  }

  buildElementsList() {
    this.focusableElements = [];
    
    // Get player quadrants in order
    const quadrants = document.querySelectorAll('.player-quadrant');
    console.log('Found quadrants:', quadrants.length); // Debug
    
    quadrants.forEach((quadrant, index) => {
      const colors = ['yellow', 'red', 'green', 'blue'];
      const color = colors[index];
      
      // Add button group
      const buttonGroup = quadrant.querySelector('.button-group');
      if (buttonGroup) {
        this.focusableElements.push({
          element: buttonGroup,
          type: 'buttons',
          color: color,
          getCurrentIndex: () => this.getActiveButtonIndex(buttonGroup),
          adjust: (dir) => this.adjustButtons(buttonGroup, dir)
        });
      }
      
      // Add sliders
      const sliders = quadrant.querySelectorAll('input[type="range"]');
      sliders.forEach(slider => {
        this.focusableElements.push({
          element: slider,
          type: 'slider',
          color: color,
          adjust: (dir) => this.adjustSlider(slider, dir)
        });
      });
    });
    
    // Add global elements
    const livesSlider = document.getElementById('number-of-lives');
    if (livesSlider) {
      this.focusableElements.push({
        element: livesSlider,
        type: 'slider',
        adjust: (dir) => this.adjustSlider(livesSlider, dir)
      });
    }
    
    const fightButton = document.querySelector('.fight-button');
    if (fightButton) {
      this.focusableElements.push({
        element: fightButton,
        type: 'button',
        adjust: () => fightButton.click()
      });
    }
    
    console.log('Built elements list, total:', this.focusableElements.length); // Debug
  }

  getActiveButtonIndex(buttonGroup) {
    const buttons = buttonGroup.querySelectorAll('.button');
    for (let i = 0; i < buttons.length; i++) {
      if (buttons[i].classList.contains('active')) {
        return i;
      }
    }
    return 0;
  }

  adjustButtons(buttonGroup, direction) {
    const buttons = buttonGroup.querySelectorAll('.button');
    const currentIndex = this.getActiveButtonIndex(buttonGroup);
    
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = buttons.length - 1;
    if (newIndex >= buttons.length) newIndex = 0;
    
    // Update buttons
    buttons.forEach(btn => btn.classList.remove('active'));
    buttons[newIndex].classList.add('active');
    
    console.log(`Button group changed to index ${newIndex}`); // Debug
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
    
    console.log(`Slider adjusted to ${newValue}`); // Debug
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
    // Remove old focus
    if (this.focusableElements[this.currentFocusIndex]) {
      this.removeFocus(this.focusableElements[this.currentFocusIndex]);
    }
    
    this.currentFocusIndex = index;
    const current = this.focusableElements[this.currentFocusIndex];
    
    if (current) {
      this.addFocus(current);
      current.element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      console.log(`Focused element ${index} (${current.type})`); // Debug
    }
  }

  addFocus(item) {
    item.element.classList.add('kb-focused');
    
    if (item.type === 'buttons') {
      const buttons = item.element.querySelectorAll('.button');
      const activeIndex = item.getCurrentIndex();
      if (buttons[activeIndex]) {
        buttons[activeIndex].classList.add('kb-focused-active');
      }
    }
  }

  removeFocus(item) {
    item.element.classList.remove('kb-focused');
    
    if (item.type === 'buttons') {
      const buttons = item.element.querySelectorAll('.button');
      buttons.forEach(btn => btn.classList.remove('kb-focused-active'));
    }
  }

  adjustCurrentSetting(direction) {
    const current = this.focusableElements[this.currentFocusIndex];
    if (current && current.adjust) {
      console.log(`Adjusting current setting by ${direction}`); // Debug
      current.adjust(direction);
    }
  }

  handleEnter() {
    const current = this.focusableElements[this.currentFocusIndex];
    if (current && current.type === 'button') {
      current.adjust(); // This will click the fight button
    }
  }

  activate() {
    console.log('Activating briefing controller'); // Debug
    this.isActive = true;
    this.buildElementsList(); // Rebuild in case anything changed
    this.setFocus(0);
  }

  deactivate() {
    console.log('Deactivating briefing controller'); // Debug
    this.isActive = false;
    
    // Remove all focus
    this.focusableElements.forEach(item => this.removeFocus(item));
  }

  setupStyles() {
    if (!document.getElementById('briefing-styles')) {
      const style = document.createElement('style');
      style.id = 'briefing-styles';
      style.textContent = `
        .kb-focused {
          outline: 3px solid #FFD700 !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 8px rgba(255, 215, 0, 0.6) !important;
        }
        
        .kb-focused-active {
          outline: 3px solid #00FF00 !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 8px rgba(0, 255, 0, 0.6) !important;
          transform: scale(1.05);
        }
        
        .button-group.kb-focused {
          background: rgba(255, 215, 0, 0.1) !important;
          border-radius: 4px;
        }
      `;
      document.head.appendChild(style);
    }
  }
}

// Make it available globally
window.BriefingRoomController = BriefingRoomController;