/*
    Constants
*/
var pi = 3.1415926;

/* 
    Helper functions, e.g. coordinate transforms, etc. 
*/
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

function cartesian_to_cylindrival(x, y, z) {
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

function update_stellar_population(stellar_pop, galaxy, dt) {
    /*  Uses the Leapfrog method to integrate the positions of this stellar 
        population forward by one timestep, specified by dt. Note that 
        Leapfrog is only symplectic if the timestep remains constant.
    */
    
    var new_positions = new Array(),
        new_velocities = new Array();

    for (var kk=0; kk < stellar_pop.positions.length; kk++) {
        // Get the old positions and velocities
        position = stellar_pop.positions[kk];
        velocity = stellar_pop.velocities[kk];
        
        // Compute the new positions
        var ai = galaxy.acceleration(position);
        var new_position = new Array();
        for (var ii=0; ii < position.length; ii++) {
            // APW: check this! do I need to consider the galaxy velocity here?
            new_position.push(position[ii] + velocity[ii]*dt + 0.5*ai[ii]*dt*dt);
        }
        
        // Compute the new velocities
        var new_ai = galaxy.acceleration(new_position);
        var new_velocity = new Array();
        for (var ii=0; ii < velocity.length; ii++) {
            // APW: check this! do I need to consider the galaxy velocity here?
            new_velocity.push(velocity[ii] + 0.5*(ai[ii] + new_ai[ii])*dt);
        }
        
        new_positions.push(new_position);
        new_velocities.push(new_velocity);
    }
    stellar_pop.positions = new_positions;
    stellar_pop.velocities = new_velocities;
}

/*
    Objects
*/
function StellarPopulation(args) {
    this.name = args["name"];
    this.positions = args["positions"] || new Array();
    this.velocities = args["velocities"] || new Array();
    
    this.draw = function(context, color) {
        if (color == undefined) {
            color = "#ccc";
        }
        
        var vel = this.velocities,
            pos = this.positions;
            
        for (var ii=0; ii < pos.length; ii++) {
            total_vel = vel[ii][0]*vel[ii][0] + vel[ii][1]*vel[ii][1];
            context.beginPath();
            context.fillStyle = color;
            context.arc(pos[ii][0],pos[ii][1], 1, 0, Math.PI*2,true);
            context.closePath();
            context.fill();
        }
    }
}

function Galaxy(position, velocity) {
    /*  This is the constructor for the "base" Galaxy object. The user must either supply an
        'acceleration' function, or subclass this object and create their own. The acceleration
        function should accept a list of positions and compute the accelerations along each dimension.
    */
        
    if ((position == undefined) || (velocity == undefined)) {
        throw new Error("A galaxy must be created with a position and velocity");
    }
    
    // Starting position
    this.position = position;
    
    // Starting velocity
    this.velocity = velocity;
	
	// Initialize internal populations object
	this.populations = {};
    
    this.add_population = function(population) {
        /*  Add a population of stars to this galaxy, e.g.:
            
            var pop = new StellarPopulation(initial_position, initial_velocity);
            galaxy.add_population(pop);
        */
        this.populations[population.name] = population;
    }
    
    this.update = function(dt) {
        // TODO: FIX THIS
        /* Update each stellar population's positions and velocities */
        
        if (dt == undefined) {
            dt = 1.0;
        }
        
        for (var ii=0; ii < this.position.length; ii++) {
            this.position[ii] += this.velocity[ii]*dt;
        }
        
        for (var key in this.populations) {
            if (this.populations.hasOwnProperty(key)) {
                update_stellar_population(this.populations[key], this, dt);
            }
        }
    }
    
    this.draw = function(context, colors) {
        /* Draw all stellar populations to the given context */
        
        // First clear the current state
        //context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        
        // Loop over populations
        for (var key in this.populations) {
            if (this.populations.hasOwnProperty(key)) {
                this.populations[key].draw(context, colors[key]);
            }
        }
    }
    
    this.add_disk = function(number, radius, dispersion) {
        /*  This is just a helper function that creates a new population of disk-like orbits and
            adds it to the galaxy.
        */
        
        //  Create an array of random initial positions and velocities for N particles (stars)
        var init_pos = new Array(),
            init_vel = new Array();
        
        var gg = 0;
        while (gg < number) {
            //  Choose stars to start with random radii around the center out to a radius
            //  supplied by the user
            init_r = Math.sqrt(Math.random()*radius*radius);
            init_phi = Math.random()*2.*pi;
            var xy = cylindrical_to_cartesian(init_r, init_phi);
            
            for (var ii=0; ii < xy.length; ii++) {
                xy[ii] += this.position[ii];
            }
            
            init_pos.push(xy);
            
            var mag_v = 1.4,
                vx = -mag_v * Math.sin(init_phi) + (Math.random()-0.5)*(dispersion/100.0/1.41),
                vy = mag_v * Math.cos(init_phi) + (Math.random()-0.5)*(dispersion/100.0/1.41);
                
            init_vel.push([vx, vy]);
            gg++;
        }
        
        var population = new StellarPopulation({"name" : "disk", "positions" : init_pos, "velocities" : init_vel});
        this.add_population(population);
        
    }
    
    this.add_bulge = function(number, radius, dispersion) {
        /*  This is just a helper function that creates a new population of bulge-like orbits and
            adds it to the galaxy.
        */
        
        // Create an array of random initial positions and velocities for N particles (stars)
        var init_pos = new Array(),
            init_vel = new Array();
        
        var gg = 0;
        while (gg < number) {
            // choose stars to start with random radii around the center out to a radius
            //  supplied by the user
            init_r = Math.sqrt(Math.random()*radius*radius);
            init_phi = Math.random()*2.*pi;
            var xy = cylindrical_to_cartesian(init_r, init_phi);
            
            for (var ii=0; ii < xy.length; ii++) {
                xy[ii] += this.position[ii];
            }
            
            init_pos.push(xy);
            
            var mag_v = 0.6,
                vx = -mag_v * Math.sin(init_phi) + (Math.random()-0.5)*(dispersion/100.0/1.41),
                vy = mag_v * Math.cos(init_phi) + (Math.random()-0.5)*(dispersion/100.0/1.41);
            init_vel.push([vx, vy]);
            gg++;
        }
        
        var population = new StellarPopulation({"name" : "bulge", "positions" : init_pos, "velocities" : init_vel});
        this.add_population(population);
        //this.add_population(init_pos, init_vel, "bulge");
        
    }
} 

function LogarithmicGalaxy(position, velocity, mass) {
    /*  This represents a 2D logarithmic galactic potential. */
    
    var _galaxy = new Galaxy(position, velocity);
	_galaxy.U = 0.8;
	_galaxy.C = 1.0;
    _galaxy.mass = parseFloat(mass);
    
	_galaxy.acceleration = function(xy) {
	    //console.log(_galaxy.mass);
        // Set the galaxy position
        var xdotdot = - _galaxy.mass * (2 * _galaxy.U*_galaxy.U * (xy[0]-_galaxy.position[0])) / (_galaxy.U*_galaxy.U*(xy[0]-_galaxy.position[0])*(xy[0]-_galaxy.position[0]) + (xy[1]-_galaxy.position[1])*(xy[1]-_galaxy.position[1]) + _galaxy.C*_galaxy.C*_galaxy.U*_galaxy.U),
            ydotdot = - _galaxy.mass * (2 * (xy[1]-_galaxy.position[1])) / (_galaxy.U*_galaxy.U*(xy[0]-_galaxy.position[0])*(xy[0]-_galaxy.position[0]) + (xy[1]-_galaxy.position[1])*(xy[1]-_galaxy.position[1]) + _galaxy.C*_galaxy.C*_galaxy.U*_galaxy.U);
        
        return [xdotdot, ydotdot];
    }
    return _galaxy;
}