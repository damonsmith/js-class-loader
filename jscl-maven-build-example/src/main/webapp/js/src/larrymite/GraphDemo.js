namespace("larrymite");

larrymite.GraphDemo = function() {
	
	//this.canvas = document.getElementsByTagName("canvas")[0];
	this.contentElement = document.getElementById("content");
	
	//var eventAdapter = new larrymite.app.event.AppEventAdapter();
	//eventAdapter.connectToCanvas(this.canvas);
	
	//var self = this;
	//window.addEventListener("resize", function() {self.onResize();});
	//this.onResize();
	
	
	var myCanviz = new Canviz('content', 'gen/graph.dot');
};

larrymite.GraphDemo.prototype.onResize = function() {
	this.canvas.width = this.contentElement.clientWidth;
	this.canvas.height = this.contentElement.clientHeight;
};
