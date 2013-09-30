namespace("jsviz.renderer");

jsviz.renderer.GraphNodeRenderer = {
	CHECK_PROPS: [
		'fontSize',
		'nPeripheries',
		'nSides',
		'penWidth',
		'w', 'h'
	],

	scale: 1,
	relScale: 1,
	renderNode: function(nd, existingContainer) {
		var nodeContainer = existingContainer || $svg('g');
		this.applyNodePosition(nodeContainer, nd);
		
		var shp = this.renderShape(nd);
		nodeContainer.appendChild(shp);
		
		var lab = this.renderLabel(nd);
		nodeContainer.appendChild(lab);
		
		if (!existingContainer) {
			this.setEmergingNodeInitialStyle(nodeContainer);
		}
		return nodeContainer;
	},
	
	updateNodeStyle: function(existingNode, newNode) {
		var propNames = jsviz.renderer.GraphNodeRenderer.CHECK_PROPS;
		var anyChanged = false;
		
		for (var i in propNames) {
			var p = propNames[i];
			if (existingNode[p] !== newNode[p]) {
				anyChanged = true;
				existingNode[p] = newNode[p];
			}
		}
		
		if (anyChanged) {
			clearChildren(existingNode.element);
			jsviz.renderer.GraphNodeRenderer.renderNode(existingNode, existingNode.element);
		}
	},
	
	applyNodePosition: function(elem, nd) {
		elem.setAttribute(
			'transform',
			this.translate(nd.sx*this.scale, nd.sy*this.scale)
		);
	},
	
	applyEdgeLabelPosition: function(edge) {
		var S = this.relScale;
		var el = edge.elements.label;
		if (edge.label) {
			el.setAttribute('x', (edge.label.sx /S) >> 0);
			el.setAttribute('y', (edge.label.sy /S) >> 0);
		}
	},
	
	renderShape: function(nd) {
		var hw = Math.floor(nd.w*this.scale + 0.5) >> 1;
		var hh = Math.floor(nd.h*this.scale + 0.5) >> 1;
		if (nd.nPeripheries < 1) {
			return this.renderNullShape(nd, hw, hh);
		}
		if (nd.nSides <= 2)
			return this.renderEllipseShape(nd, hw, hh);
		else
			return this.renderRectShape(nd, hw, hh);
	},

	renderNullShape: function(nd, hWidth, hHeight) {
		var el = $svg('g');
		return el;
	},
	
	renderEllipseShape: function(nd, hWidth, hHeight) {
		var el = $svg('ellipse');
//			el.setAttribute('cx', nd.x*this.scale);
//			el.setAttribute('cy', nd.y*this.scale);
		
		el.setAttribute('rx', hWidth);
		el.setAttribute('ry', hHeight);
//			el.setAttribute('fill', 'red');
		el.setAttribute('fill', 'none');
		el.setAttribute('stroke', 'black');
		el.setAttribute('stroke-width', Math.floor(nd.penWidth));
		
		return el;
	},

	renderRectShape: function(nd, hWidth, hHeight) {
		var el = $svg('rect');
		
		el.setAttribute('x', -hWidth);
		el.setAttribute('y', -hHeight);
		el.setAttribute('width',  hWidth*2);
		el.setAttribute('height', hHeight*2);
		el.setAttribute('fill', 'none');
		el.setAttribute('stroke', 'black');
		el.setAttribute('stroke-width', Math.floor(nd.penWidth));
		
		return el;
	},
	
	renderLabel: function(nd) {
		var tx = $svg('text');
		tx.setAttribute('font-size', nd.fontSize);
		tx.setAttribute('font-family', 'Arial');
		tx.setAttribute('text-anchor', 'middle');
		jsviz.renderer.GraphNodeRenderer.applyDefaultLabelStyle(tx);
		tx.appendChild( document.createTextNode(nd.name) );
		tx.setAttribute('y', jsviz.renderer.GraphNodeRenderer.fontYPosition(nd.fontSize));
		
		return tx;
	},
	
	applyDefaultLabelStyle: function(el) {
		el.setAttribute('font-family', 'Arial');
		el.setAttribute('text-anchor', 'middle');
	},
	
	fontYPosition: function(fontSize) {
		return (fontSize / 3) | 0;
	},

	updateEdgeStyle: function(existingEdge, newEdge) {
		var anyChanged = false;
		if (existingEdge.eflag !== newEdge.eflag) {
			existingEdge.eflag = newEdge.eflag;
			anyChanged = true;
		}

		if (existingEdge.penColor !== newEdge.penColor) {
			existingEdge.penColor = newEdge.penColor;
			anyChanged = true;
		}

		if (existingEdge.pen !== newEdge.pen) {
			existingEdge.pen = newEdge.pen;
			anyChanged = true;
		}
		
		if (anyChanged) {
			jsviz.renderer.GraphNodeRenderer.setEdgeStrokeStyle(existingEdge.elements.curve, existingEdge);
			jsviz.renderer.GraphNodeRenderer.setEdgeArrowStyle(existingEdge.elements.arrowShape, existingEdge);
		}
	},
	
	setEdgeStrokeStyle: function(strokeElement, edgeData) {
		strokeElement.setAttribute('stroke', 
				jsviz.renderer.GraphNodeRenderer.getEdgeStrokeColor(edgeData));
		
		if (jsviz.renderer.GraphRenderer.PEN_DASHED == edgeData.pen) {
			strokeElement.setAttribute('stroke-dasharray', '3,3');
		}
	},

	setEdgeArrowStyle: function(arrowShapeElement, edgeData) {
		arrowShapeElement.setAttribute('fill',
				jsviz.renderer.GraphNodeRenderer.getEdgeStrokeColor(edgeData));
	},
	
	setEdgeLabelStyle: function(labelElement, labelData) {
		if (labelData) {
			labelElement.setAttribute('font-size', labelData.fontSize);
		}
	},

	getEdgeStrokeColor: function(edgeData) {
		return (edgeData.penColor == 'transparent') ? 'none' : 'black';
	},

	updateArrowPolygon: function(container, pg, edge, useAnimatedCurve) {
		if (edge.eflag) {
			var avec = edge.calcArrowVector(useAnimatedCurve);
			var ev = (new Vec2(avec.x, avec.y)).normalize().smul( edge.arrowVector.norm() );
			// ev.smul(this.scale);

			var sideVector = ev.copy().turnLeft().smul(0.35);
			this.applyNodePosition(container, {sx: avec.ox, sy: avec.oy});

			var points = [];
			points.push('0,0');
			points.push(sideVector.x +','+sideVector.y);
			points.push(ev.x +','+ ev.y);
			points.push((-sideVector.x) +','+ (-sideVector.y));

			pg.setAttribute('points', points.join(' '));
		} else {
			pg.setAttribute('points', '');
		}
	},
	
	translate: function(x, y) {
		return 'translate('+x+','+y+')';
	},
	
	setEmergingNodeInitialStyle: function(element) {
		element.style.opacity = 0;
	},

	setEmergingEdgeInitialStyle: function(element, labelElement) {
		element.style.opacity = 0;
		labelElement.style.opacity = 0;
	},

	applyGraphPosition: function(g) {
		g.element.setAttribute('transform', this.translate(g.animatedPosition.x, g.animatedPosition.y) );
	}
};


function $svg(name) {
	return document.createElementNS("http://www.w3.org/2000/svg", name);
}

function $H(name) {
	return document.createElementNS("http://www.w3.org/1999/xhtml", name);
}

function clearChildren(el) {
	var ls = el.childNodes;
	var len = ls.length;
	for (var i = (len-1);i >= 0;--i) {
		el.removeChild(ls[i]);
	}
}