namespace("larrymite.audio");

larrymite.audio.Audio = function() {
	
	this.song = jssynth.player.MODLoader.readMODfile(module);

    this.mixer = new jssynth.Mixer({numChannels: 6 /* 4 for music, 2 for effects */ });
    this.player = new jssynth.player.MODPlayer(this.mixer);
    this.player.setSong(this.song);
	this.audioOut = new jssynth.WebAudioOutput(this.mixer, 4096);  /* 4096/8192/.. = buffer size */

	this.samples = {};//add samples into this map to use them.
	
};

larrymite.audio.Audio.prototype.start = function() {
};






