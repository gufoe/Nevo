function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function pick(array) {
    var i = Math.floor(Math.random()*array.length)
    return array[i]
}
function rand(v) {
    return Math.random()*v
}

function randInt(v) {
    return parseInt(rand(v))
}

function clone(obj) {
    return JSON.parse(JSON.stringify(obj))
}


var Net = function(net) {

    // Definition of the nodes
    this.nodes = net ? clone(net.nodes) : {}
    // Inputs of each node
    this.archs = net ? clone(net.archs) : {}

    // Clear recurrent network
    this.reset = () => {
        for (var i in this.nodes) {
            delete(this.nodes[i].val)
        }
    }

    // Measure net complexity
    this.complexity = () => {
        var c = Object.keys(this.nodes).length
        for (var i in this.archs)
            c+= Object.keys(this.archs[i]).length
        return c
    }

    // Mutations can be of the following:
    // 1 - new node (implies 2, otherwise the node would be useless)
    // 2 - new synapse for given node
    // 3 - change node bias
    // 4 - change synapse weight
    // 5 - remove synapse from node
    // 6 - remove node (and related synapses)
    this.mutate = () => {
        // First remove empty archs
        // for (var i in this.archs) {
        //     if (!Object.keys(this.archs[i]).length) {
        //         delete(this.archs[i])
        //     }
        // }

        // TODO: change based on complexity
        while (true) {
            var m = pick(Object.keys(Net.mutations))
            if (Net.mutations[m].call(this)) {
                // console.log('mutazione', m)
                break
            }
        }
        return this
    }

    this.set = (node, value) => {
        var n = this.nodes[node]

        if (!n) {
            n = this.nodes[node] = { act: 'id', mrate: 0 }
            // this.nodes['post-'+node] = { act: 'id', mrate: 1 }
            // this.archs['post-'+node] = {}
            // this.archs['post-'+node][node] = Net.randWeight()
        }

        n.bias = value
    }

    this.val = (node) => {
        var n = this.nodes[node]

        if (!n) {
            n = this.nodes[node] = { act: 'id', mrate: 1 }
        }

        // Init values
        n.val = n.val ? n.val : 0
        n.bias = n.bias ? n.bias : 0

        // If node is processing, return last value
        if (n.processing) return n.val

        // Set processing to true
        n.processing = true

        // Get node value
        var v = n.bias

        // Sum inputs
        for (var i in this.archs[node]) {
            v+= this.val(i) * this.archs[node][i]
        }

        // Unset processing
        delete(n.processing)

        // Activate value
        n.val = Net.funs[n.act](v)
        return n.val
    }

    this.lock = (id, mrate) => {
        var n = this.nodes[id]
        if (n.locking) return
        n.locking = true
        n.mrate = mrate

        // Lock inputs
        for (var i in this.archs[id]) {
            // console.log('locking', i)
            this.mrate(this.archs[id][i], mrate)
        }
    }
}


Net.randWeight = () => {
    return 1-2*Math.random()
}

Net.uid = () => {
    return Math.floor((1 + Math.random()) * 0x100000)
      .toString(16)
      .substring(1);
}

Net.mutations = {
    newSynapse(src, dst) {
        src = src ? src : pick(Object.keys(this.nodes))
        dst = dst ? dst : pick(Object.keys(this.nodes))
        if (!(dst in this.archs)) this.archs[dst] = {}
        if (this.nodes[dst].mrate <= Math.random()) return false
        this.archs[dst][src] = Net.randWeight()
        // console.log('newSynapse', src, dst)
        return true
    },
    newNode() {
        if (Math.random() < .6) return false
        var id = Net.uid()
        this.nodes[id] = {
            act: Net.randFun(),
            bias: Net.randWeight(),
            mrate: 1,
        }
        // console.log('newNode', id)
        while (!Net.mutations.newSynapse.call(this, null, id));
        return true
    },
    mutateBias() {
        var id = pick(Object.keys(this.nodes))
        if (!id) return false
        if (this.nodes[id].mrate <= Math.random()) return false
        this.nodes[id].bias+= Net.randWeight()
        return true
    },
    mutateWeight() {
        var dst = pick(Object.keys(this.archs))
        if (!dst) return false
        var src = pick(Object.keys(this.archs[dst]))
        if (!src) return false

        if (this.nodes[dst].mrate <= Math.random()) return false

        this.archs[dst][src].weight+= Net.randWeight()
        return true
    },
    mutateActivation() {
        var id = pick(Object.keys(this.nodes))
        if (!id) return false
        if (this.nodes[id].mrate <= Math.random()) return false
        this.nodes[id].act = Net.randFun()
        return true
    },
    removeSynapse() {
        var dst = pick(Object.keys(this.archs))
        if (!dst) return false
        if (this.nodes[dst].mrate <= Math.random()) return false
        var src = pick(Object.keys(this.archs[dst]))
        if (!src) return false
        // console.log('removeSynapse', src, dst)
        return delete(this.archs[dst][src])
    },
    removeNode() {
        if (Math.random() < .6) return false
        var id = pick(Object.keys(this.nodes))
        if (!id || id.length == 1) return false
        if (this.nodes[id].mrate <= Math.random()) return false
        delete(this.nodes[id])
        delete(this.archs[id])
        // console.log('removeNode', id)
        for (var i in this.archs) {
            delete(this.archs[i][id])
        }
        return true
    },
}

Net.funs = {
    sig: x => 1/(1+Math.exp(-x)),
    sq: x => x > 0 ? 1 : 0,
    id: x => x,
    neg: x => -x,
    log: x => Math.log(Math.abs(x)),
    abs: x => Math.abs(x),
    exp: x => Math.exp(x),
}

Net.active_funs = Object.keys(Net.funs)

Net.randFun = () => {
    var keys = Net.active_funs
    return pick(keys)
}
