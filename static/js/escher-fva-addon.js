/**
 * @license
 *
 * Escher
 * Author: Zachary King
 * Modified by: Rudolfs Petrovs
 *
 * Escher-FVA-AddOn
 * Author: Rudolfs Petrovs
 * Uses modified and unmodified code from Escher
 * 
 * The MIT License (MIT)
 *
 * This software is Copyright © 2015 The Regents of the University of
 * California. All Rights Reserved.
 * Copyright (c) 2020 Computational Systems Biology Group @ Latvia
 * Copyright (c) 2020 Rudolfs Petrovs
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
**/
// escher.Builder.prototype.default_set_reaction_data = escher.Builder.prototype.set_reaction_data
// escher.Builder.prototype.set_reaction_data = function (data) {
//     if (data.length == 1 && escher.libs.underscore.contains(Object.keys(data[0]), ('minimum', 'maximum'))) {
//         this.set_fva_data([data[0].minimum, data[0].maximum])
//     } else {
//         this.default_set_reaction_data(data)
//     }
// }
const reaction_scale_preset_fva = (function() {
    const green = (function () {
        var res = [
            { type: 'value', value: 1000.0000000000001, color: '#008000', size: 8 },
        ]
        const min = 8;
        const max = 32;
        for (var i = min; i <= max; i++) {
            res.push({
                type: 'value', value: 1000.0 + 10**((i/min) - 1), color: '#008000', size: i
            })
        }
        return res
    })()
    const red = (function () {
        var res = [
            { type: 'value', value: -1000.0000000000001, color: '#ff0000', size: 8 },
        ]
        const min = 8;
        const max = 32;
        for (var i = min; i <= max; i++) {
            res.push({
                type: 'value', value: -1000.0 - 10**((i/min) - 1), color: '#ff0000', size: i
            })
        }
        return res
    })()
    
    const yellow = (function () {
        var res = [
            { type: 'value', value: -999.9999999999999, color: '#ffff00', size: 8 },
            { type: 'value', value: 999.9999999999999, color: '#ffff00', size: 35 },
        ]
        const min = 8;
        const max = 34;
        for (var i = min; i <= max; i++) {
            res.push({
                type: 'value', value: -1000.0 + 10**((i/min) - 1), color: '#ffff00', size: i
            })
        }
        return res
    })()
    return [].concat(red, yellow, green)
})()

escher.Builder.prototype.set_fva_data = function set_fva_data(data) {
    console.log("Started set_fva_data");
    // START
    this.settings.set('reaction_data', data)
    // clear gene data
    if (data) {
        this.settings._options.gene_data = null
    }
    const reactionStyles = this.settings.get('reaction_styles')
    var messageFn = this._reactionCheckAddAbs()
    this.settings.set('reaction_styles', reactionStyles)

    this._updateFVAData(true, true)

    if (messageFn) messageFn()
    else this.map.set_status('')

    const disabledButtons = this.settings.get('disabled_buttons') || []
    const buttonName = 'Clear reaction data'
    const geneButtonName = 'Clear gene data'
    const index = disabledButtons.indexOf(buttonName)
    if (data && index !== -1) {
        disabledButtons.splice(index, 1)
        const gInd = disabledButtons.indexOf(geneButtonName)
        if (gInd === -1) disabledButtons.push(geneButtonName)
        this.settings.set('disabled_buttons', disabledButtons)
    } else if (!data && index === -1) {
        disabledButtons.push(buttonName)
        this.settings.set('disabled_buttons', disabledButtons)
    }
    // END
    console.log("Finished set_fva_data");
}
const RETURN_ARG = x => x

function d3Format(p) {
    return x => Number(x).toPrecision(p)
}

function checkFinite(x) {
    return isFinite(x) ? x : null
}

function abs(x, takeAbs) {
    return takeAbs ? Math.abs(x) : x
}

function FVAdiff(x, y, takeAbs) {
    var res
    var range = Math.abs(y - x)
    if (x < 0 && y <= 0) {
        // All Negative, Red
        res = -1000.0 - range
    } else if (x < 0 && y > 0) {
        // Both, Yellow
        res = -1000.0 + range
    } else if (x >= 0 && y > 0) {
        // All Positive, Green
        res = 1000.0 + range
    } else {
        res = null
    }
    return res
}

