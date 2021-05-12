self.languagePluginUrl = 'https://lv-csbg.github.io/pyodide/build/'
importScripts('https://lv-csbg.github.io/pyodide/build/pyodide.js')
var fluxEnvLoader = new Promise((resolve, reject) => {
  languagePluginLoader.then(() => {
      self.postMessage({"type":"status", "results": "Python initialisation complete"});
      self.postMessage({"type":"status", "results": "Loading packages..."});
      self.pyodide.loadPackage(['setuptools', 'ruamel', 'future', 'pandas', 'cobra'])
        .then(() => {
          self.postMessage({"type":"status", "results": "Packages loaded"});
          resolve();
        });
    }
  );
});
fluxEnvLoader

var onmessage = function(e) { // eslint-disable-line no-unused-vars
  fluxEnvLoader.then(() => {
    const data = e.data;
    const keys = Object.keys(data);
    for (let key of keys) {
      if (key !== 'python') {
        // Keys other than python must be arguments for the python script.
        // Set them on self, so that `from js import key` works.
        self[key] = data[key];
      }
    }
    self.pyodide.runPythonAsync(data.python, () => {console.log("PYAsync callback")}, () => {console.error("PYAsync ERROR callback")})
        .then((results) => {
          console.log("Results message", results); self.postMessage({results}); })
        .catch((err) => {
          // if you prefer messages with the error
          self.postMessage({error : err.message});
          // if you prefer onerror events
          // setTimeout(() => { throw err; });
        });
  });
}
