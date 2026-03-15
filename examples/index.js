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
        //autoSimulationSizing: 15,
        showBorder: true,
        showGrid: true,
        visualEffectsEnabled: true,
    }
)



// READY FUNCTION
function readyCB(simulation) {
    console.log("%cSIMULATION LOADED", "font-size:9.5px;color:#9c9c9c;")

    if (!(simulation instanceof Simulation)) return

    simulation.updateSelectedMaterial(Simulation.MATERIALS.VAPOR)
    //simulation.updateSidePriority(Simulation.SIDE_PRIORITIES.LEFT)
    //simulation.updateSidePriority(1)
    //simulation.showSkips = true
    //simulation.showGrid = false
    //simulation.timerEnabled = true

    
    //simulation.updateMapSize(23, 15)
    //simulation.updateMapPixelSize(40)
    //simulation.updateBrushType(Simulation.BRUSH_TYPES.BIG_DOT)

    //simulation.updateMapSize(300, 200)
    //simulation.updateMapPixelSize(3)
    
    //simulation.updateMapSize(231, 149)
    //simulation.updateMapPixelSize(4)
    //simulation.updateBrushType(Simulation.BRUSH_TYPES.X15)

    //simulation.updateMapPixelSize(1)
    //simulation.updateMapSize(975, 600)
    //simulation.updateBrushType(Simulation.BRUSH_TYPES.X99)
    //simulation.showGrid = false

    //simulation.updateMapPixelSize(1)
    //simulation.updateMapSize(1920, 818)
    //simulation.showGrid = false

    //simulation.updateMapSize(5, 5)
    //simulation.updateMapPixelSize(100)

    //simulation.updateMaterialSettings(2, {velXOffsetMin:-200,velXOffsetMax:200,velYOffsetMin:-200,velYOffsetMax:200,})
}



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
      timeStampStatus = document.getElementById("timeStampStatus"),
      zoomStatus = document.getElementById("zoomStatus"),
      particleStatus = document.getElementById("particleStatus")

const MOUSE_POS_KEY = "lastMousePos", storageMousePos = localStorage.getItem(MOUSE_POS_KEY).split(",").map(x=>isFinite(+x)?+x:0)
if (storageMousePos) {
    simulation.mouse._x = storageMousePos[0]
    simulation.mouse._y = storageMousePos[1]
}

