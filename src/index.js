const fpsCounter = new FPSCounter(), CVS = new Canvas(document.getElementById("sim"), null, 60),
      simulation = new Simulation(CVS, new MapGrid())
      
simulation.addLoopExtra(()=>{
    document.getElementById("fpsDisplay").textContent = fpsCounter.getFps()+" fps"

    const mapPos = simulation.mapGrid.getLocalMapPixel(CVS.mouse.pos)
    if (simulation.isMouseWithinSimulation && mapPos) {
        document.getElementById("mousePos").textContent = mapPos+" | "+simulation.mapPosToIndex(mapPos)
    }
})
