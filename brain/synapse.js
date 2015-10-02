var Synapse = function(src, dst) {
    
    this.src = src;
    this.dst = dst;
    this.weight = Math.random()-.5;
    this.weight*= 4;
    
}

Synapse.prototype.output = function() {
    
    // Return the input neuron output already weighted
    return this.src.output*this.weight;
    
}
