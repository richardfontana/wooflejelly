// @ts-ignore

console.log("popup.ts loaded");

console.log("popup.ts top-level code running");



console.log("typeof diff_match_patch:", typeof diff_match_patch);

const app = Elm.Main.init({ node: document.getElementById("elm-root") });

interface LicenseText {
  id: string;
  text: string;
}

interface MatchCandidate {
  licenseId: string;
  score: number;
}

// should point to actual SPDX license text source.
// For now, use this sample 
const spdxLicenseIds = ["MIT", "Apache-2.0", "GPL-3.0-only"];

async function fetchLicenseText(id: string): Promise<string> {
  const url = `https://raw.githubusercontent.com/spdx/license-list-data/main/text/${id}.txt`;
  const response = await fetch(url);
  return await response.text();
}

async function loadSpdxLicenses(): Promise<LicenseText[]> {
  return await Promise.all(
    spdxLicenseIds.map(async id => ({
      id,
      text: await fetchLicenseText(id),
    }))
  );
}


type Diff = [number, string];


function computeSimilarity(a: string, b: string): number {
  console.log("computeSimilarity a:", a.slice(0, 30));
  console.log("computeSimilarity b:", b.slice(0, 30));
  console.log("types:", typeof a, typeof b);

  const dmp = new diff_match_patch();
  const diff = dmp.diff_main(a, b);
  dmp.diff_cleanupSemantic(diff);
  console.log("raw diff_main output:", diff);

  // Handle diff_match_patch.Diff instances instead of [op, text] arrays
  const equalParts = diff.filter((entry: any) => entry?.[0] === 0);

  console.log("filtered equal parts:", equalParts);

  const equalLength = equalParts.reduce((sum: number, entry: any) => {
    return sum + (entry?.[1]?.length || 0);
  }, 0);

  const totalLength = a.length + b.length;
  const similarity = totalLength === 0 ? 1 : (2 * equalLength) / totalLength;

  console.log("similarity:", similarity.toFixed(4));
  return similarity;
}





function findTopMatches(selectedText: string, licenses: LicenseText[], topN = 3): MatchCandidate[] {


  const candidates = licenses.map(({ id, text }) => ({
    licenseId: id,
    score: computeSimilarity(selectedText, text),
  }));
  return candidates.sort((a, b) => b.score - a.score).slice(0, topN);
}


// selected text from the page (replace with actual selection logic)
const selectedText = "Permission is hereby granted, free of charge, to any person obtaining a copy...";

loadSpdxLicenses().then(licenses => {
  const topMatches = findTopMatches(selectedText, licenses);
  app.ports.receiveDiffCandidates?.send(topMatches);
});

app.ports.requestDiffFor?.subscribe(async (licenseId: string) => {
  const licenseText = await fetchLicenseText(licenseId);
  const dmp = new diff_match_patch();
  
  const baseText = window.selectedText ?? "";
  const diffs = dmp.diff_main(baseText, licenseText);

  dmp.diff_cleanupSemantic(diffs);

  const diffHtml = dmp.diff_prettyHtml(diffs);

  const container = document.getElementById("diff-output");
  if (container) {
    container.innerHTML =diffHtml;
  }
});

app.ports.receiveDiffResult?.subscribe((diffHtml: string) => {
  const container = document.getElementById("diff-output");
  if (container) {
    container.innerHTML = diffHtml;
  }
});

function getSelectedText(): Promise<string> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "REQUEST_SELECTION" }, (response) => {
      console.log("popup got selection response:", response); // Must appear
      resolve(response?.selectedText || "");
    });
  });
}

getSelectedText().then(async (selectedText) => {
  console.log("Selected text:", selectedText); // should appear in popup console
  
  if (!selectedText.trim()) {
    console.warn("No selection found");
    return;
  }

  const licenses = await loadSpdxLicenses();
  const topMatches = findTopMatches(selectedText, licenses);
  console.log("Top matches:", topMatches); // should also appear
  
  app.ports.receiveDiffCandidates?.send(topMatches);

  // Also store for use in later diffs
  window.selectedText = selectedText;
});


