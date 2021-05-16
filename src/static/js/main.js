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
    return messageEl;
}

function disableButton(button, message) {
    button.disabled = true;
    button.innerHTML = message;
}

function enableButton(button, message) {
    button.disabled = false;
    button.innerHTML = message;
}

function getCurrentStyleOptions() {
    const optionsToSave = [
        "reaction_scale", 
        "reaction_scale_preset", 
        "reaction_compare_style",
        "reaction_styles",
    ]
    var savedOptions = {}
    for (const option of optionsToSave) {
        savedOptions[option] = b.settings.get(option)
    }
    return savedOptions
}

function setSavedStyleOptions(newType) {
    if (typeof b._allSavedOptions === "object") {
        var curType = b._curType;
        b._allSavedOptions[curType] = getCurrentStyleOptions();
        var savedOptions = b._allSavedOptions[newType];
        for (const option in savedOptions) {
            b.settings.set(option, savedOptions[option])
        }
        b._curType = newType;
    } else {
        initSavedStyleOptions();
        setSavedStyleOptions(newType);
    }
}

function setFBAResults(fba_results) {
    console.log("setFBAResults");
    setSavedStyleOptions("FBA");
    // b.has_custom_reaction_styles = false;
    b.set_reaction_data(fba_results);
    b.callback_manager.set("update_data", updateLegend);
}

function setFVAResults(fva_results) {
    setSavedStyleOptions("FVA");
    b.has_custom_reaction_styles = true;
    b.set_fva_data([fva_results.minimum, fva_results.maximum]);
    b.callback_manager.set("update_data", updateLegend);
}

function fetchFBA() {
  console.log("fetchFBA");
  fetch(b._imfler_settings.fba_results)
    .then(response => response.json())
    .then(fba_results => setFBAResults(fba_results));
}

function fetchFVA() {
  console.log("fetchFVA");
  fetch(b._imfler_settings.fva_results)
    .then(response => response.json())
    .then(fva_results => setFVAResults(fva_results));
}

