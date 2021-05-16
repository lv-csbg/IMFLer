# IMFLer

This is a web-based tool called *an Interactive Metabolic FLux visualiser and analysER* or **IMFLer**.

It builds upon several technologies:
* `Escher` &#8212; a web-based tool for metabolic maps
    * https://github.com/zakandrewking/escher
* Adapted `Pyodide` 0.16.1 &#8212; Python 3.8 with many scientific packages, compiled to WebAssembly, see
    * the adapted version https://github.com/lv-csbg/pyodide
    * the original project https://github.com/iodide-project/pyodide
* `cobrapy` &#8212; a Python package for constraint-based modeling
    * https://github.com/opencobra/cobrapy

`IMFLer` allows both Flux Balance Analysis (FBA) and Flux Variability Analysis (FVA) of metabolic networks.

## Usage

1. Go to https://lv-csbg.github.io/flux-analysis/
2. Load an Escher map of interest from a JSON file.
    * **Ctrl+O** or from menu on the top **Map -> Load map JSON**
3. Load COBRA model corresponding to the map of interest.
    * **Ctrl+M** or from menu on the top **Model -> Load COBRA model JSON**
4. Change parameters of the model, like:
    * Flux minimum and maximum for the reactions
    * Simulate knockout of genes responsible for the reactions
5. Run FBA or FVA.
6. Analyse the visualised results.

### Visualisation settings
IMFLer's basic default visualisation settings are encoded in a JSON file.
It is stored as `static/data/settings.json`. You can change it in your local IMFLer version.

You can also pass it as a GET parameter `settings` in your URL.

Here is an example how to load a different map and a diffent model using JavaScript on Imfler's page:
```js
var newSettings = 
{
  "model": "https://escher.github.io/1-0-0/6/models/Escherichia%20coli/iJO1366.json",
  "map": "https://escher.github.io/1-0-0/6/maps/Escherichia%20coli/iJO1366.Central%20metabolism.json"
}
var newURI = encodeURI(`${window.location.origin}${window.location.pathname}?settings=${JSON.stringify(newSettings)}`);
window.location.href = newURI;
```
The resulting URL in the example would be:

https://lv-csbg.github.io/flux-analysis/?settings=%7B%22model%22:%22https://escher.github.io/1-0-0/6/models/Escherichia%2520coli/iJO1366.json%22,%22map%22:%22https://escher.github.io/1-0-0/6/maps/Escherichia%2520coli/iJO1366.Central%2520metabolism.json%22%7D
