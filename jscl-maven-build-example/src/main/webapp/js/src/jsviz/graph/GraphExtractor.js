namespace("jsviz.graph");

jsviz.graph.GraphExtractor = function() {
	this.g = new jsviz.graph.Graph();
	this.tempBuffer = null;
	this.tempBufferSize = 256;
}

jsviz.graph.GraphExtractor.prototype = {
	extractFromJSON: function(j) {
		var len = j.length;
		for (var i = 0;i < len;i++) {
			var entry = j[i];
			switch(entry.type) {
			case "N":
				var nd = this.addNode(
					entry.address, 
					entry.x, 
					entry.y, 
					entry.w, 
					entry.h, 
					entry.nSides, 
					entry.nPeripheries, 
					entry.fontSize, 
					entry.penWidth
				);
				nd.name = entry.name;
				break;
			case "E":
				var eg = this.addEdge(false,
					null,
					entry.address,
					entry.rawSplineArray,
					entry.pN1,
					entry.pN2,
					0,
					entry.arrX,
					entry.arrY
				);
				
				eg.penColor = entry.penColor;
				eg.label = entry.label;
				break;
			}
			// console.log(i+": ",entry)
		}
		
		this.g.connectEdges();
		this.g.makeNameMap();
	},

	extract: function(esModule, g, build_only) {
		var _this = this;
		
		this.tempBuffer = jsviz.Util.emCharArray(esModule, this.tempBufferSize);
		var e_max = 400;
		var edgeCoordsArray = jsviz.Util.emDoubleArray(esModule, e_max);

		esModule.FUNCTION_TABLE['js_addNode'] = 
			function(pNode, x, y, w, h, s, pe, fs, pw) {return _this.addNode(pNode, x, y, w, h, s, pe, fs, pw);};

		esModule.FUNCTION_TABLE['js_addEdge'] = 
			function(pEdge, pN1, pN2, edgeDataLength, ax,ay) { return _this.addEdge(build_only, esModule, pEdge, edgeCoordsArray, pN1, pN2, edgeDataLength, ax,ay); };

		esModule._extractGraph('js_addNode', 'js_addEdge', edgeCoordsArray, e_max, g);
		if (!build_only) {
			this.g.connectEdges();
		}
		
		this.readNodeNames(esModule, this.g);
		this.readEdgeExtras(esModule, this.g);

		if (!build_only) {
			this.g.makeNameMap();
		}
	},
	
	stringify: function(additional) {
		var injectList = [additional];
		for (var nodeAddr in this.g.nodeMap) {
			var nd = this.g.nodeMap[nodeAddr];
			injectList.push({
				type: "N",
				address: nd.address,
				name: nd.name,
				x: nd.x,
				y: nd.y,
				w: nd.w,
				h: nd.h,
				fontSize: nd.fontSize,
				penWidth: nd.penWidth,
				nSides: nd.nSides,
				nPeripheries: nd.nPeripheries
			});
		}

		for (var ei in this.g.edgeList) {
			var edge = this.g.edgeList[ei];
			injectList.push({
				type: "E",
				address: edge.pointer,
				pN1: edge.nodeFrom.address,
				pN2: edge.nodeTo.address,
				rawSplineArray: edge.rawSplineArray,
				arrX: edge.arrowVector.x,
				arrY: edge.arrowVector.y,
				penColor: edge.penColor,
				label: edge.label
			});
		}
		
		return JSON.stringify(injectList);
	},

	addEdge: function(shouldSaveRawArray, esModule, pEdge, edgeCoordsArray, pN1, pN2, edgeDataLength, arrX, arrY) {
//			console.log(pN1 +' -> '+ pN2);
		if (edgeDataLength >= 0 || !esModule) {
			var coords;
			if (esModule) {
				coords = jsviz.Util.emExtractArray(esModule, edgeCoordsArray, edgeDataLength, 'double');
			} else {
				coords = edgeCoordsArray;
			}
	
			var edge = new jsviz.renderer.GVEdge(pEdge, this.g.nodeMap[pN1], this.g.nodeMap[pN2]);
			edge.readSplines(coords);

			edge.arrowVector.x = -arrX;
			edge.arrowVector.y = arrY;
			
			if(shouldSaveRawArray){ edge.rawSplineArray = coords; }

			this.g.edgeList.push(edge);
			
			return edge;
		} else {
			// bad: overflow?
		}
	},

	addNode: function(pNode, x, y, w, h, nSides, nPeripheries, fontSize, penWidth) {
		// console.log(nSides, nPeripheries, fontSize);
		this.g.nodeMap[pNode] = {
			name: null,
			address: pNode,
			x: x, //   |position on key frame
			y: y, // --+
			sx: x, //    |position on current frame
			sy: y, // ---+
			w: w,
			h: h,
			element: null,
			willAppear: true,
			fontSize: fontSize,
			penWidth: penWidth,
			nSides: nSides,
			nPeripheries: nPeripheries,
			outgoingEdges: null,
			tweenSchedule: instantiateTweenSchedule(),
			emgOrder: 0
		};
		
		return this.g.nodeMap[pNode];
	},
	
	readNodeNames: function(esModule, g) {
		var buflen = this.tempBufferSize;
		var buf    = this.tempBuffer;

		for (var p in g.nodeMap) {
			var nd = g.nodeMap[p];
			var name_len = esModule._getNodeName(p-0, buf, buflen);
			if (name_len) {
				var bytes = jsviz.Util.emExtractArray(esModule, buf, name_len, 'i8');
				nd.name = utf8bytesToString(bytes);
//					console.log(bytes)
			}
		}
	},
	
	readEdgeExtras: function(esModule, g) {
		var buflen = this.tempBufferSize;
		var buf    = this.tempBuffer;
		for (var i in g.edgeList) {
			var edge = g.edgeList[i];
			var slen = esModule._getEdgeColor(edge.pointer, buf, buflen);
			if (slen > 0) {
				var colorName = utf8bytesToString( jsviz.Util.emExtractArray(esModule, buf, slen, 'i8') );
				edge.penColor = colorName;
			}

			this.readEdgeLabel(g, esModule, edge);
		}
	},

	readEdgeLabel: function(g, esModule, edge) {
		var callbackEntry = 'js_sendEdgeLabel';
		esModule.FUNCTION_TABLE[callbackEntry] = function(text, slen, fontSize, spaceX,spaceY, posX,posY) {
			var labelText = utf8bytesToString( jsviz.Util.emExtractArray(esModule, text, slen, 'i8') );
			edge.label = {
				text: labelText,
				fontSize: fontSize,
				x: posX,
				y: posY,
				spaceX: spaceX,
				spaceY: spaceY
			};
		};

		var hasLabel = !! esModule._getEdgeLabel(g, edge.pointer, callbackEntry);
	}
};

utf8bytesToString = function(bytes) {
	var chars = [];
	var len = bytes.length;
	for (var i = 0;i < len;i++) {
		chars.push("%"+ makeHex(bytes[i]) );
	}
	
	return unescape(chars.join(''));
}