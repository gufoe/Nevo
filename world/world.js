var World = function() {
	this.nevos = [];
	this.meals = [];
	this.tree = [];
	this.age = 0;
	this.w = 7000;
	this.h = 7000;
	this.history = [];
	this.lattice = {};
	this.latticeGrid = {};
	this.tileSize = 200;
	this.latticeElem = 0;
	this.bestFitness = 0;
}

World.prototype.setup = function(n, m) {
	this.age = 0;
	this.bestFitness = 0;
	this.history = {nevos:[], meals:[]};
	this.tree = [];
	//this.lattice = {};

	for(var i = 0; i < m; i++)
		this.meals.push(new Meal(Math.random()*this.w, Math.random()*this.h));

	if(typeof n == "array") {
		for(var i in n) {
			console.log('push');
			n[i].addToTree(this.tree);
			this.nevos.push(n[i]);
		}
	} else {
		for(var i = 0; i < n; i++) {
			var nevo = new Nevo();
			nevo.addToTree(this.tree);
			this.nevos.push(nevo);
		}
	}
}
World.prototype.latticize = function(objects) {

	var x, y;
	for (var i in objects) {
		x = parseInt(objects[i].pos.x/this.tileSize);
		y = parseInt(objects[i].pos.y/this.tileSize);
		if (objects[i].lat == null || x != objects[i].lat.x || y != objects[i].lat.y) {
			if (objects[i].lat != null) {
				this.remove(objects[i], true);
				objects[i].lat.x = x;
				objects[i].lat.y = y;
			} else {
				objects[i].lat = {x:x, y:y, id:this.latticeElem++};
				if (objects[i].lat == null) {
					console.log('waaaat');
				}
			}
			if(this.lattice[x] == null) this.lattice[x]={};
			if(this.lattice[x][y] == null) this.lattice[x][y]={};
			this.lattice[x][y][objects[i].lat.id] = objects[i];
		}
	}
}
World.prototype.update = function() {
	this.age++;

	if (this.age%10 == 0) {

		for(var i in this.meals)
			if(this.meals[i].fertile && Math.random() > .999) {
				var m = new Meal(this.meals[i].pos.x+Math.random()*100-50, this.meals[i].pos.y+Math.random()*100-50);
				this.meals.push(m);
				this.meals[i].fertile = false;
			}

		this.meals.push(new Meal(Math.random()*this.w, Math.random()*this.h));
	}

	if (this.age%300 == 0) {
		this.history.nevos.push(this.nevos.length);
		this.history.meals.push(this.meals.length);
	}

	this.latticize(this.nevos);
	this.latticize(this.meals);



	var x, y, l = this.lattice;
	this.latticeGrid = {};
	var tot = 0;
	for(var i in this.nevos) {

		var n = this.nevos[i];

		x = n.lat.x;
		y = n.lat.y;

		if (!(x in this.latticeGrid)) {
			this.latticeGrid[x] = {}
		}
		if (!(y in this.latticeGrid[x])) {
			var obj = Object.values(l[x][y]);

			if (x-1 in l && y in l[x-1])
				obj = obj.concat(Object.values(l[x-1][y]));
			if (x-1 in l && y-1 in l[x-1])
				obj = obj.concat(Object.values(l[x-1][y-1]));
			if (x-1 in l && y+1 in l[x-1])
				obj = obj.concat(Object.values(l[x-1][y+1]));

			if (x+1 in l && y in l[x+1])
				obj = obj.concat(Object.values(l[x+1][y]));
			if (x+1 in l && y-1 in l[x+1])
				obj = obj.concat(Object.values(l[x+1][y-1]));
			if (x+1 in l && y+1 in l[x+1])
				obj = obj.concat(Object.values(l[x+1][y+1]));

			if (y+1 in l[x])
				obj = obj.concat(Object.values(l[x][y+1]));
			if (y-1 in l[x])
				obj = obj.concat(Object.values(l[x][y-1]));

			this.latticeGrid[x][y] = obj;
		}
		tot+= this.latticeGrid[x][y].length-1;
		this.nevos[i].update(this.latticeGrid[x][y]);
	}
	tot/= this.nevos.length;
	if (this.age%10000 == 0) {
		//console.log(tot);
	}


	for(var i in this.nevos) {
		if(this.nevos[i].life <= 0)
			this.remove(this.nevos[i]);
	}
}
World.prototype.draw = function() {

	render.fillStyle = "#070605";
	render.fillRect(0, 0, this.w, this.h);


	if (drawBioma) {
		for(var x in this.lattice)
			for(var y in this.lattice[x]) {
				var l = len(this.lattice[x][y]);
				if ((x+2)*this.tileSize < startDraw.x || (y+2)*this.tileSize < startDraw.y) {
					continue
				}
				if ((x-1)*this.tileSize > startDraw.x+canvas.width/zoom || (y-1)*this.tileSize > startDraw.y+canvas.height/zoom) {
					continue
				}
				if (l>0) {
					render.fillStyle = 'rgba(50,255,0,'+Math.min(l/100, 1)+')';
					render.fillRect(x*this.tileSize-this.tileSize, y*this.tileSize-this.tileSize,
									this.tileSize*3, this.tileSize*3);
				}
			}
		for(var x in this.latticeGrid)
			for(var y in this.latticeGrid[x]) {
				var l = len(this.latticeGrid[x][y]);
				if ((x+2)*this.tileSize < startDraw.x || (y+2)*this.tileSize < startDraw.y) {
					continue
				}
				if ((x-1)*this.tileSize > startDraw.x+canvas.width/zoom || (y-1)*this.tileSize > startDraw.y+canvas.height/zoom) {
					continue
				}
				if (l>0) {
					render.fillStyle = 'rgba(0,200,255,'+Math.min(l/50, 1)+')';
					render.fillRect(x*this.tileSize-this.tileSize, y*this.tileSize-this.tileSize,
									this.tileSize*3, this.tileSize*3);
				}
			}
	} else {

		for(var i in this.meals) {
			var p = this.meals[i].pos;
			if (p.x < startDraw.x || p.y < startDraw.y) {
				continue
			}
			if (p.x > startDraw.x+canvas.width/zoom || p.y > startDraw.y+canvas.height/zoom) {
				continue
			}
			this.meals[i].draw();
		}

		for(var i in this.nevos) {
			var p = this.nevos[i].pos;
			if (p.x < startDraw.x || p.y < startDraw.y) {
				continue
			}
			if (p.x > startDraw.x+canvas.width/zoom || p.y > startDraw.y+canvas.height/zoom) {
				continue
			}
			this.nevos[i].draw();
		}
	}
}

World.prototype.setNevos = function(nevos) {
	this.nevos = nevos;
	for (var i in this.nevos) {
		this.nevos[i].addToTree(this.tree);
	}
}

World.prototype.remove = function(obj, onlyLattice) {
	if (!onlyLattice) {
		if (obj.type == 'n') {
			var i = this.nevos.indexOf(obj);
			if (i < 0) {
				//console.log('not found', obj);
			} else {
				this.nevos.splice(i, 1);
			}
		} else {
			var i = this.meals.indexOf(obj);
			if (i < 0) {
				//console.log('not found', obj);
			} else {
				this.meals.splice(i, 1);
			}
		}
	}
	delete this.lattice[obj.lat.x][obj.lat.y][obj.lat.id];
}
