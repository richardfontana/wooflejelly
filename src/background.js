let lastSelectedText = "";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "selected-text") {
    lastSelectedText = message.text;
  }

  if (message.type === "get-selected-text") {
    sendResponse({ text: lastSelectedText });
  }
});

