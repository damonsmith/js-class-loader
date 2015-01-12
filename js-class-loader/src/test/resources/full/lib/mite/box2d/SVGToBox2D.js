namespace("mite.box2d");

/**
 * Converts an SVG element into a Box2D World definition, using the element 
 * description to generate joints, welds, ropes and mouse points.
 * 
 * @returns {mite.box2d.SVGToBox2D}
 */
mite.box2d.SVGToBox2D = function() {
	
};

mite.box2d.SVGToBox2D.prototype.convertSVGToWorldData = function(svg) {
	var bodyMap = {};
	var shapeMap = {};
	var jointMap = {};
	var viewBoxes = {};
	
	var size = {x: svg.width.baseVal.value, y: svg.height.baseVal.value};
	
    var worldAABB = new b2AABB();
	worldAABB.minVertex.Set(-size.x*3, -size.y*3);
	worldAABB.maxVertex.Set(size.x*4, size.y*4);
	var gravity = new b2Vec2(0, 300);
	var doSleep = true;
	var world = new b2World(worldAABB, gravity, doSleep);
	world.size = size;
	var groups = Array.prototype.slice.call(svg.getElementsByTagName("g"));
    var paths = Array.prototype.slice.call(document.getElementsByTagName("path"));
    var rects = Array.prototype.slice.call(document.getElementsByTagName("rect"));
    var images = Array.prototype.slice.call(document.getElementsByTagName("image"));
    
    this.createBodiesFromGroups(world, groups, bodyMap, shapeMap);
    this.createShapes(world, paths, bodyMap, shapeMap);
    this.createBoxes(world, rects, bodyMap, shapeMap, viewBoxes);
    this.createRevoluteJoints(world, paths, bodyMap, jointMap);
    this.createDistanceJoints(world, paths, bodyMap, jointMap);
    this.createWelds(world, paths, bodyMap, jointMap);
    
    return {world: world, bodyMap: bodyMap, shapeMap: shapeMap, jointMap: jointMap, size: size, viewBoxes: viewBoxes};
};

mite.box2d.SVGToBox2D.prototype.createBox = function(world, x, y, width, height, fixed) {
	if (typeof(fixed) == 'undefined') fixed = true;
	var boxSd = new b2BoxDef();
	if (!fixed) boxSd.density = 1.0;
	boxSd.extents.Set(width, height);
	var boxBd = new b2BodyDef();
	boxBd.AddShape(boxSd);
	boxBd.position.Set(x,y);
	return world.CreateBody(boxBd);
};

mite.box2d.SVGToBox2D.prototype.convertPathToShape = function(path, options) {

	var i, pathSegElement, polyShape = new b2PolyDef();
	if (!options.fixed) polyShape.density = options.density;
	
	var previousPoint = [0,0];
	var points = [];
	
	for (i=0; i<path.pathSegList.numberOfItems; i++) {
		pathSegElement = path.pathSegList.getItem(i);
        if (pathSegElement.pathSegType === 3 || pathSegElement.pathSegType === 5 || pathSegElement.pathSegType === 7) { //Type 1 is a Close Path command, which is unnecessary for box2d polys.
            var point = [previousPoint[0] + pathSegElement.x, previousPoint[1] + pathSegElement.y];
            previousPoint = point;
            points.push(point);
        }
        else if (pathSegElement.pathSegType === 2 || pathSegElement.pathSegType === 4) {
        	var point = [pathSegElement.x, pathSegElement.y];
            previousPoint = point;
            points.push(point);
        }
    }
	
    polyShape.vertexCount = points.length;
	for (var i = 0; i < points.length; i++) {
		polyShape.vertices[i].Set(points[i][0], points[i][1]);
	}
	polyShape.svgId = path.id;
	polyShape.isVisible = options.visible;
	return polyShape;
};

mite.box2d.SVGToBox2D.prototype.convertRectToBox = function(rect, options) {

	var boxSd = new b2BoxDef();
	if (!options.fixed) {
		boxSd.density = 1.0;
	}
	boxSd.extents.Set((rect.getAttribute("width")*1)/2, (rect.getAttribute("height")*1)/2); 
	
	boxSd.localPosition.Set(
			(rect.getAttribute("x")*1) + (boxSd.extents.x),
			(rect.getAttribute("y")*1) + (boxSd.extents.y)
	);
	
	boxSd.svgId = rect.id;
	boxSd.isVisible = options.visible;
	return boxSd;
};

mite.box2d.SVGToBox2D.prototype.createBall = function(world, x, y, rad, fixed) {
	var ballSd = new b2CircleDef();
	if (!fixed) ballSd.density = 1.0;
	ballSd.radius = rad || 10;
	ballSd.restitution = 0.2;
	var ballBd = new b2BodyDef();
	ballBd.AddShape(ballSd);
	ballBd.position.Set(x,y);
	return world.CreateBody(ballBd);
};


