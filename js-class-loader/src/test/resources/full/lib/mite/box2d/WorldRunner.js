namespace("mite.box2d");

include("box2d.box2d");

mite.box2d.WorldRunner = function() {
	this.debugMode = document.location.query && document.location.query.indexOf("debug") >= 0;
	this.world = null;
	this.running = false;
	this.frameRate = 60;
	this.jointDefsToCreate = [];
	
	this.subscribedBodyContactsByName = [];
	this.subscribedBodyContacts = [];
};

mite.box2d.WorldRunner.prototype.load = function(worldData) {
	this.world = worldData.world;
	this.world.m_contactManager.m_contactSubscriber = this;
	this.jointMap = worldData.jointMap;
	this.bodyMap = worldData.bodyMap;
	this.forceMap = {};
	this.generateContactSubscribersByBody();
};

mite.box2d.WorldRunner.prototype.getBodyAtPosition = function(worldPos) {
	var aabb = new b2AABB();
	aabb.minVertex.Set(worldPos.x - 0.1, worldPos.y - 0.1);
	aabb.maxVertex.Set(worldPos.x + 0.1, worldPos.y + 0.1);
	
	var buffer = [];
	this.world.Query(aabb, buffer, 1);
	if (buffer[0]) {
		return buffer[0].GetBody();
	}
	else {
		return null;
	}
};

mite.box2d.WorldRunner.prototype.dragBodyAtPosition = function(worldPos) {
	var dragBody = this.getBodyAtPosition(worldPos);
	if (dragBody && !this.mouseJoint) {
		var jointDef = new b2MouseJointDef();
		jointDef.body1 = this.world.GetGroundBody();
		jointDef.body2 = dragBody;
		
	    jointDef.anchorPoint = new b2Vec2(worldPos.x, worldPos.y);
	    jointDef.target = jointDef.anchorPoint;
	    jointDef.maxForce = 300 * dragBody.GetMass();
	    this.mouseJoint = this.world.CreateJoint(jointDef);
	    return true;
	}
	else {
		return false;
	}
};

mite.box2d.WorldRunner.prototype.dragBodyToPosition = function(worldPos) {
	var targetPoint = new b2Vec2(worldPos.x, worldPos.y);
	this.mouseJoint.SetTarget(targetPoint);
};

mite.box2d.WorldRunner.prototype.removeDrag = function() {
	if (this.mouseJoint) {
		this.world.DestroyJoint(this.mouseJoint);
		this.mouseJoint = null;
	}
};

mite.box2d.WorldRunner.prototype.createDistanceJoint = function(body1, body2, jointName) {
	var distJoint = new b2DistanceJointDef();
	distJoint.body1 = body1;
	distJoint.body2 = body2;
	distJoint.svgId = jointName;

    distJoint.anchorPoint1 = body1.GetCenterPosition();
    distJoint.anchorPoint2 = body2.GetCenterPosition();
    this.manConnectedToChainJoint = distJoint;
    
    this.addJointDefToCreate(distJoint);
    return distJoint;
};


/**
 * Add a callback to be called when two bodies collide. The callback will be guaranteed to be called
 * back with the bodies in the order they were subscribed to.
 * 
 * @param name1 the svgId of the first body
 * @param name2 the svgId of the second body
 * @param startHandlerFunc your function to call back when a contact starts (or null)
 * @param endHandlerFunc your function to call back when a contact ends (or null)
 * @param scope your 'this' to pass through to call back on.
 */
mite.box2d.WorldRunner.prototype.addContactSubscriber = function(name1, name2, startHandlerFunc, endHandlerFunc, scope) {

	this.subscribedBodyContactsByName.push(
			{
				a: name1, 
				b: name2, 
				startFunc: startHandlerFunc, 
				endFunc: endHandlerFunc,
				scope: scope
			});
};

mite.box2d.WorldRunner.prototype.generateContactSubscribersByBody = function() {
	var i, entry;
	this.subscribedBodyContacts = [];
	for (i=0; i<this.subscribedBodyContactsByName.length; i++) {
		entry = this.subscribedBodyContactsByName[i];
		
		var contactSubscription = {
			startFunc: entry.startFunc, 
			endFunc: entry.endFunc,
			scope: entry.scope
		};
		contactSubscription.a = this.bodyMap[entry.a]; 
		//Allow wildcarding of second body:
		if (entry.b === "*") {
			contactSubscription.b = entry.b;
		}
		else {
			contactSubscription.b = this.bodyMap[entry.b]; 
		}
		
		this.subscribedBodyContacts.push(contactSubscription);
	}
};

mite.box2d.WorldRunner.prototype.startContact = function(body1, body2) {
	var i;
	for (i=0; i<this.subscribedBodyContacts.length; i++) {
		var subscription = this.subscribedBodyContacts[i];
		if (subscription.startFunc) {
			if (subscription.a === body1 && (subscription.b === "*" || subscription.b === body2)) {
				subscription.startFunc.apply(subscription.scope, [body1, body2]);
			}
			else if (subscription.a === body2 && (subscription.b === "*" || subscription.b === body1)) {
				subscription.startFunc.apply(subscription.scope, [body2, body1]);
			}	
		}
	}
};

mite.box2d.WorldRunner.prototype.endContact = function(body1, body2) {
	var i;
	for (i=0; i<this.subscribedBodyContacts.length; i++) {
		var subscription = this.subscribedBodyContacts[i];
		if (subscription.endFunc) {
			if (subscription.a === body1 && (subscription.b === "*" || subscription.b === body2)) {
				subscription.endFunc.apply(subscription.scope, [body1, body2]);
			}
			else if (subscription.a === body2 && (subscription.b === "*" || subscription.b === body1)) {
				subscription.endFunc.apply(subscription.scope, [body2, body1]);
			}	
		}
	}
};

mite.box2d.WorldRunner.prototype.addJointDefToCreate = function(jointDef) {
	this.jointDefsToCreate.push(jointDef);
};

mite.box2d.WorldRunner.prototype.addForce = function(name, bodyName, dx, dy) {
	
	this.forceMap[name] = {
			bodyName: bodyName,
			vector: new b2Vec2(dx, dy),
			rotatesWithBody: true
	};
};

mite.box2d.WorldRunner.prototype.removeForce = function(name) {
	
	delete this.forceMap[name];
};


mite.box2d.WorldRunner.prototype.step = function(cnt) {
	
	var timeStep = 2.0/this.frameRate;
	var i, force, body, vectorToApply;
	for (i in this.forceMap) {
		force = this.forceMap[i];
		body = this.bodyMap[force.bodyName];
		
		vectorToApply = force.vector;
		
		if (force.rotatesWithBody) {
			vectorToApply = b2Math.b2MulMV(body.GetRotationMatrix(), force.vector);
		}
		
		body.ApplyForce(vectorToApply, body.GetCenterPosition());
	}
	this.world.Step(timeStep, 1);
	this.createJoints();
};

mite.box2d.WorldRunner.prototype.createJoints = function() {
	while(this.jointDefsToCreate.length > 0) {
		var jointDef = this.jointDefsToCreate.pop();
		var joint = this.world.CreateJoint(jointDef);
		this.jointMap[jointDef.svgId] = joint;
	}
};

mite.box2d.WorldRunner.prototype.destroyJoint = function(name) {
	this.world.DestroyJoint(this.jointMap[name]);
	delete this.jointMap[name];
};

