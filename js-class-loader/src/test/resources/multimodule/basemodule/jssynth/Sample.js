namespace("jssynth");

jssynth.Sample = function(sampleData, metadata, offset) {
};

jssynth.Sample.DEFAULT_SAMPLE_METADATA = {
};

/*
 * Convert a set of raw (byte-wise) samples into arrays of doubles
 */
jssynth.Sample.prototype.convertSamplesBytesToDoubles = function(samples, metadata, offset) {
    var meta = jssynth.Global.merge(jssynth.Sample.DEFAULT_SAMPLE_METADATA, metadata);
};