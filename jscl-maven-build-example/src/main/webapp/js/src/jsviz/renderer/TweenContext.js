namespace("jsviz.renderer");

jsviz.renderer.TweenContext = function(cvFrom, cvTo, growAnim) {
	this.cvFrom = cvFrom;
	this.cvTo = cvTo;
	this.growAnim = growAnim;
};

jsviz.renderer.TweenContext.prototype = {
	interpolate: function(cvOut, t) {
		cvOut.clear();
		var _t = 1.0 - t;
		var tt = t*t;
		var _tt = 1.0 - tt;
		
		if (this.growAnim) {
			growCurve(cvOut, this.cvTo, (t<0.1) ? 0.1 : t);
			return;
		}

		var len  = this.cvFrom.length();
		for (var i = 0;i < len;i++) {
			//if (i == 0 || i == (len-1)) {
				cvOut.add(
					this.cvFrom.points[i].x * _t + this.cvTo.points[i].x * t,
					this.cvFrom.points[i].y * _t + this.cvTo.points[i].y * t
				);
				/*
			}
			else {
				cvOut.add(
					this.cvFrom.points[i].x * _tt + this.cvTo.points[i].x * tt,
					this.cvFrom.points[i].y * _tt + this.cvTo.points[i].y * tt
				);
			}*/
		}
	},

	growAnimation: function(t) {
		if (t<0){t=0;}

		var slen = calcSegments( this.cvTo.length() );
		var k = t * slen;
		var segIndex = Math.floor(k);
		var segT = k - segIndex;
		if (segIndex == slen) {
			--segIndex;
			segT = 1.0;
		}

		return this.cvTo.pointAt(segIndex, segT);
	}

};

function growCurve(cvOut, cvIn, t) {
	// calc segment index
	var slen = calcSegments( cvIn.length() );
	var k = t * slen;
	var i;
	var segIndex = Math.floor(k);
	var segT = k - segIndex;
	if (segIndex == slen) {
		--segIndex;
		segT = 1.0;
	}

	// copy grown segments
	cvOut.clear();
	if (segIndex > 0) {
		var copyLen = 3 * segIndex;
		for (i = 0;i < copyLen;i++) {
			cvOut.add(cvIn.points[i]);
		}
	}

	var vec = {x:0, y:0};
	var ancI1;
	ancI1 = segIndex * 3;
	cvOut.add(cvIn.points[ancI1]);
	if (segT < 0.001) {
		return;
	}
	
	growHandle(vec, cvIn, ancI1, 0);
	vec.x *= segT;
	vec.y *= segT;
	cvOut.add(cvIn.points[ancI1].x + vec.x,  cvIn.points[ancI1].y + vec.y);

	var headPt = cvIn.pointAt(segIndex, segT);
	growHandle(vec, cvIn, ancI1, segT);
	vec.x *= segT;
	vec.y *= segT;

	cvOut.add(headPt.x + vec.x, headPt.y + vec.y);
	cvOut.add(headPt);
}

function assertNaN(cv) {
	var len = cv.length();
	for (var i = 0;i < len;i++) {
		var pt = cv.points[i];
		if (isNaN(pt.x) || isNaN(pt.y)) {
			console.log(this);
			throw "Bad NaN";
		}
	}
}

function growHandle(outVec, cv, index, t) {
	var tail = t < 0.0001;
	var pts = cv.points;
	var dx = qbz_dt(pts[index].x, pts[index+1].x, pts[index+2].x, pts[index+3].x, t);
	var dy = qbz_dt(pts[index].y, pts[index+1].y, pts[index+2].y, pts[index+3].y, t);
	var len = vecLen(dx, dy);
	if (len < 0.0001 && len > -0.0001) {len=1;}
	
	dx /= len;
	dy /= len;
	
	var handleI1 = tail ? index     : (index+3);
	var handleI2 = tail ? (index+1) : (index+2);
	var h1 = pts[handleI1];
	var h2 = pts[handleI2];
	var hlen = vecLen(h1.x-h2.x, h1.y-h2.y);

	if (tail) {
		outVec.x = dx * hlen;
		outVec.y = dy * hlen;
	} else {
		outVec.x = -dx * hlen;
		outVec.y = -dy * hlen;
	}
}


function vecLen(x,y) {return Math.sqrt(x*x + y*y);}
