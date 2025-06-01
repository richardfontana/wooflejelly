"use strict";
// @ts-ignore
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a, _b;
console.log("popup.ts loaded");
console.log("popup.ts top-level code running");
console.log("typeof diff_match_patch:", typeof diff_match_patch);
const app = Elm.Main.init({ node: document.getElementById("elm-root") });
// should point to actual SPDX license text source.
// For now, use this sample 
const spdxLicenseIds = ["MIT", "Apache-2.0", "GPL-3.0-only"];
function fetchLicenseText(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `https://raw.githubusercontent.com/spdx/license-list-data/main/text/${id}.txt`;
        const response = yield fetch(url);
        return yield response.text();
    });
}
function loadSpdxLicenses() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield Promise.all(spdxLicenseIds.map((id) => __awaiter(this, void 0, void 0, function* () {
            return ({
                id,
                text: yield fetchLicenseText(id),
            });
        })));
    });
}
function computeSimilarity(a, b) {
    console.log("computeSimilarity a:", a.slice(0, 30));
    console.log("computeSimilarity b:", b.slice(0, 30));
    console.log("types:", typeof a, typeof b);
    const dmp = new diff_match_patch();
    const diff = dmp.diff_main(a, b);
    dmp.diff_cleanupSemantic(diff);
    console.log("raw diff_main output:", diff);
    // Handle diff_match_patch.Diff instances instead of [op, text] arrays
    const equalParts = diff.filter((entry) => (entry === null || entry === void 0 ? void 0 : entry[0]) === 0);
    console.log("filtered equal parts:", equalParts);
    const equalLength = equalParts.reduce((sum, entry) => {
        var _a;
        return sum + (((_a = entry === null || entry === void 0 ? void 0 : entry[1]) === null || _a === void 0 ? void 0 : _a.length) || 0);
    }, 0);
    const totalLength = a.length + b.length;
    const similarity = totalLength === 0 ? 1 : (2 * equalLength) / totalLength;
    console.log("similarity:", similarity.toFixed(4));
    return similarity;
}
function findTopMatches(selectedText, licenses, topN = 3) {
    const candidates = licenses.map(({ id, text }) => ({
        licenseId: id,
        score: computeSimilarity(selectedText, text),
    }));
    return candidates.sort((a, b) => b.score - a.score).slice(0, topN);
}
// selected text from the page (replace with actual selection logic)
const selectedText = "Permission is hereby granted, free of charge, to any person obtaining a copy...";
loadSpdxLicenses().then(licenses => {
    var _a;
    const topMatches = findTopMatches(selectedText, licenses);
    (_a = app.ports.receiveDiffCandidates) === null || _a === void 0 ? void 0 : _a.send(topMatches);
});
(_a = app.ports.requestDiffFor) === null || _a === void 0 ? void 0 : _a.subscribe((licenseId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const licenseText = yield fetchLicenseText(licenseId);
    const dmp = new diff_match_patch();
    const baseText = (_a = window.selectedText) !== null && _a !== void 0 ? _a : "";
    const diffs = dmp.diff_main(baseText, licenseText);
    dmp.diff_cleanupSemantic(diffs);
    const diffHtml = dmp.diff_prettyHtml(diffs);
    const container = document.getElementById("diff-output");
    if (container) {
        container.innerHTML = diffHtml;
    }
}));
(_b = app.ports.receiveDiffResult) === null || _b === void 0 ? void 0 : _b.subscribe((diffHtml) => {
    const container = document.getElementById("diff-output");
    if (container) {
        container.innerHTML = diffHtml;
    }
});
function getSelectedText() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "REQUEST_SELECTION" }, (response) => {
            console.log("popup got selection response:", response); // Must appear
            resolve((response === null || response === void 0 ? void 0 : response.selectedText) || "");
        });
    });
}
getSelectedText().then((selectedText) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Selected text:", selectedText); // should appear in popup console
    if (!selectedText.trim()) {
        console.warn("No selection found");
        return;
    }
    const licenses = yield loadSpdxLicenses();
    const topMatches = findTopMatches(selectedText, licenses);
    console.log("Top matches:", topMatches); // should also appear
    (_a = app.ports.receiveDiffCandidates) === null || _a === void 0 ? void 0 : _a.send(topMatches);
    // Also store for use in later diffs
    window.selectedText = selectedText;
}));
