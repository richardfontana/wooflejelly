const SPDX_LICENSE_IDS = [
  "MIT",
  "Apache-2.0",
  "GPL-3.0-only",
  "BSD-3-Clause",
  "MPL-2.0"
];

const licenseCache: Record<string, string> = {};

async function fetchLicenseText(id: string): Promise<string> {
  if (licenseCache[id]) return licenseCache[id];

  const url = `https://raw.githubusercontent.com/spdx/license-list-data/main/text/${id}.txt`;
  const res = await fetch(url);

  if (!res.ok) {
    console.warn(`Failed to fetch ${id}: ${res.status}`);
    return "";
  }

  const text = await res.text();
  licenseCache[id] = text;
  return text;
}

function similarityRatio(a: string, b: string): number {
  const dmp = new diff_match_patch();
  const diffs = dmp.diff_main(a, b);
  dmp.diff_cleanupSemantic(diffs);

  let equalLen = 0;
  let totalLen = 0;

  for (const [op, data] of diffs) {
    if (op === 0) equalLen +=data.length;
    totalLen += data.length;
  }
 
  return equalLen / (totalLen || 1);
}

async function findClosestSpdxMatch(selectedText: string) {
  let best: { id: string; score: number; text: string } | null = null;
  
  for (const id of SPDX_LICENSE_IDS) {
    const text = await fetchLicenseText(id);
    const score = similarityRatio(selectedText, text);
   
    if (!best || score > best.score) {
      best = { id, score, text };
    }
  }

  return best;
}

chrome.runtime.sendMessage({ type: "get-selected-text" }, async (response) => {
  const selectedText = response?.text;
  if (!selectedText) return;
  
  const match = await findClosestSpdxMatch(selectedText);
  if (!match) {
    app.ports.receiveDiffError?.send("No SPDX match found."); 
    return;
  }

  // send matched ID to Elm
  app.ports.receiveMatchedLicense?.send(match.id);

  const dmp = new diff_match_patch();
  const diffs = dmp.diff_main(selectedText, match.text);
  dmp.diff_cleanupSemantic(diffs);

  const structureDiff = diffs.map(([op, text]) => {
    const opStr = op === 0 ? "equal" : op === -1 ? "delete" : "insert";
    return { op : opStr, text }; 
  });

  app.ports.receiveDiffResult.send(structuredDiff); 
});



declare class diff_match_patch {
  diff_main(text1: string, text2: string): [number, string][];
  diff_cleanupSemantic(diffs: [number, string][]): void;
}

declare const Elm: {
  Main: {
    init(options: { node: HTMLElement }): ElmApp;
  };
};

type DiffOp = "equal" | "insert" | "delete";

interface DiffEntry {
  op: DiffOp; 
  text: string;
}

interface ElmApp {
  ports: {
    requestDiff: {
      subscribe(callback: (args: [string, string]) => void): void;
    };
    receiveDiffResult: {
      send(result: DiffEntry[]): void;
    };
    receiveDiffError: {
      send(error: string): void;   
    };
    receiveSelectedText?: {
      send(text: string): void;
    };
  };
}


const app = Elm.Main.init({
  node: document.getElementById("elm-root")!
});

const spdxBaseUrl = "https://raw.githubusercontent.com/spdx/license-list-data/main/text/";

app.ports.requestDiff.subscribe(([idA, idB]) => {
  Promise.all([
    fetch(spdxBaseUrl + idA + ".txt").then(res => {
      if (!res.ok) throw new Error(`Failed to fetch ${idA}`);
      return res.text(); 
    }), 
    fetch(spdxBaseUrl + idB + ".txt").then(res => {
      if (!res.ok) throw new Error(`Failed to fetch ${idB}`);
      return res.text();
    })    
  ])
    .then(([textA, textB]) => {
      const dmp = new diff_match_patch();
      const diffs = dmp.diff_main(textA, textB);
      dmp.diff_cleanupSemantic(diffs);

      const result: DiffEntry[] = [];
      for (let i = 0; i < diffs.length; i++) {
        const op = diffs[i][0];
        const text = diffs[i][1];
         
        result.push({
          op: op === 0 ? "equal" : op === 1 ? "insert" : "delete",
          text
        });
      }          

      app.ports.receiveDiffResult.send(result);
   })
    .catch(err => { 
      console.error("Diff failed:", err);
      app.ports.receiveDiffError.send(err.message);
    });
});

/*
app.ports.receiveDiffError?.subscribe((msg) => {
  console.warn("Elm reported error:", msg);
});
*/

chrome.runtime.sendMessage({ type: "get-selected-text" }, (response: { text?: string }) => {
  if (response?.text) {
    app.ports.receiveSelectedText?.send(response.text);
  }
});
 
