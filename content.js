// Function to check if the current URL is a YouTube Shorts page
function isShortsPage() {
  return (
    location.hostname === "www.youtube.com" &&
    location.pathname.startsWith("/shorts/")
  );
}

// Function to add timeline controls
function addTimelineControls() {
  // Check if the current page is a YouTube Shorts page
  if (!isShortsPage()) return;

  // Find the video element
  const videoElement = document.querySelector("video");

  // Check if video element exists and if controls already exist
  const controls = document.getElementById("timelineControls");
  if (!videoElement || controls) return; // Return if controls already exist

  // Create controls container
  const controlsContainer = document.createElement("div");
  controlsContainer.id = "timelineControls"; // Add an ID for easy removal later
  controlsContainer.style.position = "fixed";
  controlsContainer.style.bottom = "30px";
  // controlsContainer.style.left = "1000px";
  // adjust the left position to center the controls container
  controlsContainer.style.left = "50%";
  controlsContainer.style.transform = "translateX(-50%)";
  controlsContainer.style.zIndex = "9999";
  controlsContainer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  controlsContainer.style.padding = "10px";
  controlsContainer.style.borderRadius = "5px";
  controlsContainer.style.display = "flex";
  controlsContainer.style.justifyContent = "center";
  controlsContainer.style.width = `${videoElement.clientWidth}px`;

  // Create timeline
  const timeline = document.createElement("input");
  timeline.type = "range";
  timeline.min = "0";
  timeline.value = "0";
  timeline.style.width = "100%"; // Adjusted width
  timeline.style.cursor = "pointer";

  // Add event listener for timeline input
  timeline.addEventListener("input", function () {
    const percentage = parseInt(timeline.value);
    if (!isNaN(percentage) && isFinite(percentage)) {
      const time = (videoElement.duration / 100) * percentage;
      videoElement.currentTime = time;
    }
  });

  // Append timeline to controls container
  controlsContainer.appendChild(timeline);

  // Append controls container to body
  document.body.appendChild(controlsContainer);

  // Update timeline as video plays
  videoElement.addEventListener("timeupdate", function () {
    timeline.value = (videoElement.currentTime / videoElement.duration) * 100;
  });
}

// Function to remove timeline controls
function removeTimelineControls() {
  const controlsContainer = document.getElementById("timelineControls");
  if (controlsContainer) {
    controlsContainer.remove();
  }
}

// Create a MutationObserver to watch for changes to the DOM
const observer = new MutationObserver((mutationsList) => {
  // Check if the URL changes
  if (!isShortsPage()) {
    // If not on a Shorts page, remove the timeline controls
    removeTimelineControls();
  } else {
    // If on a Shorts page, add the timeline controls
    console.log("Shorts page detected");
    addTimelineControls();
  }
});

// Start observing changes to the DOM
observer.observe(document.body, { subtree: true, childList: true });

// Add controls initially when the page is loaded
addTimelineControls();

// CONSTANT SELECTORS VARIABLES
const VIDEOS_LIST_SELECTOR = ".reel-video-in-sequence";
const NEXT_VIDEO_BUTTON_SELECTOR =
  "#navigation-button-down > ytd-button-renderer > yt-button-shape > button";
const LIKE_BUTTON_SELECTOR =
  "ytd-reel-video-renderer[is-active] #like-button > yt-button-shape > label > button";
const DISLIKE_BUTTON_SELECTOR =
  "ytd-reel-video-renderer[is-active] #dislike-button > yt-button-shape > label > button";
const COMMENTS_SELECTOR =
  "ytd-reel-video-renderer[is-active] ytd-engagement-panel-section-list-renderer[target-id='engagement-panel-comments-section']";
const LIKES_COUNT_SELECTOR =
  "ytd-reel-video-renderer[is-active] #factoids > ytd-factoid-renderer:nth-child(1) > div > yt-formatted-string.factoid-value.style-scope.ytd-factoid-renderer";
const VIEW_COUNT_SELECTOR =
  "ytd-reel-video-renderer[is-active] #factoids > ytd-factoid-renderer:nth-child(2) > div > yt-formatted-string.factoid-value.style-scope.ytd-factoid-renderer";
const COMMENTS_COUNT_SELECTOR =
  "ytd-reel-video-renderer[is-active] #comments-button > ytd-button-renderer > yt-button-shape > label > div > span";

// APP VARIABLES
let amountOfPlays = 0;
let amountOfPlaysToSkip = 1;
let applicationIsOn = false;
let scrollingIsDone = true;
let lastVideo = null;

// STATE VARIABLES
let currentVideoIndex = null;

