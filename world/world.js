var World = function() {
    this.nevos = [];
    this.meals = [];
    this.tree = [];
    this.age = 0;
    this.w = 30000;
    this.h = 2000;
    this.history = [];
    this.lattice = {};
    this.latticeGrid = {};
    this.tileSize = 200;
    this.latticeElem = 0;
    this.bestFitness = 0;
    this.default_meals = 30000;
    this.meal_timoeut = 10000;
}

World.prototype.spawnMeal = function() {
    var parent = null
    do {
        parent = pick(world.meals)
    } while (parent.lat.cell.length > 10)
    var d = 800
    var m = new Meal(
        parent.pos.x + ((Math.random()-.5)*2) * d,
        parent.pos.y + ((Math.random()-.5)*2) * d
    )
    m.poison = Math.max(0, 1-Math.random()*500);
    m.setup()

	world.latticize(m)
	world.meals.push(m)
}

World.prototype.setup = function(n, m) {
    this.age = 0;
    this.bestFitness = 0;
    this.timeouts = {}

    this.history = {
        nevos: [],
        meals: []
    };
    this.tree = [];
    m = m ? m : world.default_meals
    m && this.setMeals(m)

    if (typeof n == "array") {
        for (var i in n) {
            console.log('push');
            n[i].addToTree(this.tree);
            this.nevos.push(n[i]);
        }
    } else {
        n = n ? n : 0
        for (var i = 0; i < n; i++) {
            var nevo = new Nevo();
            nevo.addToTree(this.tree);
            this.latticize(nevo)
            this.nevos.push(nevo);
        }
    }
}
World.prototype.setMeals = function(num) {
    while (world.meals.length < num) {
        var m = new Meal(Math.random() * this.w, Math.random() * this.h)
        this.meals.push(m);
        this.latticize(m)
    }
    while (world.meals.length > num) world.remove(world.meals[0])

}
World.prototype.latticize = function(obj) {
    if (!obj.pos) console.log(obj)
    var x = parseInt(obj.pos.x / this.tileSize);
    var y = parseInt(obj.pos.y / this.tileSize);
    if (obj.lat == null || x != obj.lat.x || y != obj.lat.y) {
        if (obj.lat != null) {
            this.remove(obj, true);
        }
        if (this.lattice[x] == null) this.lattice[x] = [];
        if (this.lattice[x][y] == null) this.lattice[x][y] = [];
        obj.lat = {
            x: x,
            y: y,
            id: this.latticeElem++,
            cell: this.lattice[x][y],
        };
        this.lattice[x][y].push(obj);
    }
}
World.prototype.update = function() {
    this.age++;

    if (this.age in this.timeouts) {
        for (var i in this.timeouts[this.age])
            this.timeouts[this.age][i]()
        delete(this.timeouts[this.age])
    }

    // follow = this.nevos[0]
    // Add new meals
    if (false && this.age % 10 == 0) {

        for (var i in this.meals)
            if (this.meals[i].fertile && Math.random() > .999) {
                var dist = new Vec(4, 0);
                dist.rotate(Math.PI * noise.simplex2(this.meals[i].perlin + this.meals[i].gen / 15.0, 0));
                dist.mult(this.meals[i].radius);
                var m = new Meal(this.meals[i].pos.x + dist.x, this.meals[i].pos.y + dist.y);
                m.gen = this.meals[i].gen + 1;
                m.perlin = this.meals[i].perlin;
                this.meals.push(m);
                this.latticize(m)
                this.meals[i].fertile = false;
            }

        var m = new Meal(Math.random() * this.w, Math.random() * this.h)
        this.meals.push(m);
        m.latticize()
    }

    if (this.age % 100 == 0) {
        this.history.nevos.push(this.nevos.length);
        this.history.meals.push(this.meals.length);
    }

    var l = this.lattice;
    this.latticeGrid = {};
    var tot = 0;
    for (var i in this.nevos) {

        var n = this.nevos[i];

        var x = n.lat.x;
        var y = n.lat.y;

        n.update(callback => {
            var foreach = (array) => {
                for (var i in array) {
                    callback(array[i], i)
                }
            }

            foreach(l[x][y])

            if (x - 1 in l && y in l[x - 1])
                foreach(l[x - 1][y]);
            if (x - 1 in l && y - 1 in l[x - 1])
                foreach(l[x - 1][y - 1]);
            if (x - 1 in l && y + 1 in l[x - 1])
                foreach(l[x - 1][y + 1]);

            if (x + 1 in l && y in l[x + 1])
                foreach(l[x + 1][y]);
            if (x + 1 in l && y - 1 in l[x + 1])
                foreach(l[x + 1][y - 1]);
            if (x + 1 in l && y + 1 in l[x + 1])
                foreach(l[x + 1][y + 1]);

            if (y + 1 in l[x])
                foreach(l[x][y + 1]);
            if (y - 1 in l[x])
                foreach(l[x][y - 1]);

        })

        this.latticize(n)

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
        var start = new Vec(
            parseInt(startDraw.x / this.tileSize),
            parseInt(startDraw.y / this.tileSize)
        )
        var end = new Vec(
            parseInt((startDraw.x + canvas.width / zoom) / this.tileSize),
            parseInt((startDraw.y + canvas.height / zoom) / this.tileSize)
        )
        for (var x = start.x; x <= end.x; x++) {
            for (var y = start.y; y <= end.y; y++) {
                if (!(x in this.lattice) || !(y in this.lattice[x]) || !this.lattice[x][y]) {
                    continue
                }
                for (var i in this.lattice[x][y]) {
                    var t = this.lattice[x][y][i]
                    render.fillStyle = 'rgba('+t.color.join(',')+',.4)'
                    var dim = 100
                    render.fillRect(t.pos.x-(dim/2), t.pos.y-(dim/2), dim, dim)
                    this.draws++;
                }
                // var l = len(this.lattice[x][y]);
                // this.draws++;
                // if (l > 0) {
                //     render.fillStyle = 'rgba(50,255,0,' + Math.min(l / 30, 1) + ')';
                //     render.fillRect(x * this.tileSize - this.tileSize, y * this.tileSize - this.tileSize,
                //         this.tileSize * 3, this.tileSize * 3);
                // }
            }
        }
    } else {
        var start = new Vec(
            parseInt(startDraw.x / this.tileSize),
            parseInt(startDraw.y / this.tileSize)
        )
        var end = new Vec(
            parseInt((startDraw.x + canvas.width / zoom) / this.tileSize),
            parseInt((startDraw.y + canvas.height / zoom) / this.tileSize)
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
                    color = [parseInt(n.color[0] / 3), parseInt(n.color[1] / 3), parseInt(n.color[2] / 3)].join()
                    var rad = n.shadowRadius
                    if (rad) {
                        var radgrad = render.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
                        radgrad.addColorStop(0, 'rgba(' + color + ',.8)');
                        radgrad.addColorStop(1, 'rgba(' + color + ',0)');
                        render.globalCompositeOperation = 'destination-over'
                        render.fillStyle = radgrad;
                        render.fillRect((p.x - rad), (p.y - rad), rad * 2, rad * 2);
                        render.globalCompositeOperation = 'source-over'
                    }

                    if (!inWindow(p.x, p.y, n.radius)) continue
                    this.draws++;
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
        this.latticize(this.nevos[i])
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
    if (obj.lat) {
        if (!this.lattice[obj.lat.x][obj.lat.y]) {
            console.log(obj)
        }
        var i = this.lattice[obj.lat.x][obj.lat.y].indexOf(obj);
        if (i >= 0) {
            this.lattice[obj.lat.x][obj.lat.y].splice(i, 1)
            obj.lat = null
        }
    }
}

World.prototype.save = function() {
    if (!this.nevos.length) return
    console.log(pick(this.nevos))
    var lives = [
        pick(this.nevos).brains,
        pick(this.nevos).brains,
        pick(this.nevos).brains,
        pick(this.nevos).brains,
    ]
    localStorage.setItem('lives', JSON.stringify(lives))
}

World.prototype.restore = function() {
    var lives = localStorage.getItem('lives')
    if (!lives) return
    lives = JSON.parse(lives)
    for (var i in lives) {
        for (var j in lives[i]) {
            console.log('restoring on', i, j, lives[i][j])
            this.nevos[i].brains[j] = new Net(lives[i][j])
        }
    }
}

World.prototype.setTimeout = function(cb, ticks) {
    var t = this.age + ticks
    if (!(t in this.timeouts))
        this.timeouts[t] = []
    this.timeouts[t].push(cb)
}
