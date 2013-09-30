namespace("jsviz.renderer");

jsviz.renderer.GraphTweenAnimation = function(renderer) {
	this.graphRenderer = renderer;
	this.fromGraph = null;
	this.toGraph   = null;
	this.graphTween = null;
}

function cmpNodeY(a,b){ return ((a.y<<12)+a.x) - ((b.y<<12)+b.x); }

jsviz.renderer.GraphTweenAnimation.prototype = {
	setPair: function(g1, g2) {
		this.fromGraph = g1;
		this.toGraph   = g2;
		if (g1 && g2) {
			this.graphTween = new jsviz.renderer.GraphTweenAnimation.GraphMoveTween(g1, g2);
		}
	},
	
	willStart: function() {
		var unNormalizedList = [];
		this.spreadCanvasIf();
		this.graphRenderer.updateView(this.toGraph, this.fromGraph);
	
		var anyEmerge   = false;
		var anyDisappear = false;
		
		var i, nd, edge;
		var emgNodeAddrs = this.makeEmergingNodeList();
		var disNodeAddrs = this.makeDisappearingNodeList();
		
		var emgEdges = this.makeEmergingEdgeList();
		var disEdges = this.makeDisappearingEdgeList();
		
		if (emgNodeAddrs && emgNodeAddrs.length > 0) { anyEmerge = true; }
		if (emgEdges && emgEdges.length > 0) { anyEmerge = true; }
		if (disNodeAddrs && disNodeAddrs.length > 0) { anyDisappear = true; }
		if (disEdges && disEdges.length > 0) { anyDisappear = true; }

		// reset end nodes
		for (i in emgEdges) {
			edge = emgEdges[i];
			edge.nodeFrom.tweenSchedule.reset();
			edge.nodeTo.tweenSchedule.reset();
		}

		// disappearing nodes
		var disEnd = 0;
		for (i in disNodeAddrs) {
			nd = this.fromGraph.nodeByAddress(disNodeAddrs[i]);
			nd.tweenSchedule.reset();
			nd.tweenSchedule.unOffset = (i-0) * 0.5;
			nd.tweenSchedule.unRange  = 4;
			disEnd = nd.tweenSchedule.unOffset + nd.tweenSchedule.unRange;
			unNormalizedList.push(nd);
		}

		for (i in disEdges) {
			if (disEnd < 4){disEnd=4;}
			edge = disEdges[i];
			edge.tweenSchedule.reset();
			edge.tweenSchedule.unOffset = 0;
			edge.tweenSchedule.unRange  = disEnd - 2;
			unNormalizedList.push(edge);
		}

		var moveEnd = 0;
		if (this.graphTween) {
			this.graphTween.tweenSchedule.reset();
			this.graphTween.tweenSchedule.unOffset = disEnd;
			this.graphTween.tweenSchedule.unRange  = 9;
			unNormalizedList.push(this.graphTween);
			
			moveEnd = this.graphTween.tweenSchedule.unOffset + this.graphTween.tweenSchedule.unRange;
		}

		var sortedEmgNodes = null;
		if (emgNodeAddrs && emgNodeAddrs.length > 0) {
			sortedEmgNodes = this.orderEmergingNodes(emgNodeAddrs, this.toGraph);
			for (i in sortedEmgNodes) {
				nd = sortedEmgNodes[i];
				nd.tweenSchedule.reset();
				nd.tweenSchedule.unOffset = moveEnd + nd.emgOrder*1.5;
				nd.tweenSchedule.unRange  = 5;
			}
			
		}
		
		for (i in emgEdges) {
			edge = emgEdges[i];
			edge.tweenSchedule.reset();
			var unof = edge.nodeFrom.tweenSchedule.unOffset + 3;
			if (edge.nodeTo.tweenSchedule.unOffset && unof < edge.nodeTo.tweenSchedule.unOffset) {
				unof = edge.nodeTo.tweenSchedule.unOffset;
			}
			edge.tweenSchedule.unOffset = unof;
			edge.tweenSchedule.unRange  = 7;
			unNormalizedList.push(edge);
		}
		
		return this.normalizeSchedules(sortedEmgNodes, unNormalizedList);
	},
	
	spreadCanvasIf: function() {
		if (this.graphRenderer.viewportSize.h < this.toGraph.screenSize.h) {
			this.graphRenderer.setViewportHeight(Math.round( this.toGraph.screenSize.h ));
		}
	},

	shrinkCanvasIf: function() {
		if (this.graphRenderer.viewportSize.h > this.toGraph.screenSize.h) {
			this.graphRenderer.setViewportHeight(Math.round( this.toGraph.screenSize.h ));
		}
	},
	
	normalizeSchedules: function(objList, objList2) {
		var i, j, o, u, ls;
		var un_max = 1;
		for (j = 0;j < 2;j++) {
			ls = (j==0) ? objList : objList2;
			if(!ls) {continue;}
			for (i in ls) {
				o = ls[i];
				u = o.tweenSchedule.unEndTime();
				if (u > un_max) {un_max=u;}
			}
		}
		
		var scale = un_max;
		for (j = 0;j < 2;j++) {
			ls = (j==0) ? objList : objList2;
			if(!ls) {continue;}
			for (i in ls) {
				o = ls[i];
				o.tweenSchedule.offset = o.tweenSchedule.unOffset / scale;
				o.tweenSchedule.speed  = scale / o.tweenSchedule.unRange;
			}
		}
		
		var minDivs = 100;
		var maxDivs = 250;
		var requireDivs = un_max * 6;
		if (requireDivs < minDivs) {requireDivs = minDivs;}
		else if (requireDivs > maxDivs) {requireDivs = maxDivs;}
		
		return Math.floor(requireDivs);
	},
	
	orderEmergingNodes: function(addrList, ownerGraph) {
		var i;
		var len = addrList.length;
		var sorted = new Array(len);
		for (i = 0;i < len;i++) {
			sorted[i] = ownerGraph.nodeByAddress(addrList[i]);
		}
		
		sorted.sort(cmpNodeY);
		for (i = 0;i < len;i++) {
			sorted[i].emgOrder = i;
		}
		
		return sorted;
	},

	showFrame: function(t) {
		if (!this.toGraph) {
			return;
		}
		
		this.tweenGraphPosition(t);

		this.tweenEmergingNodes(t);
		this.tweenEmergingEdges(t);
		
		this.tweenExistingNodes(t);
		this.tweenExistingEdges(t);

		this.tweenDisappearingNodes(t);
		this.tweenDisappearingEdges(t);
	},

	finishAnimation: function() {
		this.graphTween = null;

		var edges = this.toGraph.collectEdges(null, true);
		for (var i in edges) {
			edges[i].removeTween();
		}

		this.shrinkCanvasIf();
	},
	
	tweenGraphPosition: function(t) {
		if (!this.fromGraph) {
			return;
		}

		var m_t = this.graphTween.tweenSchedule.modify(t);
		this.graphTween.interpolate(TweenFuncs.SEaseOut(m_t));
	},
	
	makeEmergingNodeList: function() {
		return this.toGraph.collectNodes(this.fromGraph ? this.fromGraph.nodeNameMap : null, true);
	},
	
	makeEmergingEdgeList: function() {
		return this.toGraph.collectEdges(this.fromGraph ? this.fromGraph.edgeNameMap : null, true);
	},
	
	tweenEmergingNodes: function(t) {
		var emgNodeAddrs = this.makeEmergingNodeList();
		for (var i in emgNodeAddrs) {
			var nd = this.toGraph.nodeByAddress(emgNodeAddrs[i]);
			var m_t = nd.tweenSchedule.modify(t);
			nd.element.style.opacity = validateAlpha(m_t);
		}
		
//			console.log('E', emgNodeAddrs)
	},
	
	tweenEmergingEdges: function(t) {
		var emgEdges = this.makeEmergingEdgeList();
		for (var i in emgEdges) {
			var edge = emgEdges[i];
			if (!edge.edgeTween) {
				edge.createEdgeTween(jsviz.renderer.GVEdge.ET_EMERGE);
			}

			var m_t = edge.tweenSchedule.modify(t);

			edge.edgeTween.interpolate(edge.animatedCurve, TweenFuncs.SEaseOut(m_t));
			
			var alpha = m_t*1.1 - 0.1;
			if (alpha<0){alpha=0;}
			edge.animatedCurve.alpha = alpha;
			edge.applyAnimatedEdge();

			edge.tweenLabel(m_t);
			jsviz.renderer.GraphNodeRenderer.applyEdgeLabelPosition(edge);
		}
	},
	
	modifyTforMoving: function(t) {
		if (this.graphTween) {
			return this.graphTween.tweenSchedule.modify(t);
		}
		
		return t;
	},
	
	tweenExistingNodes: function(t) {
		if (!this.fromGraph) {
			return;
		}
		
		var m_t = this.modifyTforMoving(t);
		var exsNodeAddrs = this.toGraph.collectNodes(this.fromGraph ? this.fromGraph.nodeNameMap : null, false);
		for (var i in exsNodeAddrs) {
			var nd2 = this.toGraph.nodeByAddress(exsNodeAddrs[i]);
			var nd1 = this.fromGraph.nodeByAddress(
			           this.fromGraph.nodeAddressByName(nd2.name));
			
			this.interpolateNodePosition(nd2, nd1, nd2, m_t, TweenFuncs.SEaseOut);
			jsviz.renderer.GraphNodeRenderer.applyNodePosition(nd2.element, nd2);
		}
	},

	tweenExistingEdges: function(t) {
		if (!this.fromGraph) {
			return;
		}
		
		var m_t = this.modifyTforMoving(t);
		var exsEdges = this.toGraph.collectEdges(this.fromGraph.edgeNameMap, false);
		for (var i in exsEdges) {
			var edge = exsEdges[i];
			if (!edge.edgeTween) {
				edge.createEdgeTween(jsviz.renderer.GVEdge.ET_MOVE,
				  this.fromGraph.edgeByName(edge.makeName()) );
			}

			edge.edgeTween.interpolate(edge.animatedCurve, TweenFuncs.SEaseOut(m_t));
			edge.applyAnimatedEdge();

			edge.tweenLabel(m_t, TweenFuncs.SEaseOut);
			jsviz.renderer.GraphNodeRenderer.applyEdgeLabelPosition(edge);
		}
	},

	makeDisappearingNodeList: function() {
		if (!this.fromGraph) { return null; }
		
		return this.fromGraph.collectNodes(this.toGraph.nodeNameMap, true);
	},
	
	tweenDisappearingNodes: function(t) {
		var disNodeAddrs = this.makeDisappearingNodeList();
		if (!disNodeAddrs) { return; }
		
		for (var i in disNodeAddrs) {
			var nd = this.fromGraph.nodeByAddress(disNodeAddrs[i]);
			var m_t = nd.tweenSchedule.modify(t);
			var alpha = 1.0 - m_t;
			nd.element.style.opacity = validateAlpha(alpha);
			this.graphRenderer.applyBlurFilter(nd.element, (alpha < 0.01) ? 0 : m_t);
		}
	},

	makeDisappearingEdgeList: function() {
		if (!this.fromGraph) {
			return null;
		}
		
		return this.fromGraph.collectEdges(this.toGraph.edgeNameMap, true);
	},

	tweenDisappearingEdges: function(t) {
		var disEdges = this.makeDisappearingEdgeList();
		if (!disEdges) { return; }
		
		for (var i in disEdges) {
			var edge = disEdges[i];
			if (!edge.edgeTween) {
				edge.createEdgeTween(jsviz.renderer.GVEdge.ET_DISAPPEAR, edge);
			}

			var m_t = edge.tweenSchedule.modify(t);
			edge.edgeTween.interpolate(edge.animatedCurve, m_t);
			edge.applyAnimatedEdge();
			
			edge.tweenLabel(m_t);
		}
	},

	interpolateNodePosition: function(ndOut, nd1, nd2, t, twfun) {
		var  tt = twfun(t);
		var _tt = 1.0 - tt;
		
		ndOut.sx = nd1.x * _tt + nd2.x * tt;
		ndOut.sy = nd1.y * _tt + nd2.y * tt;
	}
};

