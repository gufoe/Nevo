var Neuron = function(bias) {

	this.bias = (bias === true);
    this.synapses = [];
    this.output = 1;

}

Neuron.prototype.process = function() {

	if (this.bias)
		return;

    this.output = 0;

    // Sum each input synapse output (already weighted)
    for(var i in this.synapses)
        this.output+= this.synapses[i].output();

    // Activate the output
    this.output = Neuron.activate(this.output);

}

Neuron.prototype.bind = function(l) {

    // Create one synapse for each input neuron
    for(var i = 0; i < l.neurons.length; i++)
        this.synapses.push(new Synapse(l.neurons[i], this));

}

Neuron.prototype.crossover = function(neu) {

	// 50% of the times copy the source neuron synapses
	if(Math.random() < 0.5)
		for(var i in this.synapses)
			this.synapses[i].weight = neu.synapses[i].weight;

	for(var i in this.synapses)
		if (Math.random()*100 < Neuron.MUTATION_RATE)
			this.synapses[i].weight+= (Math.random()-0.5)*4;

}

Neuron.activate = function(x) {
    if (x > 40)
		return 1;
	if (x < -40)
		return -1;

    // Return the sigmoid function
    return 1.0/(1 + Math.exp(-x))*2-1;

}

Neuron.MUTATION_RATE = 30;