function fold(x, y, takeAbs) {
    if (x === 0 || y === 0) return null
    var fold = (y >= x ? y / x : -x / y)
    return takeAbs ? Math.abs(fold) : fold
}

function log2Fold(x, y, takeAbs) {
    if (x === 0) return null
    if (y / x < 0) return null
    var log = Math.log(y / x) / Math.log(2)
    return takeAbs ? Math.abs(log) : log
}

function parseFloatOrNull(x) {
    // strict number casting
    const f = Number(x)
    // check for null and '', which haven't been caught yet
    return (isNaN(f) || parseFloat(x) !== f) ? null : f
}

function floatForData(d, styles, compareStyle) {
    // all null
    if (d === null) return null

    // absolute value
    const takeAbs = styles.indexOf('abs') !== -1

    if (d.length === 1) { // 1 set
        // 1 null
        var f = parseFloatOrNull(d[0])
        if (f === null) return null
        return abs(f, takeAbs)
    } else if (d.length === 2) { // 2 sets
        // 2 null
        var fs = d.map(parseFloatOrNull)
        if (fs[0] === null || fs[1] === null) return null

        if (compareStyle === 'diff') {
            return FVAdiff(fs[0], fs[1], takeAbs)
        } else if (compareStyle === 'fold') {
            return checkFinite(fold(fs[0], fs[1], takeAbs))
        } else if (compareStyle === 'log2_fold') {
            return checkFinite(log2Fold(fs[0], fs[1], takeAbs))
        }
    } else {
        throw new Error('Data array must be of length 1 or 2')
    }
    throw new Error('Bad data compare_style: ' + compareStyle)
}

function reverse_flux_for_data(d) {
    if (d === null || d[0] === null) {
        return false
    }
    return (d[0] < 0)
}

function text_for_fva_data(d, f) {
    if (d === null) {
        return null_or_d(null)
    }
    if (d.length === 2) {
        t = null_or_d(d[0], d3Format(3))
        t += ', ' + null_or_d(d[1], d3Format(3))
        // t += ': ' + null_or_d(f, format)
        return t
    }
    return ''

    // definitions
    function null_or_d(d, format) {
        return d === null ? '(nd)' : format(d)
    }
}

/**
 * Returns True if the scale has changed.
 * @param {Object} reactions -
 * @param {} data -
 * @param {} styles -
 * @param {String} compare_style -
 * @param {Array} keys - (Optional) The keys in reactions to apply data to.
 */
function apply_fva_data_to_reactions(reactions, data, styles,
    compare_style, keys) {
    if (escher.libs.underscore.isUndefined(keys)) keys = Object.keys(reactions)

    var reaction
    var segment_id
    var segment

    if (data === null) {
        keys.map(function (reaction_id) {
            reaction = reactions[reaction_id]
            reaction.data = null
            reaction.data_string = ''
            for (segment_id in reaction.segments) {
                segment = reaction.segments[segment_id]
                segment.data = null
            }
            reaction.gene_string = null
        })
        return false
    }

    // apply the datasets to the reactions
    keys.map(function (reaction_id) {
        reaction = reactions[reaction_id]
        // check bigg_id and name
        var d = data[reaction.bigg_id] || data[reaction.name] || null
        var f = floatForData(d, styles, compare_style)
        var r = reverse_flux_for_data(d)
        var s = text_for_fva_data(d, f)
        reaction.data = f
        reaction.data_string = s
        reaction.reverse_flux = r
        reaction.gene_string = null
        // apply to the segments
        for (segment_id in reaction.segments) {
            segment = reaction.segments[segment_id]
            segment.data = reaction.data
            segment.reverse_flux = reaction.reverse_flux
        }
    })
    return true
}

/**
 * Returns True if the scale has changed.
 * @param {Array} keys - (Optional) The keys in reactions to apply data to.
 */
escher.Map.prototype.apply_fva_data_to_map = function apply_fva_data_to_map(data, keys) {
    console.log("Started apply_fva_data_to_map");
    // START

    const styles = this.settings.get('reaction_styles')
    const compareStyle = this.settings.get('reaction_compare_style')
    const hasData = apply_fva_data_to_reactions(
        this.reactions,
        data,
        styles,
        compareStyle,
        keys
    )
    this.has_data_on_reactions = hasData
    this.imported_reaction_data = hasData ? data : null
    // END
    console.log("Finished apply_fva_data_to_map");

    return this.calc_data_stats('reaction')
}

