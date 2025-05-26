let lastSelectedText = "";

chrome.runtime.onMessage.addListener(
  (
    message: { type: string; text?: string }, 
    sender: chrome.runtime.MessageSender, 
    sendResponse: (response: { text?: string }) => void
  ) => {
  if (message.type === "selected-text" && message.text) {
    lastSelectedText = message.text;
    return; // no response expected 
  }

  if (message.type === "get-selected-text") {
    sendResponse({ text: lastSelectedText });
    return true; // keep the message channel open for sendResponse
  }
});