jsviz.renderer.GraphTweenAnimation.GraphMoveTween = function(g1, g2) {
	this.graphFrom = g1;
	this.graphTo = g2;
	this.tweenSchedule = new jsviz.renderer.GraphTweenAnimation.TweenSchedule();
};

jsviz.renderer.GraphTweenAnimation.GraphMoveTween.prototype = {
	interpolate: function(t) {
		var p1 = this.graphFrom.screenPosition;
		var p2 = this.graphTo.screenPosition;
		var _t = 1.0 - t;

		var x = p1.x * _t + p2.x * t;
		var y = p1.y * _t + p2.y * t;
		this.graphTo.animatedPosition.x = x;
		this.graphTo.animatedPosition.y = y;
		jsviz.renderer.GraphNodeRenderer.applyGraphPosition(this.graphTo);
	},
	
	isMoved: function() {
		var p1 = this.graphFrom.screenPosition;
		var p2 = this.graphTo.screenPosition;
		var dx = Math.round((p1.x - p2.x) / 2);
		var dy = Math.round((p1.y - p2.y) / 2);
		return dx || dy;
	}
};

jsviz.renderer.GraphTweenAnimation.TweenSchedule = function() {
	this.reset();
};

jsviz.renderer.GraphTweenAnimation.TweenSchedule.prototype = {
	reset: function() {
		this.unOffset = 0;
		this.unRange  = 2;
		this.offset = 0;
		this.speed  = 1;
	},
	
	unEndTime: function() {
		return this.unOffset + this.unRange;
	},
	
	modify: function(t) {
		var u = (t - this.offset) * this.speed;
		if (u < 0){u=0;}
		else if (u > 1) {u=1;}
		
		return u;
	}
};


var TweenFuncs = {
	Linear: function(t) {
		if(t<0) { return 0; }
		if(t>1) { return 1; }

		return t;
	},
	
	SEaseOut: function(t) {
		if(t<0) { t = 0; }
		else if(t>1) { t = 1; }

		t = 1.0 - t;
		return 1.0 - t*t;
	}
};
