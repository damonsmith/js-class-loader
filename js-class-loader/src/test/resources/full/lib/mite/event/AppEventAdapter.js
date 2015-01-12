/**
 * (c) Damon Smith damon@larrymite.com.au
 * See LICENSE.html - GPLv3.
 */

namespace("mite.app.event");

/**
 * <p>
 * Use AppEventAdapter to convert the browser events received from a canvas into app
 * style events.
 * </p>
 * <p>
 * Use this class to subscribe not only to normal browser events, like mouseDown, touchEnd
 * but also provides some compatibility events: (tap is single click or touch) and derived events 
 * that require some calculation, like pinch, twist and scroll.
 * </p>
 * <p>
 * How to connect this to a canvas and disconnect it:
 * var eventAdapter = new mite.app.event.AppEventAdapter();<br />
 * eventAdapter.connectToElement(canvas); <br />
 * eventAdapter.disconnectFromCanvas(); <br />
 * </p>
 * <p>
 * How to subscribe to an event:
 * eventAdapter.subscribe("mousedown", this.handleMouseDown, this);
 * </p>
 * 
 * <p>
 * And your event handler:
 * MyClass.prototype.handleMouseDown = function(event) {
 * 	this.startDrawing();//or whatever
 * }
 * MyClass.prototype.handleDrag = function(drag) {
 * 	this.moveScreen(drag.dx, drag.dy);//(this is called with a "drag" argument with the x,y and the dx,dy movements.
 * }
 * </p>
 * 
 * <p>
 * What events you can subscribe to, and what they will call:
 * <br />
 * Native events:
 * <ul>
 *   <li>resize - event</li>
 *   <li>mousewheel - amount</li>
 *   <li>mousedown - event.button, pos: {x: number, y: number}, event</li>
 *   <li>mouseup - event.button, pos: {x: number, y: number}, event</li>
 *   <li>mouseleave - </li>
 *   <li>mousemove - pos: {x: number, y: number}</li>
 *   <li>touchstart - </li>
 *   <li>touchend - </li>
 *   <li>touchleave - </li>
 *   <li>touchmove - </li>
 *   <li>touchcancel - </li>
 *   <li>contextmenu - </li>
 *   <li>keydown - </li>
 *   <li>keyup - </li>
 *   <li>keypress - </li>
 *   <li>visibilitychange -  </li>
 * </ul>
 * Derived events:
 * <ul>
 *   <li>dragstart - mouse click and drag or single touch drag</li>
 *   <li>drag -  </li>
 *   <li>dragstop</li>
 *   <li>tap - abstraction of either a click or a touchscreen tap</li>
 *   <li>doubletap - abstraction of either a double click or a double touchscreen tap (2 in a quick succession, not two fingers at once)</li>
 *   <li>pinch - {l: number, dl: number} - l is current pinch length, dl is the change in the pinch length</li>
 *   <li>scroll - mouse wheel or two touch parallel movement </li>
 *   <li>twist - two finger touch twisting </li>
 * </ul>
 * </p>
 * 
 * @param canvas the canvas to listen to and adapt the events on.
 * @returns {mite.app.event.AppEventAdapter}
 */
