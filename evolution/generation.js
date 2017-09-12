var Generation = function(population) {

	// The generation age
	this.age = 0;

	// Generation statistics
	this.best = null;
	this.average = 0;
	this.total = 0;

	/**
	 * The population to menage
	 * Subjects MUST implement:
	 *     float	.fitness()
	 *     object	.reproduce(partner)
	 */
	this.population = []
	for(var i in population) {
		this.push(population[i])
	}

}

Generation.prototype.push = function(element) {
	element.gen = this
	this.population.push(element)
}

// Sort the population by fitness
Generation.prototype.sort = function() {
    this.population.sort(function(a, b) {
        return b.fitness() - a.fitness()
    })
}

Generation.prototype.stats = function() {
	var s = {
		max: this.population[0].fitness(),
		min: this.population[0].fitness(),
		avg: this.population[0].fitness(),
		variance: this.population[0].fitness(),
	}
	this.best = this.population[0]

	for(var i = 0; i < this.population.length; i++) {
		var f = this.population[i].fitness()
		s.avg+= f
		if (f > s.max) { this.best = this.population[i]; s.max = f }
		else if (f < s.min) s.min = f
	}
	s.avg/= this.population.length

	for(var i = 0; i < this.population.length; i++) {
		var f = this.population[i].fitness()
		s.qmean+= Math.pow(f - s.avg, 2)
	}
	s.variance/= this.population.length
	return s
}

Generation.prototype.next = function(count) {
	count = count ? count : this.population.length
	this.sort()
	var lives = this.population
	lives = lives.slice(0, lives.length)
    var kids = []

    // Clone the top 10%
    for (var i = 0; i < count/10; i++)
        kids.push(lives[i].reproduce(true))

    // Mutate the rest
    while (kids.length < count) {
        var i = Math.floor(Math.random()*((kids.length+1)/count*lives.length)/4)
        kids.push(lives[i].reproduce())
    }

    return new Generation(kids)

}

Generation.prototype.serialize = function() {
	var brains = [];
	for(var i in this.population) {
		brains.push(this.population[i].brain.serialize());
	}
	return brains;
}
