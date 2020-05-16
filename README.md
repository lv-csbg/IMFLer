# IMFLer

This is a web-based tool called *an Interactive Metabolic FLux visualiser and analysER* or **IMFLer**.

It builds upon several technologies:
* `Escher` &#8212; a web-based tool for metabolic maps
    * https://github.com/zakandrewking/escher
* Adapted `Pyodide` &#8212; compiled to WebAssembly Python 3.7, with many scientific packages, see 
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

