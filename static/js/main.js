function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}
function addMessage(message) {
    var container = document.getElementById("messages");
    var messageEl = htmlToElement('<div>' + message + '</div>');
    container.appendChild(messageEl);
}

function disableButton(button, message) {
    button.disabled = true;
    button.innerHTML = message;
}

function enableButton(button, message) {
    button.disabled = false;
    button.innerHTML = message;
}

pyodideWorker.onerror = (e) => {
    console.log(`Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`)
}

pyodideWorker.onmessage = (e) => {
    console.log(e);
    const { type, results, error } = e.data
    if (type === "status") {
        addMessage(results)
        if (results === "Packages loaded") {
            if (document.getElementById("FBA-run-on-load").checked) {
                document.getElementById("FBA-button").onclick();
            }
            if (document.getElementById("FVA-run-on-load").checked) {
                document.getElementById("FVA-button").onclick();
            }
        }
    }
    if (results) {
        console.log('pyodideWorker return results: ', results);
        if (results.result_type === 'fba_fluxes') {
            b.set_reaction_data(JSON.parse(results.result));
            addMessage("Finished FBA");
            enableButton(document.getElementById("FBA-button"), "Run FBA");
        }
        if (results.result_type === 'fva_fluxes') {
            const fva_results = JSON.parse(results.result)
            b.set_reaction_data([fva_results.minimum, fva_results.maximum]);
            addMessage("Finished FVA");
            enableButton(document.getElementById("FVA-button"), "Run FVA");
        }
        if (results.result_type === 'cobra_init') {
            window.cobrapy_init = true;
            b.callback_manager.run("cobra_init");
        }
        if (results.result_type === 'model_loaded') {
            window.model_loaded = true;
            b.callback_manager.run("model_loaded");
        }
    } else if (error) {
        console.log('pyodideWorker error: ', error)
    }
}

var program_init = `import sys
print(sys.getrecursionlimit())
sys.setrecursionlimit(1000)
print(sys.getrecursionlimit())
from cobra.io import from_json
from cobra.flux_analysis import flux_variability_analysis
{'result_type':'cobra_init'}`;

var send_model = `from js import model_json_string
model = from_json(model_json_string)
print("Model loaded!")
{'result_type':'model_loaded'}`;

var program_run_fba = `fba_results = model.optimize()
{'result_type':'fba_fluxes', 'result': fba_results.fluxes.to_json()}`;

var program_run_fva = `model.optimize()
fva_results = flux_variability_analysis(model, fraction_of_optimum=0.5)
fva_results = fva_results.round(3)
{'result_type':'fva_fluxes', 'result': fva_results.to_json()}`;

function loadModelToWebWorker(parsedModel) {
    window.model_json_string = JSON.stringify(parsedModel);
    function sendModel() {
        const model_load_message = {
            model_json_string: model_json_string,
            python: send_model
        };
        pyodideWorker.postMessage(model_load_message)
    }
    if (window.cobrapy_init) {
        sendModel();
    } else {
        b.callback_manager.set("cobra_init", sendModel);
    }


}

function init() {
    addMessage("Python initialisation started...");
    pyodideWorker.postMessage({ python: program_init });
    escher.libs.d3_json('static/data/maps/e_coli_core.Core-metabolism.json', function (error, data) {
        if (error) console.warn(error);
        var options = { menu: 'all', fill_screen: true };
        var modelDataUrl = 'static/data/models/e_coli_core.json';
        window.b = escher.Builder(data, null, null, escher.libs.d3_select('#map_container'), options);
        b.callback_manager.set("load_model", loadModelToWebWorker);
        fetch(modelDataUrl)
            .then((x) => x.json())
            .then((json) => {
                window.model = json;
                b.load_model(json);
            });

    });
    document.getElementById("FBA-button").onclick = function () {
        disableButton(this, "Running FBA");
        addMessage("Started FBA...");
        function sendFBA() {
            pyodideWorker.postMessage({ python: program_run_fba })
        }
        if (window.model_loaded) {
            sendFBA();
        } else {
            b.callback_manager.set("model_loaded", sendFBA);
        }


    }
    document.getElementById("FVA-button").onclick = function () {
        disableButton(this, "Running FVA");
        addMessage("Started FVA...");
        function sendFVA() {
            pyodideWorker.postMessage({ python: program_run_fva });
        }
        if (window.model_loaded) {
            sendFVA();
        } else {
            b.callback_manager.set("model_loaded", sendFVA);
        }
    }

}