mite.app.event.AppEventAdapter = function(element, events) {
	
	//number of pixels a mouse or touch can move
	//before it's no longer considered a "tap"
	this.tapDragTolerance = 5;
	
	//This is used to record the number of fingers that hit the screen during a tap.
	this.numberOfTouches = 0;
	
	this.lastTapTime = 0;
	
	this.browserEventListeners = {};
	
	this.subscribers = {
			//Native browser events
			resize: [],
			mousewheel: [],
			mousedown: [],
			mouseup: [],
			mouseleave: [],
			mousemove: [],
			touchstart: [],
			touchend: [],
			touchleave: [],
			touchmove: [],
			touchcancel: [],
			contextmenu: [],
			keydown: [],
			keyup: [],
			keypress: [],
			visibilitychange: [],
			
			//Derived events
			dragstart: [],
			drag: [], 
			dragstop: [],
			tap: [], 
			tapdown: [],
			tapup: [],
			doubletap: [],
			pinch: [], 
			scroll: [],
			twist: []
	};
	
	this.dragging = {active: false, x: 0, y: 0, hasDragged: false, tx: 0, ty: 0};

	this.distanceBetweenTouchPair = 0;

	// Set the name of the hidden property and the change event for visibility
	this.hidden = null; 
	this.visibilityChangeEventName = null;
	if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
		this.hidden = "hidden";
		this.visibilityChangeEventName = "visibilitychange";
	} else if (typeof document.mozHidden !== "undefined") {
		this.hidden = "mozHidden";
		this.visibilityChangeEventName = "mozvisibilitychange";
	} else if (typeof document.msHidden !== "undefined") {
		this.hidden = "msHidden";
		this.visibilityChangeEventName = "msvisibilitychange";
	} else if (typeof document.webkitHidden !== "undefined") {
		this.hidden = "webkitHidden";
		this.visibilityChangeEventName = "webkitvisibilitychange";
	}
	if (element) {
		this.connectToElement(element);
	}
};

mite.app.event.AppEventAdapter.prototype.connectToElement = function(canvas) {
	if (this.canvas != null) {
		throw "Error, adapter is already connected to a canvas. Please remove handlers first.";
	}
	this.canvas = canvas;
	var self = this;
	
	this.browserEventListeners.handleResize = function(event) {self.resize(event);};
	this.browserEventListeners.handleMouseWheel = function(event) {self.mouseWheel(event);};
	this.browserEventListeners.handleMouseDown = function(event) {self.mouseDown(event);};
	this.browserEventListeners.handleMouseUp = function(event) {self.mouseUp(event);};
	this.browserEventListeners.handleMouseLeave = function(event) {self.mouseLeave(event);};
	this.browserEventListeners.handleMouseMove = function(event) {self.mouseMove(event);};
	this.browserEventListeners.handleTouchStart = function(event) {self.touchStart(event);};
	this.browserEventListeners.handleTouchEnd = function(event) {self.touchEnd(event);};
	this.browserEventListeners.handleTouchLeave = function(event) {self.touchLeave(event);};
	this.browserEventListeners.handleTouchMove = function(event) {self.touchMove(event);};
	this.browserEventListeners.handleTouchCancel = function(event) {self.touchCancel(event);};
	this.browserEventListeners.handleContextMenu = function(event) {self.contextMenu(event);};
	this.browserEventListeners.handleKeyDown = function(event) {self.keyDown(event);};
	this.browserEventListeners.handleKeyUp = function(event) {self.keyUp(event);};
	this.browserEventListeners.handleKeyPress = function(event) {self.keyPress(event);};
	this.browserEventListeners.handleVisibilityChange = function(event) {self.visibilityChange(event);};
	
	window.addEventListener('resize', this.browserEventListeners.handleResize);
	window.addEventListener('mousewheel', this.browserEventListeners.handleMouseWheel);
	window.addEventListener('DOMMouseScroll', this.browserEventListeners.handleMouseWheel);
	canvas.addEventListener('mousedown', this.browserEventListeners.handleMouseDown);
	canvas.addEventListener('mouseup', this.browserEventListeners.handleMouseUp);
	canvas.addEventListener('mouseleave', this.browserEventListeners.handleMouseLeave);
	canvas.addEventListener('mousemove', this.browserEventListeners.handleMouseMove);
	canvas.addEventListener("touchstart", this.browserEventListeners.handleTouchStart);
	canvas.addEventListener("touchend", this.browserEventListeners.handleTouchEnd);
	canvas.addEventListener("touchleave", this.browserEventListeners.handleTouchLeave);
	canvas.addEventListener("touchmove", this.browserEventListeners.handleTouchMove);
	canvas.addEventListener("touchcancel", this.browserEventListeners.handleTouchCancel);
	canvas.addEventListener('contextmenu', this.browserEventListeners.handleContextMenu);
	window.addEventListener("keydown", this.browserEventListeners.handleKeyDown);
	window.addEventListener("keyup", this.browserEventListeners.handleKeyUp);
	window.addEventListener("keypress", this.browserEventListeners.handleKeyPress);
	document.addEventListener(this.visibilityChangeEventName, this.browserEventListeners.handleVisibilityChange);
};

