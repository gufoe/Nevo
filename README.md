# Nevo
Virtual life simulation and evolution through Neural Networks and Genetic Algorithms.

## Demo
Check out the demo at http://gufoe.tk/jack/nevo/alpha/

## Description
The world is firstly set up with random fishes (colored pentagons with inner triangle) and food (blue hexagons), the camera always follows the older fish, use the mouse wheel to zoom in/out.
In this first moments, fishes have random NNs and will move randomly and eventually starve (blink speed is proportional to hunger).
After a few generations, fishes should start to move toward food, which will increase their life, allowing them to live longer and grow in diameter.
Fishes reach fertility at age 1000: this reproduction is asexual, as children will have a cloned NN with some random mutations. Color will also have some mutations, allowing further genealogical tree analysis.
When all fishes die, each individual who lived/died in the generation is given a probability based on their fitness (food eaten); this is used to dinamically select couples of fishes and merge their NN.
After some time (less than a minute on fast simulation using a i5 processor) generations should become longer, as fishes begin reproducting.
The graph on the lower side of the screen indicates fishes (blue) and food (green) number. In big-world simulation, when generations get very old, the graph resembles the Lotka-Volterra frequency plot of prey/predators (https://en.wikipedia.org/wiki/Lotka%E2%80%93Volterra_equations).

## Keys
F to reduce the rendering frame rate, while increasing the update frame rate; this will cause lag, but everything will actually move faster.
I to toggle information displaying over each fish (Age, Life, Food [eaten], Children).
P to pause.
D enables "debug" vision; currently it will only display every fish vision.
B enable "bioma" view, which is useful to see how creatures are migrating through the world and how food is growing or consumed.
Mouse wheel to zoom in or out.

