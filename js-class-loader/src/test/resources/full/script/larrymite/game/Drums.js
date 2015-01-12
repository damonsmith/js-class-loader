namespace("larrymite.game");

larrymite.game.Drums = function() {
	mite.game.Scenario.apply(this);
	
	this.sprites.head = {img: null};
	this.sprites.leftstickhead = {img: null};
	this.sprites.rightstickhead = {img: null};
	this.sprites.cymbal = {img: null};
	this.sprites.hihat = {img: null};
	this.sprites.kick = {img: null};
	this.sprites.snare = {img: null};
	this.sprites.tom = {img: null};
	this.sprites.floor = {img: null};
	
	this.appEventAdapter.subscribe("keydown", this.handleKeyDown, this);
	this.appEventAdapter.subscribe("keyup", this.handleKeyUp, this);
	this.appEventAdapter.subscribe("keypress", this.handleKeyPress, this);
	this.appEventAdapter.subscribe("touchstart", this.handleTouchStart, this);
	this.appEventAdapter.subscribe("touchend", this.handleTouchEnd, this);
	
//	this.zoomAndScrollEventHandler = new larrymite.game.event.ZoomAndScrollEventHandler(this.appEventAdapter);
//	this.zoomAndScrollEventHandler.setZoomingActive(false);
//	this.zoomAndScrollEventHandler.setWorldRenderer(this.worldRenderer);
	
	this.worldRunner.addContactSubscriber("leftstickhead", "cymbal", this.cymbal, null, this);
	this.worldRunner.addContactSubscriber("leftstickhead", "hihat", this.hihat, null, this);
	this.worldRunner.addContactSubscriber("leftstickhead", "snare", this.snareleft, null, this);
	this.worldRunner.addContactSubscriber("rightstickhead","snare", this.snareright, null, this);
	this.worldRunner.addContactSubscriber("rightstickhead", "tom", this.tom, null, this);
	
	this.hasStarted = false;
	this.gameEnded = false;

    /* read window.samples (loaded from the drum kit .js file), and convert raw data to jssynth samples */
    var newSamples = {};
    for (var sampleName in window.samples) {
        if (sampleName.slice(-4) === '.raw' && samples.hasOwnProperty(sampleName)) {
            var rawSampleData = atob(window.samples[sampleName]);
            newSamples[sampleName.slice(0,-4)] = new jssynth.Sample(rawSampleData, {
                representedFreq: 44100,
                sampleLength: rawSampleData.length / 6,  /* 6 bytes => 3 bytes left, 3 bytes right @ 24-bits per channel */
                name: sampleName.slice(0,-4)
            });
        }
    }
    window.samples = undefined;
    this.drumKit = newSamples;

    this.mixer = new jssynth.Mixer({numChannels: 5 /* one for each drum */ });
    this.mixer.setSecondsPerMix(0.02); /* 50Hz */

    /* all channels centred (although samples are stereo, so this doesn't mean "mono") */
    this.mixer.setPanPosition(0, 0);
    this.mixer.setPanPosition(1, 0);
    this.mixer.setPanPosition(2, 0);
    this.mixer.setPanPosition(3, 0);
    this.mixer.setPanPosition(4, 0);

    this.audioOut = new jssynth.WebAudioOutput(this.mixer, 2048);  /* 4096/8192/.. = buffer size */
    this.audioOut.start();
    this.reset();
};

extend(larrymite.game.Drums, mite.game.Scenario);

larrymite.game.Drums.prototype.reset = function() {
	this.gameEnded = false;
	if (this.hasStarted) {
		this.stop();
	}
	else {
		this.hasStarted = true;
	}
	
	var worldData = this.svgConverter.convertSVGToWorldData(this.svg);
	this.worldRunner.load(worldData);
	this.worldRenderer.load(worldData);
	this.start();
};

