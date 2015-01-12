namespace("jssynth");

jssynth.Instrument = function(metadata, samples) {
    this.metadata = jssynth.Global.merge(jssynth.Instrument.DEFAULT_INSTRUMENT_METADATA, metadata);
    this.samples = samples;
};

jssynth.Instrument.DEFAULT_INSTRUMENT_METADATA = {
    noteToSampleMap: [
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
    ],

    volumeType: 0,  // bit 0: On; 1: Sustain; 2: Loop
    volumeEnvelope: [],
    numVolumePoints: 0,
    volumeSustainPoint: 0,
    volumeLoopStartPoint: 0,
    volumeLoopEndPoint: 0,

    panningType: 0, // bit 0: On; 1: Sustain; 2: Loop
    panningEnvelope: [],
    numPanningPoints: 0,
    panningSustainPoint: 0,
    panningLoopStartPoint: 0,
    panningLoopEndPoint: 0,

    vibratoType: 0,  // ???
    vibratoSweep: 0,
    vibratoDepth: 0,
    vibratoRate: 0,

    volumeFadeout: 0
};/* ends with comment */