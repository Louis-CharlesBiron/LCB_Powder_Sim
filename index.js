// CVS + SIMULATION CREATION
const MAX_FPS = 60,
      CVS = new Canvas(document.getElementById("simulationCanvas"), null, MAX_FPS),
      simulation = new Simulation(CVS, readyCB, true, 1)
      
// FPS / SPS DISPLAY
const fpsDisplay = document.getElementById("fpsDisplay"), fpsStepDisplay = document.getElementById("fpsStepDisplay"),
      fpsCounter = new FPSCounter(), stepFpsCounter = new FPSCounter()

let stepFps = 0
simulation.stepExtra=()=>stepFps = stepFpsCounter.getFps()
simulation.loopExtra=()=>{
    const fpsValue = fpsCounter.getFps()+" fps"
    if (fpsDisplay.textContent !== fpsValue) fpsDisplay.textContent = fpsValue

    const fpsStepValue = fpsStepDisplay.textContent = " | "+stepFps+" step/s"
    if (fpsStepDisplay.textContent !== fpsStepValue) fpsStepDisplay.textContent = fpsStepValue
    if (stepFps>0) stepFps--
}

// STATUS DISPLAY
const mousePosStatus = document.getElementById("mousePosStatus"),
      mouseMaterialStatus = document.getElementById("mouseMaterialStatus"),
      selectedMaterialStatus = document.getElementById("selectedMaterialStatus"),
      brushTypeStatus = document.getElementById("brushTypeStatus"),
      mapDimensionsStatus = document.getElementById("mapDimensionsStatus"),
      sidePriorityStatus = document.getElementById("sidePriorityStatus"),
      isRunningStatus = document.getElementById("isRunningStatus"),
      physicsUnitTypeStatus = document.getElementById("physicsUnitTypeStatus"),
      zoomStatus = document.getElementById("zoomStatus")

let STATUS_REFRESH_RATE = 1000/10
function statusLoopCore() {
    // MOUSE MAP POS | MOUSE MAP INDEX | MOUSE ABSOLUTE POS 
    const mapPos = simulation.mapGrid.getLocalMapPixel(CVS.mouse.pos)
    mousePosStatus.textContent = (mapPos||"")+" | "+(mapPos?simulation.mapGrid.mapPosToIndex(mapPos):"")+" | "+CVS.mouse.pos

    // MOUSE MATERIAL
    if (simulation.isMouseWithinSimulation && mapPos) {
        const mouseMaterialText = "("+Simulation.MATERIAL_NAMES[simulation.getPixelAtMapPos(mapPos)]+")"
        if (mouseMaterialStatus.textContent !== mouseMaterialText) mouseMaterialStatus.textContent = mouseMaterialText
    }
    
    // SELECTED MATERIAL
    const selectedMaterialText = Simulation.MATERIAL_NAMES[simulation.selectedMaterial]
    if (selectedMaterialStatus.textContent !== selectedMaterialText) selectedMaterialStatus.textContent = selectedMaterialText

    // BRUSH TYPE
    const brushTypeText = Simulation.BRUSH_TYPE_NAMES[simulation.brushType]
    if (brushTypeStatus.textContent !== brushTypeText) brushTypeStatus.textContent = brushTypeText

    // MAP DIMENSIONS
    const mapDimensionsText = simulation.mapGrid.displayDimensions+" | "+simulation.mapGrid.pixelSize+"p ("+simulation.mapGrid.mapWidth*simulation.mapGrid.mapHeight+")"
    if (mapDimensionsStatus.textContent !== mapDimensionsText) mapDimensionsStatus.textContent = mapDimensionsText

    // SIDE PRIORITY
    const sidePriorityText = Simulation.SIDE_PRIORITY_NAMES[simulation.sidePriority]
    if (sidePriorityStatus.textContent !== sidePriorityText) sidePriorityStatus.textContent = sidePriorityText

    // IS RUNNING
    const isRunningText = simulation.isRunning?"RUNNING":"STOPPED"
    if (isRunningStatus.textContent !== isRunningText) isRunningStatus.textContent = isRunningText

    // PHYSICS UNIT TYPE
    const physicsUnitTypeText = simulation.usesWebWorkers ? "WORKER" : "LOCAL"
    if (physicsUnitTypeStatus.textContent !== physicsUnitTypeText) physicsUnitTypeStatus.textContent = physicsUnitTypeText

    const zoomText = CDEUtils.truncateDecimals(simulation.CVS.zoom, 3)
    if (zoomStatus.textContent !== zoomText) zoomStatus.textContent = zoomText

    setTimeout(statusLoopCore, STATUS_REFRESH_RATE)
}statusLoopCore()



