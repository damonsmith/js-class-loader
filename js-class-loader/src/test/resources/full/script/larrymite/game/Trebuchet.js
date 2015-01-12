namespace("larrymite.game");

larrymite.game.Trebuchet = function() {

	mite.game.Scenario.apply(this);
	
	this.sprites.ground = {img: null};
	this.sprites.targetzone = {img: null};
	
	this.manConnectedToChainJoint = null;
	
	this.chainLinkName = "chain3";
	this.jointName = "man-" + this.chainLinkName + "-joint";

	this.appEventAdapter.subscribe("tap", this.tapHandler, this);
	this.appEventAdapter.subscribe("keypress", this.handleKeyPress, this);
	this.appEventAdapter.subscribe("dragstart", this.handleStartDrag, this);
	this.appEventAdapter.subscribe("drag", this.handleDrag, this);
	this.appEventAdapter.subscribe("dragstop", this.handleStopDrag, this);
	this.appEventAdapter.subscribe("visibilitychange", this.handleVisibilityChange, this);
	
	this.zoomAndScrollEventHandler = new mite.game.event.ZoomAndScrollEventHandler(this.appEventAdapter);
	
	this.zoomAndScrollEventHandler.setWorldRenderer(this.worldRenderer);
	
	this.isDraggingBody = false;
	
	//this.reset();
	
	this.audio = new mite.audio.Audio();
	
	this.audio.samples.scream = new jssynth.Sample(sample_scream,
			{ bits: 8, channels: 2, signed: false, sampleRate: 16000, representedFreq: 16000, sampleLength: sample_scream.length/2, volume: 512},0);
	
	this.audio.start();
	
	this.hasStarted = false;
};

extend(larrymite.game.Trebuchet, mite.game.Scenario);

larrymite.game.Trebuchet.prototype.zoomToPerson = function() {
	this.worldRenderer.transitionTo(-1250, 0, 2, 30);
};

larrymite.game.Trebuchet.prototype.reset = function() {
	if (this.hasStarted) {
		this.stop();
	}
	else {
		this.hasStarted = true;
	}
	
	this.backgrounds.instructionsWeight.disabled = false;
	this.backgrounds.instructionsFire.disabled = false;
	this.backgrounds.slideHit.disabled = true;
	this.backgrounds.directHit.disabled = true;
	
	this.manConnectedToChainJoint = false;
	var worldData = this.svgConverter.convertSVGToWorldData(this.svg);
	this.worldRunner.load(worldData);
	this.worldRenderer.load(worldData);
	this.worldRunner.addContactSubscriber("head", "chain3", this.handleHeadChainContact, null, this);
	this.worldRunner.addContactSubscriber("head", "targetzone", this.handleHeadTargetZoneContact, null, this);
	this.worldRunner.addContactSubscriber("head", "boat", this.handleHeadBoatContact, null, this);
	
	this.start();
	this.hitTheGround = false;
};

larrymite.game.Trebuchet.prototype.handleHeadChainContact = function(body1, body2) {
	if (!this.manConnectedToChainJoint) {
		this.worldRunner.createDistanceJoint(body1, body2, this.jointName);
		this.manConnectedToChainJoint = true;
	}
};

larrymite.game.Trebuchet.prototype.handleHeadTargetZoneContact = function(body1, body2) {
	this.hitTheGround = true;
};

larrymite.game.Trebuchet.prototype.handleHeadBoatContact = function(body1, body2) {
	this.backgrounds.instructionsWeight.disabled = true;
	this.backgrounds.instructionsFire.disabled = true;
	
	if (this.hitTheGround) {
		body2.svgId = "sinking";
		this.backgrounds.slideHit.disabled = false;
	}
	else {
		body2.svgId = "explode";
		this.backgrounds.directHit.disabled = false;
	}
};

larrymite.game.Trebuchet.prototype.tapHandler = function(pos, numberOfTouches) {
	if (numberOfTouches === 3) {
		this.reset();
	}
	// else {
		// if (this.manConnectedToChainJoint) {
			// this.worldRunner.destroyJoint(this.jointName);
			// this.manConnectedToChainJoint = false;
			// this.audio.playSoundEffect("scream");
		// }	
	// }
};

larrymite.game.Trebuchet.prototype.handleKeyPress = function(e) {
	if (e.charCode == 114) {
		this.reset();
		return true;
	}
	else if (e.charCode == 97) {
		this.worldRunner.addForce("headsup", "boat", 0, -9000000);
	}
	else if (e.charCode == 98) {
		this.worldRunner.removeForce("headsup");
	}
	return false;
};

larrymite.game.Trebuchet.prototype.handleStartDrag = function(pos) {
	
	var worldPos = this.worldRenderer.getWorldCoordinatesFromPixelCoordinates(pos);
	
	if (this.worldRunner.dragBodyAtPosition(worldPos)) {
		this.isDraggingBody = true;
		this.zoomAndScrollEventHandler.setScrollingActive(false);
	}
};

larrymite.game.Trebuchet.prototype.handleDrag = function(drag) {
	if (this.isDraggingBody) {
		var worldPos = this.worldRenderer.getWorldCoordinatesFromPixelCoordinates(drag);
		this.worldRunner.dragBodyToPosition(worldPos);
	}
};

larrymite.game.Trebuchet.prototype.handleStopDrag = function(drag) {
	if (this.worldRunner) {
		this.worldRunner.removeDrag();
		this.isDraggingBody = false;
		this.zoomAndScrollEventHandler.setScrollingActive(true);
		console.debug("dragstop!");
		if (this.manConnectedToChainJoint) {
			console.debug("release!");
			this.worldRunner.destroyJoint(this.jointName);
			this.audio.playSoundEffect("scream");
		}	
	}
};

larrymite.game.Trebuchet.prototype.handleVisibilityChange = function(visible) {
	if (visible) {
		this.start();
		this.audio.start();
	}
	else {
		this.stop();
		this.audio.stop();
	}
};