mite.box2d.SVGToBox2D.prototype.createBodiesFromGroups = function(world, groups, bodyMap, shapeMap) {
	var i;
	for (i=0; i<groups.length; i++) {
		this.createBodyFromGroup(world, groups[i], bodyMap, shapeMap);
	}
};

mite.box2d.SVGToBox2D.prototype.createBodyFromGroup = function(world, group, bodyMap, shapeMap) {
	var i;
	var path, paths = group.getElementsByTagName("path");
	var rect, rects = group.getElementsByTagName("rect");
	
	var translate = this.getTranslate(group);
	
	var bodyDef = new b2BodyDef();
	bodyDef.position.Set(translate.x,translate.y);
	
	for (i=0; i<paths.length; i++) {
		path = paths[i];
		if (!shapeMap[path.id]) {
			var options = this.getOptionsByParsingDescription(path);
			var polyShape = this.convertPathToShape(path, options);
	    	bodyDef.AddShape(polyShape);
			shapeMap[path.id] = polyShape;
		}
	}
	for (i=0; i<rects.length; i++) {
		rect = rects[i];
		if (!shapeMap[rect.id]) {
			var options = this.getOptionsByParsingDescription(rect);
        	var box = this.convertRectToBox(rect, options);
        	bodyDef.AddShape(box);
        	shapeMap[rect.id] = box;
		}
	}

	var body = world.CreateBody(bodyDef);
    body.svgId = group.id;
    bodyMap[body.svgId] = body;
};

mite.box2d.SVGToBox2D.prototype.createShapes = function(world, paths, bodyMap, shapeMap) {
    var self = this;
    paths.forEach(function(pathElement) {

        if (!shapeMap[pathElement.id] &&
        	pathElement.id.indexOf("-joint") === -1 &&
        	pathElement.id.indexOf("-rope")  === -1 &&
        	pathElement.id.indexOf("-weld")  === -1 &&
        	pathElement.id.indexOf("-mouse") === -1) { 
        	
        	var options = self.getOptionsByParsingDescription(pathElement);
        	var polyShape = self.convertPathToShape(pathElement, options);
        	var bodyDef = new b2BodyDef();
        	
        	bodyDef.AddShape(polyShape);
        	bodyDef.position.Set(0,0);
        	var body = world.CreateBody(bodyDef);
            body.svgId = pathElement.id;
            body.isVisible = options.visible;
            shapeMap[body.svgId] = polyShape;
            polyShape.isVisible = options.visible;
            bodyMap[body.svgId] = body;
        }
    });
};

mite.box2d.SVGToBox2D.prototype.createBoxes = function(world, rects, bodyMap, shapeMap, viewBoxes) {
    var self = this;
    rects.forEach(function(rectElement) {

        if (!shapeMap[rectElement.id]) {
        	
        	var options = self.getOptionsByParsingDescription(rectElement);
			//If it's set to be a viewbox then don't create a Box2D body out of it, just
			//record it's dimensions in viewBoxes with the id as the name.
			if (options.viewBox) {
        		viewBoxes[rectElement.id] = {
        			x: rect.getAttribute("x")*1,
        			y: rect.getAttribute("y")*1,
        			w: rectElement.getAttribute("width")*1, 
        			h: rect.getAttribute("height")*1
        		}
        	}
        	else {
	        	var box = self.convertRectToBox(rectElement, options);
	        	var bodyDef = new b2BodyDef();
	        	
	        	bodyDef.AddShape(box);
	        	var body = world.CreateBody(bodyDef);
	            body.svgId = rectElement.id;
	            shapeMap[body.svgId] = box;
	            bodyMap[body.svgId] = body;	
	        }
        }
    });
};


mite.box2d.SVGToBox2D.prototype.createRevoluteJoints = function(world, paths, bodyMap, jointMap) {
	var self = this;
	
	paths.forEach(function(pathElement) {
        if (pathElement.id.indexOf("-joint") !== -1) {
        	var translate = self.getTranslate(pathElement);
        	pathSegs = pathElement.id.split("-");
        	
        	var jointDef = new b2RevoluteJointDef();
        	self.assignBodiesFromId(pathElement.id, jointDef, world, bodyMap);
        	
            //console.debug("creating revolute joint between: " + jointDef.body1.svgId + " and " + jointDef.body2.svgId);
            jointDef.anchorPoint = new b2Vec2(pathElement.pathSegList.getItem(0).x + translate.x, pathElement.pathSegList.getItem(0).y + translate.y);
            var joint = world.CreateJoint(jointDef);
            joint.svgId = pathElement.id;
            jointMap[joint.svgId] = joint;
        }
    });
};

