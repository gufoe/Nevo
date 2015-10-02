var NLayer = function(n) {
    
	this.id = 0;
    this.neurons = [];
    this.bias = false;
    
    // Add N neurons to the list
    for (var i = 0; i < n; i++)
        this.neurons.push(new Neuron());
        
}

NLayer.prototype.addBias = function() {
	
    // Add the bias
    this.neurons.push(new Neuron(true));
    this.bias = true;
    
}

NLayer.prototype.bind = function(layer, source) {
    
    // Bind all neurons, exept the bias
    for(var i = 0; i < this.neurons.length; i++)
        this.neurons[i].bind(layer);
    
    if (source != null) {
        
        // For each neuron
        for(var i = 0; i < this.neurons.length; i++) {
        
            // Copy each synapse weight
            for(var j = 0; j < this.neurons[i].synapses.length; j++)
                this.neurons[i].synapses[j].weight = source.neurons[i].synapses[j].weight;
        
        }
    }
}

NLayer.prototype.prepare = function(inputs) {
    
	if (inputs.length != this.neurons.length-1) {
		console.log('Inputs ('+inputs.length+') vs neurons ('+this.neurons.length+')');
		return;
	}
	
    // Set each neuron output (except the bias)
    for(var i = 0; i < inputs.length; i++)
        this.neurons[i].output = inputs[i];
    
}

NLayer.prototype.process = function() {
	
    // Make each neuron produce an output (except the bias)
    for(var i = 0; i < this.neurons.length - (this.bias ? 1 : 0); i++)
        this.neurons[i].process();
    
}

NLayer.prototype.clone = function() {
    
    // Create the cloned neural layer
    return new NLayer(this.neurons.length - (this.bias ? 1 : 0));
    
}

NLayer.prototype.output = function() {
    
    var out = [];
    
    // Copy the neurons output in a list
    for(var i = 0; i < this.neurons.length; i++)
        out.push(this.neurons[i].output);
    
    return out;
    
}

NLayer.prototype.crossover = function(lay) {
	
	// Copy random neurons synapses weights from the other layer
	for(var i in this.neurons)
		this.neurons[i].crossover(lay.neurons[i]);
	
}

