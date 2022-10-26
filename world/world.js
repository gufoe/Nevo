var World = function() {
    this.nevos = [];
    this.meals = [];
    this.tree = [];
    this.age = 0;
    this.w = Conf.world.w
    this.h = Conf.world.h
    this.history = [];
    this.lattice = {};
    this.latticeGrid = {};
    this.latticeElem = 0;
    this.bestFitness = 0;
    this.tileSize = Conf.world.tileSize
    this.default_meals = Conf.world.default_meals
    this.default_nevos = Conf.world.default_nevos
}

World.prototype.spawnMeal = function() {
    var parent = null
    var i = 0
    do {
        parent = pick(this.meals)
    } while ((!parent || parent.lat.cell.length > 10) && i++ < 20)
    if (!parent) {
        parent = { pos: new Vec(Math.random()*this.w, Math.random()*this.h)}
    }
    var d = 500
    var m = new Meal(this,
        parent.pos.x + ((Math.random()-.5)*2) * d,
        parent.pos.y + ((Math.random()-.5)*2) * d
    )
    m.setup()

	this.latticize(m)
	this.meals.push(m)
}

World.prototype.setup = function(n, m) {
    this.age = 0;
    this.bestFitness = 0;
    this.timeouts = {}
    this.lattice = {};
    this.latticeGrid = {};
    this.latticeElem = 0;

    this.history = {
        nevos: [],
        meals: []
    };
    this.tree = [];
    m = m ? m : this.default_meals
    m && this.setMeals(m)

    if (typeof n == "object" && n.length > 0) {
        for (var i in n) {
            n[i].addToTree(this.tree);
            n[i].world = this
            this.nevos.push(n[i]);
            this.latticize(n[i])
        }
    } else {
        for (var i = 0; i < this.default_nevos; i++) {
            var nevo = new Nevo(this);
            nevo.addToTree(this.tree);
            this.latticize(nevo)
            this.nevos.push(nevo);
        }
    }

    // this.nevos[0].pos.x = 500
    // this.nevos[0].pos.y = 300
    // this.latticize(this.nevos[0])
    // this.meals[0].pos.x = 550
    // this.meals[0].pos.y = 300
    // this.latticize(this.meals[0])

}
World.prototype.setMeals = function(num) {
    while (this.meals.length < num) {
        var m = new Meal(this, Math.random() * this.w, Math.random() * this.h)
        this.meals.push(m);
        this.latticize(m)
    }
    while (this.meals.length > num) this.remove(this.meals[0])

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
                var m = new Meal(this, this.meals[i].pos.x + dist.x, this.meals[i].pos.y + dist.y);
                m.gen = this.meals[i].gen + 1;
                m.perlin = this.meals[i].perlin;
                this.meals.push(m);
                this.latticize(m)
                this.meals[i].fertile = false;
            }

        var m = new Meal(this, Math.random() * this.w, Math.random() * this.h)
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
    this.nevos.forEach((n, i) => {

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

        }, i)

        this.latticize(n)

    })

    tot /= this.nevos.length;
    if (this.age % 10000 == 0) {
        //console.log(tot);
    }


    for (var i = 0; i < this.nevos.length; i++) {
        if (this.nevos[i].life <= 0) {
            this.remove(this.nevos[i]);
            i--
        }
    }
}

World.prototype.draw = function() {

    this.draws = 0

    if (autoFollow && this.nevos[0]) {
        follow = this.nevos[0]
    } else {
        follow = null
    }

    if (zoom < .1) {
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
                    if (t.type == 'm') t.updateAge()
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
                if (!this.lattice[x][y]) continue
                this.lattice[x][y].forEach((n, i) => {
                    // console.log(i, n)

                    // var n = this.lattice[x][y][i]
                    var p = n.pos;

                    if (n.type == 'm') n.updateAge()

                    var rad = n.shadowRadius
                    if (rad) {
                        var color = [n.color[0], n.color[1], n.color[2]].join()
                        var radgrad = render.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
                        radgrad.addColorStop(0, 'rgba(' + color + ',.2)');
                        radgrad.addColorStop(1, 'rgba(' + color + ',0)');
                        render.globalCompositeOperation = 'destination-over'
                        render.fillStyle = radgrad;
                        render.fillRect((p.x - rad), (p.y - rad), rad * 2, rad * 2);
                        render.globalCompositeOperation = 'source-over'
                    }

                    this.draws++;
                    n.draw()
                })
            }
        }
    }
}

World.prototype.remove = function(obj, onlyLattice) {
    if (!onlyLattice) {
        if (obj.type == 'n') {
            var i = this.nevos.indexOf(obj);
            if (i >= 0) {
                this.nevos.splice(i, 1);
            }
        } else {
            var i = this.meals.indexOf(obj);
            if (i >= 0) {
                this.meals.splice(i, 1);
            }
        }
    }
    if (obj.lat) {
        var i = this.lattice[obj.lat.x][obj.lat.y].indexOf(obj);
        if (i >= 0) {
            this.lattice[obj.lat.x][obj.lat.y].splice(i, 1)
            obj.lat = null
        }
    }
}

World.prototype.save = function() {
    if (!this.nevos.length) return
    console.log('Saving some fishes. Mmmmmh.')
    var lives = []
    this.nevos.forEach(n => lives.push(n.pack()))
    localStorage.setItem('lives', JSON.stringify(lives))
    console.log('Saved', lives.length, 'nevos')
}

World.prototype.restore = function() {
    var lives = localStorage.getItem('lives')
    if (!lives) return
    lives = JSON.parse(lives)
    var g = this.nevos[0].gen
    lives.forEach(n => {
        n = Nevo.generate(n, this)
        n.gen = g
        this.latticize(n)
        g.population.push(n)
        this.nevos.push(n)

    })
    console.log('Restored', lives.length, 'nevos')
}

World.prototype.setTimeout = function(cb, ticks) {
    var t = this.age + ticks
    if (!(t in this.timeouts))
        this.timeouts[t] = []
    this.timeouts[t].push(cb)
}
