
(function() {
    var _recurrent = false
        /**
         * Constructor A:
         * @param structure (ex. [4, 3, 2] 4 neurons in the input layer, 3 in the hidden layer and 2 in the output layer)
         *
         * Contructor B:
         * @param Brain net0
         * @param Brain net1
         * @param float mutation rate (0 = 0;, 1 = 100%)
         *
         * Examples:
         * to generate a new net, use: new Brain([4, 3, 2])
         * to clone a net, use: new Brain(net.to.clone, net.to.clone, 0)
         *
         */
    var Brain = this.Brain = function(a, b, mrate) {

        // The mutation rate, will be set later
        this.mrate = mrate ? mrate : 0;
        this.id = parseInt(Math.random() * 100000)
        this.network
        this.outputs
        this.inputs
        this.struct

        // Create the net from the struct
        this.createFromStruct = (struct) => {
            this.struct = struct
            this.network = zArray(struct.length - 1)
            this.outputs = zArray(this.network.length)

            for (var l = 0; l < struct.length - 1; l++) {
                this.network[l] = zArray(struct[l + 1])
                this.outputs[l] = zArray(this.network[l].length)
                var syn = struct[l] + 1 // Precedent neurons + bias

                // Following neurons
                if (_recurrent)
                    syn += l < struct.length - 2 ? struct[l + 2] : 0

                for (var n = 0; n < this.network[l].length; n++) {
                    this.network[l][n] = zArray(syn)
                    this.outputs[l][n] = 1
                    for (var w = 0; w < syn; w++) {
                        this.network[l][n][w] = Brain.genWeight(1)
                    }
                }
            }
        }

        // Create the net from parents
        this.createFromParents = (net0, net1, intensity) => {


            if (intensity == null) {
                intensity = 1
            }

            var d = net0.network
            var m = net1.network
            var src

            this.network = zArray(net0.network.length)
            this.outputs = zArray(net0.network.length)
            this.struct = []

            // Check brains are equal
            for (var i in net0.struct) {
                if (net0.struct[i] == net1.struct[i]) {
                    this.struct[i] = net0.struct[i]
                } else {
                    throw 'Brains are not compatible'
                }
            }


            for (var l = 0; l < this.network.length; l++) {
                this.network[l] = zArray(d[l].length)
                this.outputs[l] = zArray(this.network[l].length)

                for (var n = 0; n < this.network[l].length; n++) {

                    this.network[l][n] = zArray(d[l][n].length)

                    var src = Math.random() < .5 ? d[l][n] : m[l][n]

                    for (var w = 0; w < this.network[l][n].length; w++) {
                        this.network[l][n][w] = src[w]
                        if (Math.random() < this.mrate) {
                            this.network[l][n][w] += Brain.genWeight(intensity)
                        }
                    }
                }
            }
        }

        // This is used to calculate the network outputs
        this.process = (inp) => {
            this.inputs = inp
            if (inp.length != this.struct[0])
                throw 'Expected ' + this.struct[0] + ' inputs, got ' + inp.length

            for (var l = 0; l < this.network.length; l++) {
                if (l > 0)
                    inp = this.outputs[l - 1]

                for (var n = 0; n < this.network[l].length; n++) {
                    this.outputs[l][n] = 0;
                    for (var w = 0; w < inp.length; w++) {
                        this.outputs[l][n] += inp[w] * this.network[l][n][w]
                    }

                    this.outputs[l][n] += this.network[l][n][w]

                    if (_recurrent) {
                        for (var w = 0; l < this.network.length - 1 && w < this.outputs[l + 1].length; w++) {
                            this.outputs[l][n] += this.outputs[l + 1][w] * this.network[l][n][inp.length + 1 + w]
                        }
                    }

                    this.outputs[l][n] = this.activate(this.outputs[l][n])
                }

            }

            return this.outputs[this.outputs.length - 1]
        }

        // Get the last outputs
        this.getOutputs = () => {
            return this.outputs[this.outputs.length - 1]
        }

        // The activation function
        this.activate = (x) => {
            //return Math.sin(x*10.0);
            if(x > 40)
                return 1;
            if(x < -40)
                return -1;

            return 2.0/(1 + Math.exp(-x))-1;
        }

        // Clone a net
        this.clone = (mrate) => {
            return new Brain(this, this, mrate)
        }

        // Get the number of inputs
        this.inputs = () => {
            return this.network[0][0].length - 1
        }

        if (b == null) {

            // Generate a new net
            if (a != null) {
                this.createFromStruct(a)
            }

        } else {

            // Generate a new net given its parents
            this.createFromParents(a, b, 2)
        }
    }

    // Unserialize the net
    Brain.unserialize = (data) => {
        var net = new Brain()
        net.outputs = []
        net.inputs = []
        net.network = clone(data.network)
        net.struct = data.struct
        for (var i = 1; i < net.struct.length; i++) {
            net.outputs.push(zArray(data.struct[i]))
        }
        return net;
    }

    Brain.genWeight = (factor) => {
        return 10 * (factor ? factor : 1) * (1 - Math.random() * 2)
    }

    function zArray(n) {
        return Array.apply(null, Array(n)).map(Number.prototype.valueOf, 0)
    }

}).call(this)
