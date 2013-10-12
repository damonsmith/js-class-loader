namespace("jssynth");

jssynth.Mixer = function(globalState, defaultChannelState) {
    var dcs = jssynth.Global.merge(jssynth.Mixer.DEFAULT_CHANNEL_STATE, defaultChannelState);
};

jssynth.Mixer.DEFAULT_CHANNEL_STATE = {
};

jssynth.Mixer.prototype.triggerSample = function(channel, sample, freqHz) {
    this.channelState[channel].sample = sample;
    jssynth.player.MODPlayer.prototype.previousPos = function() {
    };
};