//Create a namespace from a string, e.g:
//namespace("com.mycompany.mypackage");
function namespace(name) {
	var i, node = window, parts = name.split(".");
	for (i=0; i<parts.length; i++) {
		node[parts[i]] = node[parts[i]] || {};
		node = node[parts[i]];
	}
}

// This is an intermediate class style extend function that allows you
// to extend classes properly, preserve the scope chain and not execute the base
// constructor each time you use it.
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

// Implement is functionally the same as extend but can be used for
// descriptive purposes.
var implement = extend;

//this will tell JS-Class-Loader to include the named library.
function include(name) {};
