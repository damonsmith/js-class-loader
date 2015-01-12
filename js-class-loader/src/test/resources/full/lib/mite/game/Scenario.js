namespace("mite.game");

/**
 * This class is only concerned with the general tasks of starting a Box2D-SVG-JSSynth-Game scenario.
 * 
 * Extend this class to create a game.
 * 
 * @returns {mite.game.Scenario}
 */
mite.game.Scenario = function() {
	this.frameRate = 60;
	this.sprites = {};
	this.backgrounds = {};
	this.fixedImages = {};
	this.loadImages();
	
	//Load the first svg and the first canvas by default.
	this.svg = document.getElementsByTagName("svg")[0];
	this.canvas = document.getElementsByTagName("canvas")[0];
	
	this.svgConverter = new mite.box2d.SVGToBox2D();
	this.worldRunner = new mite.box2d.WorldRunner();
	this.worldRenderer = new mite.box2d.WorldRenderer(this.canvas);
	this.worldRenderer.images = this.sprites;
	this.worldRenderer.backgroundImages = this.backgrounds;
	this.worldRenderer.fixedImages = this.fixedImages;
	
	this.appEventAdapter = new mite.app.event.AppEventAdapter(this.canvas);
	
	this.simulationEnabled = true;
	this.renderingEnabled = true;
};

mite.game.Scenario.prototype.loadImages = function() {

	this.addImagesFromContainer(document.getElementById("sprites"), this.sprites);
	this.addImagesFromContainer(document.getElementById("backgrounds"), this.backgrounds);
	this.addImagesFromContainer(document.getElementById("fixed"), this.fixed);
};

/**
 * Start/unpause the game loop
 */
mite.game.Scenario.prototype.start = function() {
	this.running = true;
	var self = this;
	this.runningInterval = setInterval(function() {self.step();}, Math.round(1000/self.frameRate));
};

/**
 * Pause the game loop
 */
mite.game.Scenario.prototype.stop = function() {
	clearInterval(this.runningInterval);
	this.running = false;
};

/**
 * Internal. Steps the world forward and draws it
 */
mite.game.Scenario.prototype.step = function() {
	if (this.simulationEnabled) {
		this.worldRunner.step();
	}
	if (this.renderingEnabled) {
		this.worldRenderer.drawWorld(this.worldRunner.world);	
	}
	
};

/**
 * Internal. Utility to generate the sprite list from the html page contents.
 * 
 * @param containerElem a DOM element that contains the game images to read in.
 * @param imageMap map of image names to settings {name: {img: Element, scale: number, pos: Position, disabled: boolean},...} 
 */
mite.game.Scenario.prototype.addImagesFromContainer = function(containerElem, imageMap) {
	if (containerElem) {
		var i, img, imageElements = containerElem.getElementsByTagName("img");
		for (i=0; i<imageElements.length; i++) {
			img = imageElements[i];
			if (img.id) {
				imageMap[img.id] = this.convertImageToEntry(img);
			}
		}
	}
};

/**
 * Internal converter from a DOM image element into a sprite or background image list entry.
 * @param img Element to convert
 * @returns image entry object {img: Element, scale: number, pos: Position, disabled: boolean}
 */
mite.game.Scenario.prototype.convertImageToEntry = function(img) {
	var scaleAttr, posAttr, posParts, disabledAttr;
	var entry = {img: img};
	scaleAttr = img.getAttribute("data-scale");
	if (scaleAttr) {
		entry.scale = scaleAttr * 1;
	}
	posAttr = img.getAttribute("data-pos");
	if (posAttr) {
		posParts = posAttr.split(",");
		entry.x = posParts[0] * 1;
		entry.y = posParts[1] * 1;
	}
	disabledAttr = img.getAttribute("data-disabled");
	if (disabledAttr && disabledAttr === "true") {
		entry.disabled = true;
	}
	return entry;
};