const fpsCounter = new FPSCounter(), stepFpsCounter = new FPSCounter(), CVS = new Canvas(document.getElementById("sim"), null, 60),
      simulation = new Simulation(CVS, readyCB, true, 1)
      
simulation.loopExtra=()=>{ // optimize for event updates instead of loop
    document.getElementById("fpsDisplay").textContent = fpsCounter.getFps()+" fps"

    const mapPos = simulation.mapGrid.getLocalMapPixel(CVS.mouse.pos)
    document.getElementById("mousePos").textContent = (mapPos||"")+" | "+(mapPos?simulation.mapGrid.mapPosToIndex(mapPos):"")+" | "+CVS.mouse.pos

    if (simulation.isMouseWithinSimulation && mapPos) document.getElementById("mouseMaterial").textContent = "("+Simulation.MATERIAL_NAMES[simulation.getPixelAtMapPos(mapPos)]+")"
    
    const matEl = document.getElementById("selectedMaterial"), selectedMat = simulation.selectedMaterial
    if (matEl.textContent != selectedMat) matEl.textContent = Simulation.MATERIAL_NAMES[selectedMat]

    const mapDims = document.getElementById("mapDim"), displayDims = simulation.mapGrid.displayDimensions+" ("+simulation.mapGrid.mapWidth*simulation.mapGrid.mapHeight+")"
    if (mapDims.textContent != displayDims) mapDims.textContent = displayDims

    const sideP = document.getElementById("sidePriorityText"), sidePriority = Simulation.SIDE_PRIORITY_NAMES[simulation.sidePriority]
    if (sideP.textContent != sidePriority) sideP.textContent = sidePriority

    const isRunningText = document.getElementById("isRunningText"), isRunning = simulation.isRunning?"RUNNING":"STOPPED"
    if (isRunningText.textContent != isRunning) isRunningText.textContent = isRunning

    const unitTypeText = document.getElementById("unitType"), isWorker = simulation.usesWebWorkers ? "WORKER" : "LOCAL"
    if (unitTypeText.textContent != isWorker) unitTypeText.textContent = isWorker

    document.getElementById("fpsStepDisplay").textContent = " | "+stepFps+" step/s"
    if (stepFps>0) stepFps--
}
let stepFps = 0
simulation.stepExtra=()=>{
    stepFps = stepFpsCounter.getFps()
}

