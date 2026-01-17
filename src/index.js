const fpsCounter = new FPSCounter(), CVS = new Canvas(document.getElementById("sim"), null, 60), simulation = new Simulation(CVS, new MapGrid())
      
simulation.addLoopExtra(()=>{ // optimise for event updates
    document.getElementById("fpsDisplay").textContent = fpsCounter.getFps()+" fps"

    const mapPos = simulation.mapGrid.getLocalMapPixel(CVS.mouse.pos)
    if (simulation.isMouseWithinSimulation && mapPos) document.getElementById("mousePos").textContent = mapPos+" | "+simulation.mapPosToIndex(mapPos)

    if (simulation.isMouseWithinSimulation && mapPos) document.getElementById("mouseMaterial").textContent = "("+Simulation.MATERIAL_NAMES[simulation.pixels[simulation.mapPosToIndex(mapPos)]]+")"
    
    const matEl = document.getElementById("selectedMaterial"), selectedMat = simulation.selectedMaterial
    if (matEl.textContent != selectedMat) matEl.textContent = Simulation.MATERIAL_NAMES[selectedMat]

    const mapDims = document.getElementById("mapDim"), displayDims = simulation.mapGrid.displayDimensions
    if (mapDims.textContent != displayDims) mapDims.textContent = displayDims

    const sideP = document.getElementById("sidePriorityText"), sidePriority = Simulation.SIDE_PRIORITY_NAMES[simulation.sidePriority]
    if (sideP.textContent != sidePriority) sideP.textContent = sidePriority

    const isRunningText = document.getElementById("isRunningText"), isRunning = simulation.isRunning
    if (isRunningText.textContent != isRunning) isRunningText.textContent = isRunning?"RUNNING":"STOPPED"
})


// CONTROLS BUTTONS
document.getElementById("startButton").onclick=()=>simulation.isRunning = true
document.getElementById("stopButton").onclick=()=>simulation.isRunning = false

document.getElementById("stepButton").onclick=()=>simulation.step()
document.getElementById("backStepButton").onclick=()=>simulation.backStep()

document.getElementById("clearButton").onclick=()=>simulation.clear()
