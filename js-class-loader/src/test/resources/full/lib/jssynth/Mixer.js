namespace("jssynth");

jssynth.Mixer = function(globalState, defaultChannelState) {
    this.globalState = jssynth.Global.merge({
        numChannels: 8,
        volume: 64,
        secondsPerMix: 0.1,
        filters: null
    }, globalState);
    this.preMixCallback = null;
    this.preMixObject = null;
    this.channelState = [];
    var dcs = jssynth.Global.merge(jssynth.Mixer.DEFAULT_CHANNEL_STATE, defaultChannelState);
    for (var chan = 0; chan < this.globalState.numChannels; chan++) {
        this.channelState[chan] = jssynth.Global.clone(dcs);
    }
};

jssynth.Mixer.DEFAULT_CHANNEL_STATE = {
    panPos: 0,  /* -1 = full left, +1 = full right */
    playbackFreqHz: 0,
    sample: undefined,
    samplePosition: -1,
    volume: 64,
    enabled: true
};



/**
 * Set the callback to be called prior to mixing the next batch of samples
 * @param preMixCallback
 */
jssynth.Mixer.prototype.setPreMixCallback = function(f, c) {
    this.preMixCallback = f;
    this.preMixObject = c;
};

jssynth.Mixer.prototype.setGlobalVolume = function(vol) {
    this.globalState.volume = vol;
};

/**
 * Set the number of seconds worth of data to return from each mix() call
 * @param secondsPerMix
 */
jssynth.Mixer.prototype.setSecondsPerMix = function(secondsPerMix) {
    this.globalState.secondsPerMix = secondsPerMix;
};

/**
 * Trigger a sample to start playing on a given channel
 * @param channel channel to play the sample on
 * @param sample sample to play
 * @param freqHz frequency (absolute) to play the sample at
 */
jssynth.Mixer.prototype.triggerSample = function(channel, sample, freqHz) {
    this.channelState[channel].sample = sample;
    this.channelState[channel].playbackFreqHz = freqHz;
    this.channelState[channel].samplePosition = 0;
    this.channelState[channel].volume = sample.metadata.volume;
};

jssynth.Mixer.prototype.enableChannels = function(channels) {
    for (var i = 0; i < channels.length ; i++) {
        this.channelState[channels[i]].enabled = true;
    }
};

jssynth.Mixer.prototype.disableChannels = function(channels) {
    for (var i = 0; i < channels.length ; i++) {
        this.channelState[channels[i]].enabled = false;
    }
};
/**
 * Set sample without updating any other params
 * @param channel channel to play the sample on
 * @param sample sample to play
 * @param freqHz frequency (absolute) to play the sample at
 */
jssynth.Mixer.prototype.setSample = function(channel, sample) {
    this.channelState[channel].sample = sample;
};

/**
 * Set the current position/offset of the sample playing on a given channel
 * @param channel
 * @param offset
 */
jssynth.Mixer.prototype.setSamplePosition = function(channel, offset) {
    var sample = this.channelState[channel].sample;
    if (sample) {
        var length = sample.metadata.sampleLength;
        if (sample.metadata.repeatType !== 'NON_REPEATING') {
            var repStart = sample.metadata.repeatStart;
            var repEnd = sample.metadata.repeatEnd;
            var repLen = repEnd - repStart;
            while (offset > length) {
                offset -= repLen;
            }
        }
        if (offset < length) {
            this.channelState[channel].samplePosition = offset;
        } else {
            this.channelState[channel].samplePosition = -1;
        }
    }
};

/**
 * Change the frequency of a sample playing on a given channel
 * @param channel
 * @param freqHz
 */
jssynth.Mixer.prototype.setFrequency = function(channel, freqHz) {
    this.channelState[channel].playbackFreqHz = freqHz;
};

/**
 * Change the volume of a sample playing on a given channel
 * @param channel
 * @param vol
 */
jssynth.Mixer.prototype.setVolume = function(channel, vol) {
    this.channelState[channel].volume = vol;
};

/**
 * Change the L/R mix for a given channel (-1 = full left, +1 = full right)
 * @param channel
 * @param panPos
 */
