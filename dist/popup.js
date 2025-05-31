"use strict";
// @ts-ignore
const dmp = new diff_match_patch();
const app = Elm.Main.init({ node: document.getElementById("elm-root") });
// This should point to your actual SPDX license text source.
// For now, we use this sample for demonstration.
const spdxLicenseIds = ["MIT", "Apache-2.0", "GPL-3.0-only"];
async function fetchLicenseText(id) {
    const url = `https://raw.githubusercontent.com/spdx/license-list-data/main/text/${id}.txt`;
    const response = await fetch(url);
    return await response.text();
}
async function loadSpdxLicenses() {
    return await Promise.all(spdxLicenseIds.map(async (id) => ({
        id,
        text: await fetchLicenseText(id),
    })));
}
function computeSimilarity(a, b) {
    const dmp = new diff_match_patch();
    const diffs = dmp.diff_main(a, b);
    const totalLength = a.length + b.length;
    const unchanged = diffs
        .filter(([op]) => op === 0)
        .reduce((sum, [, text]) => sum + text.length, 0);
    return unchanged / (totalLength / 2);
}
function findTopMatches(selectedText, licenses, topN = 3) {
    const candidates = licenses.map(({ id, text }) => ({
        licenseId: id,
        score: computeSimilarity(selectedText, text),
    }));
    return candidates.sort((a, b) => b.score - a.score).slice(0, topN);
}
// Your selected text from the page (replace with actual selection logic)
const selectedText = "Permission is hereby granted, free of charge, to any person obtaining a copy...";
loadSpdxLicenses().then(licenses => {
    const topMatches = findTopMatches(selectedText, licenses);
    app.ports.receiveDiffCandidates?.send(topMatches);
});
app.ports.requestDiffFor?.subscribe(async (licenseId) => {
    const licenseText = await fetchLicenseText(licenseId);
    const dmp = new diff_match_patch();
    const diffs = dmp.diff_main(selectedText, licenseText);
    dmp.diff_cleanupSemantic(diffs);
    const diffHtml = dmp.diff_prettyHtml(diffs);
    const container = document.getElementById("diff-output");
    if (container) {
        container.innerHTML = diffHtml;
    }
});
app.ports.receiveDiffResult?.subscribe((diffHtml) => {
    const container = document.getElementById("diff-output");
    if (container) {
        container.innerHTML = diffHtml;
    }
});
