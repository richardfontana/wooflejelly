/* 
 * Copyright The Wooflejelly Authors
 * SPDX-License-Identifier: Apache-2.0
 */

const app = Elm.Main.init({
  node: document.getElementById("elm-root"),
});

// When Elm requests a diff, run it in JS and send it back
app.ports.requestDiff.subscribe(() => {
  const text1 = "A candle in a jar of razzleberry dressing.";
  const text2 = "And on the tree a star of shining Christmas gold.";

  const dmp = new diff_match_patch();
  const diffs = dmp.diff_main(text1, text2);
  dmp.diff_cleanupSemantic(diffs);

  let result = '';
  for (let i = 0; i < diffs.length; i++) {
    const op = diffs[i][0];
    const data = diffs[i][1];    
    if (op === 1) {
      result += `[+${data}]`; // insertion
    } else if (op === -1) {
      result += `[-${data}]`; // deletion
    } else {
      result += data; // equal
    }
  }

  app.ports.receiveDiffResult.send(result);
});

