/**
 * This file provides universal functions for defining classes. It must be included
 * explicitly at the start of any bundle definition that uses it.
 */
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
	//do nothing, class loader will detect and include parse-time dependencies automatically.
}

function require(classString) {
	//do nothing, class loader will detect and include dependencies automatically.
};

function include(classString) {
	//do nothing, class loader will detect and include dependencies automatically.
};