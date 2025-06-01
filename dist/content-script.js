"use strict";
document.addEventListener("mouseup", () => {
    var _a;
    const selected = (_a = window.getSelection()) === null || _a === void 0 ? void 0 : _a.toString().trim();
    if (selected && selected.length > 0) {
        chrome.runtime.sendMessage({
            type: "selected-text",
            text: selected
        });
    }
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    var _a;
    if (message.type === "GET_SELECTION") {
        const selection = ((_a = window.getSelection()) === null || _a === void 0 ? void 0 : _a.toString()) || "";
        sendResponse({ selectedText: selection });
    }
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    var _a;
    if (message.type === "GET_SELECTION") {
        const selection = ((_a = window.getSelection()) === null || _a === void 0 ? void 0 : _a.toString()) || "";
        sendResponse({ selectedText: selection });
    }
});