mite.app.event.AppEventAdapter.prototype.disconnectFromCanvas = function() {
	var canvas = this.canvas;
	window.removeEventListener('resize', this.browserEventListeners.handleResize);
	window.removeEventListener('mousewheel', this.browserEventListeners.handleMouseWheel);
	window.removeEventListener('DOMMouseScroll', this.browserEventListeners.handleMouseWheel);
	canvas.removeEventListener('mousedown', this.browserEventListeners.handleMouseDown);
	canvas.removeEventListener('mouseup', this.browserEventListeners.handleMouseUp);
	canvas.removeEventListener('mouseleave', this.browserEventListeners.handleMouseLeave);
	canvas.removeEventListener('mousemove', this.browserEventListeners.handleMouseMove);
	canvas.removeEventListener("touchstart", this.browserEventListeners.handleTouchStart);
	canvas.removeEventListener("touchend", this.browserEventListeners.handleTouchEnd);
	canvas.removeEventListener("touchleave", this.browserEventListeners.handleTouchLeave);
	canvas.removeEventListener("touchmove", this.browserEventListeners.handleTouchMove);
	canvas.removeEventListener("touchcancel", this.browserEventListeners.handleTouchCancel);
	canvas.removeEventListener('contextmenu', this.browserEventListeners.handleContextMenu);
	window.removeEventListener("keydown", this.browserEventListeners.handleKeyDown);
	window.removeEventListener("keyup", this.browserEventListeners.handleKeyUp);
	window.removeEventListener("keypress", this.browserEventListeners.handleKeyPress);
	document.removeEventListener(this.visibilityChangeEventName, this.browserEventListeners.handleVisibilityChange);
	
	this.canvas = null;
};

mite.app.event.AppEventAdapter.prototype.resize = function(event) {
	this.callSubscribers("resize", [event]);
};


mite.app.event.AppEventAdapter.prototype.mouseDown = function(event) {
	if (this.hasSubscribersForEventList(["tapdown", "dragstart", "drag"])) {
		var pos = {x: event.pageX, y: event.pageY};
		this.startDrag(pos);
		this.callSubscribers("tapdown", [pos]);
		var args = [event.button, pos, event];
		this.callSubscribers("mousedown", args);
		
		return this.preventDefault(event);
	}
};

mite.app.event.AppEventAdapter.prototype.mouseUp = function(event) {
	if (this.hasSubscribersForEventList(["tapup", "tap", "dragend"])) {
		var pos = {x: event.pageX, y: event.pageY};
		if (this.wasATap()) {
			this.callSubscribers("tapup", [pos, event]);
			this.callSubscribers("tap", [pos, 1, event]);
		}

		if (this.dragging.active) {
			this.stopDrag();
		}
		
		var args = [event.button, pos, event];
		this.callSubscribers("mouseup", args);
		return this.preventDefault(event);
	}
};

mite.app.event.AppEventAdapter.prototype.mouseMove = function(event) {
	if (this.hasSubscribersForEventList(["drag", "mousemove"])) {
		var pos = {
			x: event.pageX,
			y: event.pageY
		};
	
		if (this.dragging.active) {
			this.drag(pos);
		}
		this.callSubscribers("mousemove", [pos]);
		return this.preventDefault(event);
	}
};

mite.app.event.AppEventAdapter.prototype.mouseLeave = function(event) {
	this.stopDrag();
	return this.preventDefault(event);
};

