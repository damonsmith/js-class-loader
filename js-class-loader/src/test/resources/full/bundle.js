//# sourceMappingURL=bundle.js.map

function namespace(name) {
	var i, node = window, parts = name.split(".");
	for (i=0; i<parts.length; i++) {
		node[parts[i]] = node[parts[i]] || {};
		node = node[parts[i]];
	}
}

function extend(subClass, superClass) {
	var x, intermediateClass, isFirstInheritance = true;
	
	for (x in subClass) {
		isFirstInheritance = false;
		break;
	}
	
	if (isFirstInheritance) {
		intermediateClass = new Function();
		intermediateClass.prototype = superClass.prototype;
		subClass.prototype = new intermediateClass;
	}
	else {
		for (x in superClass.prototype) {
			subClass.prototype[x] = superClass.prototype[x];
		}
	}
}

function loadClass() {
	
}

function require(classString) {
	
};

function include(classString) {
	
};


var JSCL_UNIQUE_BUNDLE_HASH='d41d8cd98f00b204e9800998ecf8427e';

