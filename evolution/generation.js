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
		population[i].gen = this;
		this.population.push(population[i]);
	}

}

Generation.prototype.sort = function() {

	// Sort the population by fitness
    this.population.sort(function(a, b) {
        return b.fitness() - a.fitness();
    })
}

Generation.prototype.update = function() {
	this.sort();
	this.total = 0;
	for(var i in this.population)
		this.total+= this.population[i].fitness();
	this.average = this.total/this.population.length;
	this.best = this.population[0].fitness();
}

Generation.prototype.children = function() {
	var lives = this.population

    var kids = []
    // Clone the top 10%
    // for (var i = 0; i < lives.length/10; i++)
    //     kids.push(lives[i].kid(false))
    // Mutate the rest
    while (kids.length < lives.length) {
        var i = Math.floor(Math.random()*(lives.length - kids.length))
        kids.push(lives[i].reproduce())
    }
    return kids
	//
	//
	// var pool = [],
	// 	keep = Math.min(this.population.length/10, this.population.length);
	//
	// // Fill the mating pool with 100 population
	// for(var i in this.population) {
	// 	var fitness = this.population[i].fitness();
	//
	// 	for(var j = 0; j < Math.pow(fitness+1, 1); j++)
	// 		pool.push(this.population[i]);
	// }
	//
	//
	//
	// var children = [];
	//
	// for(var i = 0; i < keep; i++) {
	// 	var genius = this.population[i];
	// 	children.push(genius.clone());
	// }
	//
	// // Generate the new generation
	// for(var i = 0; i < this.population.length-keep; i++) {
	// 	var dad, mom;
	// 	if(pool.length > 4) {
	//
	// 		dad = Math.random()*pool.length;
	// 		mom = Math.random()*pool.length;
	//
	// 		// Select the parents from the pool
	// 		dad = pool[Math.floor(dad)];
	// 		mom = pool[Math.floor(mom)];
	//
	// 	} else {
	//
	// 		dad = Math.random()*this.population.length;
	// 		mom = Math.random()*this.population.length;
	//
	// 		// Select the parents from the pool
	// 		dad = this.population[Math.floor(dad)];
	// 		mom = this.population[Math.floor(mom)];
	//
	// 	}
	//
	//
	// 	// Create a new subject
	// 	var child = dad.reproduce(mom);
	//
	// 	// Add the child to the new generation
	// 	children.push(child);
	// }
	//
	// // Return the new generation
	// return children;

}

Generation.prototype.serialize = function() {
	var brains = [];
	for(var i in this.population) {
		brains.push(this.population[i].brain.serialize());
	}
	return brains;
}
