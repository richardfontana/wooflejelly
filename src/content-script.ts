document.addEventListener("mouseup", () => {
  const selected = window.getSelection()?.toString().trim();
  if (selected && selected.length > 0) {
    chrome.runtime.sendMessage({ 
      type: "selected-text", 
      text: selected 
    } satisfies { type: string; text: string });
  }
});


