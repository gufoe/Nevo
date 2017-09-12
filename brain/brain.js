var Net = function(net) {

    // Definition of the nodes
    this.nodes = net ? clone(net.nodes) : {}
    this.active = net ? net.active.slice() : []
    this.outputs = net ? net.outputs.slice() : []

    this.reset()
}

// Clear recurrent network
Net.prototype.reset = function() {
    for (var i in this.nodes) {
        this.nodes[i].val = 0
        this.nodes[i].used = 0
    }
}

// Measure net complexity
Net.prototype.complexity = function() {
    var c = 0
    for (var i in this.nodes) {
        c+= 1 + keys(this.nodes[i].inputs).length
    }
    return c
}
// Measure net complexity
Net.prototype.plasticity = function() {
    var c = 0
    for (var i in this.nodes) {
        c+= this.nodes[i].plasticity
    }
    return c
}

// Mutations can be of the following:
// 1 - new node (implies 2, otherwise the node would be useless)
// 2 - new synapse for given node
// 3 - change node bias
// 4 - change synapse weight
// 5 - remove synapse from node
// 6 - remove node (and related synapses)
Net.prototype.mutate = function(n) {
    // TODO: change based on complexity
    // console.log('mutating', n)
    for (var i = 0; i < (n || 1); i++) {
        var done
        for (var j = 0; j < 10; j++) {

            var m = pick(keys(Net.mutations))
            // console.log('round', i, j, m)
            done = Net.mutations[m](this)
            if (done) {
                // console.log('mut', m)
                break
            } else {
                // console.log('!mut')
            }
        }
        // done || console.log('!done')
    }

    // this.optimize()
    return this
}

// Removes unused circuits
Net.prototype.optimize = function() {
    // console.log('optimize', this)
    for (var i in this.nodes) {
        delete(this.nodes[i].used)
    }

    this.tick()

    // Remove unreachable nodes
    for (var i in this.nodes) {
        if (this.nodes[i].input || this.nodes[i].output) continue
        if (!this.nodes[i].used) {
            // console.log('del', i)
            delete(this.nodes[i])
            remove(this.active, i)
            remove(this.outputs, i)
        }
    }
}

Net.prototype.set = function(id, value) {
    var n = this.nodes[id]

    if (!n) {
        n = this.newNode(true, false, id, 'id')
    }

    n.val = value
}

Net.prototype.tick = function() {

    // Tick
    var todo = []

    this.outputs.forEach(id => {
        todo.push(this.node(id))
    })

    while(todo.length) {
        var n = todo.shift()
        n.used = true
        var val = 0
        for (var i in n.inputs) {
            // console.log('calc', i, n.inputs[i],  calc(i) )
            if (!n.input && !n.used) {
                todo.push(this.nodes[n.input[i]])
            }
            val += this.val(i) * n.inputs[i]
        }
        n.new_val = Net.funs[n.act](val)
        if (n.new_val * n.bias < 0) n.new_val = 0
    }


    for (var i in this.nodes) {
        var n = this.nodes[i]
        if (!n.input) {
            n.val = n.new_val
        }
        delete(n.new_val)
    }
}

Net.prototype.val = function(id, act) {
    var n = this.node(id)

    if (!n) {
        n = this.newNode(false, true, id, act)
        // var r = Net.mutations.newSynapse.call(this, 'tick', node)
        // if (!r) console.log('not added tick to', node)
        for (var i = 0; i < 10; i++) {
            var r = Net.mutations.newSynapse(this, null, n)
            var r = Net.mutations.newSynapse(this, n, null)
            // if (!r) console.log('not added syn to', node)
        }
    }

    return n.val
}

Net.prototype.lock = function(id, plasticity) {
    var n = this.nodes[id]
    if (n.locking) return
    n.locking = true
    n.plasticity = plasticity

    // Lock inputs
    for (var i in n.inputs) {
        // console.log('locking', i)
        this.plasticity(n.inputs[i], plasticity)
    }
}

