/* 
 * Copyright The Wooflejelly Authors
 * SPDX-License-Identifier: Apache-2.0
 */

const app = Elm.Main.init({
  node: document.getElementById("elm-root"),
});

// When Elm requests a diff, run it in JS and send it back
app.ports.requestDiff.subscribe(() => {

  const dmp = new diff_match_patch();
  const diffs = dmp.diff_main(
    "SPDX license identifiers are the best.",
    "SPDX license identifiers are really good."
  );
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

  console.log("Sending diff result:", result);
  app.ports.receiveDiffResult.send(JSON.parse(JSON.stringify(result)));
});

