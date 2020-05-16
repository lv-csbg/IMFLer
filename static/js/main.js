const preact = escher.libs.preact;
const h = preact.createElement;
const Component = preact.Component;

var tooltipStyle = {
    'min-width': '40px',
    'min-height': '10px',
    'border-radius': '2px',
    'border': '1px solid #b58787',
    'padding': '7px',
    'background-color': '#fff',
    'text-align': 'left',
    'font-size': '16px',
    'font-family': 'sans-serif',
    'color': '#111',
    'box-shadow': '4px 6px 20px 0px rgba(0, 0, 0, 0.4)'
};

class FBAFVATooltip extends Component {
    componentShouldUpdate() {
        return false;
    }

    componentWillReceiveProps(nextProps) {
    }

    applyBounds() {
        const reactionId = document.querySelector(".default-tooltip div.id").innerText
        const bounds = [
            Number(document.querySelector(".default-tooltip input.lower_bound").value),
            Number(document.querySelector(".default-tooltip input.upper_bound").value)
        ];
        var result = {};
        result[reactionId] = bounds;
        b.current_reaction_bounds[reactionId] = bounds;
        return sendBoundsToWebWorker(result);
    }
    render() {
        // var decomp = this.decompartmentalizeCheck(this.props.biggId, this.props.type);
        // var biggButtonText = 'Open ' + decomp + ' in BiGG Models.';
        if (this.props.type === 'reaction') {
            let lower_bound = window.b.current_reaction_bounds ? window.b.current_reaction_bounds[this.props.biggId][0] : -10000;
            let upper_bound = window.b.current_reaction_bounds ? window.b.current_reaction_bounds[this.props.biggId][1] : 10000;
            return (0, h)(
                'div',
                {
                    className: 'default-tooltip',
                    onMouseLeave: function (e) {
                        b.map.key_manager.toggle(true);
                    },
                    onMouseOver: function (e) {
                        b.map.key_manager.toggle(false);
                    },
                },
                (0, h)(
                    'div',
                    { className: 'id' },
                    this.props.biggId
                ),
                (0, h)(
                    'div',
                    { className: 'name' },
                    'name: ',
                    this.props.name
                ),
                (0, h)(
                    'div',
                    { className: 'data' },
                    'data: ',
                    this.props.data && this.props.data !== '(nd)' ? this.props.data : 'no data'
                ),
                (0, h)(
                    'div',
                    { className: 'labels' },
                    (0, h)(
                        'div',
                        { className: 'labels' },
                        'Lower bound'
                    ),
                    (0, h)(
                        'div',
                        { className: 'labels' },
                        'Upper bound'
                    )
                ),
                (0, h)(
                    'div',
                    { className: 'inputs' },
                    (0, h)(
                        'input',
                        { className: 'lower_bound', type: 'text', contenteditable: "true", value: lower_bound, }
                    ),
                    (0, h)(
                        'input',
                        { className: 'upper_bound', type: 'text', contenteditable: "true", value: upper_bound, },
                    )
                ),
                (0, h)(
                    'button',
                    { onClick: this.applyBounds },
                    'Apply bounds'
                ),
                (0, h)(
                    'div',
                    { className: 'top-right' },
                    // (0, h)(
                    //   'div',
                    //   { className: 'type-label' },
                    //   this.capitalizeFirstLetter(this.props.type)
                    // ),
                    (0, h)(
                        'a',
                        { onClick: this.props.disableTooltips },
                        'Disable Tooltips'
                    )
                )
            );
        };
    };
}

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
            if (typeof b._savedOptions === "object") {
                for (const option in b._savedOptions) {
                    b.settings.set(option, b._savedOptions[option])
                }
            }
            b.set_reaction_data(JSON.parse(results.result));
            addMessage("Finished FBA");
            enableButton(document.getElementById("FBA-button"), "Run FBA");
        }
        if (results.result_type === 'fva_fluxes') {
            const fva_results = JSON.parse(results.result)
            const optionsToSave = [
                "reaction_scale", 
                "reaction_scale_preset", 
                "reaction_compare_style",
                "reaction_styles",
            ]
            _savedOptions = {}
            for (const option of optionsToSave) {
                _savedOptions[option] = b.settings.get(option)
            }
            b._savedOptions = _savedOptions
            const fva_options = {
                reaction_scale: reaction_scale_preset_fva,
                reaction_scale_preset: false,
                reaction_compare_style: "diff",
                reaction_styles: [ "color", "text", "size" ],
            }
            for (const option in fva_options) {
                b.settings.set(option, fva_options[option])
            }
            b.has_custom_reaction_styles = true
            b.set_fva_data([fva_results.minimum, fva_results.maximum]);
            // b.set_reaction_data([fva_results]);
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

var send_bounds = `from js import reactions_bounds_json
import json
reaction_bounds = json.loads(reactions_bounds_json)
for reaction, bounds in reaction_bounds.items():
    cur_reaction = model.reactions.get_by_id(reaction)
    if bounds == "knockout":
        cur_reaction.knock_out()
    else:
        cur_reaction.bounds = bounds
if "last" in locals():
    if last == "FBA":
        fba_results, message, last = run_fba(model)
    elif last == "FVA":
        fva_results, message, last = run_fva(model)
message`;

var program_run_fba = `def run_fba(model):
    fba_results = model.optimize()
    return fba_results, {'result_type':'fba_fluxes', 'result': fba_results.fluxes.to_json()}, "FBA"
fba_results, message, last = run_fba(model)
message`;

var program_run_fva = `def run_fva(model):
    model.optimize()
    fva_results = flux_variability_analysis(model, fraction_of_optimum=0.5)
    fva_results = fva_results.round(3)
    return fva_results, {'result_type':'fva_fluxes', 'result': fva_results.to_json()}, "FVA"
fva_results, message, last = run_fva(model)
message`;

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

function sendBoundsToWebWorker(bounds) {
    const reactions_bounds_json = JSON.stringify(bounds);
    function sendBounds() {
        const change_bounds_message = {
            reactions_bounds_json: reactions_bounds_json,
            python: send_bounds
        };
        pyodideWorker.postMessage(change_bounds_message)
    }
    if (window.cobrapy_init) {
        sendBounds();
    } else {
        b.callback_manager.set("cobra_init", sendBounds);
    }
}

function init() {
    addMessage("Python initialisation started...");
    pyodideWorker.postMessage({ python: program_init });
    escher.libs.d3_json('static/data/maps/e_coli_core.Core-metabolism.json', function (error, data) {
        if (error) console.warn(error);
        var options = { menu: 'all', fill_screen: true, tooltip_component: FBAFVATooltip };
        var modelDataUrl = 'static/data/models/e_coli_core.json';
        window.b = escher.Builder(data, null, null, escher.libs.d3_select('#map_container'), options);
        b.callback_manager.set("load_model", loadModelToWebWorker);
        fetch(modelDataUrl)
            .then((x) => x.json())
            .then((json) => {
                window.b.default_model = json;
                const bounds = {}
                json.reactions.forEach(x => bounds[x.id] = [x.lower_bound, x.upper_bound])
                window.b.current_reaction_bounds = bounds;
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
