//File name and path: main/main.js
//File role: Main frame JS works

/*--------------------
  KEYBOARD CONTROLS
--------------------*/

document.addEventListener('DOMContentLoaded', () => {
  // Define tabs, contents, and mainWrapper in a higher scope
  // so they are accessible to both keyboard controls and initializers
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const contents = document.querySelectorAll('.tab-content'); // Moved to higher scope
  const mainWrapper = document.getElementById('main-content');

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
    }
  }

  // Focus the first tab by default AND activate its content on page load
  focusTab(0); // This will both focus the tab and activate its content

  // Find index of focused tab
  function currentTabIndex() {
    return tabs.findIndex(tab => tab === document.activeElement);
  }

  // Bind arrow keys globally (Mousetrap uses window by default)
  Mousetrap.bind('left', () => {
    const idx = currentTabIndex();
    if (idx > 0) {
      focusTab(idx - 1);
    }
  });

  Mousetrap.bind('right', () => {
    const idx = currentTabIndex();
    if (idx < tabs.length - 1) {
      focusTab(idx + 1);
    }
  });

  Mousetrap.bind('down', () => {
    // If focus is on tab, move focus to main content
    if (tabs.includes(document.activeElement)) {
      mainWrapper.focus();
    }
  });

  Mousetrap.bind('up', () => {
    // If focus is on main content, move focus back to currently active tab (or first tab)
    if (document.activeElement === mainWrapper) {
      // Find the index of the currently active content to focus its corresponding tab
      const activeContent = document.querySelector('.tab-content.active');
      if (activeContent) {
        const activeTabId = activeContent.id;
        const correspondingTab = tabs.find(tab => tab.dataset.tab === activeTabId);
        if (correspondingTab) {
          correspondingTab.focus();
          // No need to call focusTab here, as the content is already active
        }
      } else {
        focusTab(0); // Fallback to first tab if no content is active
      }
    }
  });


  /*--------------------
    INITIALIZERS 
  --------------------*/
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.tab;
      const clickedTabIndex = tabs.findIndex(t => t === tab);
      focusTab(clickedTabIndex); // Use focusTab to handle both focus and content activation
    });
  });
});