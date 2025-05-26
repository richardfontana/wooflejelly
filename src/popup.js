
const app = Elm.Main.init({
  node: document.getElementById("elm-root"),
});

const spdxBaseUrl = "https://raw.githubusercontent.com/spdx/license-list-data/main/text/";

app.ports.requestDiff.subscribe(([idA, idB]) => {
  console.log("Requesting diff for", idA, "vs", idB);

  Promise.all([
    fetch(spdxBaseUrl + idA + ".txt").then(res => res.text()),
    fetch(spdxBaseUrl + idB + ".txt").then(res => res.text())
  ])
    .then(([textA, textB]) => {
      const dmp = new diff_match_patch();
      const diffs = dmp.diff_main(textA, textB);
      dmp.diff_cleanupSemantic(diffs);

      const result = [];	
      for (let i = 0; i < diffs.length; i++) {
        const op = diffs[i][0];
        const text = diffs[i][1];

        result.push({
          op: op === 0 ? "equal" : op === 1 ? "insert" : "delete",
          text: text
        });
      }    
  
      app.ports.receiveDiffResult.send(JSON.parse(JSON.stringify(result)));
    });
});

