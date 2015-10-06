/**
 * Constructor A:
 * @param structure (ex. [4, 3, 2] 4 neurons in the input layer, 3 in the hidden layer and 2 in the output layer)
 *
 * Contructor B:
 * @param Brain dad
 * @param Brain mom
 * @param float mutation rate (0 = 0%, 1 = 100%)
 *
 * Examples:
 * to generate a new brain, use: new Brain([4, 3, 2])
 * to clone a brain, use: new Brain(brain_to_clone, brain_to_clone, 0)
 *
 */
var Brain = function(a, b, mrate) {

    // The mutation rate, will be set later
    this.mrate = 0;

    this.network;
    this.outputs;
    this.inputs;

    if (b == null) {

        // Generate a new brain
        if (a != null) {
            this.createFromStruct(a);
        }

    } else {

        // Generate a new brain given its parents
        this.createFromParents(a, b, mrate);
    }
}

    // Create the brain from the struct
Brain.prototype.createFromStruct = function(struct) {
    this.struct = struct;
    this.network = zArray(struct.length-1);
    this.outputs = zArray(this.network.length);

    for(var l = 0; l < struct.length-1; l++) {
        this.network[l] = zArray(struct[l+1]);
        this.outputs[l] = zArray(this.network[l].length);
        //console.log('Layer ', l, struct[l]);
        var syn =
            struct[l] // Precedent neurons
            + 1 // Bias
            + (l < struct.length-2 ? struct[l+2] : 0); // Following neurons;

        for(var n = 0; n < this.network[l].length; n++) {
            this.network[l][n] = zArray(syn);
            this.outputs[l][n] = 1;
            for(var w = 0; w < syn; w++) {
                this.network[l][n][w] = Brain.genWeight(1);
            }
        }
    }
}

// Create the brain from parents
Brain.prototype.createFromParents = function(dad, mom, mrate, intensity) {

    if (mrate == null) {
        this.mrate = dad.mrate;
    } else {
        this.mrate = mrate;
    }

    if (intensity == null) {
        intensity = 1;
    }

    var d = dad.network;
    var m = mom.network;
    var src;

    this.network = zArray(dad.network.length);
    this.outputs = zArray(this.network.length);
    this.struct = dad.struct;

    for(var l = 0; l < this.network.length; l++) {
        this.network[l] = zArray(d[l].length);
        this.outputs[l] = zArray(this.network[l].length);

        for(var n = 0; n < this.network[l].length; n++) {

            this.network[l][n] = zArray(d[l][n].length);
            src = Math.random() < .5 ? d[l][n] : m[l][n];

            for(var w = 0; w < this.network[l][n].length; w++)
                this.network[l][n][w] = src[w] + (Math.random()*100 < this.mrate ? Brain.genWeight(intensity) : 0);
        }
    }
}

// This is used to calculate the network outputs
Brain.prototype.process = function(inp) {
    this.inputs = inp;
    if (inp.length != this.struct[0])
        throw 'Expected '+this.struct[0]+' inputs, got '+inp.length;

    for(var l = 0; l < this.network.length; l++) {
        //console.log('layer: ', l);
        if(l > 0)
            inp = this.outputs[l-1];

        for(var n = 0; n < this.network[l].length; n++) {
            this.outputs[l][n] = 0;
            //console.log('neuron: ', l, n, 'inputs: ', inp.length, 'syn: ',this.network[l][n]);
            for(var w = 0; w < inp.length; w++) {
                this.outputs[l][n]+= inp[w] * this.network[l][n][w];
            }
            //console.log('summing bias in ', w, this.network[l][n][w])
            this.outputs[l][n]+= this.network[l][n][w];

            //(l < this.network.length-1) && console.log('summing output from ', inp.length, 'to', this.outputs[l+1].length);
            for(var w = 0; l < this.network.length-1 && w < this.outputs[l+1].length; w++) {
                //console.log('Adding from syn:', inp.length+1+w);
                this.outputs[l][n]+= this.outputs[l+1][w] * this.network[l][n][inp.length+1+w];
            }

            this.outputs[l][n] = this.activate(this.outputs[l][n]);
        }

    }

    return this.outputs[this.outputs.length-1];
}

// Get the last outputs
Brain.prototype.getOutputs = function() {
    return this.outputs[this.outputs.length-1];
}

// The activation function
Brain.prototype.activate = function(x) {
    //return Math.sin(x*10.0);
    if(x > 40)
        return 1;
    if(x < -40)
        return -1;

    return 2.0/(1 + Math.exp(-x))-1;
}

// Clone a brain
Brain.prototype.clone = function(mrate) {
    return new Brain(this, this, mrate);
}

// Get the number of inputs
Brain.prototype.inputs = function() {
    return this.network[0][0].length-1;
}

// Serialize the brain
Brain.prototype.serialize = function() {
    var data = this.network;
    return data;
}

// Unserialize the brain
Brain.unserialize = function(data) {
    var brain = new Brain();
    brain.outputs = [];
    brain.inputs = [];
    brain.network = data;
    for(var l in data) {
        brain.outputs.push(zArray(data[l].length));
    }
    return brain;
}

Brain.genWeight = function(factor) {
    return (factor?factor:1)*(1-Math.random()*2);
}

function zArray(n) {
    return Array.apply(null, Array(n)).map(Number.prototype.valueOf,0);
}