function readyCB(sim) {
    console.log("LOAD")
    //sim.PERF_TEST_FULL_WATER_REG()

    // BUGGY COPPER TESTING
    //sim.updateMapPixelSize(10)
    //sim.updateMapSize(91, 68)
    //sim.load("1x91,68,10x0,78,256,5,0,1,256,4,0,81,256,11,0,62,256,2,0,14,256,14,0,60,256,32,0,59,256,32,0,19,256,1,0,20,256,4,0,15,256,17,0,1,256,14,0,18,256,3,0,17,256,7,0,14,256,3,0,15,256,14,0,18,256,3,0,16,256,9,0,4,4,4,0,4,256,3,0,16,256,14,0,18,256,3,0,16,256,3,0,3,256,3,0,4,4,1,0,2,4,1,0,4,256,3,0,6,256,1,0,9,256,14,0,18,256,3,0,15,256,4,0,3,256,3,0,4,4,1,0,2,4,1,0,3,256,4,0,5,256,3,0,8,256,14,0,19,256,3,0,3,256,1,0,10,256,3,0,4,256,3,0,4,4,1,0,2,256,9,0,3,256,5,0,7,256,14,0,19,256,3,0,2,256,3,0,9,256,3,0,3,256,4,0,4,4,1,256,20,0,5,256,15,0,15,256,1,0,3,256,4,0,1,256,3,0,9,256,3,0,2,256,4,0,5,256,21,0,5,256,15,0,14,256,3,0,3,256,3,0,1,256,3,0,9,256,3,0,2,256,3,0,5,256,22,0,5,256,15,0,12,256,5,0,3,256,7,0,9,256,3,0,1,256,3,0,6,256,21,0,6,256,15,0,11,256,6,0,4,256,5,0,10,256,6,0,6,256,22,0,5,256,16,0,10,256,7,0,5,256,4,0,10,256,6,0,6,256,21,0,6,256,16,0,9,256,3,0,2,256,4,0,4,256,7,0,6,256,6,0,6,256,19,0,9,256,16,0,8,256,3,0,4,256,25,0,6,256,3,0,1,256,16,0,9,256,16,0,7,256,4,0,5,256,8,0,1,256,15,0,5,256,3,0,2,256,15,0,10,256,16,0,6,256,4,0,7,256,5,0,7,256,6,0,3,256,10,0,3,256,17,0,7,256,16,0,6,256,3,0,30,256,8,0,5,256,39,0,5,256,3,0,5,256,17,0,10,256,5,0,8,256,10,0,1,256,27,0,4,256,3,0,3,256,21,0,25,256,5,0,7,256,23,0,3,256,4,0,2,256,23,0,25,256,3,0,6,256,25,0,2,256,4,0,2,256,6,0,15,256,3,0,33,256,26,0,2,256,3,0,3,256,3,0,5,256,8,0,5,256,3,0,33,256,26,0,2,256,3,0,2,256,4,0,4,256,10,0,4,256,3,0,34,256,25,0,2,256,3,0,2,256,3,0,2,256,13,0,4,256,3,0,42,256,17,0,1,256,3,0,2,256,4,0,1,256,6,0,4,256,4,0,4,256,3,0,43,256,16,0,1,256,3,0,2,256,3,0,1,256,7,0,1,256,6,0,5,256,3,0,47,256,12,0,1,256,3,0,2,256,3,0,2,256,1,0,3,256,8,0,5,256,4,0,33,256,3,0,16,256,7,0,1,256,3,0,2,256,3,0,4,256,8,0,6,256,4,0,34,256,1,0,1,256,11,0,6,256,7,0,1,256,3,0,2,256,3,0,3,256,7,0,7,256,4,0,34,256,2,0,18,256,7,0,1,256,3,0,2,256,9,0,8,256,6,0,35,256,1,0,19,256,7,0,1,256,3,0,3,256,7,0,6,256,8,0,36,256,1,0,20,256,6,0,1,256,3,0,4,256,5,0,4,256,9,0,38,256,1,0,21,256,4,0,3,256,3,0,10,256,9,0,40,256,1,0,23,256,1,0,4,256,19,0,43,256,1,0,29,256,15,0,19,256,7,0,20,256,1,0,30,256,11,0,11,256,31,0,7,256,1,0,42,256,60,0,22,256,21,0,2,256,1,0,5,256,1,0,5,256,1,0,4,256,1,0,9,256,2,0,15,256,1,0,22,256,3,0,1,256,7,0,7,256,1,0,5,256,1,0,5,256,1,0,5,256,1,0,4,256,1,0,10,256,1,0,15,256,1,0,3,256,13,0,10,256,1,0,1,256,2,0,10,256,1,0,5,256,1,0,5,256,1,0,5,256,1,0,4,256,1,0,10,256,1,0,14,256,2,0,3,256,1,0,22,256,1,0,13,256,1,0,5,256,1,0,5,256,1,0,5,256,1,0,4,256,1,0,10,256,1,0,14,256,1,0,4,256,1,0,22,256,1,0,5,256,32,0,10,256,1,0,14,256,1,0,4,256,1,0,22,256,1,0,4,256,1,0,7,256,1,0,6,256,1,0,6,256,1,0,4,256,1,0,15,256,1,0,14,256,14,0,14,256,1,0,4,256,1,0,7,256,1,0,5,256,2,0,6,256,1,0,4,256,1,0,15,256,1,0,19,256,1,0,7,256,1,0,14,256,1,0,4,256,1,0,7,256,1,0,5,256,1,0,7,256,1,0,4,256,1,0,15,256,1,0,1,256,5,0,2,256,24,0,10,256,1,0,4,256,1,0,7,256,2,0,4,256,1,0,7,256,1,0,4,256,1,0,11,256,7,0,3,256,4,0,10,256,2,0,5,256,1,0,15,256,1,0,4,256,10,0,4,256,9,0,4,256,1,0,5,256,7,0,3,256,1,0,20,256,1,0,5,256,1,0,15,256,1,0,13,256,6,0,11,256,8,0,9,256,1,0,20,256,1,0,5,256,1,0,15,256,1,0,13,256,1,0,3,256,1,0,10,256,4,0,15,256,1,0,20,256,1,0,5,256,1,0,15,256,1,0,13,256,1,0,3,256,1,0,10,256,1,0,2,256,1,0,15,256,1,0,21,256,6,0,15,256,1,0,13,256,1,0,2,256,2,0,9,256,2,0,2,256,1,0,16,256,1,0,41,256,15,0,2,256,1,0,9,256,2,0,3,256,18,0,58,256,1,0,9,256,1,0,80,256,1,0,5,256,5,0,80,256,6,0,3,256,2,0,781")

}

