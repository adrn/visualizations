/*
    Constants
*/
var pi = 3.1415926;

function update_galaxy_positions(galaxy_simulation, dt) {
    /*  Uses the Leapfrog method to integrate the positions of the galaxy
        potential centers forward by one timestep, specified by dt. Note that
        Leapfrog is only symplectic if the timestep remains constant.
    */

    for (var key in galaxy_simulation.galaxies) {
        if (galaxy_simulation.galaxies.hasOwnProperty(key)) {
            // Get galaxy object
            var galaxy = galaxy_simulation.galaxies[key];

            // Get the old positions and velocities
            var position = galaxy.position;
            var velocity = galaxy.velocity;
            var num_dimensions = position.length;

            var ai = new Array();
            for (var ii=0; ii < num_dimensions; ii++) {
                ai.push(0.);
            }

            // Compute the total acceleration at a point due to all galaxies
            for (var key in galaxy_simulation.galaxies) {
                if ( galaxy_simulation.galaxies.hasOwnProperty(key) && (galaxy_simulation.galaxies[key] != galaxy) ) {
                    ai = ai.vectorAdd(galaxy_simulation.galaxies[key].newton_acceleration_at(position));
                }
            }

            // Compute the new positions
            var new_position = new Array();
            for (var ii=0; ii < num_dimensions; ii++) {
                new_position.push(position[ii] + velocity[ii]*dt + 0.5*ai[ii]*dt*dt);
            }

            var new_ai = new Array();
            for (var ii=0; ii < num_dimensions; ii++) {
                new_ai.push(0.);
            }

            // Compute the total acceleration at a point due to all galaxies
            for (var key in galaxy_simulation.galaxies) {
                if ( galaxy_simulation.galaxies.hasOwnProperty(key) && (galaxy_simulation.galaxies[key] != galaxy) ) {
                    new_ai = new_ai.vectorAdd(galaxy_simulation.galaxies[key].newton_acceleration_at(new_position));
                }
            }

            // Compute the new velocities
            var new_velocity = new Array();
            for (var ii=0; ii < num_dimensions; ii++) {
                new_velocity.push(velocity[ii] + 0.5*(ai[ii] + new_ai[ii])*dt);
            }

            galaxy.position = new_position;
            galaxy.velocity = new_velocity;

        }
    }
}

function update_stellar_populations(galaxy_simulation, dt) {
    /*  Uses the Leapfrog method to integrate the positions of stellar
        populations forward by one timestep, specified by dt. Note that
        Leapfrog is only symplectic if the timestep remains constant.
    */

    // loop over stellar populations?
    var number_of_galaxies = galaxy_simulation.num_galaxies();

    for (var key in galaxy_simulation.galaxies) {
        if (galaxy_simulation.galaxies.hasOwnProperty(key)) {
            // Get galaxy object
            var galaxy = galaxy_simulation.galaxies[key]

            for (var key in galaxy.populations) {
                if (galaxy.populations.hasOwnProperty(key)) {
                    var stellar_pop = galaxy.populations[key];

                    var new_positions = new Array(),
                        new_velocities = new Array();

                    for (var kk=0; kk < stellar_pop.positions.length; kk++) {
                        // Get the old positions and velocities
                        var position = stellar_pop.positions[kk];
                        var velocity = stellar_pop.velocities[kk];
                        var num_dimensions = position.length;

                        var ai = new Array();
                        for (var ii=0; ii < num_dimensions; ii++) {
                            ai.push(0.);
                        }

                        // Compute the total acceleration at a point due to all galaxies
                        for (var key in galaxy_simulation.galaxies) {
                            if (galaxy_simulation.galaxies.hasOwnProperty(key)) {
                                ai = ai.vectorAdd(galaxy_simulation.galaxies[key].acceleration_at(position));
                            }
                        }

                        // Compute the new positions
                        var new_position = new Array();
                        for (var ii=0; ii < num_dimensions; ii++) {
                            new_position.push(position[ii] + velocity[ii]*dt + 0.5*ai[ii]*dt*dt);
                        }

                        var new_ai = new Array();
                        for (var ii=0; ii < num_dimensions; ii++) {
                            new_ai.push(0.);
                        }

                        // Compute the total acceleration at a point due to all galaxies
                        for (var key in galaxy_simulation.galaxies) {
                            if (galaxy_simulation.galaxies.hasOwnProperty(key)) {
                                new_ai = new_ai.vectorAdd(galaxy_simulation.galaxies[key].acceleration_at(new_position));
                            }
                        }

                        // Compute the new velocities
                        var new_velocity = new Array();
                        for (var ii=0; ii < num_dimensions; ii++) {
                            // APW: check this! do I need to consider the galaxy velocity here?
                            new_velocity.push(velocity[ii] + 0.5*(ai[ii] + new_ai[ii])*dt);
                        }

                        new_positions.push(new_position);
                        new_velocities.push(new_velocity);
                    }
                    stellar_pop.positions = new_positions;
                    stellar_pop.velocities = new_velocities;
                }
            }
        }
    }
}

