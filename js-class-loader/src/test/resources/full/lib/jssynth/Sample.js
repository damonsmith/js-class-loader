namespace("jssynth");

jssynth.Sample = function(sampleData, metadata, offset) {
    if (typeof sampleData === 'function') {
        this.data = sampleData();
    } else {
        this.data = this.convertSamplesBytesToDoubles(sampleData, metadata, offset);
    }
    this.metadata = jssynth.Global.merge(jssynth.Sample.DEFAULT_SAMPLE_METADATA, metadata);
    if (this.metadata.repeatType !== 'NON_REPEATING') {
        for (var c = 0; c < this.data.length; c++) {
            this.data[c][metadata.repeatEnd+1] = this.data[c][metadata.repeatEnd];
        }
    }
};

jssynth.Sample.DEFAULT_SAMPLE_METADATA = {
    name: "",
    bits: 24,
    channels: 2,
    little_endian: true,
    delta_encoding: false,
    signed: true,
    sampleRate: 44100,
    representedFreq: 440,  /* the frequency that this sample will produce if played at it's sample rate */
    pitchOfs: 1,
    repeatType: 'NON_REPEATING',
    volume: 64,
    repeatStart: 0,
    repeatEnd: 0,
    sampleLength: 0
};

/*
 * Convert a set of raw (byte-wise) samples into arrays of doubles
 */
jssynth.Sample.prototype.convertSamplesBytesToDoubles = function(samples, metadata, offset) {
    var startOfs = offset || 0;
    var channelData = [];
    var rawData = [];
    var meta = jssynth.Global.merge(jssynth.Sample.DEFAULT_SAMPLE_METADATA, metadata);
    for (var chan = 0; chan < meta.channels; chan++) {
        channelData[chan] = [];
        rawData[chan] = [];
    }
    if (meta.bits % 8 !== 0 || meta.bits > 24) {
        console.log("can only read 8, 16 or 24-bit samples");
        return channelData;
    }
    var bytesPerSample = meta.bits / 8;
    var bytesPerSamplePeriod = bytesPerSample * meta.channels;
    var periodsToRead = metadata.sampleLength;
    for (var i = 0 ; i < periodsToRead; i++) {
        var ofs = bytesPerSamplePeriod * i;
        for (var chan = 0; chan < meta.channels; chan++) {
            var chanOfs = ofs + chan * bytesPerSample;
            var startBytePos = chanOfs + (meta.little_endian ? (bytesPerSample-1) : 0);
            var endBytePos = chanOfs + (meta.little_endian ? -1 : bytesPerSample);
            var bytePosDelta = (meta.little_endian ? -1 : 1);
            var data = 0;
            var scale = 0.5;
            var mask = 255;
            for (var bytePos = startBytePos; bytePos !== endBytePos; bytePos += bytePosDelta) {
                data = data * 256 + samples.charCodeAt(startOfs+bytePos);
                scale = scale * 256;
                mask = mask * 256 + 255;
            }
            if (meta.signed) {
                /* samp XOR 0x8000 & 0xffff converts from signed to unsigned */
                data = (data ^ scale) & mask;
            }
            if (meta.delta_encoding) {
                var previousVal = ((i == 0) ? 0x00 : rawData[chan][i-1]);
                rawData[chan][i] = (previousVal + ((data^scale)&mask)) & 0xff;
                channelData[chan][i] = (((rawData[chan][i] ^ scale) & mask) - scale) / scale;
            } else {
                data = (data - scale) / scale;
                channelData[chan][i] = data;
            }
        }
    }
    return channelData;
};