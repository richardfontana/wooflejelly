/* 
 * Copyright The Wooflejelly Authors
 * SPDX-License-Identifier: Apache-2.0
 */

//import { Elm } from './Main.elm';

const app = Elm.Main.init({
    node: document.getElementById('elm-root')
});

app.ports.sendToJS.subscribe(function (msg) {
    console.log("Elm said:", msg);
    // call diff.js logic?
});

