namespace("jsviz.graph");

jsviz.graph.GraphsController = function(renderAreaId) {
	this.glog = [];
	this.renderAreaId = renderAreaId;
	this.renderer = new jsviz.renderer.GraphRenderer(document.getElementById(this.renderAreaId), 2000, 2000);
	this.graphTween = new jsviz.renderer.GraphTweenAnimation(this.renderer);
	this.animationManager = new jsviz.renderer.AnimationManager(this.graphTween);
};

jsviz.graph.GraphsController.prototype = {
	setNewGraph: function(g, slowMode, finishHandler) {
		this.animationManager.finishHandler = finishHandler;
		this.animationManager.forceFinish();
		this.animationManager.changeSlow(slowMode ? 3 : 1);
	
		this.glog.push(g);
		var prev = this.getPrevGraph();
		this.cleanRemovedElements(prev);

		this.graphTween.setPair(prev, g);
		this.animationManager.start();
	},
	
	cleanRemovedElements: function(referGraph) {
		if (!referGraph) {
			return;
		}
		
		for (var nodeName in this.renderer.nodeNameMap) {
			if (!referGraph.nodeNameMap[nodeName]) {
				this.renderer.removeNode(nodeName);
			}
		}

		for (var edgeName in this.renderer.edgeNameMap) {
			if (!referGraph.edgeNameMap[edgeName]) {
				this.renderer.removeEdge(edgeName);
			}
		}
		
	},

	setDisplayGraphSize: function(g, w, h) {
		g.screenSize.w = w;// / this.renderer.scaleToDisplayDPI() + 4;
		g.screenSize.h = h;// / this.renderer.scaleToDisplayDPI() + 16;
	},
	
	getPrevGraph: function() {
		if (this.glog.length > 1) {
			return this.glog[this.glog.length - 2];
		}
		
		return null;
	}
};