pyodideWorker.onerror = (e) => {
    console.error(`Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`)
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
        console.log('pyodideWorker return results:', results);
        if (results.result_type === 'fba_fluxes') {
            const fba_results = JSON.parse(results.result);
            setFBAResults(fba_results);
            addMessage("Finished FBA");
            enableButton(document.getElementById("FBA-button"), "Run FBA");
        }
        if (results.result_type === 'fva_fluxes') {
            const fva_results = JSON.parse(results.result);
            setFVAResults(fva_results);
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
        let errorMsg;
        console.error('pyodideWorker error:', error);
        if (error === "Maximum call stack size exceeded") {
            errorMsg = `${error}<br>Your browser does not support deep enough recursion.<br>Try Firefox!`
        } else {
            errorMsg = error;
        }
        let errorMessage = addMessage(errorMsg);
        errorMessage.className = "error";
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

function initSavedStyleOptions() {
    const reaction_scale_preset_fba = [
        {type: "min", color: "#c8c8c8", size: 12},
        {type: "value", value: 0.01, color: "#9696ff", size: 16},
        {type: "value", value: 20, color: "#209123", size: 20},
        {type: "max", color: "#ff0000", size: 25}
    ]
    const default_fba_options = {
        reaction_scale: reaction_scale_preset_fba,
        reaction_scale_preset: "GaBuGeRd",
        reaction_compare_style: "log2_fold",
        reaction_styles: ["color", "size", "text"],
    }
    const default_fva_options = {
        reaction_scale: reaction_scale_preset_fva,
        reaction_scale_preset: false,
        reaction_compare_style: "diff",
        reaction_styles: ["color", "text", "size"],
    }
    var _allSavedOptions = {};
    _allSavedOptions["None"] = getCurrentStyleOptions();
    _allSavedOptions["FBA"] = default_fba_options;
    _allSavedOptions["FVA"] = default_fva_options;
    b._allSavedOptions = _allSavedOptions;
    b._curType = "None";
}

function init(settings) {
    var searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has("settings")) {
        const settingsJSON = searchParams.get("settings");
        let givenSettings = JSON.parse(settingsJSON);
        settings = Object.assign({}, settings, givenSettings);
    }
    if (settings.fba_results || settings.fva_results) {
      document.getElementById("FBA-run-on-load").checked = false;
      document.getElementById("FBA-run-on-load").checked = false;
    }
    addMessage("Python initialisation started...");
    pyodideWorker.postMessage({
        python: program_init
    });
    escher.libs.d3_json(settings.map, function(error, data) {
        if (error) console.warn(error);
        var options = {
            menu: 'all',
            fill_screen: true,
            tooltip_component: FBAFVATooltip
        };
        var modelDataUrl = settings.model;
        window.b = escher.Builder(data, null, null, escher.libs.d3_select('#map_container'), options);
        b._imfler_settings = settings;
        b.callback_manager.set("load_model", loadModelToWebWorker);
        if (settings.fba_results && settings.fva_results) {
          addMessage("Both FBA and FVA results provided. Choosing to show FVA.")
          console.log("settings.fba_results && settings.fva_results");
          b.callback_manager.set("load_model", fetchFVA, settings.fba_results);
        } else if (settings.fba_results) {
          console.log("settings.fba_results");
          b.callback_manager.set("load_model", fetchFBA, settings.fba_results);
        } else if (settings.fva_results) {
          console.log("settings.fva_results");
          b.callback_manager.set("load_model", fetchFVA, settings.fva_results);
        }
        fetch(modelDataUrl)
            .then((x) => x.json())
            .then((json) => {
                window.b.default_model = json;
                const bounds = {}
                json.reactions.forEach(x => bounds[x.id] = [x.lower_bound, x.upper_bound])
                window.b.current_reaction_bounds = bounds;
                b.load_model(json);
            });
        initSavedStyleOptions();
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

function updateLegend(curType) {
    let svg;
    var legend = document.querySelector("svg.legend");
    if (legend !== null) {
        legend.remove()
    }
    if (typeof curType !== "string") {
        curType = b._curType;
    }
    if (curType === "FBA") {
        svg = createFBALegend();
    } else if (curType === "FVA") {
        svg = createFVALegend();
    } else if (curType === "None") {
      return
    } else {
        console.error(`updateLegend failed, b._curType / curType is not recognized. ${curType}`);
    }
    var zoomedArea = document.querySelector("g.zoom-g");
    zoomedArea.appendChild(svg.node());
}

function createFBALegend({
    xAxisTickOutsideLength = 6,
    width = 320,
    marginTop = 18,
    marginLeft = 5,
    marginRight = 5,
    marginBottom = 16 + xAxisTickOutsideLength,
    height = 44 + xAxisTickOutsideLength,
    svgX = calcRightTopCanvasPoint().x - width - 1200,
    svgY = calcRightTopCanvasPoint().y + 150,
    svgScale = 4
} = {}) {
    let isAbsolute;
    var minValue = b.map.data_statistics.reaction.min;
    var maxValue = b.map.data_statistics.reaction.max;
    if (minValue < 0) {
      isAbsolute = "";
    } else {
      isAbsolute = "absolute ";
    }
    var title = `Flux, ${isAbsolute}value (mmol gDW-1 hr-1)`;
    const gradientId = "FBAgradient";
    var svg = d3.create("svg")
        .attr("class", "legend")
        .attr("transform", `translate(${svgX},${svgY}) scale(${svgScale})`)
        .attr("height", height)
        .attr("width", width);
    var defs = svg.append("defs");

    svg.append("rect")
        .attr("class", "legend-gradient")
        .attr("x", marginLeft)
        .attr("y", marginTop)
        .attr("width", width - marginLeft - marginRight)
        .attr("height", height - marginTop - marginBottom)
        .attr("fill", `url('#${gradientId}')`);

    var scalePoints = getCurrentStyleOptions().reaction_scale;
    var gradient = defs.append("linearGradient")
        .attr("id", gradientId);

    var sortedScalePoints = [];
    for (const scalePoint of scalePoints) {
        if (scalePoint.type === "min") {
            var value = minValue;
        } else if (scalePoint.type === "max") {
            var value = maxValue;
        } else if (scalePoint.type === "value") {
            var value = scalePoint.value;
        } else {
            var value = NaN;
        }
        sortedScalePoints.push([scalePoint, value]);
    }
    sortedScalePoints.sort((x, y) => x[1] - y[1]);
    
    var range = maxValue - minValue;
    for (const [scalePoint, value] of sortedScalePoints) {
        var offset = (value - minValue) / range;
        var offsetPrcnt = offset * 100.0;
        gradient.append("stop")
            .attr("offset", `${offsetPrcnt.toPrecision(4)}%`)
            .attr("stop-color", scalePoint.color);
    }

    let lengthenTicks = g => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);
    let x = d3.scaleLinear()
        .domain([minValue, maxValue])
        .rangeRound([marginLeft, width - marginRight]);
    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x))
        .call(lengthenTicks)
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
            .attr("x", marginLeft)
            .attr("y", marginTop + marginBottom - height - 6)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .attr("class", "title")
            .text(title));
    return svg
}

