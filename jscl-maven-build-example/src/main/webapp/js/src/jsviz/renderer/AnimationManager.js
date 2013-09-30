namespace("jsviz");


jsviz.renderer.AnimationManager = function(ao, finishHandler) {
	this.finishHandler = finishHandler;
	this.animationObject = ao;
	this.defaultDivs = 220;
	this.slowScale = 1;
	this.defaultInterval = 10;
	this.frameCount = this.defaultDivs;
	this.prevTime = 0;
	
	var _this = this;
	this.closure = function(){ _this.tick(); } ;
};

jsviz.renderer.AnimationManager.prototype = {
	currentTime: function() {
		return (new Date()) - 0;
	},

	tick: function() {
		if (!this.animationObject || this.frameCount >= this.defaultDivs) {
			return false;
		}
		
		++this.frameCount;
		
		// frame skip
		var curT  = this.currentTime();
		var diffT = curT - this.prevTime;
		this.prevTime = curT;
		if (diffT > (this.defaultInterval*2)) {++this.frameCount;}
		if (diffT > (this.defaultInterval*3)) {++this.frameCount;}
		
		var t = this.frameCount / this.defaultDivs;
		
		this.animationObject.showFrame(t);
		if (t < 0.999) {
			setTimeout(this.closure, this.defaultInterval);
		} else {
			this.animationObject.finishAnimation();
			if (this.finishHandler) {this.finishHandler();}
		}
	},
	
	start: function() {
		if (this.animationObject.willStart) {
			this.changeDivs(
				this.animationObject.willStart() * this.slowScale
			);
		}
		
		this.prevTime = this.currentTime();
		this.frameCount = 0;
		setTimeout(this.closure, this.defaultInterval);
	},
	
	changeSlow: function(s) {
		this.slowScale = s;
	},
	
	changeDivs: function(d) {
		this.defaultDivs = d;
		this.frameCount  = d;
	},
			
	forceFinish: function() {
		if (this.frameCount < this.defaultDivs) {
			this.animationObject.showFrame(1);
			this.animationObject.finishAnimation();
		}
	}
};