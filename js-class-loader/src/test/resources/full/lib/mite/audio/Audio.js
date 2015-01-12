namespace("mite.audio");

mite.audio.Audio = function() {
	
	this.song = jssynth.player.MODLoader.readMODfile(module);

    this.mixer = new jssynth.Mixer({numChannels: 6 /* 4 for music, 2 for effects */ });
    this.player = new jssynth.player.MODPlayer(this.mixer);
    this.player.setSong(this.song);
	this.audioOut = new jssynth.WebAudioOutput(this.mixer, 4096);  /* 4096/8192/.. = buffer size */

	this.samples = {};//add samples into this map to use them.
	
};

mite.audio.Audio.prototype.start = function() {
	this.audioOut.start();
	this.enableMusic();
	this.enableSfx();
};

mite.audio.Audio.prototype.stop = function() {
	this.disableMusic();
	this.audioOut.stop();
};

mite.audio.Audio.prototype.disableMusic = function() {
    this.player.stop();
};

mite.audio.Audio.prototype.enableMusic = function() {
    this.player.start();
};

mite.audio.Audio.prototype.setSong = function(song) {
    this.disableMusic();
    this.player.setSong(song);
    this.enableMusic();
};

mite.audio.Audio.prototype.disableSfx = function() {
	this.mixer.disableChannels([4,5]);
};

mite.audio.Audio.prototype.enableSfx = function() {
	this.mixer.enableChannels([4,5]);
};

mite.audio.Audio.prototype.playSoundEffect = function(name, /*optional*/freq) {
	var sample = this.samples[name];
	if (!freq) {
		freq = sample.metadata.representedFreq;
	}
	this.mixer.triggerSample(4, sample, freq);
};