mite.app.event.AppEventAdapter.prototype.mouseWheel = function(event) {
	if (this.hasSubscribersForEventList(["scroll"])) {
		var pos = {
				x: event.pageX,
				y: event.pageY
		};
		
		var amount = event.detail;
		if (event.wheelDelta) {
			amount = event.wheelDelta / 40;
		}
		var args = [amount, pos];
	
		this.callSubscribers("mousewheel", args);
		this.callSubscribers("scroll", args);
		return this.preventDefault(event);
	}
};

mite.app.event.AppEventAdapter.prototype.contextMenu = function(event) {
	return this.preventDefault(event);
};

mite.app.event.AppEventAdapter.prototype.keyDown = function(event) {
	if (this.callSubscribers("keydown", [event])) {
		return this.preventDefault(event);	
	}
	return true;
};

mite.app.event.AppEventAdapter.prototype.keyUp = function(event) {
	if (this.callSubscribers("keyup", [event])) {
		return this.preventDefault(event);	
	}
	return true;
};

mite.app.event.AppEventAdapter.prototype.keyPress = function(event) {
	if (this.callSubscribers("keypress", [event])) {
		return this.preventDefault(event);	
	}
	return true;
};

mite.app.event.AppEventAdapter.prototype.touchStart = function(event) {
	if (this.hasSubscribersForEventList(["drag", "tapdown", "dragstart"])) {
		this.numberOfTouches = Math.max(this.numberOfTouches, event.touches.length);
		
		var pos = {
			x: event.changedTouches[0].pageX,
			y: event.changedTouches[0].pageY
		};
		
		prevDist = 0;
		this.startDrag(pos);
		
		this.callSubscribers("touchstart", [pos]);
		return this.preventDefault(event);
	}
};

mite.app.event.AppEventAdapter.prototype.touchMove = function(event) {
	if (this.hasSubscribersForEventList(["drag", "touchmove"])) {
		var pos;
		
		if (event.touches.length === 1) {
			pos = {
					x: event.changedTouches[0].pageX,
					y: event.changedTouches[0].pageY
			};
			this.drag(pos);
		}
		else if (event.touches.length === 2) {
			this.pinch(event);
		}
		this.callSubscribers("touchmove", [event]);
		return this.preventDefault(event);
	}
};

mite.app.event.AppEventAdapter.prototype.touchEnd = function(event) {
	if (this.hasSubscribersForEventList(["tap", "drag", "touchend", "dragend"])) {
		var time;
		var pos = {
			x: event.changedTouches[0].pageX,
			y: event.changedTouches[0].pageY
		};
	
		if (event.touches.length === 0 && this.wasATap()) {
			this.callSubscribers("tap", [pos, this.numberOfTouches]);
			this.checkAndDoubleTap(pos);
		}
		if (event.touches.length === 0) {
			this.numberOfTouches = 0;
		}
		this.stopDrag();
		this.callSubscribers("touchend", [pos]);
		return this.preventDefault(event);
	}
};

mite.app.event.AppEventAdapter.prototype.checkAndDoubleTap = function(pos) {
	time = (new Date()).getTime();
	if (time - this.lastTapTime < this.doubleTapThreshold) {
		this.callSubscribers("doubletap", [pos]);
	}
	this.lastTapTime = time;
};

mite.app.event.AppEventAdapter.prototype.touchLeave = function(event) {

	this.stopDrag();
	this.callSubscribers("touchleave", []);
	return this.preventDefault(event);
};

mite.app.event.AppEventAdapter.prototype.touchCancel = function(event) {

	this.stopDrag();
	this.callSubscribers("touchcancel", []);
	return this.preventDefault(event);
};

//Checks that the mouse or touch didn't move more than the tap drag tolerance.
mite.app.event.AppEventAdapter.prototype.wasATap = function() {
	if (!this.dragging.hasDragged) {
		return true;
	}
	else {
		return (Math.abs(this.dragging.tx) < this.tapDragTolerance) && (Math.abs(this.dragging.ty) < this.tapDragTolerance);
	}
};


