var Meal = function(x, y, energy) {
	this.type = 'm';
	this.shadowRadius = 30
	this.lat = null;
	this.pos = new Vec(x, y);
	this.energy = energy != null ? energy : Conf.meal.energy;
	this.fertile = true;
	this.perlin = Math.random()*100000;
	this.gen = 0;

	this.poison = Meal.poison()
	this.created_at = world.age
	this.age = 0
	this.setup()
}

Meal.poison = () => Math.random() < Conf.meal.poison ? 1 : 0

Meal.prototype.setup = function() {
	var poison = parseInt(this.poison*255)
	this.color = [poison,255-poison,0];
	this.radius = parseInt(Math.sqrt(this.energy/10));
}

Meal.prototype.updateAge = function() {
	this.age = world.age - this.created_at
	this.color[2] = parseInt(255*600/(600+this.age))
	return this.age
}

Meal.prototype.draw = function() {
	render.save();

	render.beginPath();
	render.strokeStyle = 'rgba('+this.color.join(',')+',.7)';
	render.fillStyle = 'rgba('+this.color.join(',')+',.5)';

	for(var i = 0; i < 6; i++) {
		render.lineTo(this.pos.x+this.radius*Math.cos(Math.PI/3*i),
					  this.pos.y+this.radius*Math.sin(Math.PI/3*i));
	}
	//render.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
	render.closePath();
	render.fill();
	render.stroke();

	render.restore();
}
