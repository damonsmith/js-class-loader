namespace("jsviz");

jsviz.JSVizRunner = function() {
	this.dotWorker = new Worker("js/src/jsviz/WorkerLoader.js");
	this.graphsCtrl = new jsviz.graph.GraphsController('graph-svg');
	
	this.stopGo = this.setupWebWorker(this.dotWorker);	
	this.startAnimationFunc = null;
	this.errorSink = new jsviz.ErrorSink();
	
	this.runOptions = {
		slow: false,
		prog: false
	};
	
	this.registerWorkerMessageHandler();
	
};

jsviz.JSVizRunner.prototype.loadGraphFromUrl = function(url) {
	var self = this;
	
	var req = new XMLHttpRequest();
	req.onload = function() {
		self.loadGraph(this.responseText);
	};
	req.open("get", url, true);
	req.send();
};

jsviz.JSVizRunner.prototype.setupWebWorker = function(dotWorker) {
	return new jsviz.worker.Controller(dotWorker,
		function(){ // stopGo ready
			postArgMessage(dotWorker, "init");
		},
		function() { // worker task complete
		});
};

jsviz.JSVizRunner.prototype.loadGraph = function(dotGraphText) {
	this.sendGraphToWorker(dotGraphText);
	this.setupGraphVizContext(this.runOptions);
};

jsviz.JSVizRunner.prototype.sendGraphToWorker = function(graphText) {
	postArgMessage(this.dotWorker, "setWorkerSTDIN", graphText);
};

jsviz.JSVizRunner.prototype.setupGraphVizContext = function(options) {
	postArgMessage(this.dotWorker, "setupGVContext", options);
};

jsviz.JSVizRunner.prototype.runDotLayout = function() {
	postArgMessage(this.dotWorker, "runDotLayout");
};

jsviz.JSVizRunner.prototype.registerWorkerMessageHandler = function() {
	var self = this;
	this.dotWorker.addEventListener("message", function(event) {
		self.distributeMessage(event);
	});
};

jsviz.JSVizRunner.prototype.distributeMessage = function(event) {
	if (event.data.type === "log") {
		console.log(event.data.arg0);
	}
	else if (event.data.type === "afterInit") {
		this[event.data.type].call(this);	
		
	}
	else {
		if (this[event.data.type]) {
			this[event.data.type].call(this, JSON.parse(event.data.arg0));	
		}
		else {
			this.log("no handler for event: " + event.data.type);
		}
		
	}
};

jsviz.JSVizRunner.prototype.afterInit = function() {
};

jsviz.JSVizRunner.prototype.afterSetupGVContext = function(value) {
	if (this.errorSink.countFatal() < 1) {
		this.stopGo.run();
	}
};

jsviz.JSVizRunner.prototype.afterRunDotLayout = function(param) {
	var extractor = new jsviz.graph.GraphExtractor();
	var graphInfo = null;
	if (param[0].type == "G") {
		graphInfo = param.shift();
	}
	
	extractor.extractFromJSON(param);
	this.graphsCtrl.setDisplayGraphSize(extractor.g, graphInfo.displayWidth, graphInfo.displayHeight);
	this.startAnimationFunc = function() {
		this.graphsCtrl.setNewGraph(extractor.g, this.runOptions.slow, function(){
			//nextReady();
		});
	};
	
	if (!this.runOptions.prog) {
		this.startAnimationFunc();
	}
};

jsviz.JSVizRunner.prototype.afterErrorCheck = function(param) {
	this.errorSink.load(param);
};

jsviz.JSVizRunner.prototype.recvProgress = function(value) {
};

jsviz.JSVizRunner.prototype.log = function(value) {
	console.log(value);
};

