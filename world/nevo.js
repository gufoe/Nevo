var Nevo = function(world, brains) {
    this.world = world
    this.type = 'n';
    this.id = parseInt(Math.random() * 1000);
    // Descriptors
    this.pos = new Vec(Math.random() * this.world.w, Math.random() * this.world.h);
    this.rot = Math.random() * Math.PI * 2;

    this.age = 0;
    this.gen = null;
    this.children = [];
    this.generation = 0
    this.lat = null;
    this.shadowRadius = 100

    // Max number of visible objects (closer objects have priority)
    this.brains = {
        // This is used to understand each object, using distance, direction and poison
        // object: new Net(),

        // This is used to decide what action to take based on each seen object and other parameters (velocity, health etc.)
        main: brains ? brains.main : new Net({
            params: {
                synapsesPerNode: 40
            }
        }),
    };

    // TODO
    // this.orig_brains = {}
    // for (var i in this.brains) {
    //     this.orig_brains[i] = new Net(this.brains[i])
    // }

    // The max delta direction for consideration
    this.viewRange = Conf.nevo.viewRange
    this.viewAccuracy = Conf.nevo.viewAccuracy

    // The fitness evaluation property
    this.eaten = 0;

    // Accelerations
    this.linAcc = 0;
    this.angAcc = 0;
    this.linVel = 0;
    this.angVel = 0;

    // Limits
    this.maxLinVel = Conf.nevo.maxLinVel
    this.maxLinAcc = Conf.nevo.maxLinAcc

    this.maxAngVel = Conf.nevo.maxAngVel
    this.maxAngAcc = Conf.nevo.maxAngAcc

    this.maxLife = Conf.nevo.max_life
    this.life = Conf.nevo.default_life


    // The Vec to follow
    this.follow = null;

    // The creature radius
    this.radius = this.life / 1000 * 20


    // The creature color
    this.color = [200, 200, 200];
    this.highlight = null;

    // Put me in the lattice
}

Nevo.prototype.addToTree = function(tree) {
    tree.push({
        color: this.color.join(','),
        time: this.world.age,
        children: this.children
    });
}

Nevo.prototype.eat = function(obj, force) {
    if (this.linVel < 0) return
    if (obj.type == 'n') {
        this.life += obj.life/2;
        this.eaten++;
        this.world.remove(obj);
        if (this.fitness() > this.world.bestFitness) this.world.bestFitness = this.fitness();
    } else {
        var poison = obj.poison
        if (poison < .5) {
            this.life += obj.energy
            this.eaten++;
            if (this.fitness() > this.world.bestFitness) this.world.bestFitness = this.fitness();
        } else {
            this.life -= obj.energy * 3
            this.eaten -= 3
        }
        this.world.remove(obj)

        this.world.setTimeout(() => {
            this.world.spawnMeal()
        }, Conf.meal.timeout)
        if (Math.random() > .8) {
            this.world.setTimeout(() => {
                this.world.spawnMeal()
            }, Conf.meal.timeout*2)
        }
    }
    this.life = Math.min(this.life, this.maxLife);
}


Nevo.prototype.think = function(each, really) {
    var inputs = [];

    // Relative life [0, 1]
    inputs.push(this.life / this.maxLife);

    // Relative linear acceleration [-1, +1]
    inputs.push(this.linVel / this.maxLinVel);

    // Relative angular acceleration [-1, +1]
    inputs.push(this.angVel / this.maxAngVel);

    // Elaborate every point
    var max_dist = this.world.tileSize
    var view = this.view = really ? [] : this.view
    // Filter objects not in view
    each((obj) => {
        // if (obj == this || obj.type != 'm') return
        if (obj == this) return

        // Get distance
        obj.tmp_dist = this.pos.dist(obj.pos)
        // Filter by distance
        if (obj.tmp_dist > max_dist) return

        // Eat close meals
        var angle = this.drift(obj.pos)
        if (Math.abs(angle) < Math.PI/4 && obj.tmp_dist < obj.radius + this.radius) {
            this.eat(obj)
            return
        }
        if (!really) return

        // Filter by angle

        var p1 = this.pos
        var p2 = obj.pos
        var rad = obj.radius
        var v = p2.get().sub(p1)
        // console.info('Calculating v ', v, ' rot', parseInt(this.rot/Math.PI*180), parseInt(this.drift(p2)/Math.PI*180))

        var lv = v.get().norm().rotate(-90).mult(rad).add(p2)
        var rv = v.get().norm().rotate(+90).mult(rad).add(p2)

        var l = this.drift(lv)
        var r = this.drift(rv)

        if (l > this.viewRange) return
        if (r < -this.viewRange) return


        l = Math.max(l, -this.viewRange)
        r = Math.min(r, this.viewRange)

        var angle_to_i = angle => Math.round((angle / this.viewRange + 1) / 2 * this.viewAccuracy)

        for (var i = angle_to_i(l); i <= angle_to_i(r); i++) {
            // console.log(i)
            if (i in view && view[i].tmp_dist < obj.tmp_dist) {
                continue
            }
            view[i] = obj
        }

    })
    if (!really) return

    //
    for (var i = 0; i < this.viewAccuracy; i++) {
        var v = view[i]
        inputs = inputs.concat([
            v && v.type == 'n' ? (max_dist - v.tmp_dist) / max_dist + .05 : 0,
            v && v.type == 'm' && v.poison < .5 ? (max_dist - v.tmp_dist) / max_dist + .05 : 0,
            // v && v.type == 'm' && v.poison >= .5 ? (max_dist - v.tmp_dist) / max_dist : 0,
        ])
    }

    this.inputs = inputs

    inputs.forEach((v, i) => this.brains.main.set('x' + i, v))
}

