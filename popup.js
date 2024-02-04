document.addEventListener("DOMContentLoaded", function () {
  const hideNonVideoElementsCheckbox = document.getElementById(
    "hideNonVideoElements"
  );

  // Retrieve the state from local storage and set the initial state of the checkbox
  chrome.storage.local.get("hideNonVideoElements", function (data) {
    const hideNonVideoElements =
      data.hideNonVideoElements !== undefined
        ? data.hideNonVideoElements
        : false;
    hideNonVideoElementsCheckbox.checked = hideNonVideoElements;

    // If the checkbox is checked, send a message to the content script to toggle hiding non-video elements
    if (hideNonVideoElements) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "toggleHideNonVideoElements",
          value: hideNonVideoElements,
        });
      });
    }
  });

  // Event listener for the checkbox hiding the distractions
  hideNonVideoElementsCheckbox.addEventListener("change", function () {
    const value = hideNonVideoElementsCheckbox.checked;
    // Update local storage with the new state
    chrome.storage.local.set({ hideNonVideoElements: value });
    // Send message to content script to toggle hiding non-video elements
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "toggleHideNonVideoElements",
        value,
      });
    });
  });
});
