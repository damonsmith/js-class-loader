"use strict";
var window = {};
if (!this.console) {
	this.console = { log: function(a) { sendLog(a); } };
}

importScripts("../../../js/src/Base.js");
importScripts("Util.js");
importScripts("worker/GraphWorker.js");
importScripts("worker/Controller.js");
importScripts("graph/GraphExtractor.js");
importScripts("graph/Graph.js");
importScripts("renderer/GVEdge.js");
importScripts("ErrorSink.js");
importScripts("em-graphviz.js");

var emModule = null;
var workerGlobal = this;
var print = function(msg) { throw ("BAD PRINT!: " + msg); };
var STOP_FUNC_LABEL = '2.3456';
var SENDRK_FUNC_LABEL = '2.4567';
var SENDEG_FUNC_LABEL = '2.5678';

var GV = {
	gvc: null,
	verbose: 0,
	pGraph: null,
	errorSink: null,
	rankMap: {},
	edgeList: [],
	progressList: [],
	prevSent: 0,
	useProgress: false
};

var theStopGo = new jsviz.worker.GraphWorker(this, function(stopgo){
	runDotLayout();
	stopgo.setCompleted();
});

// OUTGOING MESSAGES - - - - - - - -

function afterInit() {
	postArgMessage(workerGlobal, "afterInit"); }
function afterSetupGVContext(param) {
	postArgMessage(workerGlobal, "afterSetupGVContext", param); }
function afterRunDotLayout(param) {
	postArgMessage(workerGlobal, "afterRunDotLayout", param); }
function afterErrorCheck(param) {
	postArgMessage(workerGlobal, "afterErrorCheck", param); }
function sendProgressMessage(param) {
	postArgMessage(workerGlobal, "sendProgress", param); }
function sendLog(s) {
	postArgMessage(workerGlobal, "log", s); }

// INCOMING MESSAGES - - - - - - - -
addEventListener("message", function(event){
	var etype  = event.data.type;
	var arg0   = event.data.arg0 || null;

	switch(etype) {
	case "init":
		initDotgenWorker(); break;
	case "setWorkerSTDIN":
		emModule.setStdinArray(arg0.split(/[\r\n]+/));
		break;
	case "setupGVContext":
		setupGVContext(arg0);
		break;
	}
}, false);

function initDotgenWorker() {
	emModule = window.initEmscriptenModule({noInitialRun: true});
	emModule.beforeMain();

	GV.errorSink = new jsviz.ErrorSink(emModule);
	afterInit();
}

function setupGVContext(options) {
	GV.useProgress = options.prog;
	GV.gvc = emModule._prepareGVContext();
	GV.errorSink.clear();
	var g_ptr = emModule._beginGVJob(GV.gvc, GV.verbose, GV.errorSink.funcLabel);
	GV.errorSink.checkGraph(emModule, g_ptr);
	afterErrorCheck(GV.errorSink.stringify());
	
	GV.pGraph = g_ptr;
	afterSetupGVContext( GV.errorSink.stringify() );
}

function shouldStopLayout(progress) {
	sendLog("SS : "+ progress);
	//if (progress == PROGRESS_BEFORE_MX || progress == PROGRESS_AFTER_MX) {
	if (GV.useProgress) {
		initRankNodePool();
		emModule._extractRanks(GV.pGraph, SENDRK_FUNC_LABEL);
		emModule._extractEdgesEarly(GV.pGraph, SENDEG_FUNC_LABEL);
		addProgressData(progress);
	}
	
	return theStopGo.shouldStop() ? 1 : 0;
}

function runDotLayout() {
	emModule.FUNCTION_TABLE[ STOP_FUNC_LABEL   ] = shouldStopLayout;
	emModule.FUNCTION_TABLE[ SENDRK_FUNC_LABEL ] = recvRankNode;
	emModule.FUNCTION_TABLE[ SENDEG_FUNC_LABEL ] = recvEdgeEarly;
	clearProgressList();
	
	emModule._runDotLayout(GV.pGraph, GV.gvc, STOP_FUNC_LABEL);
	var extractor = new jsviz.graph.GraphExtractor();
	extractor.extract(emModule, GV.pGraph, true);
	
	var ginfo = {
		type: "G",
		displayWidth:  emModule._getGraphWidth(GV.gvc),
		displayHeight: emModule._getGraphHeight(GV.gvc)
	};
	
	afterRunDotLayout(extractor.stringify(ginfo));
}

function emCharArray(m, len) {return m.allocate(len, "i8", m.allocate.ALLOC_STATIC) &4294967295;}
function emDoubleArray(m, len) {return m.allocate(len, "double", m.allocate.ALLOC_STATIC) &4294967295;}

function emExtractArray(m, ptr, len, val_type) {
	var a = [];
	var stride = 1;
	switch(val_type){
	case 'i8':  stride = 1; break;
	case 'double':  stride = 8; break;
	}
	for (var i = 0;i < len;i++) // >
		{ a.push(m.getValue(ptr+(i*stride), val_type)); }

	return a;
}

function clearProgressList() {
	GV.progressList.length = 0;
	GV.prevSent = 0;
}

function initRankNodePool() {
	GV.edgeList.length = 0;
	var m = GV.rankMap;
	for (var i in m) {delete m[i];}
}

function recvRankNode(rankIndex, pNode, isVirtual, coordX) {
	var m = GV.rankMap;
	
	if (!m[rankIndex]) {
		m[rankIndex] = [];
	}
	
	m[rankIndex].push({ptr: pNode, v: isVirtual, x: coordX});
}

function recvEdgeEarly(pEdge, pTailNode, pHeadNode) {
	var eg = {
		pEdge: pEdge,
		pTailNode: pTailNode,
		pHeadNode: pHeadNode
	};
	
	GV.edgeList.push(eg);
	// sendLog(pEdge +': '+ pTailNode.toString(16) +' -> '+ pHeadNode)
}

function addProgressData(progressState) {
//	var pg = new window.JSViz.ProgressModel(progressState);
//	pg.registerNodes(GV.rankMap, emModule);
//	pg.registerEdges(GV.edgeList);
//	GV.progressList.push(pg);
//	
//	sendProgress();
}

function sendProgress() {
	var PG_INTERVAL = 450;
	var nomore = true;
	var ls = GV.progressList;
	var t = new Date();
	
	if (ls.length) {
		if ((t - GV.prevSent) > PG_INTERVAL) {
			var pg = ls.shift();
			sendProgressMessage(pg.stringify());
			GV.prevSent = t;
		}
		nomore = false;
	}
	
	if (!nomore) {
		setTimeout(sendProgress, 50);
	}
}

// - - - - - - - - -