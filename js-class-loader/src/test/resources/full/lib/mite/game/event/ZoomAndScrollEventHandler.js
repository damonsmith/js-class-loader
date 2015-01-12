namespace("mite.game.event");

/**
 * Designed to be used in a 2d canvas game.
 * 
 * Construct this class and pass it an appEventAdapter and give it a worldRenderer and
 * it will attach handlers that let the user zoom and scroll around the world using dragging,
 * pinching and mousewheel. 
 * 
 * @param {mite.event.AppEventAdapter} eventAdapter 
 */

mite.game.event.ZoomAndScrollEventHandler = function(appEventAdapter) {
	
	this.scrollingActive = true;
	
	appEventAdapter.subscribe("scroll", this.handleScroll, this);
	appEventAdapter.subscribe("drag", this.handleDrag, this);
	appEventAdapter.subscribe("pinch", this.handlePinch, this);
};

mite.game.event.ZoomAndScrollEventHandler.prototype.setScrollingActive = function(isActive) {
	this.scrollingActive = isActive;
};

mite.game.event.ZoomAndScrollEventHandler.prototype.setWorldRenderer = function(worldRenderer) {
	this.worldRenderer = worldRenderer;
};

mite.game.event.ZoomAndScrollEventHandler.prototype.handleScroll = function(amount, pos) {
	var scale = 1 - (amount/30);
	this.worldRenderer.scaleBy(scale, this.worldRenderer.getWorldCoordinatesFromPixelCoordinates(pos));
};

mite.game.event.ZoomAndScrollEventHandler.prototype.handleDrag = function(drag) {
	if (this.scrollingActive) {
		this.worldRenderer.translate(drag.dx / this.worldRenderer.currentScale, drag.dy / this.worldRenderer.currentScale);
	}
};

mite.game.event.ZoomAndScrollEventHandler.prototype.handlePinch = function(pinch) {
	var scale = 1 - (pinch.dl/100);
	if (scale > 0.9 && scale < 1.1) {
		this.worldRenderer.scaleBy(scale, this.worldRenderer.getWorldCoordinatesFromPixelCoordinates(pinch.pos));	
	}
};
