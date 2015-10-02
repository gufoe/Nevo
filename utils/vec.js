
var Vec = function(x, y) {
	this.x = x == null ? 0 : x;
	this.y = y == null ? 0 : y;
}
Vec.prototype.add = function(vec) {
	this.x+= vec.x;
	this.y+= vec.y;
	return this;
}
Vec.prototype.sub = function(vec) {
	this.x-= vec.x;
	this.y-= vec.y;
	return this;
}
Vec.prototype.mult = function(n) {
	this.x*= n;
	this.y*= n;
	return this;
}
Vec.prototype.norm = function() {
	var a = this.mag();
	this.x = this.x/a;
	this.y = this.y/a;
	return this;
}
Vec.prototype.mag = function() {
	return Math.sqrt(this.x*this.x+this.y*this.y);
}
Vec.prototype.dist = function(vec) {
	return Math.sqrt(Math.pow(this.x-vec.x,2)+Math.pow(this.y-vec.y,2));
}
Vec.prototype.limit = function(n) {
	if (this.mag() > n) {
		this.norm();
		this.mult(n);
	}
	return this;
}
Vec.prototype.get = function() {
	return new Vec(this.x, this.y);
}
Vec.prototype.angle = function(vec) {
	vec = vec == null ? new Vec() : vec.get();
	vec.norm();
	vec.sub(this.get().norm());
	vec.mult(-1);
	var angle = Math.atan(vec.y/vec.x)+(vec.x < 0 ? Math.PI : 0)-(vec.y < 0 && vec.x < 0 ? Math.PI*2 : 0);
	return angle;
}
