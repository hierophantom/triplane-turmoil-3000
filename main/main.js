//File name and path: main/main.js
//File role: Main frame JS works

/*--------------------
  GLOBAL VARIABLES
--------------------*/
let briefingController = null;

/*--------------------
  KEYBOARD CONTROLS
--------------------*/

document.addEventListener('DOMContentLoaded', () => {
  // Define tabs, contents, and mainWrapper in a higher scope
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const contents = document.querySelectorAll('.tab-content');
  const mainWrapper = document.getElementById('main-content');

  // Initialize tab-specific controllers
  briefingController = new BriefingRoomController();

  // Helper: focus tab by index AND activate its content
  function focusTab(index) {
    if (index >= 0 && index < tabs.length) {
      const targetTab = tabs[index];
      targetTab.focus();

      // Deactivate all tab contents and controllers
      contents.forEach(section => section.classList.remove('active'));
      deactivateAllTabControllers();

      // Activate the content corresponding to the focused tab
      const targetId = targetTab.dataset.tab;
      const targetContent = document.getElementById(targetId);
      targetContent.classList.add('active');
      
      // Don't auto-activate tab controller - wait for down arrow
    }
  }

  // Activate the appropriate controller based on active tab
  function activateTabController(tabId) {
    console.log('Activating controller for tab:', tabId); // Debug
    switch(tabId) {
      case 'briefing-room':
        if (briefingController) {
          briefingController.activate();
        }
        break;
      case 'pilot-controls':
        // Future: pilotController.activate();
        break;
      case 'cockpit-settings':
        // Future: cockpitController.activate();
        break;
      case 'victory-board':
        // Future: victoryController.activate();
        break;
      case 'about':
        // Future: aboutController.activate();
        break;
    }
  }

  // Deactivate all tab controllers
  function deactivateAllTabControllers() {
    console.log('Deactivating all controllers'); // Debug
    if (briefingController) {
      briefingController.deactivate();
    }
    // Future: deactivate other controllers
  }

  // Check if we're in a tab content area with active controller
  function isInActiveTabContent() {
    const activeTab = document.querySelector('.tab-content.active');
    if (!activeTab) return false;
    
    switch(activeTab.id) {
      case 'briefing-room':
        return briefingController && briefingController.isActive;
      default:
        return false;
    }
  }

  // Focus the first tab by default AND activate its content on page load
  focusTab(0);

  // Find index of focused tab
  function currentTabIndex() {
    return tabs.findIndex(tab => tab === document.activeElement);
  }

  // Tab navigation - only when NOT in active tab content
  Mousetrap.bind('left', (e) => {
    console.log('Left key pressed, in active tab content?', isInActiveTabContent()); // Debug
    if (!isInActiveTabContent()) {
      console.log('Handling tab navigation left'); // Debug
      const idx = currentTabIndex();
      if (idx > 0) {
        e.preventDefault();
        focusTab(idx - 1);
        return false;
      }
    }
    // If in active tab content, let the tab controller handle it
  });

  Mousetrap.bind('right', (e) => {
    console.log('Right key pressed, in active tab content?', isInActiveTabContent()); // Debug
    if (!isInActiveTabContent()) {
      console.log('Handling tab navigation right'); // Debug
      const idx = currentTabIndex();
      if (idx < tabs.length - 1) {
        e.preventDefault();
        focusTab(idx + 1);
        return false;
      }
    }
    // If in active tab content, let the tab controller handle it
  });

  Mousetrap.bind('down', (e) => {
    console.log('Down key pressed'); // Debug
    
    // If focus is on tab, move focus to main content and activate controller
    if (tabs.includes(document.activeElement)) {
      console.log('Moving from tab to content'); // Debug
      e.preventDefault();
      mainWrapper.focus();
      
      // Activate the controller for current tab
      const activeContent = document.querySelector('.tab-content.active');
      if (activeContent) {
        activateTabController(activeContent.id);
      }
      return false;
    }
  });

  Mousetrap.bind('up', (e) => {
    console.log('Up key pressed, in active tab content?', isInActiveTabContent()); // Debug
    
    // If in active tab content, let controller handle it first
    if (isInActiveTabContent()) {
      // The controller will handle this unless it's at the top
      return; // Let the controller decide
    }
    
    // If focus is on main content but no active controller, move back to tab
    if (document.activeElement === mainWrapper) {
      console.log('Moving from content to tab'); // Debug
      e.preventDefault();
      
      // Deactivate all controllers
      deactivateAllTabControllers();
      
      // Find the corresponding tab and focus it
      const activeContent = document.querySelector('.tab-content.active');
      if (activeContent) {
        const activeTabId = activeContent.id;
        const correspondingTab = tabs.find(tab => tab.dataset.tab === activeTabId);
        if (correspondingTab) {
          correspondingTab.focus();
        }
      } else {
        focusTab(0); // Fallback to first tab
      }
      return false;
    }
  });

  /*--------------------
    INITIALIZERS 
  --------------------*/
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.tab;
      const clickedTabIndex = tabs.findIndex(t => t === tab);
      focusTab(clickedTabIndex);
    });
  });
});