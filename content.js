function addTimelineControls() {
  // Find the video element
  const videoElement = document.querySelector("video");

  // If video element exists, add controls
  if (videoElement) {
    // Create controls container
    const controlsContainer = document.createElement("div");
    controlsContainer.style.position = "fixed";
    controlsContainer.style.bottom = "20px";
    controlsContainer.style.left = "58%"; // Align to center horizontally
    controlsContainer.style.transform = "translateX(-50%)"; // Adjust for center alignment
    controlsContainer.style.zIndex = "9999";
    controlsContainer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    controlsContainer.style.padding = "10px";
    controlsContainer.style.borderRadius = "5px";
    controlsContainer.style.display = "flex"; // Use flexbox for alignment
    controlsContainer.style.justifyContent = "center"; // Center content horizontally
    controlsContainer.style.width = "316px"; // Set width to 316px

    // Might be added later
    // Create play/pause button
    // const playPauseButton = document.createElement("button");
    // playPauseButton.textContent = "Pause";
    // playPauseButton.onclick = function () {
    //   if (videoElement.paused) {
    //     videoElement.play();
    //     playPauseButton.textContent = "Pause";
    //   } else {
    //     videoElement.pause();
    //     playPauseButton.textContent = "Play";
    //   }
    // };
    // controlsContainer.appendChild(playPauseButton);

    // Create timeline
    const timeline = document.createElement("input");
    timeline.type = "range";
    timeline.min = "0";
    timeline.value = "0";
    timeline.style.width = "100%";
    timeline.style.cursor = "pointer";
    timeline.addEventListener("input", function () {
      const time = (videoElement.duration / 100) * timeline.value;
      videoElement.currentTime = time;
    });
    controlsContainer.appendChild(timeline);

    // Append controls to the body
    document.body.appendChild(controlsContainer);

    // Update timeline as video plays
    videoElement.addEventListener("timeupdate", function () {
      timeline.value = (videoElement.currentTime / videoElement.duration) * 100;
    });
  }
}

// Add controls when the page is loaded
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

setInterval(checkForNewShort, 100);
