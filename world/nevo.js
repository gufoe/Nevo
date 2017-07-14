var Nevo = function(brains) {

	this.type = 'n';
	this.id = parseInt(Math.random()*1000);
	// Descriptors
	this.pos = new Vec(Math.random()*world.w, Math.random()*world.h);
	this.rot = Math.random()*Math.PI*2;
	this.linVel = 0;
	this.angVel = 0;
	this.life = 0;
	this.age = 0;
	this.gen = null;
	this.children = [];
	this.lat = null;
	this.shadowRadius = 100

	// Max number of visible objects (closer objects have priority)
	this.viewAccuracy = 10;

	// For each object, the point
	var outPrecision = 3
	this.brains = brains ? brains : {
		// This is used to understand each object, using distance, direction and poison
		// object: new Net(),

		// This is used to decide what action to take based on each seen object and other parameters (velocity, health etc.)
		main: new Net(null, {
			nodes: {
				y2: { bias: 2, act: 'id' },
				y1: { bias: 0, act: 'id' },
				k: { bias: 0, act: 'id' },
			},
			archs: {
				k : {
					x3: 1
				},
				y1 : {
					x5: 1
				}
			}
		}),
	};

	// The max delta direction for consideration
	this.viewRange = Math.PI/2;

	// The fitness evaluation property
	this.eaten = 0;

	// Accelerations
	this.linAcc = 0;
	this.angAcc = 0;

	// Limits
	this.maxLinVel = 1.4;
	this.maxLinAcc = this.maxLinVel/40;

	this.maxAngVel = Math.PI/16.0;
	this.maxAngAcc = this.maxAngVel/20;

	this.maxLife = 3000;
	this.life = this.maxLife/4;


	// The Vec to follow
	this.follow = null;

	// The creature radius
	this.radius = 5;


	// The creature color
	this.color = [200,200,200];
	this.highlight = null;

	// Put me in the lattice
}

Nevo.prototype.addToTree = function(tree) {
	tree.push({
		color: this.color.join(','),
		time: world.age,
		children: this.children
	});
}

Nevo.prototype.eat = function(obj, force) {

	if(obj.type == 'n') {
		if(force) {
			this.life+= obj.life;
			this.eaten++;
			world.remove(obj);
			if (this.fitness() > world.bestFitness) world.bestFitness = this.fitness();
		} else {
			if(Math.abs(this.color[0]-obj.color[0]) < 50)
				return;
			if(this.color[0] > obj.color[0]) {
				this.eat(obj, true);
			} else {
				obj.eat(this, true);
			}
			return;
		}
	} else {
		var poison = obj.poison
		if(poison<.5) {
			this.life+= obj.energy
			this.eaten++;
			if (this.fitness() > world.bestFitness) world.bestFitness = this.fitness();
		} else {
			this.life-= obj.energy*3
			this.eaten-= 3
		}
		obj.randomize()
		// world.remove(obj);

	}
	this.life = Math.min(this.life, this.maxLife);
}


