class Thing {
    constructor(thing) {
        if (thing) {
            this.net = new Net(thing.net)
            this.net.mutate(2)
        } else {
            this.net = new Net()
        }
        this.test()
    }
    fitness() {
        return this.fit
    }
    test() {
        this.fit = 0
        for (var i = 0; i < 10; i++) {
            var x = Math.random()*Math.PI*2
            var y = Math.cos(x)
            this.net.set('x', x)
            this.net.tick()
            var guess = this.net.val('y')
            this.fit-= Math.abs(guess - y)
        }
        if (this.fit > -0.0001) {
            this.fit+= 1/this.net.complexity()
        }
    }
    reproduce() {
        return new Thing(this)
    }
}

window.onload = () => {

    var p = []
    while (p.length < 40) {
        p.push(new Thing())
    }

    var gen = null
    for (var i = 0; i < 100; i++) {
        gen = gen ? gen.next() : new Generation(p)
        if ((i+1) % 10 == 0)  {
            gen.stats()
            console.log('round', i, gen.best.net.complexity(), gen.best.fitness())
        }
    }
    gen.sort()
    gen.stats()
    window.best = gen.best
    console.log(best)
}