Nevo.prototype.update = function(each, index) {
    this.age++;
    //this.life-= Math.pow(1.001, this.age/3);
    //this.life-= Math.sqrt(this.age)/30;
    this.life -= this.radius / 4
    this.maxLinVel *= .9997
    //this.life-= 1;

    if (this.age % 20 == 0) {
        this.radius += .05
    }
    if (this.age % Conf.mutation_ticks == 0) {
        console.log('apply life mutation')
        for (var i in this.brains)
            this.brains[i].mutate()
    }

    // Only elaborate inputs every X frames (for performance)


    if ((this.age - 1) % Conf.nevo.ticks_per_tought == 0) {
        this.think(each, true)
        this.brains.main.tick()
    } else {
        this.think(each, true)
    }

    if (PLAYER_MODE && index == 0) {
        this.linAcc = 0
        this.angAcc = 0
        if (window._keys.ArrowUp) this.linAcc = 1
        if (window._keys.ArrowDown) this.linAcc = -1
        if (window._keys.ArrowLeft) this.angAcc = -3
        if (window._keys.ArrowRight) this.angAcc = 3
        this.life = 5000
    } else {
        this.angAcc = this.brains.main.val('ang_acc', 'sig')
        this.linAcc = this.brains.main.val('lin_acc', 'sig')
    }

    // this.linAcc = this.angAcc = 0;
    this.linVel *= .96;
    this.angVel *= .86;


    if (typeof History != 'undefined') {
        if ((this.age - 1) % Conf.nevo.ticks_per_tought == 0) {
            if (this == this.world.nevos[0]) {
                if (History.ang_acc.nevo != this) {
                    History.ang_acc.reset()
                    History.ang_acc.nevo = this
                }
                if (History.lin_acc.nevo != this) {
                    History.lin_acc.reset()
                    History.lin_acc.nevo = this
                }
                History.ang_acc.push(this.angAcc)
                History.lin_acc.push(this.linAcc)
                // console.log(this.angAcc)
            }
        }
    }

    if (isNaN(this.angAcc) || isNaN(this.linAcc)) {
        console.log('we got nan problems')
    }
    this.angAcc *= this.maxAngAcc
    // this.linAcc+= .1
    this.linAcc *= this.maxLinAcc
    // if(this.follow != null) {
    // 	var delta = this.drift(this.follow);
    // 	this.angAcc = delta;
    // 	this.angAcc = this.angAcc > 0 ? Math.min(this.angAcc, this.maxAngAcc) : Math.max(this.angAcc, -this.maxAngAcc);
    // 	this.linAcc = this.maxLinAcc*(Math.pow(3-2*Math.abs(delta/Math.PI), 2)/4.5-1);
    // }
    // var mult = 3/(2+this.age/1000)

    this.linAcc = constrain(this.linAcc, this.maxLinAcc);
    this.linVel += this.linAcc
    this.linVel += this.linAcc*Conf.nevo.speed_bonus;
    this.linVel = constrain(this.linVel, this.maxLinVel);

    this.angAcc = constrain(this.angAcc, this.maxAngAcc);
    this.angVel += this.angAcc;
    this.angVel = constrain(this.angVel, this.maxAngVel);
    this.rot = Angle.sum(this.angVel, this.rot);


    this.pos.x -= this.linVel * Math.sin(this.rot);
    this.pos.y += this.linVel * Math.cos(this.rot);
    // Update the lattice

    if (this.age > 1000 && Math.random() < 10 / this.age) {

        var child = this.reproduce(this);
        child.generation = this.generation+1
        child.gen = this.gen;
        child.pos = this.pos.get();
        child.pos.x += Math.random() * 40 - 20;
        child.pos.y += Math.random() * 40 - 20;
        this.world.nevos.push(child);
        this.world.latticize(child);
        //console.log(this)
        if (this.gen.population.length > 10000)
            this.gen.population.splice(0, 1);
        this.gen.population.push(child);
    }
}