mite.app.event.AppEventAdapter.prototype.pinch = function(event) {
	var dx2 = Math.pow(event.touches[0].pageX - event.touches[1].pageX,2);
	var dy2 = Math.pow(event.touches[0].pageY - event.touches[1].pageY,2);
	var dist = Math.sqrt(dx2, dy2);

	var pinch = {
		l: dist,
		dl: this.distanceBetweenTouchPair - dist,
		pos: {x: event.touches[0].pageX, y: event.touches[0].pageY}
	};
	this.distanceBetweenTouchPair = pinch.l;
	
	this.callSubscribers("pinch", [pinch]);
	return this.preventDefault(event);
};

mite.app.event.AppEventAdapter.prototype.startDrag = function(pos) {
	if (!this.dragging.active) {
		this.dragging.active = true;
		this.dragging.x = pos.x;
		this.dragging.y = pos.y;
		this.dragging.tx = 0;
		this.dragging.ty = 0;
		this.dragging.hasDragged = false;
		this.callSubscribers("dragstart", [pos]);
	}
};

mite.app.event.AppEventAdapter.prototype.drag = function(pos) {
	
	var drag = {
			x: pos.x,
			y: pos.y,
			dx: pos.x - this.dragging.x,
			dy: pos.y - this.dragging.y
	};
	
	this.dragging.x = pos.x;
	this.dragging.y = pos.y;
	
	//keep a running total:
	this.dragging.tx += drag.dx;
	this.dragging.ty += drag.dy;
	
	this.dragging.hasDragged = true;
	this.callSubscribers("drag", [drag]);
};

mite.app.event.AppEventAdapter.prototype.stopDrag = function() {
	this.dragging.active = false;
	this.callSubscribers("dragstop", []);
};

mite.app.event.AppEventAdapter.prototype.visibilityChange = function() {
	this.callSubscribers("visibilitychange", [!document[this.hidden]]);
};

mite.app.event.AppEventAdapter.prototype.hasSubscribersForEventList = function(eventList) {
	var i;
	for ( i = 0; i < eventList.length; i++) {
		if (this.subscribers[eventList[i]].length > 0) {
			return true;
		}
	}
	return false;
};

mite.app.event.AppEventAdapter.prototype.preventDefault = function(event) {
	if (event.preventDefault) {
		event.preventDefault();
	}
	return false;
};

mite.app.event.AppEventAdapter.prototype.subscribe = function(eventName, handler, scope, /*optional*/label) {
	this.subscribers[eventName].push({func: handler, scope: scope, label: label});
};

mite.app.event.AppEventAdapter.prototype.unsubscribe = function(eventName, handler, scope) {
	var i, subscriber;
	for (i=0; i<this.subscribers[eventName].length; i++) {
		subscriber = this.subscribers[eventName][i];
		if (subscriber.func === handler && subscriber.scope === scope) {
			this.subscribers[eventName].splice(i,1);
			return;
		}
	}
	if (console && console.error) {
		console.error("Can't remove subscriber, it is not subscribed. EventName: " + eventName + 
				", scope: ", scope, ", handler: " + handler);
	}
};

mite.app.event.AppEventAdapter.prototype.callSubscribers = function(eventName, arguments) {
	var i, subscriber, eventHandled = false;//key events use eventHandled to decide whether to preventDefault on key presses.
	for (i=0; i<this.subscribers[eventName].length; i++) {
		subscriber = this.subscribers[eventName][i];
		try {
			eventHandled = subscriber.func.apply(subscriber.scope, arguments);
		}
		catch (e) {
			if (console && console.log) {
				console.log("Error calling " + eventName + " subscriber, label: " + subscriber.label + "\n" + 
						"exception: ", e);	
			}
		}
	}
	return eventHandled;
};

mite.app.event.AppEventAdapter.prototype.destroy = function() {
	this.disconnectFromCanvas();
	this.browserEventListeners = null;
};