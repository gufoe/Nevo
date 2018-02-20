var Net = function() {
    this.neurons = []
}

Net.prototype.tick = () => {
    var activate = n => {
        var sum = n.bias
        for (var i in n.inputs) {
            var syn = n.inputs[i]
            sum += syn.weight * syn.neuron.output
        }
        return Net.funs[this.neurons.activation](sum)
    }

    var outs = []

    // Calculate new state
    for (var i in this.neurons) {
        this.neurons.forEach(n => outs.push(activate(n)))
    }

    // Save new state
    for (var i in this.neurons) {
        this.neurons[i].output = outs[i]
    }
}

Net.prototype.get = i => {
    return this.neurons[i]
}

Net.spawnNeuron = plasticity => {
    bias: 0,
    plasticity: plasticity,
    activation: Net.randActivation(),
    inputs: [],
}

Net.funs = {
    sig: x => 1 / (1 + Math.exp(-x)),
    sq: x => x > 0 ? 1 : 0,
    id: x => x,
    neg: x => -x,
    log: x => Math.log(Math.abs(x)),
    abs: Math.abs,
    exp: Math.exp,
    sin: Math.sin,
    cos: Math.cos,
}

Net.weights = [ 2/6, 3/6, 6/6, 9/6, 12/16, 0, -2/6, -3/6, -6/6, -9/6, -12/16]
