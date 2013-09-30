namespace("jsviz.worker");


jsviz.worker.GraphWorker = function(messagePort, proc) {
	var _this = this;
	this.messagePort = messagePort;
	this.sharedFileURL = null;
	this.proc = proc;
	this.running = false;
	messagePort.addEventListener("message", function(event) {
		if (event.data) {
			switch(event.data.type) {
			case "_stopgo_run":
				if (!_this.running) {
					_this.sharedFileURL = event.data.sharedFileURL;
					_this.running = true;
					_this.proc(_this);
					_this.setStopped();
				}
				break;
			}
		}
	}, false);
};

jsviz.worker.GraphWorker.prototype = {
	shouldStop: function () {
		if (!this.sharedFileURL){ return false; }

		return compareFileContent(this.sharedFileURL, "STOP");
	},

	setStopped: function() {
		var _this = this;
		setTimeout(function() {
			_this.running = false;
		}, 50);
	},

	setCompleted: function() {
		this.messagePort.postMessage({type: '_stopgo_complete'});
	}
};