/**
 * Convert imported data to a style that can be applied to reactions and nodes.
 * @param data - The data object.
 * @param name - Either 'reaction_data', 'metabolite_data', or 'gene_data'
 * @param allReactions - Required for name == 'gene_data'. Must include all GPRs
 *                       for the map and model.
 */
function importAndCheck(data, name, allReactions) {
    // check arguments
    if (!data) return null

    if (['reaction_data', 'metabolite_data', 'gene_data'].indexOf(name) === -1) {
        throw new Error('Invalid name argument: ' + name)
    }

    // make array
    if (!(data instanceof Array)) {
        data = [data]
    }
    // check data
    var check = function () {
        if (data === null) {
            return null
        }
        if (data.length === 1) {
            return null
        }
        if (data.length === 2) {
            return null
        }
        return console.warn('Bad data style: ' + name)
    }
    check()
    data = escher.utils.arrayToObject(data)

    if (name === 'gene_data') {
        if (allReactions === undefined) {
            throw new Error('Must pass all_reactions argument for gene_data')
        }
        data = alignGeneDataToReactions(data, allReactions)
    }

    return data
}

/**
 * Set data and settings for the model.
 * update_model: (Boolean) Update data for the model.
 * update_map: (Boolean) Update data for the map.
 * should_draw: (Optional, Default: true) Whether to redraw the update sections
 * of the map.
 */
escher.Builder.prototype._updateFVAData = function _updateFVAData() {
    var updateModel = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    var updateMap = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var shouldDraw = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

    var _this8 = this;

    var kind = ['reaction'];
    var reactionDataObject = void 0;
    var geneDataObject = void 0;

    // -------------------
    // First map, and draw
    // -------------------

    // reaction data
    if (this.settings.get('reaction_data') && updateMap && this.map !== null) {
        reactionDataObject = importAndCheck(this.settings.get('reaction_data'), 'reaction_data');
        this.map.apply_fva_data_to_map(reactionDataObject);
        if (shouldDraw) {
            this.map.draw_all_reactions(false, false);
        }
    } else if (this.settings.get('gene_data') && updateMap && this.map !== null) {
        geneDataObject = this._makeGeneDataObject(this.settings.get('gene_data'), this.cobra_model, this.map);
        this.map.apply_gene_data_to_map(geneDataObject);
        if (shouldDraw) {
            this.map.draw_all_reactions(false, false);
        }
    } else if (updateMap && this.map !== null) {
        // clear the data
        this.map.apply_fva_data_to_map(null);
        if (shouldDraw) {
            this.map.draw_all_reactions(false, false);
        }
    }

    // ----------------------------------------------------------------
    // Then the model, after drawing. Delay by 5ms so the the map draws
    // first.
    // ----------------------------------------------------------------

    // If this function runs again, cancel the previous model update
    if (this.update_model_timer) {
        clearTimeout(this.update_model_timer);
    }

    var delay = 5;
    this.update_model_timer = setTimeout(function () {
        // reaction data
        if (_this8.settings.get('reaction_data') && updateModel && _this8.cobra_model !== null) {
            // if we haven't already made this
            if (!reactionDataObject) {
                reactionDataObject = importAndCheck(_this8.settings.get('reaction_data'), 'reaction_data');
            }
            _this8.cobra_model.apply_reaction_data(reactionDataObject, _this8.settings.get('reaction_styles'), _this8.settings.get('reaction_compare_style'));
        } else if (_this8.settings.get('gene_data') && updateModel && _this8.cobra_model !== null) {
            if (!geneDataObject) {
                geneDataObject = _this8._makeGeneDataObject(_this8.settings.get('gene_data'), _this8.cobra_model, _this8.map);
            }
            _this8.cobra_model.apply_gene_data(geneDataObject, _this8.settings.get('reaction_styles'), _this8.settings.get('identifiers_on_map'), _this8.settings.get('reaction_compare_style'), _this8.settings.get('and_method_in_gene_reaction_rule'));
        } else if (updateModel && _this8.cobra_model !== null) {
            // clear the data
            _this8.cobra_model.apply_reaction_data(null, _this8.settings.get('reaction_styles'), _this8.settings.get('reaction_compare_style'));
        }

        // callback
        _this8.callback_manager.run('update_data', null, updateModel, updateMap, kind, shouldDraw);
    }, delay);
};
