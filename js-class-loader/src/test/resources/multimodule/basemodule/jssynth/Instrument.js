namespace("jssynth");

jssynth.Instrument = function(metadata, samples) {
    this.metadata = jssynth.Global.merge(jssynth.Instrument.DEFAULT_INSTRUMENT_METADATA, metadata);
    this.samples = samples;
};

jssynth.Instrument.DEFAULT_INSTRUMENT_METADATA = {
};