// READY FUNCTION
function readyCB(sim) {
    console.log("%cSIMULATION LOADED", "font-size:9.5px;color:#9c9c9c;")

    /* BUGGY COPPER TESTING
    sim.load(
        "1x91,68,10x0,78,256,5,0,1,256,4,0,81,256,11,0,62,256,2,0,14,256,14,0,60,256,32,0,59,256,32,0,19,256,1,0,20,256,4,0,15,256,17,0,1,256,14,0,18,256,3,0,17,256,7,0,14,256,3,0,15,256,14,0,18,256,3,0,16,256,9,0,4,4,4,0,4,256,3,0,16,256,14,0,18,256,3,0,16,256,3,0,3,256,3,0,4,4,1,0,2,4,1,0,4,256,3,0,6,256,1,0,9,256,14,0,18,256,3,0,15,256,4,0,3,256,3,0,4,4,1,0,2,4,1,0,3,256,4,0,5,256,3,0,8,256,14,0,19,256,3,0,3,256,1,0,10,256,3,0,4,256,3,0,4,4,1,0,2,256,9,0,3,256,5,0,7,256,14,0,19,256,3,0,2,256,3,0,9,256,3,0,3,256,4,0,4,4,1,256,20,0,5,256,15,0,15,256,1,0,3,256,4,0,1,256,3,0,9,256,3,0,2,256,4,0,5,256,21,0,5,256,15,0,14,256,3,0,3,256,3,0,1,256,3,0,9,256,3,0,2,256,3,0,5,256,22,0,5,256,15,0,12,256,5,0,3,256,7,0,9,256,3,0,1,256,3,0,6,256,21,0,6,256,15,0,11,256,6,0,4,256,5,0,10,256,6,0,6,256,22,0,5,256,16,0,10,256,7,0,5,256,4,0,10,256,6,0,6,256,21,0,6,256,16,0,9,256,3,0,2,256,4,0,4,256,7,0,6,256,6,0,6,256,19,0,9,256,16,0,8,256,3,0,4,256,25,0,6,256,3,0,1,256,16,0,9,256,16,0,7,256,4,0,5,256,8,0,1,256,15,0,5,256,3,0,2,256,15,0,10,256,16,0,6,256,4,0,7,256,5,0,7,256,6,0,3,256,10,0,3,256,17,0,7,256,16,0,6,256,3,0,30,256,8,0,5,256,39,0,5,256,3,0,5,256,17,0,10,256,5,0,8,256,10,0,1,256,27,0,4,256,3,0,3,256,21,0,25,256,5,0,7,256,23,0,3,256,4,0,2,256,23,0,25,256,3,0,6,256,25,0,2,256,4,0,2,256,6,0,15,256,3,0,33,256,26,0,2,256,3,0,3,256,3,0,5,256,8,0,5,256,3,0,33,256,26,0,2,256,3,0,2,256,4,0,4,256,10,0,4,256,3,0,34,256,25,0,2,256,3,0,2,256,3,0,2,256,13,0,4,256,3,0,42,256,17,0,1,256,3,0,2,256,4,0,1,256,6,0,4,256,4,0,4,256,3,0,43,256,16,0,1,256,3,0,2,256,3,0,1,256,7,0,1,256,6,0,5,256,3,0,47,256,12,0,1,256,3,0,2,256,3,0,2,256,1,0,3,256,8,0,5,256,4,0,33,256,3,0,16,256,7,0,1,256,3,0,2,256,3,0,4,256,8,0,6,256,4,0,34,256,1,0,1,256,11,0,6,256,7,0,1,256,3,0,2,256,3,0,3,256,7,0,7,256,4,0,34,256,2,0,18,256,7,0,1,256,3,0,2,256,9,0,8,256,6,0,35,256,1,0,19,256,7,0,1,256,3,0,3,256,7,0,6,256,8,0,36,256,1,0,20,256,6,0,1,256,3,0,4,256,5,0,4,256,9,0,38,256,1,0,21,256,4,0,3,256,3,0,10,256,9,0,40,256,1,0,23,256,1,0,4,256,19,0,43,256,1,0,29,256,15,0,19,256,7,0,20,256,1,0,30,256,11,0,11,256,31,0,7,256,1,0,42,256,60,0,22,256,21,0,2,256,1,0,5,256,1,0,5,256,1,0,4,256,1,0,9,256,2,0,15,256,1,0,22,256,3,0,1,256,7,0,7,256,1,0,5,256,1,0,5,256,1,0,5,256,1,0,4,256,1,0,10,256,1,0,15,256,1,0,3,256,13,0,10,256,1,0,1,256,2,0,10,256,1,0,5,256,1,0,5,256,1,0,5,256,1,0,4,256,1,0,10,256,1,0,14,256,2,0,3,256,1,0,22,256,1,0,13,256,1,0,5,256,1,0,5,256,1,0,5,256,1,0,4,256,1,0,10,256,1,0,14,256,1,0,4,256,1,0,22,256,1,0,5,256,32,0,10,256,1,0,14,256,1,0,4,256,1,0,22,256,1,0,4,256,1,0,7,256,1,0,6,256,1,0,6,256,1,0,4,256,1,0,15,256,1,0,14,256,14,0,14,256,1,0,4,256,1,0,7,256,1,0,5,256,2,0,6,256,1,0,4,256,1,0,15,256,1,0,19,256,1,0,7,256,1,0,14,256,1,0,4,256,1,0,7,256,1,0,5,256,1,0,7,256,1,0,4,256,1,0,15,256,1,0,1,256,5,0,2,256,24,0,10,256,1,0,4,256,1,0,7,256,2,0,4,256,1,0,7,256,1,0,4,256,1,0,11,256,7,0,3,256,4,0,10,256,2,0,5,256,1,0,15,256,1,0,4,256,10,0,4,256,9,0,4,256,1,0,5,256,7,0,3,256,1,0,20,256,1,0,5,256,1,0,15,256,1,0,13,256,6,0,11,256,8,0,9,256,1,0,20,256,1,0,5,256,1,0,15,256,1,0,13,256,1,0,3,256,1,0,10,256,4,0,15,256,1,0,20,256,1,0,5,256,1,0,15,256,1,0,13,256,1,0,3,256,1,0,10,256,1,0,2,256,1,0,15,256,1,0,21,256,6,0,15,256,1,0,13,256,1,0,2,256,2,0,9,256,2,0,2,256,1,0,16,256,1,0,41,256,15,0,2,256,1,0,9,256,2,0,3,256,18,0,58,256,1,0,9,256,1,0,80,256,1,0,5,256,5,0,80,256,6,0,3,256,2,0,781"
        true
    )*/
}