Nevo.prototype.think = function(each, really) {
	var inputs = [];

	// Relative linear acceleration [-1, +1]
	inputs.push(this.linAcc/this.maxLinAcc);

	// Relative angular acceleration [-1, +1]
	inputs.push(this.angAcc/this.maxAngAcc);

	// Relative life [0, 1]
	inputs.push(this.life/this.maxLife);

	// Elaborate every point
	var max_dist = 200
	var view = []
	// Filter objects not in view
	each((obj, i) => {
		if (obj == this) return
		// if (obj.type != 'm') return

		// Get distance
		obj.tmp_dist = this.pos.dist(obj.pos)
		// Filter by distance
		if (obj.tmp_dist > max_dist) return
		// Eat close meals
		if (obj.type == 'm' && obj.tmp_dist < obj.radius+this.radius) {
			this.eat(obj)
			return
		}
		if (!really) return

		// Get angle
		obj.tmp_angle = Angle.norm(Angle.drift(this.pos, obj.pos)-this.rot)
		// Filter by angle
		if (Math.abs(obj.tmp_angle) > this.viewRange) return
		// Save valid objects
		var inserted = false
		for (var j = 0; j < view.length; j++) {
			if (obj.tmp_dist < view[j].tmp_dist) {
				view.splice(j, 0, obj)
				inserted = true
				return
			}
		}
		view.push(obj)
	})
	if (!really) return

	// console.log(this.pos, parseInt(this.rot/Math.PI*180))

	var empty = [0,0,0]
	for (var i = 0; i < this.viewAccuracy; i++) {
		var obj = view[i]
		var out = empty

		// Filter by object
		if (obj) {
			var dist = obj.tmp_dist
			var angle = obj.tmp_angle
			// if ((obj.poison-.5)*100 > 0)
				// console.log(obj.poison)
			// Object is valid
			// console.log(i, parseInt(dist), parseInt(angle/Math.PI*180))
			var out = [
				obj.type == 'm' ? 1 : 0,
				// Distance [0, 1] bigger is closer
				1-dist/max_dist,
				// Relative angle [-PI, +PI]
				angle,

				(obj.poison-.5)*2
			]
		}
		// this.brains.object.reset()
		// for (var j in out) {
		// 	this.brains.object.set('x'+i, out[j])
		// }
		// var v = this.brains.object.val('y')
		// inputs.push(v)
		inputs = inputs.concat(out)
	}

	for (var i in inputs) {
		this.brains.main.set('x'+i, inputs[i])
	}
}

Nevo.prototype.update = function(each) {
	this.age++;
	//this.life-= Math.pow(1.001, this.age/3);
	//this.life-= Math.sqrt(this.age)/30;
	this.life-= this.radius/5;
	//this.life-= 1;

	if (this.age%100 == 0) {
		this.radius+= 0.5;
	}

	// Only elaborate inputs every X frames (for performance)
	this.think(each, this.age%4 == 0)

	// console.log(thought)

	this.angAcc = this.maxAngAcc*this.brains.main.val('y1')

	this.linAcc = this.maxLinAcc*this.brains.main.val('y2')
	if(this.follow != null) {
		var delta = this.drift(this.follow);
		this.angAcc = delta;
		this.angAcc = this.angAcc > 0 ? Math.min(this.angAcc, this.maxAngAcc) : Math.max(this.angAcc, -this.maxAngAcc);
		this.linAcc = this.maxLinAcc*(Math.pow(3-2*Math.abs(delta/Math.PI), 2)/4.5-1);
	}

	this.linAcc = constrain(this.linAcc, this.maxLinAcc);
	this.linVel+= this.linAcc;
	this.linVel = constrain(this.linVel, this.maxLinVel);

	this.angAcc = constrain(this.angAcc, this.maxAngAcc);
	this.angVel+= this.angAcc;
	this.angVel = constrain(this.angVel, this.maxAngVel);

	this.rot = Angle.sum(this.angVel, this.rot);

	this.pos.x-= this.linVel*Math.sin(this.rot);
	this.pos.y+= this.linVel*Math.cos(this.rot);
	// Update the lattice

	this.linAcc = this.angAcc = 0;
	this.linVel*= .96;
	this.angVel*= .8;

	if (this.age > 1000 && Math.random() < 10/this.age) {

		var child = this.reproduce(this);
		child.gen = this.gen;
		child.pos = this.pos.get();
		child.pos.x+= Math.random()*40-20;
		child.pos.y+= Math.random()*40-20;
		world.nevos.push(child);
		world.latticize(child);
		if(this.gen.population.length>60)
			this.gen.population.splice(0, 1);
		this.gen.population.push(child);
	}
}

