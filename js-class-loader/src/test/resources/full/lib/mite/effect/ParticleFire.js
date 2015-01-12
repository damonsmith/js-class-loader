namespace("mite.effect");

mite.effect.ParticleFire = function(numParticles, offset) {
	this.numParticles = numParticles;
	
	this.particles = [];
	var i;
	for (i=0; i<numParticles; i++) {
		this.particles.push(new mite.effect.ParticleFire.Particle());
	}
};

//Inner class Particle:
mite.effect.ParticleFire.Particle = function() {
	this.reset();
};

//Inner class Particle:
mite.effect.ParticleFire.Particle.prototype.step = function() {
	this.remainingLife--;
	this.radius--;
	this.location.x += this.speed.x;
	this.location.y += this.speed.y;
	this.opacity = 0.5;
	
	if (this.radius < 1 || this.remainingLife < 1) {
		this.reset();
	}
};

//Inner class Particle:
mite.effect.ParticleFire.Particle.prototype.reset = function() {
	this.speed = {x: 2.5-Math.random()*5, y: 15+Math.random()*10};
	this.location = {x: 0, y: 0};
	this.radius = Math.random()*20;
	this.life = 20+Math.random()*10;
	this.remainingLife = this.life;
	
	var r = Math.round(Math.random()*255);
	var g = Math.round(Math.random()*255);
	var b = Math.round(Math.random()*255);
	
	var o = 0.5;
	
	this.rgba1 = "rgba(" + r + "," + g + "," + b + "," + o + ")";
	this.rgba2 = "rgba(" + r + "," + g + "," + b + ", 0)";
};

mite.effect.ParticleFire.prototype.draw = function(ctx) {
	var i;
	ctx.globalCompositeOperation = "lighter";
	
	for (i=0; i<this.particles.length; i++) {
		var p = this.particles[i];
		ctx.beginPath();
		
		var gradient = ctx.createRadialGradient(p.location.x, p.location.y, 0, p.location.x, p.location.y, p.radius);
		gradient.addColorStop(0, p.rgba1);
		gradient.addColorStop(1, p.rgba2);
		
		ctx.fillStyle = gradient;
		ctx.arc(p.location.x, p.location.y, p.radius, Math.PI*2, false);
		ctx.fill();
		
		p.step();
	}
};



