namespace("larrymite.scenario");

larrymite.scenario.RocketLander = function() {
	larrymite.scenario.Scenario.apply(this);
	
	this.zoomAndScrollEventHandler = new larrymite.scenario.event.ZoomAndScrollEventHandler(this.appEventAdapter);
	this.rocketEffect = new larrymite.effect.ParticleFire(20);
};

extend(larrymite.scenario.RocketLander, larrymite.scenario.Scenario);

larrymite.scenario.RocketLander.prototype.reset = function() {
};