// TODO ADD CUSTON onBrushUpdate onMaterialUpdate listener



// CONTROLS BUTTONS
document.getElementById("startButton").onclick=()=>simulation.start()
document.getElementById("stopButton").onclick=()=>simulation.stop()

document.getElementById("stepButton").onclick=()=>simulation.step()
document.getElementById("backStepButton").onclick=()=>simulation.backStep()

document.getElementById("clearButton").onclick=()=>simulation.clear()

// SAVE/EXPORT + LOAD/IMPORT
const loadValueInput = document.getElementById("loadValueInput"), exportValueInput = document.getElementById("exportValueInput")

document.getElementById("saveButton").onclick=e=>exportValueInput.value = simulation.exportAsText(e.ctrlKey, saveValue=>exportValueInput.value=saveValue)

document.getElementById("loadButton").onclick=e=>simulation.load((loadValueInput.value||exportValueInput.value), e.ctrlKey)

loadValueInput.oncontextmenu=e=>{
    e.preventDefault()
    loadValueInput.value = ""
}

// WIDTH / HEIGHT / PIXEL SIZE
const widthInput = document.getElementById("widthInput"), heightInput = document.getElementById("heightInput"), pixelSizeInput = document.getElementById("pixelSizeInput")

widthInput.value = simulation.mapGrid.mapWidth
setRegularNumberInput(widthInput, v=>simulation.updateMapSize(v))
addWheelIncrement(widthInput, [1,10,50], v=>simulation.updateMapSize(v))


heightInput.value = simulation.mapGrid.mapHeight
setRegularNumberInput(heightInput, v=>simulation.updateMapSize(null, v))
addWheelIncrement(heightInput, [1,10,50], v=>simulation.updateMapSize(null, v))

pixelSizeInput.value = simulation.mapGrid.pixelSize
setRegularNumberInput(pixelSizeInput, v=>simulation.updateMapPixelSize(v))
addWheelIncrement(pixelSizeInput, [1,5,10], v=>simulation.updateMapPixelSize(v))

// BRUSH TYPES
const brushTypeOptions = document.getElementById("brushTypeOptions")
brushTypeOptions.value = Simulation.DEFAULT_BRUSH_TYPE

fillSelectOptions(brushTypeOptions, Object.keys(Simulation.BRUSH_TYPES), i=>1<<i)
addWheelIncrement(brushTypeOptions, null, v=>simulation.brushType = +v)

brushTypeOptions.onchange=()=>simulation.brushType = +brushTypeOptions.value


// MATERIAL TYPES
const materialOptions = document.getElementById("materialOptions")
materialOptions.value = Simulation.DEFAULT_MATERIAL

fillSelectOptions(materialOptions, Object.keys(Simulation.MATERIALS), i=>i?1<<(i-1):0)
addWheelIncrement(materialOptions, null, v=>simulation.selectedMaterial = +v)

materialOptions.onchange=()=>simulation.selectedMaterial = +materialOptions.value