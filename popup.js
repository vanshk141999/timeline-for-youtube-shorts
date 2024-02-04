document.addEventListener("DOMContentLoaded", function () {
  const toggleAutoscrollCheckbox = document.getElementById("toggleAutoscroll");

  // Retrieve the state from local storage and set the initial state of the checkbox
  chrome.storage.local.get("autoscrollEnabled", function (data) {
    const autoscrollEnabled =
      data.autoscrollEnabled !== undefined ? data.autoscrollEnabled : true;
    toggleAutoscrollCheckbox.checked = autoscrollEnabled;
    // Update local storage with the initial state of the checkbox
    chrome.storage.local.set({ autoscrollEnabled });
    // Send message to content script to toggle autoscrolling
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "toggleAutoscroll",
        value: autoscrollEnabled,
      });
    });
  });

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