function calcRightTopCanvasPoint() {
    const canvas = document.querySelector("#canvas");
    const width = canvas.getAttribute("width");
    const height = canvas.getAttribute("height");
    const x = document.querySelector("#canvas").__data__.x;
    const y = document.querySelector("#canvas").__data__.y;
    return {
        "x": Number(width) + x,
        "y": y
    }
}

function createFVALegend({
    maxStrokeHeight = 34,
    titleFontSize = 50,
    xAxisLabelSize = 18,
    height = (maxStrokeHeight + titleFontSize + xAxisLabelSize + 20) * 3,
    labelWrap = 30,
    shapeWidth = 70,
    shapePadding = 80,
    width = shapePadding * 29,
    svgX = calcRightTopCanvasPoint().x - width - 10,
    svgY = calcRightTopCanvasPoint().y + 10,
    svgScale = 1
} = {}) {
    var sublegendHeight = height / 3;
    var scalePoints = getCurrentStyleOptions().reaction_scale

    var classesParameters = [{
            "className": "reverse",
            "title": "Negative fluxes only, FVA range value (mmol gDW-1 hr-1)",
            "getRangeFunction": x => -(x.value + 1000.0),
            "fScalePoints": scalePoints.filter(x => x.value < -1000.0)
        },
        {
            "className": "ambidirectional",
            "title": "Ambidirectional fluxes, FVA range value (mmol gDW-1 hr-1)",
            "getRangeFunction": x => x.value + 1000.0,
            "fScalePoints": scalePoints.filter(x => x.value >= -1000.0 && x.value <= 1000.0)
        },
        {
            "className": "forward",
            "title": "Positive fluxes only, FVA range value (mmol gDW-1 hr-1)",
            "getRangeFunction": x => x.value - 1000.0,
            "fScalePoints": scalePoints.filter(x => x.value >= 1000.0)
        }
    ];

    var svg = d3.create("svg")
        .attr("class", "legend")
        .attr("transform", `translate(${svgX},${svgY}) scale(${svgScale})`)
        .attr("height", height)
        .attr("width", width);

    var defs = svg.append("defs");
    var legendCSS = `
    .legendSizeLine text.title {
      font-size: ${titleFontSize}px;
    }
    .legendSizeLine text.label {
      font-size: ${xAxisLabelSize}px;
    }
    `;

    for (const [index, {
            className,
            title,
            fScalePoints,
            getRangeFunction
        }] of classesParameters.entries()) {
        var classColor = fScalePoints[0].color;
        var rangeSizeValues = fScalePoints.map(x => [getRangeFunction(x), x.size]).sort((x, y) => x[0] - y[0])
        var lineSize = d3.scaleOrdinal()
            .domain(rangeSizeValues.map(x => x[0].toFixed(1)))
            .range(rangeSizeValues.map(x => x[1]));

        svg.append("g")
            .attr("class", `legendSizeLine ${className}`)
            .attr("transform", `translate(0, ${(0+index)*sublegendHeight+titleFontSize+10})`)
            .call(g => g.append("text")
                .attr("x", 0)
                .attr("y", -10)
                .attr("fill", "currentColor")
                .attr("text-anchor", "start")
                .attr("font-weight", "bold")
                .attr("class", "title")
                .text(title));

        var legendSizeLine = d3.legendSize()
            .scale(lineSize)
            .shape("line")
            .orient("horizontal")
            .labelWrap(labelWrap)
            .shapeWidth(shapeWidth)
            .labelAlign("start")
            .shapePadding(shapePadding);

        svg.select(`.legendSizeLine.${className}`)
            .call(legendSizeLine);

        legendCSS += `
      .legendSizeLine.${className} line {
        stroke: ${classColor};
      }
      `
    }

    var svgStyle = defs.append("style");
    svgStyle.node().innerHTML = legendCSS;
    return svg
}

function clearOther(x, selector="div#control-board input") {
    if (x.checked === true) {
        document.querySelectorAll(selector).forEach(a => a.checked = false);
        x.checked = true;
    }
}