function startAutoScrolling() {
  if (!applicationIsOn) {
    applicationIsOn = true;
    // Save state to chrome storage so it will be on next time on page load
    chrome.storage.local.set({ applicationIsOn: true });
    // If on hashtag page, click on a shorts video to start the auto scrolling
    document
      .querySelector("#thumbnail [aria-label='Shorts']")
      .parentElement.parentElement.parentElement.click();
  }
}

function stopAutoScrolling() {
  if (applicationIsOn) {
    applicationIsOn = false;
    // Save state to chrome storage so it will be off next time on page load
    chrome.storage.local.set({ applicationIsOn: false });
  }
  const currentVideo = document.querySelector(
    "#shorts-container video[tabindex='-1']"
  );
  // Let the video loop again
  if (currentVideo) currentVideo.setAttribute("loop", "");
}

function checkForNewShort() {
  const currentVideo = document.querySelector(
    "#shorts-container video[tabindex='-1']"
  );
  // Check to see if the video has loaded
  if (isNaN(currentVideo?.duration) || currentVideo?.duration == null) return;
  // Checks if the application is on. If not, let the video loop again
  if (!applicationIsOn) return currentVideo.setAttribute("loop", "");
  else currentVideo.removeAttribute("loop");

  const newCurrentShortsIndex = Array.from(
    document.querySelectorAll(VIDEOS_LIST_SELECTOR)
  ).findIndex((e) => e.hasAttribute("is-active"));

  if (scrollingIsDone) {
    if (newCurrentShortsIndex !== currentVideoIndex) {
      lastVideo?.removeEventListener("ended", videoFinished);
      lastVideo = currentVideo;
      currentVideoIndex = newCurrentShortsIndex;
      amountOfPlays = 0;
    }
    if (!checkIfValidVideo()) {
      scrollToNextShort();
      return;
    }
    currentVideo.addEventListener("ended", videoFinished);
  }
}

function videoFinished() {
  const currentVideo = document.querySelector(
    "#shorts-container video[tabindex='-1']"
  );
  if (!applicationIsOn) return currentVideo.setAttribute("loop", "");
  amountOfPlays++;

  if (amountOfPlays >= amountOfPlaysToSkip) {
    // If the video is finished and is equal to the amount of plays needed to skip,
    // check if the comments are open.
    const comments = document.querySelector(COMMENTS_SELECTOR);
    if (comments) {
      if (
        comments.getAttribute("visibility") ===
          "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN" ||
        comments.clientWidth <= 0
      )
        scrollToNextShort(); // Scroll due to comments not being open
    } else {
      scrollToNextShort(); // Scroll due to no comments found
    }
  } else {
    // If the video hasn't been played enough times, play it again
    currentVideo?.play();
  }
}

async function scrollToNextShort() {
  const currentVideoParent = getParentVideo();
  if (!currentVideoParent) return;
  const currentVideo = currentVideoParent.querySelector("video");
  if (!applicationIsOn) return currentVideo?.setAttribute("loop", "");
  amountOfPlays = 0;
  scrollingIsDone = false;
  const nextVideoParent = document.getElementById(
    `${Number(currentVideoParent?.id) + 1}`
  );
  if (nextVideoParent) {
    nextVideoParent.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });
  } else {
    currentVideo?.play();
  }
  setTimeout(() => {
    // Hardcoded timeout to make sure the video is scrolled before other scrolls are allowed
    scrollingIsDone = true;
  }, 700);
}

function checkIfValidVideo() {
  const currentVideoParent = getParentVideo();
  const currentVideo = currentVideoParent?.querySelector("video");
  if (!currentVideo) return false;
  if (!applicationIsOn) {
    currentVideo.setAttribute("loop", "");
    return false;
  }
  // Your validation logic goes here
  // Example: Check if the video is from a blocked creator and if it is, skip it
  // Example: Check if the video length is within specified range
  return true;
}

// Helper function to get the parent of the current short playing/played
function getParentVideo() {
  const VIDEOS_LIST = [...document.querySelectorAll(VIDEOS_LIST_SELECTOR)];
  const currentVideoParent = VIDEOS_LIST.find((e) => {
    return (
      e.hasAttribute("is-active") &&
      e.querySelector("#shorts-container video[tabindex='-1']")
    );
  });
  return currentVideoParent;
}

// Set up the application
chrome.storage.local.get(["applicationIsOn"], (result) => {
  if (result["applicationIsOn"] == null) {
    startAutoScrolling();
  }
  if (result["applicationIsOn"]) startAutoScrolling();
});

// Enable disable the autoscrolling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleAutoscroll") {
    if (request.value) {
      startAutoScrolling();
    } else {
      stopAutoScrolling();
    }
  }
});

setInterval(checkForNewShort, 100);
