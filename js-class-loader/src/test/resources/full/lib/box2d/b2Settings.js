namespace("box2d");

box2d.b2Settings = Class.create();
box2d.b2Settings.prototype = {

	// Define your unit system here. The default system is
	// meters-kilograms-seconds. For the tuning to work well,
	// your dynamic objects should be bigger than a pebble and smaller
	// than a house.
	//static public const b2Settings.b2_lengthUnitsPerMeter = 1.0;

	// Use this for pixels:

	// Global tuning constants based on MKS units.

	// Collision

	// Dynamics

	// Sleep

	// assert

	initialize: function() {}
}
box2d.b2Settings.USHRT_MAX = 0x0000ffff;
box2d.b2Settings.b2_pi = Math.PI;
box2d.b2Settings.b2_massUnitsPerKilogram = 1.0;
box2d.b2Settings.b2_timeUnitsPerSecond = 1.0;
box2d.b2Settings.b2_lengthUnitsPerMeter = 30.0;
box2d.b2Settings.b2_maxManifoldPoints = 2;
box2d.b2Settings.b2_maxShapesPerBody = 64;
box2d.b2Settings.b2_maxPolyVertices = 8;
box2d.b2Settings.b2_maxProxies = 1024;
box2d.b2Settings.b2_maxPairs = 8 * box2d.b2Settings.b2_maxProxies;
box2d.b2Settings.b2_linearSlop = 0.005 * box2d.b2Settings.b2_lengthUnitsPerMeter;
box2d.b2Settings.b2_angularSlop = 2.0 / 180.0 * box2d.b2Settings.b2_pi;
box2d.b2Settings.b2_velocityThreshold = 1.0 * box2d.b2Settings.b2_lengthUnitsPerMeter / box2d.b2Settings.b2_timeUnitsPerSecond;
box2d.b2Settings.b2_maxLinearCorrection = 0.2 * box2d.b2Settings.b2_lengthUnitsPerMeter;
box2d.b2Settings.b2_maxAngularCorrection = 8.0 / 180.0 * box2d.b2Settings.b2_pi;
box2d.b2Settings.b2_contactBaumgarte = 0.2;
box2d.b2Settings.b2_timeToSleep = 0.5 * box2d.b2Settings.b2_timeUnitsPerSecond;
box2d.b2Settings.b2_linearSleepTolerance = 0.01 * box2d.b2Settings.b2_lengthUnitsPerMeter / box2d.b2Settings.b2_timeUnitsPerSecond;
box2d.b2Settings.b2_angularSleepTolerance = 2.0 / 180.0 / box2d.b2Settings.b2_timeUnitsPerSecond;
box2d.b2Settings.b2Assert = function(a) {
	if (!a){
		var nullVec;
		nullVec.x++;
	}
};