function distance(pos1, pos2) {
    if (pos1.length != pos2.length) {
        throw new Error("distance(): Position vectors have different length!");
    }

    var dist = 0.;
    for (var ii=0; ii < pos1.length; ii++) {
        dist += (pos1[ii]-pos2[ii])*(pos1[ii]-pos2[ii]);
    }
    return Math.sqrt(dist);
}

/*
function merge_galaxies(galaxy, simulation) {
    var galaxies = simulation.galaxies;

    for (var key in galaxies) {
        if (galaxies.hasOwnProperty(key)) {
            if ((galaxy != galaxies[key]) && (distance(galaxy.position, galaxies[key].position) < 10.)) {
                console.log("HERE HERE HERE");
                if (galaxy.mass > galaxies[key].mass) {
                    // merge galaxies[key] into galaxy
                    // TODO: this is a hack, and should be more general!
                    galaxy.populations["merged"] = cloneObject(galaxies[key].populations["disk"]);
                    delete simulation.galaxies[key];
                } else {
                    // merge galaxy into galaxies[key]
                    galaxies[key].populations["merged"] = cloneObject(galaxy.populations["disk"]);
                    galaxy = undefined;
                }
            }
        }
    }
}
*/

/*
    Objects
*/

function GalaxySimulation(canvas) {
    this.canvas = canvas;
    this.galaxies = {};

    this.num_galaxies = function() {
        var num = 0;
        for (var key in this.galaxies) {
            if (this.galaxies.hasOwnProperty(key)) {
                num++;
            }
        }
    }

    this.update = function(dt) {
        if (dt == undefined) {
            dt = 1.
        }
        // Update galaxy potential positions
        update_galaxy_positions(this, dt);

        // Update galaxy star positions
        update_stellar_populations(this, dt);

        /*
        for (var key in this.galaxies) {
            if (this.galaxies.hasOwnProperty(key)) {
                // Check galaxies to see if any are close enough to merge
                merge_galaxies(this.galaxies[key], this);
            }
        }*/
    }

    this.draw = function() {
        for (var key in this.galaxies) {
            if (this.galaxies.hasOwnProperty(key)) {
                this.galaxies[key].draw(this.canvas.getContext('2d'));

                context.beginPath();
                context.fillStyle = "rgba(153, 142, 195,0.75)";
                context.arc(this.galaxies[key].position[0], this.galaxies[key].position[1], 10, 0, Math.PI*2,true);
                context.closePath();
                context.fill();
            }
        }
    }

    this.clear = function() {
        this.galaxies = {};
    }
}

function StellarPopulation(args) {
    this.name = args["name"];
    this.positions = args["positions"] || new Array();
    this.velocities = args["velocities"] || new Array();
    this.color = args["color"] || "#ddd";

    this.draw = function(context) {
        var vel = this.velocities,
            pos = this.positions;

        for (var ii=0; ii < pos.length; ii++) {
            //total_vel = vel[ii][0]*vel[ii][0] + vel[ii][1]*vel[ii][1];
            context.beginPath();
            context.fillStyle = this.color;
            context.arc(pos[ii][0],pos[ii][1], 1, 0, Math.PI*2,true);
            context.closePath();
            context.fill();
        }
    }
}

