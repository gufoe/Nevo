function constrain(value, minValue, maxValue) {
    if (maxValue == null) {
        maxValue = minValue;
        minValue*= -1;
    }
    return value > maxValue ? maxValue : (value < minValue ? minValue : value);
}

function len(obj) {
    return Object.keys(obj).length;
}

function randColor() {
    return parseInt(Math.random()*255)+','+parseInt(Math.random()*255)+','+parseInt(Math.random()*255)
}

var rnd = Math.random
var pty = n => rnd() < n

function collect() {
  var ret = {};
  var len = arguments.length;
  for (var i=0; i<len; i++) {
    for (p in arguments[i]) {
      if (arguments[i].hasOwnProperty(p)) {
        ret[p] = arguments[i][p];
      }
    }
  }
  return ret;
}
Object.values = function (obj) {
    var vals = [];
    for( var key in obj ) {
        if ( obj.hasOwnProperty(key) ) {
            vals.push(obj[key]);
        }
    }
    return vals;
}


var clone = (obj) => {
    return JSON.parse(JSON.stringify(obj))
}
var keys = obj => Object.keys(obj)
var values = obj => Object.values(obj)

var range = (n, c) => { for (var i = 0; i < n; i++) c(i) }

function shuffle(array) {
    var currentIndex = array.length,
        temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function pick(array) {
    var i = Math.floor(Math.random() * array.length)
    return array[i]
}

function rand(v) {
    return Math.random() * v
}

function randInt(v) {
    return parseInt(rand(v))
}

function clone(obj) {
    return JSON.parse(JSON.stringify(obj))
}

var remove = function(array, el) {
    var i = array.indexOf(el)
    if (i >= 0) array.splice(i, 1)
}

function size (obj) { return keys(obj).length }
