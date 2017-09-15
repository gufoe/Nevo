var canvas = false,
    render = false,
    mouse = {
        x: 0,
        y: 0
    },
    fps = {
        update: 40,
        draw: 10
    },
    Conf = {
        mutation_ticks: 10000,
        world: null
    },
    fastFps = 40,
    sync = true,
    paused = false,
    startDraw,
    showInfo = true,
    autoFollow = true,
    drawHelp = true,
    DEBUG = false,
    fastMode = false,
    chain = [],
    follow = null,
    zoom = 1,
    zoomInt = null,
    zoomFinal = zoom,
    History = {
        age: new Seq(),
        max: new Seq(),
        min: new Seq(),
        avg: new Seq(),
        size: new Seq(),
        lin_acc: new Seq(200),
        ang_acc: new Seq(200),
    }
distr = {
    distribution: new Distribution(0, 1, 1000, 1000, 1080, 130, 200, 100, '#7e6', 'Distribution'),
    fitness: new Distribution(0, 3000, 50, 30000, 1300, 130, 200, 100, '#7e6', 'Fitness'),
}
drawables = [
    distr.distribution,
    distr.fitness,
]


// Init
Conf.world = {
    w: 10000,
    h: 10000,
    tileSize: 300,
    default_meals: 700,
    default_nevos: 400,
}
Conf.meal = {
    energy: 200,
    timeout: 10,
    poison: 0,
}
Conf.nevo = {
    max_life: 5000,
    default_life: 1000,
    viewRange: Math.PI / 1.7,
    viewAccuracy: 40,
    maxLinVel: 10,
    maxLinAcc: 1,
    maxAngVel: (Math.PI / 16.0),
    maxAngAcc: (Math.PI / 16.0) / 10,
    speed_bonus: 0,
    ticks_per_tought: 1,
}

// Exploration
// Conf.world.h = 30000
// Conf.meal.energy = 400
// Conf.nevo.default_life = Conf.nevo.newborn_life = 200
// Conf.nevo.max_life = 3000
// Conf.nevo.maxLinVel = 10
// Conf.nevo.viewAccuracy = 7


var update = function() {
    if (sync) {
        draw();
    }
    if (!paused) {
        for (var i = 0; i < (fastMode ? fastFps : 1); i++) {
            world.update();
            if (world.nevos.length == 0) {
                generate();
            }
        }
    }

}

var drawGraph = function(label, array, x, y, w, h, color, min, max) {
    if (!array || !array.length) return

    if (max !== undefined || min !== undefined) {
        var mx = -Infinity
        var mn = Infinity

        for (var i = 0; i < array.length; i++) {
            if (isNaN(array[i])) continue
            if (array[i] > mx) {
                mx = array[i]
            } else if (array[i] < mn) {
                mn = array[i]
            }
        }

        if (min === undefined) min = mn
        if (max === undefined) max = mx
    }

    render.beginPath();
    for (var i in array) {
        if (isNaN(array[i])) continue
        var yy = array[i]
        yy -= min
        yy /= max - min
        render.lineTo(x + i * (w / (array.length - 1)), y - yy * h);
    }
    render.strokeStyle = color;
    render.stroke();
    render.closePath();

    render.strokeStyle = color;
    render.strokeRect(x, y - h, w, h);

    render.globalAlpha = .05;
    render.fillStyle = color;
    render.fillRect(x, y - h, w, h);
    render.globalAlpha = 1;

    render.fillStyle = color;
    render.fillText(label, x, y + 15);

}

