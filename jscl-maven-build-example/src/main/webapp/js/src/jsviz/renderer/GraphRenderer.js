namespace("jsviz.renderer");

jsviz.renderer.GraphRenderer = function(svg, vw, vh) {
	this.scale = 70.0;
	this.marginTop = 40;
	this.viewportSize = {w: vw, h: vh};
	this.svgElement = svg;
	this.containerElement = $svg('g');
	this.defsElement = $svg('defs');
	this.filterElements = [];
	this.nodeNameMap = {__proto__:null};
	this.edgeNameMap = {__proto__:null};

	svg.appendChild(this.containerElement);
	this.setMetrics(svg);

	svg.appendChild(this.defsElement);
	this.setupFilters(this.defsElement, this.filterElements);
};

jsviz.renderer.GraphRenderer.makeFilterId = function(i){return "blurf-"+i;}
jsviz.renderer.GraphRenderer.PEN_DASHED = 1;

jsviz.renderer.GraphRenderer.prototype = {
	setupFilters: function(defs, filterList) {
		var len = 20;
		for (var i = 0;i < len;i++) {
			var f = $svg('filter');
			var blur = $svg('feGaussianBlur');
			blur.setAttribute('in', 'SourceGraphic');
			blur.setAttribute('stdDeviation', (i+1)*0.25);
			f.setAttribute('id', jsviz.renderer.GraphRenderer.makeFilterId(i));
			filterList.push(f);
			f.appendChild(blur);
			defs.appendChild(f);
		}
	},
	
	applyBlurFilter: function(el, t) {
		var fid = '';
		if (t > 0.01) {
			var len = this.filterElements.length;
			var i = Math.floor(t * len);
			if (i < 0) {i=0;}
			if (i >= len) {i=(len-1);}
			
			fid = 'url(#'+ jsviz.renderer.GraphRenderer.makeFilterId(i) +')';
		}
	
		el.setAttribute('filter', fid);
	},

	setViewportWidth: function(w) {
		this.viewportSize.w = w;
		this.setMetrics(this.svgElement);
	},

	setViewportHeight: function(h) {
		this.viewportSize.h = h;
		this.setMetrics(this.svgElement);
	},

	setMetrics: function(element) {
		var ww = this.viewportSize.w >> 1;
		var h  = this.viewportSize.h;
		
		element.setAttribute('viewBox', [-ww, 0, this.viewportSize.w, h].join(' '));
		element.style.width  = this.viewportSize.w + 'px';
		element.style.height = h + 'px';
		element.style.marginTop = this.marginTop + 'px';
	},

	scaleToDisplayDPI: function() {
		return 72.0 / this.scale;
	},

	updateView: function(g, prevGraph) {
		jsviz.renderer.GraphNodeRenderer.scale = this.scale;
		jsviz.renderer.GraphNodeRenderer.relScale = this.scaleToDisplayDPI();
		// this.clear();

		g.element = this.containerElement;
		this.positionGraph(g, prevGraph);
		this.renderNodes(g);
		this.renderEdges(g);
	},

	clear: function() {
	throw "XXX";
		var ls = this.containerElement.childNodes;
		var len = ls.length;
		for (var i = (len-1);i >= 0;--i) {
			this.containerElement.removeChild(ls[i]);
		}
	},
	
	removeNode: function(nodeName) {
		var nd = this.nodeNameMap[nodeName];
		if (nd) {
			if (nd.element) {
				this.containerElement.removeChild(nd.element);
			}
			delete this.nodeNameMap[nodeName];
		}
	},

	removeEdge: function(edgeName) {
		var edge = this.edgeNameMap[ edgeName ];
		if (edge) {
			this.containerElement.removeChild(edge.elements.label);
			this.containerElement.removeChild(edge.elements.container);
			delete this.edgeNameMap[ edgeName ];
		}
	},

	positionGraph: function(g, prevGraph) {
		g.animatedPosition.x = g.screenPosition.x = Math.floor(-g.screenSize.w/2);
		g.animatedPosition.y = g.screenPosition.y = 8;
		g.nonscaledPosition.x = g.screenPosition.x / this.scale;
		g.nonscaledPosition.y = g.screenPosition.y / this.scale;

		if (!prevGraph) {
			jsviz.renderer.GraphNodeRenderer.applyGraphPosition(g);
		}
	},

	renderEllipseNodeSVG: function(nd) {
		var hw = Math.floor(nd.w*this.scale + 0.5) >> 1;
		var hh = Math.floor(nd.h*this.scale + 0.5) >> 1;
		var el = $svg('ellipse');
		el.setAttribute('cx', nd.x*this.scale);
		el.setAttribute('cy', nd.y*this.scale);
		
		el.setAttribute('rx', hw);
		el.setAttribute('ry', hh);
		el.setAttribute('fill', 'red');

		return el;
	},

	renderNodes: function(g) {
		var nd;
		for (var i in g.nodeMap) {
			nd = g.nodeMap[i];
			if (!this.isNodeDrawn(nd)) {
				this.renderANode(nd);
				this.nodeNameMap[nd.name] = nd;
			} else {
				// set existing element
				nd.element = this.nodeNameMap[nd.name].element;
				jsviz.renderer.GraphNodeRenderer.updateNodeStyle(this.nodeNameMap[nd.name], nd);
			}
		}
	},

	renderEdges: function(g) {
		var nd;
		for (var i in g.nodeMap) {
			nd = g.nodeMap[i];
			if (nd.outgoingEdges) {
				for (var j in nd.outgoingEdges) {
					var edge = nd.outgoingEdges[j];
					if (!this.isEdgeDrawn(edge)) {
						this.edgeNameMap[ edge.makeName() ] = edge;
						edge.elements = this.renderAEdge(edge);
						jsviz.renderer.GraphNodeRenderer.setEmergingEdgeInitialStyle(edge.elements.container, edge.elements.label);
					} else {
						var existingEdge = this.edgeNameMap[ edge.makeName() ];
						edge.elements = existingEdge.elements;
						jsviz.renderer.GraphNodeRenderer.updateEdgeStyle(existingEdge, edge);
					}
				}
			}
		}
	},
	
	isNodeDrawn: function(nd) {
		return !!(this.nodeNameMap[nd.name]);
	},

	isEdgeDrawn: function(edge) {
		return !!(this.edgeNameMap[ edge.makeName() ]);
	},

	renderANode: function(nd) {
		var ndElem = jsviz.renderer.GraphNodeRenderer.renderNode(nd);
		nd.element = ndElem;
		this.containerElement.appendChild(ndElem);
	},

	renderAEdge: function(edge) {

		var sps = edge.splineList;
		var crv = $svg('path');
		var container = $svg('g');
		var retElements = {curve: crv, container: container, arrowShape: null, label: null};
		// crv.setAttribute('d', this.makePath(edge.nodeFrom, edge.nodeTo, sps));
		crv.setAttribute('fill', 'none');
		crv.setAttribute('stroke-width', '1');
		jsviz.renderer.GraphNodeRenderer.setEdgeStrokeStyle(crv, edge);
		
		container.appendChild(crv);

		var asvg = this.renderArrawHead(edge, retElements, 
				jsviz.renderer.GraphNodeRenderer.getEdgeStrokeColor(edge));
		retElements.arrowShape = asvg.firstChild; // XXX
		jsviz.renderer.GraphNodeRenderer.setEdgeArrowStyle(retElements.arrowShape, edge);
		
		container.appendChild(asvg);
		this.containerElement.appendChild(container);

		retElements.label = $svg('text');
		retElements.label.appendChild( document.createTextNode(' ') );
		if (edge.label) {
			retElements.label.firstChild.nodeValue = edge.label.text;
			jsviz.renderer.GraphNodeRenderer.setEdgeLabelStyle(retElements.label, edge.label);
		}
		this.containerElement.appendChild(retElements.label);
		jsviz.renderer.GraphNodeRenderer.applyDefaultLabelStyle(retElements.label);
/*
			for (var i in sps) {
				var spl = sps[i];
				for (var j = 0;j < spl.length;j++) {
					var box = $svg('circle');
					box.setAttribute('cx', spl[j].x*this.scale);
					box.setAttribute('cy', spl[j].y*this.scale);
					box.setAttribute('r', 2);
					box.setAttribute('fill', 'blue');
					this.containerElement.appendChild(box);
				}
			}
*/
		return retElements;
	},

	renderArrawHead: function(edge, retElements) {
		var pg = $svg('polygon');
		var ag = $svg('g');

		ag.appendChild(pg);
		retElements.arrowHeadContainer = ag;
		retElements.arrowHeadPolygon   = pg;

		jsviz.renderer.GraphNodeRenderer.updateArrowPolygon(ag, pg, edge);

		return ag;
	},

	makePath: function(n1, n2, splines) {
		var S = this.scale;
		var d = [];
		var len = splines.length;
		var j;
		for (var i = 0;i < len;i++) {
			var spl = splines[i];
			if (!i) {
				d.push('M');
				d.push(spl[0].x *S); d.push(spl[0].y *S);
				d.push('C');
			} else {
				d.push(spl[0].x *S); d.push(spl[0].y *S);
			}
/*
				d.push(!i ? 'M' : 'L');
				d.push(spl[0].x *S); d.push(spl[0].y *S);
				d.push('C');
*/
			for (j = 1;j < spl.length;j++) {
				d.push(spl[j].x *S);
				d.push(spl[j].y *S);
			}
		}

		return d.join(' ');
	}
};
