namespace("larrymite.game");

larrymite.game.RocketLander = function() {
	mite.game.Scenario.apply(this);
	this.svgList = document.getElementsByTagName("svg");
	this.appEventAdapter.subscribe("keydown", this.handleKeyDown, this);
	this.appEventAdapter.subscribe("keyup", this.handleKeyUp, this);
	this.appEventAdapter.subscribe("keypress", this.handleKeyPress, this);
	this.appEventAdapter.subscribe("tap", this.handleTap, this);
	
	this.zoomAndScrollEventHandler = new mite.game.event.ZoomAndScrollEventHandler(this.appEventAdapter);
	this.zoomAndScrollEventHandler.setWorldRenderer(this.worldRenderer);
	
	this.worldRunner.addContactSubscriber("rocket", "*", this.rocketImpact, null, this);

	this.gameEnded = false;
	
	
	this.rocketEffect = new mite.effect.ParticleFire(20);
};

extend(larrymite.game.RocketLander, mite.game.Scenario);

larrymite.game.RocketLander.prototype.reset = function() {
	if (this.running) {
		this.stop();
	}
	this.setup();
	this.simulationEnabled = false;
	this.start();
};

larrymite.game.RocketLander.prototype.setup = function() {
	this.gameEnded = false;
	this.backgrounds.instructions.disabled = false;
	var worldData = this.svgConverter.convertSVGToWorldData(this.svgList[0]);
	this.worldRunner.load(worldData);
	this.worldRenderer.load(worldData);
};

larrymite.game.RocketLander.prototype.handleKeyDown = function(e) {
	console.debug(e.keyCode);
	switch(e.keyCode) {
	case 37:
	case 65: this.worldRunner.addForce("rightRocket", "rightRocket", 100000, -1000000); break;
	case 38:
	case 87:
		if (!this.simulationEnabled) {
			this.simulationEnabled = true;
			this.backgrounds.instructions.disabled = true;
		}
		this.worldRunner.addForce("rocket", "rocket", 0, -3000000); 
		break;
	case 39:
	case 68: this.worldRunner.addForce("leftRocket", "leftRocket", -100000, -1000000);
	}
	this.worldRenderer.effects.rocket = this.rocketEffect;
};

larrymite.game.RocketLander.prototype.handleKeyUp = function(e) {
	switch(e.keyCode) {
	case 37:
	case 65: this.worldRunner.removeForce("rightRocket"); break;
	case 38:
	case 87: this.worldRunner.removeForce("rocket"); break;
	case 39:
	case 68: this.worldRunner.removeForce("leftRocket"); break;
	}
	this.worldRenderer.effects.rocket = null;
};

larrymite.game.RocketLander.prototype.handleKeyPress = function(e) {
	if (e.charCode == 114) {
		this.reset();
		return true;
	}
};

larrymite.game.RocketLander.prototype.handleTap = function(pos) {
	console.debug(this.worldRenderer.getWorldCoordinatesFromPixelCoordinates(pos));
};

larrymite.game.RocketLander.prototype.rocketImpact = function(body1, body2) {
	if (!this.gameEnded) {
		var impactVelocity = this.worldRunner.bodyMap.rocket.GetLinearVelocity().Normalize();
		console.debug("hit with force: " + impactVelocity);
		if (impactVelocity > 300) {
			body1.svgId = "explode";
			this.simulationEnabled = false;
		}
		else {
			if (body2.svgId === "landingPad") {
				console.debug("LAND!", body1.svgId, body2.svgId);	
			}
		}
		this.gameEnded = true;
	}
};

larrymite.game.RocketLander.prototype.handleCrash = function() {
	this.enableSimulation = false;
	
};

larrymite.game.RocketLander.prototype.handeLand = function() {
	this.enableSimulation = false;
	
};