var draw = function() {

    //follow = world.nevos[0];
    //follow.highlight = '0, 255, 255';

    // render.fillStyle = "#000";
    render.clearRect(0, 0, canvas.width, canvas.height);


    render.save();

    if (Math.abs(zoomFinal - zoom) > 0.01) {
        zoom += (zoomFinal - zoom) / (fastMode ? 1 : 10);
    }
    render.scale(zoom, zoom);
    // if (world.nevos[0]) {
    // 	follow = world.nevos[0];
    // }

    if (follow != null) {
        //render.rotate(Math.PI-follow.rot);
        render.translate(canvas.width / 2 / zoom, canvas.height / 2 / zoom);
        render.translate(-follow.pos.x, -follow.pos.y);
        startDraw.x = -canvas.width / 2 / zoom + follow.pos.x;
        startDraw.y = -canvas.height / 2 / zoom + follow.pos.y;
    } else {
        render.translate(canvas.width / 2 / zoom, canvas.height / 2 / zoom);
        render.translate(-mouse.x / canvas.width * world.w, -mouse.y / canvas.height * world.h);
        startDraw.x = -canvas.width / 2 / zoom + mouse.x / canvas.width * world.w;
        startDraw.y = -canvas.height / 2 / zoom + mouse.y / canvas.height * world.h;
    }

    world.draw();

    render.restore();

    render.font = '10pt monospace';
    render.fillStyle = "#FFF";

    var legend = {
        'Extintions': (chain.length == 0 ? 0 : chain[0].length),
        'World age ': world.age,
        'World best': world.bestFitness,
        'Food': world.meals.length,
        'Nevos': world.nevos.length,
        'Visible objects': world.draws,
        '[H] Help': drawHelp ? 'on' : 'off'
    }
    if (drawHelp) {
        legend['[I] Show info  '] = showInfo ? 'on' : 'off';
        legend['[P] Paused     '] = paused ? 'on' : 'off';
        legend['[F] Fast mode  '] = fastMode ? 'on' : 'off';
        legend['[D] Debug mode '] = DEBUG ? 'on' : 'off';
        legend['[A] Auto follow'] = autoFollow ? 'on' : 'off';
    }
    var i = 1;
    for (var label in legend) {
        render.fillText(label + ': ' + legend[label], 10, (i++) * 20);
    }


    drawGraph("", world.history.nevos, canvas.width / 2 + 50, canvas.height - 10, canvas.width / 2 - 100, 100, '#07f', 0);
    drawGraph("", world.history.meals, canvas.width / 2 + 50, canvas.height - 10, canvas.width / 2 - 100, 100, '#0f0', 0);

    History.age.draw(50, canvas.height - 120, canvas.width / 2 - 100, 100, '#0ff', 0)
    History.size.draw(50, canvas.height - 120, canvas.width / 2 - 100, 100, '#f0f', 0)
    History.avg.draw(50, canvas.height - 10, canvas.width / 2 - 100, 100, '#ff0', History.min.min, History.max.max)
    History.min.draw(50, canvas.height - 10, canvas.width / 2 - 100, 100, '#f00', History.min.min, History.max.max)
    History.max.draw(50, canvas.height - 10, canvas.width / 2 - 100, 100, '#0f0', History.min.min, History.max.max)

    if (world.nevos[0] && world.nevos[0].inputs) {
        // console.log(world.nevos[0].inputs)
        var stats = world.nevos[0].inputs.slice(0, 3)
        stats[0] = stats[0] * 2 - 1
        drawGraph('Input Stats', stats, 640, 130, 200, 100, '#ff0', -1, 1)
        drawGraph('Input View', world.nevos[0].inputs.slice(3), 860, 130, 200, 100, '#ff0', 0, 1)
    }

    History.lin_acc.draw(200, 80, 200, 45, '#cf0', -1, 1)
    History.ang_acc.draw(200, 130, 200, 45, '#4f0', -1, 1)
    drawables.forEach(d => {
        d.draw()
    })
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
        render.clearRect(0, 0, canvas.width, canvas.height);
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
        if (e.wheelDeltaY > 0) {
            zoomFinal = zoomFinal * factor;
        } else {
            zoomFinal = zoomFinal / factor;
        }
        // clearInterval(zoomInt);
        // zoomInt = setInterval(function() {
        //     zoom += (zoomFinal - zoom) / 10;
        //     if (Math.abs(zoomFinal - zoom) < 0.01)
        //         clearInterval(zoomInt);
        //
        // }, 20);
    }



    // Init the world
    world = new World();
    world.setup();
    gen = new Generation(world.nevos)


    // Start the update thread
    setInterval(function() {
        update();
    }, 1000.0 / fps.update);

    // Start the draw thread
    if (!sync) {
        setInterval(function() {
            draw();
        }, 1000.0 / fps.draw);
    }
}


function inWindow(x, y, radius) {
    if (x + radius < startDraw.x || y + radius < startDraw.y) {
        return false
    }
    if (x - radius > startDraw.x + canvas.width / zoom || y - radius > startDraw.y + canvas.height / zoom) {
        return false
    }
    return true
}


var generate = function() {
    var old_gen = gen
    gen = old_gen.next(Conf.world.default_nevos)

    var s = old_gen.stats()
    History.size.push(old_gen.population.length)
    History.age.push(world.age)
    History.avg.push(s.avg)
    History.max.push(s.max)
    History.min.push(s.min)

    world = new World()
    world.setup(gen.population)

}

var drawNet = () => {
    var col = (weight) => {
        var v = weight
        v = Math.min(1, Math.max(v, -1))
        v01 = v/2+.5
        var c = [1-v01, v01, v01, .2+Math.abs(v*.8)]
        c[0] *= 255
        c[1] *= 255
        c[2] *= 255
        c[0] = Math.floor(c[0])
        c[1] = Math.floor(c[1])
        c[2] = Math.floor(c[2])
        return 'rgba(' + c.join(',') + ')'
    }
    var nodes = []
    var edges = []
    var network = []
    var net = world.nevos[0].brains.main
    for (var i in net.nodes) {
        var n = net.nodes[i]
        nodes.push({
            id: i,
            value: .1,
            label: n.input || n.output ? i+'('+n.act+')' : null,
            color: col(n.val),
            font: {
                color: '#0f6',
                face: 'monospace',
            }
        })

        console.log(n.inputs)
        for (var j in n.inputs) {
            edges.push({
                color: col(n.inputs[j]),
                from: i,
                to: j,
                value: n.inputs[j] * net.nodes[j].val,
            })
        }
    }

    // Instantiate our network object.
    var data = {
        nodes: nodes,
        edges: edges
    };
    var options = {
        nodes: {
            shape: 'dot',
        }
    };
    var container = document.getElementById('graph');
    window.network = new vis.Network(container, data, options);
    container.style.display = 'block'
    // window.network.on('change', () => {
    //     setTimeout(() => container.style.display = 'none', 4000)
    // })
}

window.onkeydown = function(e) {
    var key = String.fromCharCode(e.keyCode);

    switch (key) {
        case 'G':
            localStorage.setItem('tree', JSON.stringify(world.tree));
            win = window.open('graph.html', '_blank');
            win.focus();
            break;
        case 'D':
            DEBUG = !DEBUG;
            break;
        case 'F':
            fastMode = !fastMode;
            break;
        case 'A':
            autoFollow = !autoFollow;
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
        case 'N':
            drawNet()
            break
    }
}