const STATUS_REFRESH_RATE = 1000/10
function statusLoopCore() {
    const map = simulation.mapGrid, mousePos = simulation.mouse.pos
    localStorage.setItem(MOUSE_POS_KEY, mousePos)

    // MOUSE MAP POS | MOUSE MAP INDEX | MOUSE ABSOLUTE POS 
    const mapPos = map.getLocalMapPixel(mousePos)
    mousePosStatus.textContent = (mapPos||"")+" | "+(mapPos?map.mapPosToIndex(mapPos):"")+" | "+mousePos

    // MOUSE MATERIAL
    if (simulation.isMouseWithinSimulation && mapPos) {
        const mouseMaterialText = "("+Simulation.MATERIAL_NAMES[simulation.getPixelAtMapPos(mapPos)]+")"
        if (mouseMaterialStatus.textContent !== mouseMaterialText) mouseMaterialStatus.textContent = mouseMaterialText
    }

    // MOUSE PARTICLE INFO
    if (simulation.isMouseWithinSimulation && mapPos) {
        const particleInfo = simulation.getPixelInfo(map.mapPosToIndex(mapPos))

        particleStatus.innerHTML = Array.isArray(particleInfo) ? `
        <span>----------</span>
        <span>Mat: ${particleInfo[0]}</span>
        <span>Index: ${particleInfo[1]}</span>
        <span>Flags: ${particleInfo[2]}</span>
        <span>Pos: [${particleInfo[3].toFixed(2)}, ${particleInfo[4].toFixed(2)}]</span>
        <span>Vel: [${particleInfo[5].toFixed(2)}, ${particleInfo[6].toFixed(2)}]</span>
        <span>Gravity: ${particleInfo[7]}</span>
        <span>----------</span>
        `.trim() : ""
    }
    
    // SELECTED MATERIAL
    const selectedMaterialText = Simulation.MATERIAL_NAMES[simulation.selectedMaterial]
    if (selectedMaterialStatus.textContent !== selectedMaterialText) selectedMaterialStatus.textContent = selectedMaterialText

    // BRUSH TYPE
    const brushTypeText = Simulation.BRUSH_TYPE_NAMES[simulation.brushType]
    if (brushTypeStatus.textContent !== brushTypeText) brushTypeStatus.textContent = brushTypeText

    // MAP DIMENSIONS
    const mapDimensionsText = map.displayDimensions+" | "+map.pixelSize+" | ("+simulation._indexCount[0]+"/"+(map.mapWidth*map.mapHeight)+")"
    if (mapDimensionsStatus.textContent !== mapDimensionsText) mapDimensionsStatus.textContent = mapDimensionsText

    // SIDE PRIORITY
    const sidePriorityText = Simulation.SIDE_PRIORITY_NAMES[simulation.sidePriority]
    if (sidePriorityStatus.textContent !== sidePriorityText) sidePriorityStatus.textContent = sidePriorityText

    // IS RUNNING
    const isRunningText = simulation.isRunning?"RUNNING":"STOPPED"
    if (isRunningStatus.textContent !== isRunningText) isRunningStatus.textContent = isRunningText

    // PHYSICS UNIT TYPE
    const physicsUnitTypeText = simulation.usingWebWorkers ? "WORKER" : "LOCAL"
    if (physicsUnitTypeStatus.textContent !== physicsUnitTypeText) physicsUnitTypeStatus.textContent = physicsUnitTypeText

    // TIMESTAMP
    const timeStampText = simulation.CVS.timeStamp|0
    if (timeStampStatus.textContent !== timeStampText) timeStampStatus.textContent = timeStampText

    // ZOOM LEVEL
    const zoomText = CDEUtils.truncateDecimals(simulation.CVS.zoom, 3)
    if (zoomStatus.textContent != zoomText) zoomStatus.textContent = zoomText

    setTimeout(statusLoopCore, STATUS_REFRESH_RATE)
}statusLoopCore()



document.oncontextmenu=e=>e.preventDefault()

// CONTROLS BUTTONS
document.getElementById("startButton").onclick=()=>simulation.start()
document.getElementById("stopButton").onclick=()=>simulation.stop()
document.getElementById("stepButton").onclick=()=>simulation.step()
document.getElementById("backStepButton").onclick=()=>simulation.backStep()
document.getElementById("clearButton").onclick=()=>simulation.clear()

// SAVE
const exportValueInput = document.getElementById("exportValueInput"), EXPORT_VALUE_KEY = "exportValue"
function handleExportInput(exportValue) {
    exportValueInput.value = exportValue
    localStorage.setItem(EXPORT_VALUE_KEY, exportValue)
}
exportValueInput.value = localStorage.getItem(EXPORT_VALUE_KEY)||""
document.getElementById("saveButton").onclick=e=>simulation.exportAsText(e.ctrlKey ? SETTINGS.EXPORT_STATES.RAW : SETTINGS.EXPORT_STATES.COMPACTED, handleExportInput)

// LOAD
const loadValueInput = document.getElementById("loadValueInput"), LOAD_VALUE_KEY = "loadedValue"
document.getElementById("loadButton").onclick=e=>{
    const loadValue = loadValueInput.value||exportValueInput.value
    simulation.load(loadValue, e.ctrlKey)
    localStorage.setItem(LOAD_VALUE_KEY, loadValue)
}
loadValueInput.value = localStorage.getItem(LOAD_VALUE_KEY)||""
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