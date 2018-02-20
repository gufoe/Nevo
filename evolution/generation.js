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
	this.sort()

	var s = {
		max: this.population[0].fitness(),
		min: this.population[this.population.length-1].fitness(),
		avg: this.population[0].fitness(),
		top: this.population[0].fitness(),
		variance: this.population[0].fitness(),
	}
	this.best = this.population[0]

	for(var i = 1; i < this.population.length; i++) {
		var f = this.population[i].fitness()
		s.avg+= f
		if (i < this.population.length/10) s.top+= f
		if (f < s.min) s.min = f
	}
	s.avg/= this.population.length
	s.top/= Math.floor(this.population.length/10)

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
    for (var i = 0; i < count/100; i++)
        kids.push(lives[i].reproduce())

    // Mutate the rest
    while (kids.length < count) {
        var i = Math.floor(Math.random()*((kids.length+1)/count*lives.length)/4)
        var j = Math.floor(Math.random()*((kids.length+1)/count*lives.length)/10)
        kids.push(lives[i].reproduce(lives[j]))
    }

    return new Generation(kids)

}
