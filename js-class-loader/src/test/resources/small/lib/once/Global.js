/*

 Copyright (c) 2013 David Gundersen

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions
 of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
 LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

/*
 * SAMPLE MIXER and related functionality
 */

namespace("jssynth");

/*
 * Core helper functions for JSynth
 */
jssynth.Global = {};

jssynth.Global.clone = function(obj) {
    var newObj = {};

    for(var key in obj) {
        if (obj.hasOwnProperty(key)) {
            newObj[key] = obj[key];
        }
    }
    return newObj;
};

jssynth.Global.merge = function(existingObj, toMerge) {
    var newObj = jssynth.Global.clone(existingObj);

    if (toMerge !== undefined && toMerge !== null) {
        for(var key in toMerge) {
            if (toMerge.hasOwnProperty(key)) {
                newObj[key] = toMerge[key];
            }
        }
    }
    return newObj;
};

jssynth.Global.makeArrayOf = function (value, length) {
    var arr = [], i = length;
    while (i--) {
        arr[i] = value;
    }
    return arr;
};

jssynth.Global.additiveSynth = function(length, sampleRate, baseFreq, harmonics, globalVolume, state) {
    var results = jssynth.Global.makeArrayOf(0.0, length);
    var synthState = state || {};

    if (synthState.ofs === undefined) {
        synthState.ofs = 0;
    }
    for (var h = 0 ; h < harmonics.length; h++) {
        var freq = baseFreq * harmonics[h].freqMul;
        freq = freq * harmonics[h].random;
        if (freq < (sampleRate / 2)) {
            var scale = Math.pow(10, harmonics[h].dB/10) * (globalVolume / 64);
            for (var i = 0 ; i < length; i++) {
                results[i] +=  Math.cos(2 * Math.PI * (freq / sampleRate) * (synthState.ofs+i)) * scale;
            }
        }
    }
    synthState.ofs += length;
    return results;
};
