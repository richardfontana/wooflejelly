document.addEventListener("mouseup", () => {
  const selected = window.getSelection().toString().trim();
  if (selected.length > 0) {
    chrome.runtime.sendMessage({ type: "selected-text", text: selected });
  }
});


