namespace("jsviz.graph");

jsviz.graph.Graph = function() {
	this.nodeMap = {__proto__:null};
	this.edgeList = [];
	this.nodeNameMap = {__proto__:null};
	this.edgeNameMap = {__proto__:null};
	this.screenSize = {w:0,h:0};
	this.screenPosition = {x:0, y:0};
	this.nonscaledPosition   = {x:0, y:0};
	this.animatedPosition = {x:0, y:0};
	this.element = null;
}

jsviz.graph.Graph.prototype = {
	countNodes: function() {
		var n = 0;
		for (var i in this.nodeMap) {
			++n;
		}

		return n;
	},

	nodeByAddress: function(p) {
		return this.nodeMap[p-0] || null;
	},

	connectEdges: function() {
		var nd;
		for (var i in this.nodeMap) {
			nd = this.nodeMap[i];
			if (!nd.outgoingEdges) {
				nd.outgoingEdges = [];
			}

			nd.outgoingEdges.length = 0;
			this.gatherEdges(nd, nd.outgoingEdges);
		}
	},

	gatherEdges: function(cond, a) {
		var edge;
		for (var i in this.edgeList) {
			edge = this.edgeList[i];
			if (edge.nodeFrom == cond) {
				a.push(edge);
			}
		}
	},

	makeNameMap: function() {
		for (var nodeAddr in this.nodeMap) {
			nodeAddr -= 0;
			var nd = this.nodeMap[nodeAddr];
			this.nodeNameMap[nd.name] = nodeAddr;
		}
		
		for (var ei in this.edgeList) {
			var edge = this.edgeList[ei];
			this.edgeNameMap[edge.makeName()] = edge;
		}
	},

	edgeByName: function(nm) {
		return this.edgeNameMap[nm] || null;
	},

	nodeAddressByName: function(nm) {
		return this.nodeNameMap[nm] || 0;
	},
	
	collectNodes: function(refNameMap, except) {
		var ls = [];
	
		for (var nm in this.nodeNameMap) {
			if (refNameMap) {
				var exists = !!( refNameMap[nm] );
				if (except == exists) { continue; }
			} else {
				if (except === false) { continue; }
			}
			
			ls.push(this.nodeNameMap[nm]);
		}
		
		return ls;
	},
	
	collectEdges: function(refNameMap, except) {
		var ls = [];
	
		for (var nm in this.edgeNameMap) {
			if (refNameMap) {
				var exists = !!( refNameMap[nm] );
				if (except == exists) { continue; }
			} else {
				if (except === false) { continue; }
			}
			
			ls.push(this.edgeNameMap[nm]);
		}
		
		return ls;
	}
}


function makeHex(v) {
	if (v < 16) { return '0' + v.toString(16); }
	return v.toString(16);
}

