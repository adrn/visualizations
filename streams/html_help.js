function toggle_menu() {
    /* Toggle the side bar menu visible/invisible */
    
    if ($(".control_panel").css("display") != "none") {
        $(".control_panel").css("display", "none");
        $("#hide_show_button").val($("<div>").html("&#x25BC;").text());
    } else {
        $(".control_panel").css("display", "block");
        $("#hide_show_button").val($("<div>").html("&#x25B2;").text());
    }
}

function toggle_trails() {
    /* Toggle whether to erase points or keep them and draw
        trails over the history of particle positions.
    */
    if ($('#trails').is(':checked')) {
        draw_trails = true;
    } else {
        draw_trails = false;
    }
}

function wipe_context(context) {
    /* Clear a canvas context. */
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}

function restart() {
    /* Restart the simulation. Clear all galaxies, wipe the canvas. */
    wipe_context(context);
    simulation.galaxies = new Array();
    start();
}

function start() {
    /* Start the simulation. */
    stop();
    interval = setInterval(draw_update, 10);
}

function stop() {
    /* Stop the simulation. */
    window.clearInterval(interval);
}

function draw_update(dt) {
    /* Draw the current positions of the stars, then update the positions
        by the specified dt. 
    */
    if (draw_trails != true) {
        wipe_context(context);
    }
    simulation.draw(context);
    simulation.update(dt);
}