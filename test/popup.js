// This assumes elm.js is already loaded via <script> in popup.html
const app = Elm.Main.init({
  node: document.getElementById('elm-root')
});

app.ports.sendToJS.subscribe((msg) => {
  console.log("Received from Elm:", msg);
});

