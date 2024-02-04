document.addEventListener("DOMContentLoaded", function () {
  const toggleAutoscrollCheckbox = document.getElementById("toggleAutoscroll");

  // Retrieve the state from local storage and set the initial state of the checkbox
  chrome.storage.local.get("autoscrollEnabled", function (data) {
    toggleAutoscrollCheckbox.checked = data.autoscrollEnabled || false;
  });

  // If there's no stored value in local storage, set the checkbox as checked by default
  if (toggleAutoscrollCheckbox.checked === false) {
    toggleAutoscrollCheckbox.checked = true;
    chrome.storage.local.set({ autoscrollEnabled: true });
  }

  toggleAutoscrollCheckbox.addEventListener("change", function () {
    const value = toggleAutoscrollCheckbox.checked;
    // Update local storage with the new state
    chrome.storage.local.set({ autoscrollEnabled: value });
    // Send message to content script to toggle autoscrolling
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "toggleAutoscroll",
        value,
      });
    });
  });
});
