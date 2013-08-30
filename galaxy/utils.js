/*
    Helper functions, e.g. coordinate transforms, etc.
*/

function cloneObject(source) {
    for (i in source) {
        if (typeof source[i] == 'source') {
            this[i] = new cloneObject(source[i]);
        }
        else{
            this[i] = source[i];
	}
    }
}

Array.prototype.vectorAdd = function(other) {
    var output_array = new Array();

    for (var ii=0; ii < this.length; ii++) {
        output_array.push(other[ii] + this[ii]);
    }
    return output_array;
};

function subclass(constructor, superConstructor) {
	function surrogateConstructor() { }

	surrogateConstructor.prototype = superConstructor.prototype;
	var prototypeObject = new surrogateConstructor();
	prototypeObject.constructor = constructor;

	constructor.prototype = prototypeObject;
}

function cylindrical_to_cartesian(r, phi, z) {
    /*  Convert cylindrical coordinates to cartesian. Center of the coordinate system is 0,0! */

    var x = r*Math.cos(phi),
        y = r*Math.sin(phi);

    if (z == undefined) {
        return [x,y];
    } else {
        return [x,y,z];
    }
}

function cartesian_to_cylindrical(x, y, z) {
    /*  Convert cartesian coordinates to cylindrical. The cartesian values must
        already be shifted to be relative to the center of the coordinate system!
    */

    var r = Math.sqrt(x*x + y*y);
    var phi = Math.atan2(y, x);

    if (z == undefined) {
        return [r, phi];
    } else {
        return [r, phi, z];
    }
}
