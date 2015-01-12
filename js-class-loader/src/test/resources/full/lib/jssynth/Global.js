/*

















 */line19
line20
/*
 * SAMPLE MIXER and related functionality
 */line23
line24
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
