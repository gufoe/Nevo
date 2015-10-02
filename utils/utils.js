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