namespace("jsviz");

jsviz.renderer.FadeOutTweenContext = function(cv) {
	this.cv = cv;
};

jsviz.renderer.FadeOutTweenContext.prototype = {
	interpolate: function(cvOut, t) {
		cvOut.clear();

		var len  = this.cv.length();
		for (var i = 0;i < len;i++) {
			var x = this.cv.points[i].x;
			var y = this.cv.points[i].y;
			cvOut.add(x, y);
		}

		cvOut.alpha = 1.0 - t;
	}
};