var canvas = false,
	render = false,
	mouse = {x:0,y:0},
	fps = {
		update : 40,
		draw : 10
	},
	sync = true,
	paused = false,
	startDraw,
	showInfo = true,
	drawBioma = false,
	drawHelp = true,
	fullDraw = false,
	fastMode = false,
	chain = [],
	species = [[0,180,255]],//, '31,242,0', '0, 255, 255'],
	follow = null,
	zoom = 1,
	zoomInt = null,
	zoomFinal = zoom;

var update = function() {
	if (!paused) {
		for(var i = 0; i < (fastMode?100:1); i++)
			world.update();
	}
	if(sync) {
		draw();
	}

	if (world.nevos.length == 0) {
		generate();
	}
}

var drawGraph = function(label, array, x, y, w, h, color, maxm) {

	if (maxm == null) {
		maxm = 0;

		for(var i in array) {
			if(array[i] > maxm)
				maxm = array[i];
		}
	}

	render.beginPath();
	for(var i in array)
		render.lineTo(x+i*(w/(array.length-1)), y-array[i]/maxm*h);
	render.strokeStyle = color;
	render.stroke();
	render.closePath();

	render.strokeStyle = color;
	render.strokeRect(x, y-h, w, h);

	render.globalAlpha = .05;
	render.fillStyle = color;
	render.fillRect(x, y-h, w, h);
	render.globalAlpha = 1;

	render.fillStyle = color;
	render.fillText(label, x, y);

}

var draw = function() {

	//follow = world.nevos[0];
	//follow.highlight = '0, 255, 255';

	render.fillStyle = "#000";
	render.fillRect(0, 0, canvas.width, canvas.height);


	render.save();
	render.scale(zoom, zoom);
	if (world.nevos[0]) {
		follow = world.nevos[0];
	}

	if(follow != null) {
		//render.rotate(Math.PI-follow.rot);
		render.translate(canvas.width/2/zoom, canvas.height/2/zoom);
		render.translate(-follow.pos.x, -follow.pos.y);
		startDraw.x = -canvas.width/2/zoom +follow.pos.x;
		startDraw.y = -canvas.height/2/zoom+follow.pos.y;
	} else {
		render.translate(canvas.width/2/zoom, canvas.height/2/zoom);
		render.translate(
			-mouse.x/canvas.width*world.w,
			-mouse.y/canvas.height*world.h
		);
		startDraw.x = -canvas.width/2/zoom +mouse.x/canvas.width*world.w;
		startDraw.y = -canvas.height/2/zoom+mouse.y/canvas.height*world.h;
	}

	world.draw();

	render.restore();

	if (follow != null)
		drawSpectrum();

	render.font = '10pt monospace';
	render.fillStyle = "#FFF";

	var legend = {
		'Extintions':(chain.length == 0 ? 0 : chain[0].length),
		'World age ':world.age,
		'World best':world.bestFitness,
		'Food ':world.meals.length,
		'Nevos':world.nevos.length,
		'[H] Help':drawHelp?'on':'off'
	}
	if (drawHelp) {
		legend['[I] Show info '] = showInfo?'on':'off';
		legend['[P] Paused    '] = paused?'on':'off';
		legend['[F] Fast mode '] = fastMode?'on':'off';
		legend['[D] Debug mode'] = fullDraw?'on':'off';
		legend['[B] Bioma mode'] = drawBioma?'on':'off';
	}
	var i = 1;
	for (var label in legend) {
		render.fillText(label+': '+legend[label], 10, (i++)*20);
	}


	for(var i in species) {
		if (world.age%300 == 0) {
			species[i].update();
		}
		render.fillStyle = 'rgb('+species[i].color.join(',')+')';
		//render.fillText("Best:  "+species[i].population[0].fitness(), 20, i*80+80);
		//render.fillText("Total: "+species[i].total, 20, i*80+110);

		if (chain[i] == null)
			chain[i] = [];

		//drawGraph("", chain[i], 130, i*80+120, 200, 60, 'rgb('+species[i].color.join(',')+')');
	}

	drawGraph("", world.history.nevos, 50, canvas.height-10, canvas.width-100, 100, '#07f');
	drawGraph("", world.history.meals, 50, canvas.height-10, canvas.width-100, 100, '#0f0');
}

