if (window.lcbPS) {
    window.Simulation = window.lcbPS.Simulation
    window.FPSCounter = window.lcbPS.FPSCounter
    window.CDEUtils = window.lcbPS.CDEUtils
}

// Creating the powder simulation
const simulation = new Simulation(
    document.getElementById("simulationCanvas"),
    readyCB,
    {
        usesWebWorkers: false,
        autoStart: true,
        aimedFPS: 60,
        //cameraCenterPos: null,
        //zoom: 4
    },
    {
        autoSimulationSizing: false,//15
        showBorder: true,
        showGrid: true,
        visualEffectsEnabled: true,
        mapWidth: 1
    }
)

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
      timeStampStatus = document.getElementById("timeStampStatus")
      zoomStatus = document.getElementById("zoomStatus")

let STATUS_REFRESH_RATE = 1000/10
function statusLoopCore() {
    // MOUSE MAP POS | MOUSE MAP INDEX | MOUSE ABSOLUTE POS 
    const mapPos = simulation.mapGrid.getLocalMapPixel(simulation.CVS.mouse.pos)
    mousePosStatus.textContent = (mapPos||"")+" | "+(mapPos?simulation.mapGrid.mapPosToIndex(mapPos):"")+" | "+simulation.CVS.mouse.pos

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
    const mapDimensionsText = simulation.mapGrid.displayDimensions+" | "+simulation.mapGrid.pixelSize+" | ("+simulation.mapGrid.mapWidth*simulation.mapGrid.mapHeight+")"
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

    const timeStampText = simulation.CVS.timeStamp
    if (timeStampStatus.textContent !== timeStampText) timeStampStatus.textContent = timeStampText

    // ZOOM LEVEL
    const zoomText = CDEUtils.truncateDecimals(simulation.CVS.zoom, 3)
    if (zoomStatus.textContent != zoomText) zoomStatus.textContent = zoomText

    setTimeout(statusLoopCore, STATUS_REFRESH_RATE)
}statusLoopCore()



// READY FUNCTION
function readyCB(simulation) {
    console.log("%cSIMULATION LOADED", "font-size:9.5px;color:#9c9c9c;")

    simulation.updateSelectedMaterial(Simulation.MATERIALS.WATER)

    //simulation.placePixelAtCoords(22, 13)

    //simulation.updateMapSize(300, 200)
    //simulation.updateMapPixelSize(3)
    //simulation.updateBrushType(Simulation.BRUSH_TYPES.X15)
    
    //simulation.updateMapSize(231, 149)
    //simulation.updateMapPixelSize(4)
    //simulation.updateBrushType(Simulation.BRUSH_TYPES.X15)

    //simulation.updateMapPixelSize(1)
    //simulation.updateMapSize(1000, 1000)
    //simulation.updateBrushType(Simulation.BRUSH_TYPES.X99)
    //simulation.timerEnabled = true
}

document.oncontextmenu=e=>e.preventDefault()

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
fillSelectOptions(materialOptions, Object.keys(Simulation.MATERIALS), i=>1<<i)
addWheelIncrement(materialOptions, null, v=>simulation.updateSelectedMaterial(v))
materialOptions.value = Simulation.DEFAULT_MATERIAL

// BRUSH TYPES
const brushTypeOptions = document.getElementById("brushTypeOptions")
brushTypeOptions.onchange=()=>simulation.updateBrushType(brushTypeOptions.value)
fillSelectOptions(brushTypeOptions, Object.keys(Simulation.BRUSH_TYPES), i=>1<<i)
addWheelIncrement(brushTypeOptions, null, v=>simulation.updateBrushType(v))
brushTypeOptions.value = Simulation.DEFAULT_BRUSH_TYPE