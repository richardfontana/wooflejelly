"use strict";
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "REQUEST_SELECTION") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            var _a;
            const tabId = (_a = tabs[0]) === null || _a === void 0 ? void 0 : _a.id;
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
