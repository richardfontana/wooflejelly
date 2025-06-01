chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "REQUEST_SELECTION") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId !== undefined) {
        chrome.tabs.sendMessage(tabId, { type: "GET_SELECTION" }, (response) => {
          sendResponse(response); // will include { selectedText }
        });
      }
    });

    // Important! Keeps the message channel open for async response
    return true;
  }
});