function Galaxy(position, velocity, mass) {
    /*  This is the constructor for the "base" Galaxy object. The user must either supply an
        'acceleration' function, or subclass this object and create their own. The acceleration
        function should accept a list of positions and compute the accelerations along each dimension.
    */

    if ((position == undefined) || (velocity == undefined)) {
        throw new Error("A galaxy must be created with a position and velocity");
    }

    this.mass = parseFloat(mass) || 1.0;

    // Starting position
    this.position = new Array();
    for (var ii=0; ii < position.length; ii++) {
        this.position.push(parseFloat(position[ii]));
    }

    // Starting velocity
    this.velocity = new Array();
    for (var ii=0; ii < velocity.length; ii++) {
        this.velocity.push(parseFloat(velocity[ii]));
    }

	// Initialize internal populations object
	this.populations = {};

    this.add_population = function(population) {
        /*  Add a population of stars to this galaxy, e.g.:

            var pop = new StellarPopulation(initial_position, initial_velocity);
            galaxy.add_population(pop);
        */
        this.populations[population.name] = population;
    }

    this.draw = function(context, colors) {
        /* Draw all stellar populations to the given context */

        // First clear the current state
        //context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        // Loop over populations
        for (var key in this.populations) {
            if (this.populations.hasOwnProperty(key)) {
                this.populations[key].draw(context);
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

            var mag_v = 1.4*Math.sqrt(this.mass),
                vx = -mag_v * Math.sin(init_phi) + (Math.random()-0.5)*(dispersion/100.0/1.41),
                vy = mag_v * Math.cos(init_phi) + (Math.random()-0.5)*(dispersion/100.0/1.41);

            init_vel.push([vx + this.velocity[0], vy + this.velocity[1]]);
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

            var mag_v = 1.4*Math.sqrt(this.mass),
                vx = -mag_v * Math.sin(init_phi) + (Math.random()-0.5)*(dispersion/100.0/1.41),
                vy = mag_v * Math.cos(init_phi) + (Math.random()-0.5)*(dispersion/100.0/1.41);
            init_vel.push([vx + this.velocity[0], vy + this.velocity[1]]);
            gg++;
        }

        var population = new StellarPopulation({"name" : "bulge", "positions" : init_pos, "velocities" : init_vel});
        this.add_population(population);
        //this.add_population(init_pos, init_vel, "bulge");

    }
}

function LogarithmicGalaxy(position, velocity, mass) {
    /*  This represents a 2D logarithmic galactic potential. */

    var _galaxy = new Galaxy(position, velocity, mass);
	_galaxy.U = 0.8;
	_galaxy.C = 1.0;

	_galaxy.acceleration_at = function(xy) {
	    //console.log(_galaxy.mass);
        // Set the galaxy position
        var xdotdot = - _galaxy.mass * (2 * _galaxy.U*_galaxy.U * (xy[0]-_galaxy.position[0])) / (_galaxy.U*_galaxy.U*(xy[0]-_galaxy.position[0])*(xy[0]-_galaxy.position[0]) + (xy[1]-_galaxy.position[1])*(xy[1]-_galaxy.position[1]) + _galaxy.C*_galaxy.C*_galaxy.U*_galaxy.U),
            ydotdot = - _galaxy.mass * (2 * (xy[1]-_galaxy.position[1])) / (_galaxy.U*_galaxy.U*(xy[0]-_galaxy.position[0])*(xy[0]-_galaxy.position[0]) + (xy[1]-_galaxy.position[1])*(xy[1]-_galaxy.position[1]) + _galaxy.C*_galaxy.C*_galaxy.U*_galaxy.U);

        return [xdotdot, ydotdot];
    }

    _galaxy.newton_acceleration_at = function(xy) {
	    //console.log(_galaxy.mass);
        // Set the galaxy position
        var x = (xy[0]-_galaxy.position[0]),
            y = (xy[1]-_galaxy.position[1]);
        var r = Math.sqrt(x*x + y*y);

        var xdotdot = - 100. * _galaxy.mass * x / (r*r*r),
            ydotdot = - 100. * _galaxy.mass * y / (r*r*r);

        return [xdotdot, ydotdot];
    }

    return _galaxy;
}