Nevo.prototype.draw = function() {
    render.save();

    if (this.highlight != null)
        this.color = this.highlight;
    if (this.color == null)
        this.color = [
            Math.round(255 - 255 * this.life / this.maxLife),
            Math.round(255 * this.life / this.maxLife),
            0
        ];

    var disc = this.linVel < 0;
    render.translate(this.pos.x, this.pos.y);


    render.font = '3pt monospace';
    render.fillStyle = '#fff';
    render.textAlign = 'center';
    if (showInfo) {
        render.fillText('A:' + parseInt(this.age), 0, -25);
        render.fillText('L:' + parseInt(this.life), 0, -20);
        render.fillText('F:' + this.eaten, 0, -15);
        render.fillText('C:' + this.children.length, 0, -10);
    }

    render.rotate(this.rot + Math.PI / 2);

    this.radius -= 1;
    render.beginPath();
    render.moveTo(this.radius * Math.cos(Math.PI / 2.5 * 0),
        this.radius * Math.sin(Math.PI / 2.5 * 0));
    render.lineTo(this.radius * Math.cos(Math.PI / 2.5 * 2),
        this.radius * Math.sin(Math.PI / 2.5 * 2));
    render.lineTo(this.radius * Math.cos(Math.PI / 2.5 * 3),
        this.radius * Math.sin(Math.PI / 2.5 * 3));
    render.lineTo(this.radius * Math.cos(Math.PI / 2.5 * 0),
        this.radius * Math.sin(Math.PI / 2.5 * 0));
    render.closePath();
    this.radius += 1;
    render.strokeStyle = 'rgba(' + this.color.join(',') + ",0.8)";
    render.stroke();
    render.fillStyle = 'rgba(' + this.color.join(',') + "," + Math.pow(Math.cos(Math.pow(this.life / this.maxLife * Math.PI * 1000, .4) * 5), 2) + ")";
    render.fill();

    render.beginPath();
    for (var i = 0; i < 5; i++) {
        render.lineTo(this.radius * Math.cos(Math.PI / 2.5 * i),
            this.radius * Math.sin(Math.PI / 2.5 * i));
    }
    //render.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
    render.closePath();

    render.restore();


    if (this.follow != null) {
        render.moveTo(this.follow.x, this.follow.y);
        render.lineTo(this.pos.x, this.pos.y);
    }

    render.strokeStyle = 'rgba(' + this.color.join(',') + ",0.3)";
    render.stroke();
    render.fillStyle = 'rgba(' + this.color.join(',') + ",0.2)";
    render.fill();

    if (!DEBUG)
        return;
    for (i in this.view) {

        if (this.view[i] == null)
            continue;

        render.save();
        render.beginPath();
        render.moveTo(this.pos.x, this.pos.y);
        render.lineTo(
            this.pos.x +
            this.view[i].tmp_dist * Math.cos(Math.PI / 2 + this.rot + (i / this.viewAccuracy * 2 - 1) * this.viewRange),

            this.pos.y +
            this.view[i].tmp_dist * Math.sin(Math.PI / 2 + this.rot + (i / this.viewAccuracy * 2 - 1) * this.viewRange)
        );
        render.closePath();
        render.strokeStyle = 'rgba(' + this.view[i].r + ', ' + this.view[i].g + ', ' + this.view[i].b + ',1)';
        render.stroke();
        render.restore();
    }

}

Nevo.prototype.drift = function(vec) {
    var desired = Angle.drift(this.pos, vec);
    return Angle.sub(desired, this.rot)
}

Nevo.prototype.fitness = function() {
    return this.age//(this.children.length/10+.1) * (this.generation/10+.1) * this.eaten
    //return Math.pow(this.eaten, 1.0);
}

Nevo.prototype.reproduce = function(partner) {
    // The child brain is derived from the parent's ones
    var brains = {}
    for (var i in this.brains) {
        // console.log('cambio il', this.brains[i])
        brains[i] = partner ? this.brains[i].crossover(partner.brains[i]) : new Net(this.brains[i])
        brains[i].mutate(2)
    }

    var child = new Nevo(this.world, brains);
    child.color = this.color.slice();
    child.gen = this.gen

    var c = Math.floor(Math.random() * 3);
    child.color[c] = Math.floor(child.color[c]);
    child.color[c] += Math.floor(Math.random() * 130 - 65);
    child.color[c] = Math.min(child.color[c], 255);
    child.color[c] = Math.max(child.color[c], 20);
    //console.log(child.highlight);

    child.setColor(child.color);
    child.addToTree(this.children);
    return child;
}

Nevo.prototype.setColor = function(c) {
    this.color = c;
    var agility = (255 - this.color[0]) / 255 * 4;
    // this.maxLinVel*= agility;
    // this.maxLinAcc*= agility;
    // this.maxAngVel*= agility;
    // this.maxAngAcc*= agility;
}

Nevo.prototype.clone = function() {
    return Nevo.generate(this)
}

Nevo.generate = (nevo, world) => {
    var brains = {}
    for (var i in nevo.brains)
        brains[i] = new Net(nevo.brains[i])
    var n = new Nevo(world || nevo.world, brains)
    // console.log(n)
    n.setColor(nevo.color)
    return n
}

Nevo.prototype.pack = function() {
    return {
        brains: this.brains,
        color: this.color,
        fitness: this.fitness()
    }
}
