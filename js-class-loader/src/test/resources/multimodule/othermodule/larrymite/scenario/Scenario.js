namespace("larrymite.scenario");

larrymite.scenario.Scenario = function() {
	this.svgConverter = new larrymite.svg.SVGToBox2D();
	this.worldRunner = new larrymite.box2d.WorldRunner();
	this.worldRenderer = new larrymite.box2d.WorldRenderer(this.canvas);
	this.appEventAdapter = new larrymite.app.event.AppEventAdapter(this.canvas);
};

larrymite.scenario.Scenario.prototype.loadImages = function() {
};