jssynth.Mixer.prototype.setPanPosition = function(channel, panPos) {
    this.channelState[channel].panPos = panPos;
};

/**
 * (Immediately) cut playback of a sample playing on a given channel
 * @param channel
 */
jssynth.Mixer.prototype.cut = function(channel) {
    this.channelState[channel].samplePosition = -1;
    this.channelState[channel].sample = undefined;
};

/**
 * Set globally applied filters (array, 0 = left filter, 1 = right filter)
 * @param filters
 */

jssynth.Mixer.prototype.setFilters = function(filters) {
    if (filters) {
        this.globalState.filters = filters;
    } else {
        this.globalState.filters = null;
    }
};



/* TODO; not sure if things need to get this complicated for now */
jssynth.Mixer.prototype.calculatePanMatrix = function(pp) {
    if (pp >= -1 && pp <= 1) {
        var pp = (pp + 1) / 2;   /* shift values from -1 to 1, to be in the range 0..1 (left -> right) */
        return {
            ll: 1-pp, /* left channel, % left mix */
            lr: 0, /* left channel, % right mix - TODO */
            rl: 0, /* right channel, % left mix */
            rr: pp  /* right channel, % right mix - TODO */
        };
    } else {
        return {ll: 1, rr: -1 };  /* surround */
    }
};

jssynth.Mixer.STEP_FUNCS = {  /* step through the sample, key is "repeatType" flag */
    'REP_NORMAL': function(samplePos, samplePosStep, repEnd, repLen) {
        samplePos += samplePosStep;
        while (samplePos >= repEnd) {
            samplePos -= repLen;
        }
        return samplePos;
    },
    'NON_REPEATING': function(samplePos, samplePosStep) {
        return samplePos + samplePosStep;
    }
};

jssynth.Mixer.prototype.mix = function(sampleRate) {
    if (this.preMixCallback) {
        this.preMixCallback.call(this.preMixObject, this, sampleRate);
    }
    var i = 0, chan = 0;
    var output = [];
    var numSamples = Math.floor(sampleRate * this.globalState.secondsPerMix);
    output[0] = jssynth.Global.makeArrayOf(0.0, numSamples); /* left */
    output[1] = jssynth.Global.makeArrayOf(0.0, numSamples); /* right */
    var numChannels = this.globalState.numChannels;
    var globalVolume = this.globalState.volume;
    for (chan = 0; chan < numChannels; chan++) {
        var state = this.channelState[chan];
        if (!state.enabled) {
            break;
        }

        var panPos = this.calculatePanMatrix(state.panPos);
        var sample = state.sample;

        var channelVolume = state.volume;
        var samplePos = state.samplePosition;
        var samplePosStep = state.playbackFreqHz / sampleRate;
        var scale = (1 / (numChannels / 2)) * (globalVolume / 64) * (channelVolume / 64);
        var leftScale = scale * panPos.ll;
        var rightScale = scale * panPos.rr;
        if (sample && sample.data[0] && samplePos >= 0 && samplePosStep > 0) {
            var leftSampleData = sample.data[0];
            var rightSampleData = sample.data[1] || sample.data[0]; /* mix in mono if that's all we've got */
            var sampleLength = sample.metadata.sampleLength;
            var repStart = sample.metadata.repeatStart;
            var repEnd = sample.metadata.repeatEnd;
            var repLen = repEnd - repStart;
            var stepFunc = jssynth.Mixer.STEP_FUNCS[sample.metadata.repeatType];
            for (i = 0; (i < numSamples) && (samplePos < sampleLength); i++) {
                output[0][i] += (leftSampleData[Math.floor(samplePos)] * leftScale);
                output[1][i] += (rightSampleData[Math.floor(samplePos)] * rightScale);
                samplePos = stepFunc(samplePos, samplePosStep, repEnd, repLen);
            }
        }
        state.samplePosition = samplePos;
    }
    if (this.globalState.filters) {
        var filters = this.globalState.filters;
        for (var i = 0; i < numSamples; i++) {
            output[0][i] = filters[0].next(output[0][i]);
            output[1][i] = filters[1].next(output[1][i]);
        }
    }
    return {
        bufferSize: numSamples,
        output: output
    };
};