// CONTROLS BUTTONS
document.getElementById("startButton").onclick=()=>simulation.start()
document.getElementById("stopButton").onclick=()=>simulation.stop()
document.getElementById("stepButton").onclick=()=>simulation.step()
document.getElementById("backStepButton").onclick=()=>simulation.backStep()
document.getElementById("clearButton").onclick=()=>simulation.clear()

// SAVE
const exportValueInput = document.getElementById("exportValueInput")
document.getElementById("saveButton").onclick=e=>exportValueInput.value = simulation.exportAsText(e.ctrlKey, saveValue=>exportValueInput.value=saveValue)

// LOAD
const loadValueInput = document.getElementById("loadValueInput")
document.getElementById("loadButton").onclick=e=>simulation.load((loadValueInput.value||exportValueInput.value), e.ctrlKey)
loadValueInput.oncontextmenu=e=>{
    e.preventDefault()
    loadValueInput.value = ""
}

// WIDTH INPUT
const widthInput = document.getElementById("widthInput")
widthInput.value = simulation.mapGrid.mapWidth
setRegularNumberInput(widthInput, v=>simulation.updateMapSize(v))
addWheelIncrement(widthInput, [1,10,50], v=>simulation.updateMapSize(v))

// HEIGHT INPUT
const heightInput = document.getElementById("heightInput")
heightInput.value = simulation.mapGrid.mapHeight
setRegularNumberInput(heightInput, v=>simulation.updateMapSize(null, v))
addWheelIncrement(heightInput, [1,10,50], v=>simulation.updateMapSize(null, v))

// PIXEL SIZE INPUT
const pixelSizeInput = document.getElementById("pixelSizeInput")
pixelSizeInput.value = simulation.mapGrid.pixelSize
setRegularNumberInput(pixelSizeInput, v=>simulation.updateMapPixelSize(v))
addWheelIncrement(pixelSizeInput, [1,5,10], v=>simulation.updateMapPixelSize(v))

// MATERIAL TYPES
const materialOptions = document.getElementById("materialOptions")
materialOptions.onchange=()=>simulation.updateSelectedMaterial(materialOptions.value)
fillSelectOptions(materialOptions, Object.keys(Simulation.MATERIALS), i=>i?1<<(i-1):0)
addWheelIncrement(materialOptions, null, v=>simulation.updateSelectedMaterial(v))
materialOptions.value = Simulation.DEFAULT_MATERIAL

// BRUSH TYPES
const brushTypeOptions = document.getElementById("brushTypeOptions")
brushTypeOptions.onchange=()=>simulation.updateBrushType(brushTypeOptions.value)
fillSelectOptions(brushTypeOptions, Object.keys(Simulation.BRUSH_TYPES), i=>1<<i)
addWheelIncrement(brushTypeOptions, null, v=>simulation.updateBrushType(v))
brushTypeOptions.value = Simulation.DEFAULT_BRUSH_TYPE