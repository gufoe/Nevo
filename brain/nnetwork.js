var NNetwork = function(ser) {
    
    this.layers = [];
    this.output = [];
	
    if(ser == null)
    	return;
    
    for(var i = 0; i < ser.length; i++) {
    	var l;
    	if(i < ser.length-1) {
    		l = this.layers[i] = new NLayer(ser[i].length-1);
    		l.addBias();
    	} else {
    		l = this.layers[i] = new NLayer(ser[i].length);
    	}
    	if(i > 0) {
    		l.bind(this.layers[i-1]);
		}
    	
    	for(var j in l.neurons) {
    		var n = l.neurons[j];
    		for(var k in n.synapses) {
    			n.synapses[k].weight = ser[i][j][k];
    		}
    	}
    }
    
}

NNetwork.prototype.add = function(layer, source) {
    
    // Bind the layer with the previous one (if exists)
    if (this.layers.length > 0) {
        this.lastLayer().addBias();
        layer.bind(this.lastLayer(), source);
    }
	
	layer.id = this.layers.length;
	
	this.output = [];
	for(var i = 0; i < layer.neurons.length; i++)
		this.output.push(0);
    
    // Add the new layer to the list
    this.layers.push(layer);
    
}

NNetwork.prototype.lastLayer = function() {
    
    // Return the last layer in the list (output layer)
    return this.layers[this.layers.length-1];

}

NNetwork.prototype.process = function(inputs) {
    
    // Prepare the input layer neurons
    this.layers[0].prepare(inputs);
	
    // Make each layer work
    for(var i = 1; i < this.layers.length; i++)
        this.layers[i].process();
    
    // Return the output layer outputs
    this.output = this.lastLayer().output();
	
	return this.output;
    
}

NNetwork.prototype.display = function() {
    for(var i in this.layers)
        console.log(this.layers[i].neurons);
}

NNetwork.prototype.clone = function() {
    
    // Create the cloned neural network
    var net = new NNetwork();
    
    // Clone each layer
    for(var i = 0; i < this.layers.length; i++)
        net.add(this.layers[i].clone(), this.layers[i]);
    
    return net;
    
}

NNetwork.prototype.crossover = function(net) {
	
	// The crossover change random neurons synapses weights
	for(var i = 1; i < this.layers.length; i++)
		this.layers[i].crossover(net.layers[i]);
	
}

NNetwork.generate = function(dad, mom) {
	
	// Clone dad
	var child = dad.clone();
	
	// Mix dad genes with mom's ones
	child.crossover(mom);
	
	// Return the child
	return child;

}

NNetwork.prototype.serialize = function() {
	var ser = [];
	for(var i in this.layers) {
		ser[i] = [];
		var l = this.layers[i];
		for(var j in l.neurons) {
			ser[i][j] = [];
			var n = l.neurons[j];
			for(var k in n.synapses) {
				ser[i][j][k] = n.synapses[k].weight;
			}
		}
	}
	return ser;
}
