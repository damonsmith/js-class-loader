namespace("jsviz");

jsviz.Util = {};

jsviz.Util.allocCString = function(m, str) {
	var len = str.length;
	var a = new Array(len);
	for (var i = 0;i < len;i++) { // >
		a[i] = str.charCodeAt(i);
	}

	return m.allocate(a, "i8", m.allocate.ALLOC_STATIC) &4294967295;
};

jsviz.Util.emCharArray = function(m, len) {
	return m.allocate(len, "i8", m.allocate.ALLOC_STATIC) &4294967295;
};

jsviz.Util.emDoubleArray = function(m, len) {
	return m.allocate(len, "double", m.allocate.ALLOC_STATIC) &4294967295;
}

jsviz.Util.emExtractArray = function(m, ptr, len, val_type) {
	var a = [];
	var stride = 1;
	switch(val_type){
	case 'i8':  stride = 1; break;
	case 'double':  stride = 8; break;
	}
	for (var i = 0;i < len;i++) // >
		{ a.push(m.getValue(ptr+(i*stride), val_type)); }

	return a;
};