Nevo.prototype.draw = function() {

	render.save();

	if(this.highlight != null)
		this.color = this.highlight;
	if(this.color == null)
		this.color = [
			Math.round(255-255*this.life/this.maxLife),
			Math.round(255*this.life/this.maxLife),
			0
		];

	var disc = this.linVel.x < 0;
	render.translate(this.pos.x, this.pos.y);


	render.font = '3pt monospace';
	render.fillStyle = '#fff';
	render.textAlign = 'center';
	if (showInfo) {
		render.fillText('A:'+parseInt(this.age), 0, -25);
		render.fillText('L:'+parseInt(this.life), 0, -20);
		render.fillText('F:'+this.fitness(), 0, -15);
		render.fillText('C:'+this.children.length, 0, -10);
	}

	render.rotate(this.rot+Math.PI/2);

	this.radius-= 1;
	render.beginPath();
	render.moveTo(this.radius*Math.cos(Math.PI/2.5*0),
				  this.radius*Math.sin(Math.PI/2.5*0));
	render.lineTo(this.radius*Math.cos(Math.PI/2.5*2),
				  this.radius*Math.sin(Math.PI/2.5*2));
	render.lineTo(this.radius*Math.cos(Math.PI/2.5*3),
				  this.radius*Math.sin(Math.PI/2.5*3));
	render.lineTo(this.radius*Math.cos(Math.PI/2.5*0),
				  this.radius*Math.sin(Math.PI/2.5*0));
	render.closePath();
	this.radius+= 1;
	render.strokeStyle = 'rgba('+this.color.join(',')+",0.8)";
	render.stroke();
	render.fillStyle = 'rgba('+this.color.join(',')+","+Math.pow(Math.cos(Math.pow(this.life/this.maxLife*Math.PI*1000, .4)*5), 2)+")";
	render.fill();

	render.beginPath();
	for(var i = 0; i < 5; i++) {
		render.lineTo(this.radius*Math.cos(Math.PI/2.5*i),
					  this.radius*Math.sin(Math.PI/2.5*i));
	}
	//render.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
	render.closePath();

	render.restore();


	if(this.follow != null) {
		render.moveTo(this.follow.x, this.follow.y);
		render.lineTo(this.pos.x, this.pos.y);
	}

	render.strokeStyle = 'rgba('+this.color.join(',')+",0.3)";
	render.stroke();
	render.fillStyle = 'rgba('+this.color.join(',')+",0.2)";
	render.fill();
}

Nevo.prototype.drift = function(vec) {
	var desired = Angle.drift(this.pos, vec);
	return Angle.sub(desired, this.rot);
}

Nevo.prototype.fitness = function() {
	return this.eaten;
	//return Math.pow(this.eaten, 1.0);
}

Nevo.prototype.reproduce = function(partner) {
	// The child brain is derived from the parent's ones
	var brains = {}
	for (var i in this.brains) {
		brains[i] = new Net(this.brains[i])
		brains[i].mutate()
		brains[i].mutate()
		brains[i].mutate()
		brains[i].mutate()
	}

	var child = new Nevo(brains);
	child.color = this.color.slice();

	var c = Math.floor(Math.random()*3);
	child.color[c] = Math.floor(child.color[c]);
	child.color[c]+= Math.floor(Math.random()*130-65);
	child.color[c] = Math.min(child.color[c], 255);
	child.color[c] = Math.max(child.color[c], 20);
	//console.log(child.highlight);

	child.setColor(child.color);
	child.addToTree(this.children);
	return child;
}

Nevo.prototype.setColor = function(c) {
	this.color = c;
	var agility = (255-this.color[0])/255*4;
	// this.maxLinVel*= agility;
	// this.maxLinAcc*= agility;
	// this.maxAngVel*= agility;
	// this.maxAngAcc*= agility;
}

Nevo.prototype.clone = function() {
	var brains = {};
	for (var i in this.brains)
		brains[i] = new Net(this.brains[i])
	var child = new Nevo(brains);
	child.setColor(this.color);
	child.addToTree(this.children);
	return child;
}
