namespace("larrymite.scenario");

larrymite.scenario.Trebuchet = function() {
	larrymite.scenario.Scenario.apply(this);
	this.zoomAndScrollEventHandler = new larrymite.scenario.event.ZoomAndScrollEventHandler(this.appEventAdapter);
	
	this.audio = new larrymite.audio.Audio();
	
};

extend(larrymite.scenario.Trebuchet, larrymite.scenario.Scenario);

larrymite.scenario.Trebuchet.prototype.zoomToPerson = function() {
};

larrymite.scenario.Trebuchet.prototype.reset = function() {
	var extras = jssynth.webkitAudioContextMonkeyPatch();
	var nothing = new jssynth.Sample();
};



