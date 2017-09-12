var Distribution = function(a, b, steps, mem, x, y, w, h, color, label) {
    this.draw = () => {
        drawGraph(label, this.val, x, y, w, h, color, 0)
    }
    this.reset = () => {
        this.val = []
        this.victim = 0
        this.queue = []
        while (this.val.length < this.steps) {
            this.val.push(0)
        }
    }
    this.push = n => {
        var i = Math.floor((n-a)/(b-a+0.000001)*steps)
        if (!(i in this.val) || n < a || n > b) {
            console.log('invalid input', n)
            return
        }

        this.queue[(this.victim++) % this.mem] = i
        if (this.victim % this.mem in this.queue) {
            this.val[this.queue[this.victim % this.mem]]--
        }

        this.val[i]++
    }

    this.setSteps = steps => {
        this.steps = steps
        this.reset()
    }
    this.a = a
    this.b = b
    this.steps = steps
    this.mem = mem
    this.reset()
}