mite.box2d.SVGToBox2D.prototype.createWelds = function(world, paths, bodyMap, jointMap) {
	var self = this;
	
	paths.forEach(function(pathElement) {
        if (pathElement.id.indexOf("-weld") !== -1) {
        	var translate = self.getTranslate(pathElement);
        	pathSegs = pathElement.id.split("-");
        	
        	var jointDef = new b2RevoluteJointDef();
        	jointDef.enableLimit = true;
        	self.assignBodiesFromId(pathElement.id, jointDef, world, bodyMap);
        	
            //console.debug("creating revolute joint between: " + jointDef.body1.svgId + " and " + jointDef.body2.svgId);
            jointDef.anchorPoint = new b2Vec2(pathElement.pathSegList.getItem(0).x + translate.x, pathElement.pathSegList.getItem(0).y + translate.y);
            var joint = world.CreateJoint(jointDef);
            joint.svgId = pathElement.id;
            jointMap[joint.svgId] = joint;
        }
    });
};


mite.box2d.SVGToBox2D.prototype.createDistanceJoints = function(world, paths, bodyMap, jointMap) {
	var self = this;
    paths.forEach(function(pathElement) {
    	var translate = self.getTranslate(pathElement);
        var pointList = [];
        var previousPoint = [0,0];
        
        
        if (pathElement.id.indexOf("-rope") !== -1) {
        	
            var i;
        	for (i=0; i<pathElement.pathSegList.numberOfItems; i++) {
        		var pathSegElement = pathElement.pathSegList.getItem(i);
        		if (pathSegElement.pathSegType !== 1) {
                    var point = [previousPoint[0] + pathSegElement.x + translate.x, previousPoint[1] + pathSegElement.y + translate.y];
                    previousPoint = point;
                    pointList.push(point);
                }
        	}
        	
        	pathSegs = pathElement.id.split("-");
        	
        	var distJoint = new b2DistanceJointDef();
        	self.assignBodiesFromId(pathElement.id, distJoint, world, bodyMap);

            distJoint.anchorPoint1 = new b2Vec2(pointList[0][0], pointList[0][1]);
            distJoint.anchorPoint2 = new b2Vec2(pointList[1][0], pointList[1][1]);
            var distJointOut = world.CreateJoint(distJoint);
            distJointOut.svgId = pathElement.id;
            jointMap[distJoint.svgId] = distJointOut;
        }
    });
};

mite.box2d.SVGToBox2D.prototype.assignBodiesFromId = function(idString, joint, world, bodyMap) {
	
	var pathSegs = idString.split("-");
	
	joint.body1 = bodyMap[pathSegs[0]];
	if (!joint.body1) {
		throw "Error 110: joint id is trying to join something that doesn't exist: " + pathSegs[0];
	}
	
	if (pathSegs.length === 3) {
		
		joint.body2 = bodyMap[pathSegs[1]];
		if (!joint.body2) {
			throw "Error 110: joint id is trying to join something that doesn't exist: " + pathSegs[1];
		}
	}
	else if (pathSegs.length === 2) {
		joint.body2 = world.GetGroundBody();
	}
	else {
		throw "Error 111 (invalid number of hyphens in an id for a joint item)";
	}
	
	
};

mite.box2d.SVGToBox2D.prototype.getTranslate = function(path) {
	var translate = {x: 0, y: 0};
	
	var transform = path.getAttribute("transform");
	if (transform && transform.indexOf("translate(") != -1) {
		var translateVals = transform.match("translate\\(([\\-?\\d\\.]+)[,\\ ]+([\\-?\\d\\.]+)");
		translate.x = translateVals[1]*1;
		translate.y = translateVals[2]*1;
	}
	return translate;
};

mite.box2d.SVGToBox2D.prototype.getOptionsByParsingDescription = function(pathElement) {
	
	var userOptions = {};
	
	try {
		if (pathElement.getElementsByTagName("desc")[0]) {
			//console.debug("{" + pathElement.getElementsByTagName("desc")[0].childNodes[0].textContent + "}");
			userOptions = JSON.parse("{" + pathElement.getElementsByTagName("desc")[0].childNodes[0].textContent + "}");
		}	
	}
	catch (e) {
		console.error(e);	
		console.error(
				'the PathElement "' + pathElement.id + 
				'" has a description which cant be parsed as JSON.\n' + 
				'descriptions are used to add options like density or friction to objects in JSON format.');
	}

	var defaultOptions = {
			fixed: false,
			density: 1.0,
			visible: true
	};
	
	return Object.extend(defaultOptions, userOptions);
};