Net.prototype.findSourcedNeuron = function() {
    for (var i = 0; i < 10; i++) {
        var n = this.node(pick(this.active))
        if (n && len(n.inputs)) return n
    }
    return null
}


Net.prototype.newNode = function(input, output, id, act) {
    var n = {
        inputs: {},
        act: act ? act : Net.randFun(),
        fixed_action: !!act,
        plasticity: !!input ? 0 : 1,
        input: !!input,
        output: !!output,
        used: 0,
        bias: 0,
        val: 0,
        id: id ? id : Net.uid(),
    }
    this.nodes[n.id] = n
    if (!input) {
        range(2, () => Net.mutations.newSynapse(this, null, n))
        range(2, () => Net.mutations.newSynapse(this, n, null))
        this.active.push(n.id)
    }
    if (output) {
        this.outputs.push(n.id)
    }
    return n
}

Net.prototype.node = function(n) {
    if (typeof n == 'string') {
        n = this.nodes[n]
    }
    return n
}
Net.prototype.id = function(n) {
    if (typeof n == 'object') {
        n = n.id
    }
    return n
}

Net.prototype.mute = function(n) {
    n = this.node(n)
    if (n.plasticity > rnd()*1.1) {
        // console.log('pass')
        return true
    } else {
        // console.log('lock', node, n.plasticity)
        n.plasticity *= .95
        if (n.plasticity < 0.01) {
            remove(this.active, n.id)
        }
        return false
    }
}

Net.randWeight = () => {
    return (pty(.5) ? 1 : -1) * pick([0, .3, .5, 1, 1.5, 2])
}

Net.uid = () => {
    return Math.floor((1 + Math.random()) * 0x100000)
        .toString(16)
        .substring(1);
}

Net.mutations = {
    newSynapse(_, src, dst) {
        if (pty(.2)) return false
        var n = dst ? _.node(dst) : _.node(pick(_.active))
        if (!n || !_.mute(n)) return false
        var src = src ? _.id(src) : pick(keys(_.nodes))
        n.inputs[src] = Net.randWeight()
        return true
    },
    newNode(_) {
        if (pty(.9)) return false
        var n = _.newNode()
        range(2, () => Net.mutations.newSynapse(_, null, n))
        range(2, () => Net.mutations.newSynapse(_, n, null))
        return true
    },
    mutateBias(_) {
        var n = _.node(pick(_.active))
        if (!n || !_.mute(n)) return false
        n.bias*= Net.randWeight()
        return true
    },
    mutateActivation(_) {
        var n = _.node(pick(_.active))
        if (!n || n.fixed_action || !_.mute(n)) return false
        n.act = Net.randFun()
        return true
    },
    mutateWeight(_) {
        var n = _.findSourcedNeuron()
        if (!n || !_.mute(n)) return false
        var src = pick(keys(n.inputs))
        n.inputs[src]*= Net.randWeight()
        return true
    },
    removeSynapse(_) {
        if (pty(.5)) return false
        var n = _.findSourcedNeuron()
        if (!n || !_.mute(n)) return false
        var src = pick(keys(n.inputs))
        delete(n.inputs[src])
        return true
    },
    removeNode(_) {
        if (pty(.9)) return false
        var n = _.node(pick(_.active))
        if (!n || !_.mute(n)) return false
        delete(_.nodes[n.id])
        for (var i in _.nodes) {
            delete(_.nodes[i].inputs[n.id])
        }
        remove(_.active, n.id)
        remove(_.outputs, n.id)
        return true
    },
}

Net.funs = {
    id: x => x,
    sig: x => 1 - 2 / (1 + Math.exp(-x)),
    bool: x => x > 0 ? 1 : 0,
    sign: x => x > 0 ? 1 : -1,
    neg: x => -x,
    log: x => Math.log(Math.abs(x)),
    abs: x => Math.abs(x),
    exp: x => Math.exp(x),
    sin: x => Math.sin(x),
    cos: x => Math.cos(x),
}

Net.randFun = () => {
    var act = pick(keys(Net.funs))
    return act
}
