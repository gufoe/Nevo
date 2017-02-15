var Angle = {
	norm : function(a) {
		while(a > Math.PI)
		  a-= Math.PI*2;
		while(a <= -Math.PI)
		  a+= Math.PI*2;
		return a;
	},
	pos : function(a) {
	  while(a < 0)
		a+= Math.PI*2;
	  return a;
	},
	sum : function(a, b) {
	  return Angle.norm(Angle.pos(a)+Angle.pos(b));
	},
	sub : function(a, b) {
	  return Angle.norm(Angle.pos(a)-Angle.pos(b));
	},
	drift : function(vec1, vec2) {
		var desired = -Math.atan2(vec2.x-vec1.x, vec2.y-vec1.y);
		return Angle.norm(desired);
	}
}