function drawSpectrum() {
	var mem = follow.memory;
	render.strokeStyle = '#fff';
	var xoff = follow.viewRange/Math.PI*180;
	var x = canvas.width/2-xoff;
	render.strokeRect(x, 0, xoff*2, mem.length*3+3);
	for(var t in mem) {
		var v = mem[t];
		for(var a in v) {
			if (v[a] == null)
				continue;

			render.fillStyle = 'rgba('+v[a].r+', '+v[a].g+', '+v[a].b+', '+Math.min(10, Math.exp(300/(100+v[a].dist)))/10+')';
			render.fillRect(x+xoff+parseInt(a), (mem.length-t)*3, 1, 3);
		}
	}
}

window.onload = function() {
	startDraw = new Vec();

	// Init the canvas
	canvas = document.createElement('canvas');
	canvas.id = 'nevo_canvas';
	document.getElementById('canvas_box').appendChild(canvas);

	// Resize the canvas
	window.onresize = function() {
		canvas.width = document.getElementById('canvas_box').clientWidth;
		canvas.height = document.getElementById('canvas_box').clientHeight;
		render = canvas.getContext('2d');

		render.save();
		render.fillStyle = "#000";
		render.fillRect(0, 0, canvas.width, canvas.height);
		render.restore();
	}

	// Call the resize event
	window.onresize();

	// Refresh mouse coords
	window.onmousemove = function(e) {
		mouse.x = e.pageX;
		mouse.y = e.pageY;
	}

	canvas.onmousewheel = function(e) {
		var factor = 1.2;
		if(e.wheelDeltaY > 0) {
			zoomFinal = zoomFinal*factor;
		} else {
			zoomFinal = zoomFinal/factor;
		}
		clearInterval(zoomInt);
		zoomInt = setInterval(function() {
			zoom+= (zoomFinal-zoom)/10;
			if (Math.abs(zoomFinal-zoom) < 0.01)
				clearInterval(zoomInt);

		}, 20);
	}



	// Init the world
	world = new World();
	world.setup(80, 600);
	createSpecies();



	// Start the update thread
	setInterval(function() {
		update();
	}, 1000.0/fps.update);

	// Start the draw thread
	if(!sync) {
		setInterval(function() {
			draw();
		}, 1000.0/fps.draw);
	}
}

function createSpecies() {

	var slice = world.nevos.length/species.length;
	for(var i in species) {
		var color = species[i].color == null ? species[i] : species[i].color;
		var nevos = world.nevos.slice(i*slice, i*slice+slice);
		species[i] = new Generation(nevos);
		species[i].color = color;
	}

}


var generate = function() {

	for(var i in species) {
		species[i].update();
		if (chain[i] == null)
			chain[i] = [];

		chain[i].push(species[i].total);
		if (chain[i].length > 100) {
			chain[i].shift();
		}
	}


	var children = [];

	for(var i in species)
		children = children.concat(species[i].children());

	world.setup(0, 0);
	world.setNevos(children);
	createSpecies();

}


window.onkeydown = function(e) {
	var key = String.fromCharCode(e.keyCode);

	switch(key) {
		case 'G':
			localStorage.setItem('tree', JSON.stringify(world.tree));
			win = window.open('graph.html', '_blank');
			win.focus();
		break;
		case 'D':
			fullDraw = !fullDraw;
		break;
		case 'F':
			fastMode = !fastMode;
		break;
		case 'B':
			drawBioma = !drawBioma;
		break;
		case 'H':
			drawHelp = !drawHelp;
		break;
		case 'I':
			showInfo = !showInfo;
		break;
		case 'P':
			paused = !paused;
		break;
	}
}
