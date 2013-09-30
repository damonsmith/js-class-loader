jsviz.renderer.Curve = function() {
	this.points = [];
	this.dividedCurve = null;
	this.alpha = 1;
};

jsviz.renderer.Curve.prototype = {
	clear: function() {
		this.alpha = 1;
		this.points.length = 0;
	},

	clearDivided: function() {
		this.dividedCurve = null;
	},

	translate: function(dx, dy) {
		for (var i in this.points) {
			this.points[i].x += dx;
			this.points[i].y += dy;
		}

		return this;
	},
	
	subdivide: function(nSegments) {
		var oldCurve = null;
		var newCurve = this;
		var oldT = 0;

		var orgSegs = calcSegments( this.length() );
		for (var i = 0;i < (nSegments-orgSegs);i++) {
			oldCurve = newCurve;
			newCurve = new jsviz.renderer.Curve();
			var t  = (1.0 / nSegments) * (i+1);

			var oldLength = i*3;
			for (var j = 0;j < oldLength;j++) {
				newCurve.add( oldCurve.points[j] );
			}

			var divPt     = oldCurve.pointAt(i, (t - oldT) / (1 - oldT));
			var p12 = subPt(divPt.ref1, divPt.ref2, divPt.segT);
			var p43 = subPt(divPt.ref4, divPt.ref3, 1.0 - divPt.segT);
			var p23 = subPt(divPt.ref2, divPt.ref3, divPt.segT);

			var pM1 = subPt(p12, p23, divPt.segT);
			var pM2 = subPt(p23, p43, divPt.segT);

			newCurve.add(divPt.ref1);
			newCurve.add(p12);
			newCurve.add(pM1);
			newCurve.add(divPt);
			newCurve.add(pM2);
			newCurve.add(p43);
			newCurve.add(divPt.ref4);

			oldT = t;
/*
		 document.getElementById('svg1').appendChild(debugDot(p12.x, p12.y));
		 document.getElementById('svg1').appendChild(debugDot(p43.x, p43.y));
		 document.getElementById('svg1').appendChild(debugDot(p23.x, p23.y));
		 document.getElementById('svg1').appendChild(debugDot(pM1.x, pM1.y));
		 document.getElementById('svg1').appendChild(debugDot(pM2.x, pM2.y));

*/
//		 document.getElementById('svg1').appendChild(debugDot(divPt.x, divPt.y, i));
//		 document.getElementById('svg1').appendChild(debugVector(divPt.x, divPt.y, divPt.dx, divPt.dy));
		}

		if (orgSegs > 1) {
			for (i = 4;i < this.points.length;i++) {
				newCurve.add(this.points[i]);
			}
		}

//console.log('>> ' + newCurve.length())
		this.dividedCurve = newCurve;
		return newCurve;
	},
	
	pointAt: function(segIndex, seg_t) {
		var segs = calcSegments( this.length() );
		
		var firstIndex = segIndex * 3;
		
//			console.log(segIndex, seg_t);
		var p1 = this.points[firstIndex  ];
		var p2 = this.points[firstIndex+1];
		var p3 = this.points[firstIndex+2];
		var p4 = this.points[firstIndex+3];

		var pt = {
			x: qbz(p1.x, p2.x, p3.x, p4.x, seg_t),
			y: qbz(p1.y, p2.y, p3.y, p4.y, seg_t),
			dx: qbz_dt(p1.x, p2.x, p3.x, p4.x, seg_t),
			dy: qbz_dt(p1.y, p2.y, p3.y, p4.y, seg_t),
			ref1: p1,
			ref2: p2,
			ref3: p3,
			ref4: p4,
			segT: seg_t
		};
		
		return pt;
	},
	
	debugOut: function(container) {
		var path = $svg('path');
		var len = this.length();
		var d = [];
		for (var i = 0;i < len;i++) {
			var pt = this.points[i];
			if (i == 0) {
				d.push('M');
			} else if (i == 1) {
				d.push('C');
			}
			
			d.push(pt.x+','+pt.y);
			container.appendChild( debugDot(pt.x, pt.y, (i%3) == 0, i==5) );
		}
		
		path.setAttribute('d', d.join(' '));
		path.setAttribute('fill', 'none');
		path.setAttribute('stroke', 'lime');
		container.appendChild(path);
	},
	
	makePathData: function(scale) {
		var len = this.length();
		var d = [];
		scale = scale || 1;
		
		for (var i = 0;i < len;i++) {
			var pt = this.points[i];
			if (i == 0) {
				d.push('M');
			} else if (i == 1) {
				d.push('C');
			}
			
			d.push((pt.x*scale)+','+(pt.y*scale));
		}
		
		return d.join(' ');
	},
	
	length: function() {
		return this.points.length;
	},
	
	add: function(x, y) {
		if (y === undefined) {
			y = x.y;
			x = x.x;
		}

		this.points.push({
			x: x,
			y: y
		});
		
		return this;
	}
};

function calcSegments(plen) {
	return ((plen-1) / 3) | 0;
}

function subPt(p0, p1, kmul) {
	return {
		x: (p1.x - p0.x) * kmul + p0.x,
		y: (p1.y - p0.y) * kmul + p0.y
	};
}

function qbz(p1, p2, p3, p4, t) {
	var _t = 1.0 - t;
	return _t*_t*_t * p1 +
	       _t*_t* t * 3.0 * p2 +
	       _t* t* t * 3.0 * p3 + 
	        t* t* t * p4;
}

function qbz_dt(p1, p2, p3, p4, t) {
	var _t = 1.0 - t;
	return -3.0 * _t*_t * p1 +
	       (9.0*t*t - 12.0*t + 3) * p2 +
	       (-9.0*t*t + 6.0*t) * p3 + 
	       3.0 * t*t * p4;
}

function debugDot(x, y, clr, larger) {
	var c = $svg('circle');
	c.setAttribute('cx', x);
	c.setAttribute('cy', y);
	c.setAttribute('r', larger ? 3 : 2);
	c.setAttribute('fill', clr ? 'yellow' : 'white');

	return c;
}

function debugVector(x, y, dx, dy) {
	var c = $svg('line');
	c.setAttribute('x1', x);
	c.setAttribute('y1', y);
	c.setAttribute('x2', x+dx);
	c.setAttribute('y2', y+dy);
	c.setAttribute('stroke', 'red');

	return c;
}
