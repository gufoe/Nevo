var World = function() {
    this.nevos = [];
    this.meals = [];
    this.tree = [];
    this.age = 0;
    this.w = 30000;
    this.h = 30000;
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
    this.history = {
        nevos: [],
        meals: []
    };
    this.tree = [];
    //this.lattice = {};

    for (var i = 0; i < m; i++)
        this.meals.push(new Meal(Math.random() * this.w, Math.random() * this.h));

    if (typeof n == "array") {
        for (var i in n) {
            console.log('push');
            n[i].addToTree(this.tree);
            this.nevos.push(n[i]);
        }
    } else {
        for (var i = 0; i < n; i++) {
            var nevo = new Nevo();
            nevo.addToTree(this.tree);
            this.nevos.push(nevo);
        }
    }
}
World.prototype.latticize = function(obj) {
    var x = parseInt(obj.pos.x / this.tileSize);
    var y = parseInt(obj.pos.y / this.tileSize);
    if (obj.lat == null || x != obj.lat.x || y != obj.lat.y) {
        if (obj.lat != null) {
            this.remove(obj, true);
            obj.lat.x = x;
            obj.lat.y = y;
        } else {
            obj.lat = {
                x: x,
                y: y,
                id: this.latticeElem++
            };
        }
        if (this.lattice[x] == null) this.lattice[x] = [];
        if (this.lattice[x][y] == null) this.lattice[x][y] = [];
        this.lattice[x][y].push(obj);
    }
}
World.prototype.update = function() {
    this.age++;
    // follow = this.nevos[0]
    // Add new meals
    if (this.age % 10 == 0) {

        for (var i in this.meals)
            if (this.meals[i].fertile && Math.random() > .999) {
                var dist = new Vec(4, 0);
                dist.rotate(Math.PI * noise.simplex2(this.meals[i].perlin + this.meals[i].gen / 15.0, 0));
                dist.mult(this.meals[i].radius);
                var m = new Meal(this.meals[i].pos.x + dist.x, this.meals[i].pos.y + dist.y);
                m.gen = this.meals[i].gen + 1;
                m.perlin = this.meals[i].perlin;
                this.meals.push(m);
                this.meals[i].fertile = false;
            }

        this.meals.push(new Meal(Math.random() * this.w, Math.random() * this.h));
    }

    if (this.age % 300 == 0) {
        this.history.nevos.push(this.nevos.length);
        this.history.meals.push(this.meals.length);
    }

    var x, y, l = this.lattice;
    this.latticeGrid = {};
    var tot = 0;
    for (var i in this.nevos) {

        var n = this.nevos[i];

        x = n.lat.x;
        y = n.lat.y;

        if (!(x in this.latticeGrid)) {
            this.latticeGrid[x] = {}
        }
        if (!(y in this.latticeGrid[x])) {
            var obj = l[x][y];

            if (x - 1 in l && y in l[x - 1])
                obj = obj.concat(l[x - 1][y]);
            if (x - 1 in l && y - 1 in l[x - 1])
                obj = obj.concat(l[x - 1][y - 1]);
            if (x - 1 in l && y + 1 in l[x - 1])
                obj = obj.concat(l[x - 1][y + 1]);

            if (x + 1 in l && y in l[x + 1])
                obj = obj.concat(l[x + 1][y]);
            if (x + 1 in l && y - 1 in l[x + 1])
                obj = obj.concat(l[x + 1][y - 1]);
            if (x + 1 in l && y + 1 in l[x + 1])
                obj = obj.concat(l[x + 1][y + 1]);

            if (y + 1 in l[x])
                obj = obj.concat(l[x][y + 1]);
            if (y - 1 in l[x])
                obj = obj.concat(l[x][y - 1]);

            this.latticeGrid[x][y] = obj;
        }
        tot += this.latticeGrid[x][y].length - 1;
        this.nevos[i].update(this.latticeGrid[x][y]);
    }
    tot /= this.nevos.length;
    if (this.age % 10000 == 0) {
        //console.log(tot);
    }


    for (var i in this.nevos) {
        if (this.nevos[i].life <= 0)
            this.remove(this.nevos[i]);
    }
}

World.prototype.draw = function() {

    this.draws = 0

    if (autoFollow && this.nevos[0]) {
        follow = this.nevos[0]
    } else {
        follow = null
    }

    if (zoom < .3) {
        for (var x in this.lattice)
            for (var y in this.lattice[x]) {
                var l = len(this.lattice[x][y]);
                if (!inWindow(x, y, this.tileSize / 2)) continue
                this.draws++
                    if (l > 0) {
                        render.fillStyle = 'rgba(50,255,0,' + Math.min(l / 100, 1) + ')';
                        render.fillRect(x * this.tileSize - this.tileSize, y * this.tileSize - this.tileSize,
                            this.tileSize * 3, this.tileSize * 3);
                    }
            }
        for (var x in this.latticeGrid)
            for (var y in this.latticeGrid[x]) {
                var l = len(this.latticeGrid[x][y]);
                if (!inWindow(x, y, this.tileSize / 2)) continue
                this.draws++
                    if (l > 0) {
                        render.fillStyle = 'rgba(0,200,255,' + Math.min(l / 50, 1) + ')';
                        render.fillRect(x * this.tileSize - this.tileSize, y * this.tileSize - this.tileSize,
                            this.tileSize * 3, this.tileSize * 3);
                    }
            }
    } else {
        var start = new Vec(
            parseInt(startDraw.x / this.tileSize),
            parseInt(startDraw.y / this.tileSize)
        )
        var end = new Vec(
            parseInt((startDraw.x+canvas.width/zoom)/this.tileSize),
            parseInt((startDraw.y+canvas.height/zoom)/this.tileSize)
        )
        // console.clear()
        a = true
        for (var x = start.x; x <= end.x; x++) {
            for (var y = start.y; this.lattice[x] && y <= end.y; y++) {
                // render.strokeStyle = 'rgba(200, 200, 0, .5)'
                // render.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize)
                for (var i in this.lattice[x][y]) {
                    var n = this.lattice[x][y][i]
                    var p = n.pos;
                	color = [parseInt(n.color[0]/3), parseInt(n.color[1]/3), parseInt(n.color[2]/3)].join()
                	var rad = n.shadowRadius
                    if (rad) {
                        var radgrad = render.createRadialGradient(p.x,p.y,0,p.x,p.y,rad);
                        radgrad.addColorStop(0, 'rgba('+color+',.8)');
                        radgrad.addColorStop(1, 'rgba('+color+',0)');
                        render.globalCompositeOperation = 'destination-over'
                        render.fillStyle = radgrad;
                        render.fillRect((p.x-rad),(p.y-rad),rad*2,rad*2);
                        render.globalCompositeOperation = 'source-over'
                    }

                    if (!inWindow(p.x, p.y, n.radius)) continue
                    this.draws++
                    n.draw();
                }
            }
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
    var i = this.lattice[obj.lat.x][obj.lat.y].indexOf(obj);
    if (i >= 0) {
        this.lattice[obj.lat.x][obj.lat.y].splice(i, 1)
    }
}
