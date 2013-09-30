namespace("jsviz.renderer");

jsviz.renderer.GVEdge = function(pEdge, n1, n2) {
	this.pointer  = pEdge;
	this.elements = null;
	this.penColor = null;
	this.nodeFrom = n1;
	this.nodeTo   = n2;
	this.rawSplineArray = null;
	this.splineList = null;
	this.arrowVector = new Vec2();
	this.edgeTween = null;
	this.labelTween = {
		type: 0,
		ref: null,
		willChange: false,
		phase: 0
	};
	
	this.eflag = 0;
	this.pen = 0;
	this.animatedCurve = null;
	this.tweenSchedule = instantiateTweenSchedule();
	this.label = null;
}

jsviz.renderer.GVEdge.ET_EMERGE    = 0;
jsviz.renderer.GVEdge.ET_MOVE      = 1;
jsviz.renderer.GVEdge.ET_DISAPPEAR = 2;

jsviz.renderer.GVEdge.prototype = {
	createEdgeTween: function(animationType, refEdgeOrOffset) {
		var twn;
		if (animationType == jsviz.renderer.GVEdge.ET_EMERGE) {
			var minEdge = this.createStraight(this.firstPoint(), this.lastPoint(), 0.1, refEdgeOrOffset);
			twn = this.createTween(minEdge, this.makeCurve(), true);
		} else if (animationType == jsviz.renderer.GVEdge.ET_MOVE) {
			twn = this.createTween(refEdgeOrOffset.makeCurve(), this.makeCurve());
		} else {
			twn = this.createFadeOutTween(this.makeCurve());
		}
		
		this.edgeTween = twn;
		this.animatedCurve = new jsviz.renderer.Curve();

		this.labelTween.type = animationType;
		this.labelTween.phase = 0;
		if (animationType == jsviz.renderer.GVEdge.ET_MOVE) {
			this.labelTween.ref = refEdgeOrOffset.label;
			this.labelTween.willChange = this.isLabelChanged(refEdgeOrOffset);
		} else {
			this.labelTween.willChange = true;
		}
		
		return twn;
	},

	isLabelChanged: function(refEdge) {
		var L1 = this.label;
		var L2 = refEdge.label;
	
		if (!L1 && !L2) {return false;}
		if (!L1 && L2) {return true;}
		if (L1 && !L2) {return true;}
		
		return (L1.text != L2.text) || 
		       (L1.fontSize != L2.fontSize);
	},

	removeTween: function() {
		this.edgeTween = null;
	},
	
	makeCurve: function() {
		var cv = new jsviz.renderer.Curve();
		var ls = this.splineList;
		var len = ls.length;
		
		for (var i = 0;i < len;i++) {
			var spl = ls[i];
			for (var j = 0;j < spl.length;j++) {
				var pt = spl[j];
				cv.add(pt);
			}
		}
		
		return cv;
	},
	
	tweenLabel: function(t, moveTweenFunc) {
		var el = this.elements.label;
		var refLabel = this.label; 
		if (this.labelTween.type == jsviz.renderer.GVEdge.ET_MOVE && t < 0.5) {
			refLabel = this.labelTween.ref;
		}

		if (this.labelTween.type == jsviz.renderer.GVEdge.ET_MOVE && t >= 0.5 && this.labelTween.phase == 0) {
			el.firstChild.nodeValue = this.label ? this.label.text : ' ';
			jsviz.renderer.GraphNodeRenderer.setEdgeLabelStyle(el, this.label);
			this.labelTween.phase = 1;
		}
		
		if (el && refLabel) {
			if (this.labelTween.willChange || this.labelTween.type == jsviz.renderer.GVEdge.ET_DISAPPEAR) {
				var alpha = (t-0.5) * 2.0;
				if (this.labelTween.type == jsviz.renderer.GVEdge.ET_MOVE) {
					if (alpha < 0) { alpha = -alpha; }
				} else if (this.labelTween.type == jsviz.renderer.GVEdge.ET_DISAPPEAR) {
					alpha = 1.0 - alpha;
				}
				
				if (alpha<0){alpha=0;}
				else if (alpha>1){alpha=1;}
				
				el.style.opacity = validateAlpha(alpha);
			}
			
			
			if (this.label) {
				var sx2 = this.label.x;
				var sy2 = this.label.y + jsviz.renderer.GraphNodeRenderer.fontYPosition(this.label.fontSize);
				if (this.labelTween.type == jsviz.renderer.GVEdge.ET_MOVE && this.labelTween.ref) {
					var sx1 = this.labelTween.ref.x;
					var sy1 = this.labelTween.ref.y + jsviz.renderer.GraphNodeRenderer.fontYPosition(this.labelTween.ref.fontSize);
					var mT = moveTweenFunc ? moveTweenFunc(t) : t;
					this.label.sx = sx1*(1-mT) + sx2*mT;
					this.label.sy = sy1*(1-mT) + sy2*mT;
				} else {
					this.label.sx = sx2;
					this.label.sy = sy2;
				}
			}
		}
	},
	
	
	applyAnimatedEdge: function() {
		var es = this.elements;
		es.curve.setAttribute('d', this.animatedCurve.makePathData(jsviz.renderer.GraphNodeRenderer.scale));

		jsviz.renderer.GraphNodeRenderer.updateArrowPolygon(es.arrowHeadContainer, es.arrowHeadPolygon, this, true);

		// alpha
		es.container.setAttribute('style', 'opacity:'+validateAlpha(this.animatedCurve.alpha));
	},
	
	firstPoint: function() {
		return this.splineList[0][0];
	},
	
	lastPoint: function() {
		var spl = this.splineList[this.splineList.length - 1];
		return spl[ spl.length - 1 ];
	},

	makeName: function() {
		return this.nodeFrom.name +':'+ this.nodeTo.name;
	},

	readSplines: function(list) {
		var len = list.length - 2;
		var i, k, y;
		var n = 0;
		var spl;
		var splineList = [];

		this.eflag = list[len];
		this.pen = list[len-1];
		for (i = 0;i < len;i++) {
			k = list[i];

			if (n == 0) {
				if (spl) {
					splineList.push(spl);
					spl = null;
				}

				n = k;
				spl = [];
			} else {
				// read a point (x, y)
				y = list[++i];
				spl.push( new GVPoint(k, y) );
				--n;
			}
		}

		this.splineList = splineList;
		// console.log(this.splineList)
	},

	calcArrowVector: function(useAnimatedCurve) {
		var splines = this.splineList;
		var spl = splines[splines.length - 1];
		var ep, ep2;

		if (this.animatedCurve && useAnimatedCurve) {
			var clen = this.animatedCurve.length();
			ep  = this.animatedCurve.points[clen - 1];
			ep2 = this.animatedCurve.points[clen - 2];
		} else {
			ep  = spl[spl.length - 1];
			ep2 = spl[spl.length - 2];
		}

		return {
			ox: ep.x,
			oy: ep.y,
			x: ep.x - ep2.x,
			y: ep.y - ep2.y
		};
	},
	
	createStraight: function(p1, p2, scale, translate) {
		var cv = new jsviz.renderer.Curve();
		
		cv.add(p1);
		cv.add(subPt(p1, p2, 0.333*scale));
		cv.add(subPt(p1, p2, 0.667*scale));
		cv.add(subPt(p1, p2, scale));

		if (translate) {
//			cv.points[0].x += translate.x;
//			cv.points[0].y += translate.y;
			cv.translate(translate.x, translate.y);
		}
		
		return cv;
	},
	
	createFadeOutTween: function(cv) {
		return new jsviz.renderer.FadeOutTweenContext(cv);
	},
	
	createTween: function(c1, c2, growAnim) {
		c1.clearDivided();
		c2.clearDivided();

		var longer = 1;
		var shouldDivided = null;
		var l2 = c2.length();
		var maxLen = c1.length();
		if (maxLen < l2) {
			longer = 2;
			maxLen = l2;
		}
		
		var maxSegments = calcSegments(maxLen);

		if (c1.length() != l2) {
			shouldDivided = (longer == 1) ? c2 : c1;
			shouldDivided.subdivide(maxSegments);
			// shouldDivided.dividedCurve.translate(240,0).debugOut(document.getElementById('svg1'));
		}

		var cvFrom = c1.dividedCurve || c1;
		var cvTo = c2.dividedCurve || c2;

		return new jsviz.renderer.TweenContext(cvFrom, cvTo, growAnim);
	}
};

function GVPoint(x, y) {
	this.x = x || 0;
	this.y = y || 0;
}


function Vec2(x, y) {
	this.x = x || 0;
	this.y = y || 0;
}

Vec2.prototype = {
	copy: function() {
		return new Vec2(this.x, this.y);
	},

	norm: function() {
		return Math.sqrt(this.x*this.x + this.y*this.y);
	},

	normalize: function() {
		var len = Math.sqrt(this.x*this.x + this.y*this.y);
		if (len > -0.00001 && len < 0.00001) {len=1;}
		this.x /= len;
		this.y /= len;
		return this;
	},

	smul: function(v) {
		this.x *= v;
		this.y *= v;
		return this;
	},

	turnLeft: function() {
		var x = this.x;

		this.x = this.y;
		this.y = -x;
		return this;
	}
};

function instantiateTweenSchedule() {
	if (jsviz.renderer && jsviz.renderer.GraphTweenAnimation && jsviz.renderer.GraphTweenAnimation.TweenSchedule) {
		return new jsviz.renderer.GraphTweenAnimation.TweenSchedule();
	}
	return null; // module not loaded
}

function validateAlpha(a) {
	return (a < 0.001) ? 0 : 
	       (a > 0.999) ? 1 : 
	        a;
}