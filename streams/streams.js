function StreamSimulation(canvas, pixel_scale) {
    /* pixel_scale = pix/kpc */
    this.canvas = canvas;
    this.galaxies = new Array();
    this.origin = [this.canvas.width / 2., this.canvas.height / 2.];
    this.pixel_scale = pixel_scale;
    
    this.update = function(dt) {
        if (dt == undefined) {
            dt = 1.
        }
        
        // ???
        //update_stellar_populations(this, dt);

    }

    this.draw = function(context) {
        
        // Add a point at the origin
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(this.origin[0], this.origin[1]-5.*this.pixel_scale);
        context.lineTo(this.origin[0], this.origin[1]+5.*this.pixel_scale);
        context.moveTo(this.origin[0]-5.*this.pixel_scale, this.origin[1]);
        context.lineTo(this.origin[0]+5.*this.pixel_scale, this.origin[1]);
        context.strokeStyle = "rgba(67, 162, 202, 0.75)";
        context.stroke();
        
        for (var ii=0; ii < this.galaxies.length; ii++) { 
            this.galaxies[ii].draw(context, this.pixel_scale);
        }
    }

    this.clear = function() {
        this.galaxies = new Array();
    }
}

function GaussianGalaxy(position, velocity, r_scale, v_scale, N, color, alpha) {
    if ((position == undefined) || (velocity == undefined)) {
        throw new Error("A galaxy must be created with a position and velocity");
    }
    
    if (color == undefined) {
        this.color = "#FECC5C";
    }
    
    if (alpha == undefined) {
        this.alpha = 0.5;
    }
    
    this.position = position;
    this.velocity = velocity;
    
    this.stars = new Array();
    
    for (var ii=0; ii < N; ii++) {
        var star_x = gaussian(this.position[0], r_scale),
            star_y = gaussian(this.position[1], r_scale);
        
        var star_vx = gaussian(this.velocity[0], v_scale),
            star_vy = gaussian(this.velocity[1], v_scale);
        
        this.stars.push([star_x, star_y, star_vx, star_vy]);
    }
    
    this.draw = function(context, pixel_scale) {
        /* Draw all stars to the given context */
        
        for (var ii=0; ii < this.stars.length; ii++) {
            var x = this.stars[ii][0]*pixel_scale,
                y = this.stars[ii][1]*pixel_scale;
                
            context.beginPath();
            context.fillStyle = this.color;
            context.arc(x, y, 1, 0, Math.PI*2,true);
            context.closePath();
            context.fill();
        }
    }
}