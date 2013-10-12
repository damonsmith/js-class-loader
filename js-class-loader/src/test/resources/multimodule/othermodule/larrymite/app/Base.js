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