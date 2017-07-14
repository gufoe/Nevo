var Meal = function(x, y, energy) {
	this.type = 'm';
	this.shadowRadius = 30
	this.lat = null;
	this.pos = new Vec(x, y);
	this.energy = energy != null ? energy : 100;
	this.fertile = true;
	this.perlin = Math.random()*100000;
	this.gen = 0;

	this.poison = Math.max(0, 1-Math.random()*500);
	this.setup()
}

Meal.prototype.setup = function() {
	var poison = parseInt(this.poison*255)
	this.color = [poison,255-poison,0];
	this.radius = parseInt(Math.sqrt(this.energy/10));
}

Meal.prototype.randomize = function() {
	world.remove(this)

	world.setTimeout(() => {
		world.spawnMeal()
	}, world.meal_timoeut)
}

Meal.prototype.draw = function() {
	render.save();

	render.beginPath();
	for(var i = 0; i < 6; i++) {
		render.lineTo(this.pos.x+this.radius*Math.cos(Math.PI/3*i),
					  this.pos.y+this.radius*Math.sin(Math.PI/3*i));
	}
	//render.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);

	render.closePath();
	render.strokeStyle = 'rgba('+this.color.join(',')+',0.8)';
	render.fillStyle = 'rgba('+this.color.join(',')+',0.2)';
	render.stroke();
	render.fill();

	render.restore();
}
