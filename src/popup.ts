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
 
