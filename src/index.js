const fpsCounter = new FPSCounter(), CVS = new Canvas(document.getElementById("sim"), null, 60),
      simulation = new Simulation(CVS, new MapGrid())
      
simulation.addLoopExtra(()=>{
    document.getElementById("fpsDisplay").textContent = fpsCounter.getFps()+" fps"

    const mapPos = simulation.mapGrid.getLocalMapPixel(CVS.mouse.pos)
    if (simulation.isMouseWithinSimulation && mapPos) document.getElementById("mousePos").textContent = mapPos+" | "+simulation.mapPosToIndex(mapPos)
    
    const matEl = document.getElementById("selectedMaterial"), selectedMat = simulation.selectedMaterial
    if (matEl.textContent != selectedMat) matEl.textContent = Simulation.MATERIAL_NAMES[selectedMat]

    const mapDims = document.getElementById("mapDim"), displayDims = simulation.mapGrid.displayDimensions
    if (mapDims.textContent != displayDims) mapDims.textContent = displayDims

    if (simulation.isMouseWithinSimulation && mapPos) document.getElementById("mouseMaterial").textContent = "("+Simulation.MATERIAL_NAMES[simulation.pixels[simulation.mapPosToIndex(mapPos)]]+")"

})