larrymite.game.Drums.prototype.handleKeyDown = function(e) {
	switch(e.keyCode) {
	case 81: this.worldRunner.addForce("leftupperarm", "leftupperarm", 0, -5000000); break;
	case 87: this.worldRunner.addForce("leftlowerarm", "leftlowerarm", 0, -5000000); break;
	case 79: this.worldRunner.addForce("rightupperarm", "rightupperarm", 0, -5000000); break;
	case 80: this.worldRunner.addForce("rightlowerarm", "rightlowerarm", 0, -5000000); break;
	}
};

larrymite.game.Drums.prototype.handleKeyUp = function(e) {
	switch(e.keyCode) {
	case 81: this.worldRunner.removeForce("leftupperarm"); break;
	case 87: this.worldRunner.removeForce("leftlowerarm"); break;
	case 79: this.worldRunner.removeForce("rightupperarm"); break;
	case 80: this.worldRunner.removeForce("rightlowerarm"); break;addForce
	}
	this.worldRenderer.effects.rocket = null;
};

larrymite.game.Drums.prototype.handleKeyPress = function(e) {
	if (e.charCode == 114) {
		this.reset();
		return true;
	}
};

larrymite.game.Drums.prototype.handleTouchStart = function(pos) {
	if (pos.x < this.canvas.width/2) {
		if (pos.y < this.canvas.height/2) {
			this.worldRunner.addForce("leftupperarm", "leftupperarm", 0, -5000000);
		}
		else {
			this.worldRunner.addForce("leftlowerarm", "leftlowerarm", 0, -5000000);
		}
	}
	else {
		if (pos.y < this.canvas.height/2) {
			this.worldRunner.addForce("rightupperarm", "rightupperarm", 0, -5000000);
		}
		else {
			this.worldRunner.addForce("rightlowerarm", "rightlowerarm", 0, -5000000);
		}
	}
};


larrymite.game.Drums.prototype.handleTouchEnd = function(pos) {
	if (pos.x < this.canvas.width/2) {
		if (pos.y < this.canvas.height/2) {
			this.worldRunner.removeForce("leftupperarm");
		}
		else {
			this.worldRunner.removeForce("leftlowerarm");
		}
	}
	else {
		if (pos.y < this.canvas.height/2) {
			this.worldRunner.removeForce("rightupperarm");
		}
		else {
			this.worldRunner.removeForce("rightlowerarm");
		}
	}
};

larrymite.game.Drums.prototype.cymbal = function(body1, body2) {
    var force = Math.round(body1.GetLinearVelocity().Normalize());
	console.debug("cymbal, force: " + force);
    var volume = force / 5;
    this.mixer.triggerSample(2, this.drumKit["Crash"], 44100);
    this.mixer.setVolume(2, volume);
};

larrymite.game.Drums.prototype.hihat = function(body1, body2) {
    var force = Math.round(body1.GetLinearVelocity().Normalize());
	console.debug("hihat, force: " + force);
    var volume = force / 5;
    this.mixer.triggerSample(3, this.drumKit["ClosedHiHat"], 44100);
    this.mixer.setVolume(3, volume);
    // depending on whether the pedal was pressed or not
    //this.mixer.triggerSample(3, this.drumKit["OpenHiHat"], 44100);
};
larrymite.game.Drums.prototype.snareleft = function(body1, body2) {
    var force = Math.round(body1.GetLinearVelocity().Normalize());
	console.debug("snare hit with left stick, force: " + force);
    var volume = force / 5;
    this.mixer.triggerSample(1, this.drumKit["Snare"], 44100);
    this.mixer.setVolume(1, volume);
};
larrymite.game.Drums.prototype.snareright = function(body1, body2) {
    var force = Math.round(body1.GetLinearVelocity().Normalize());
	console.debug("snare hit with right stick, force: " + force);
    var volume = force / 5;
    this.mixer.triggerSample(4, this.drumKit["Snare"], 44100);
    this.mixer.setVolume(4, volume);
};
larrymite.game.Drums.prototype.tom = function(body1, body2) {
    var force = Math.round(body1.GetLinearVelocity().Normalize());
	console.debug("tom hit, force: " + force);
    var volume = force / 5;
    this.mixer.triggerSample(0, this.drumKit["Tom1"], 44100);
    this.mixer.setVolume(0, volume);
};


