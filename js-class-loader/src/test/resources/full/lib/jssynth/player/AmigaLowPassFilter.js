namespace("jssynth.player");

jssynth.player.AmigaLowPassFilter = function() {
    var NZEROS = 2;
    var NPOLES = 2;
    var GAIN = 24.33619312;

    var xv = [ 0, 0, 0 ], yv = [0, 0, 0];

    this.next = function(sample) {
        xv[0] = xv[1]; xv[1] = xv[2];
        xv[2] = sample / GAIN;
        yv[0] = yv[1]; yv[1] = yv[2];
        yv[2] = (xv[0] + xv[2]) + 2 * xv[1]
            + ( -0.5147540757 * yv[0] ) + ( 1.3503898310 * yv[1]);
        return yv[2];
    };
};