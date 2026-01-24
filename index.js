const fpsCounter = new FPSCounter(), stepFpsCounter = new FPSCounter(), CVS = new Canvas(document.getElementById("sim"), null, 60), simulation = new Simulation(CVS, new MapGrid())
      
simulation.loopExtra=()=>{ // optimise for event updates instead of loop
    document.getElementById("fpsDisplay").textContent = fpsCounter.getFps()+" fps"

    const mapPos = simulation.mapGrid.getLocalMapPixel(CVS.mouse.pos)
    document.getElementById("mousePos").textContent = (mapPos||"")+" | "+(mapPos?simulation.mapGrid.mapPosToIndex(mapPos):"")+" | "+CVS.mouse.pos

    if (simulation.isMouseWithinSimulation && mapPos) document.getElementById("mouseMaterial").textContent = "("+Simulation.MATERIAL_NAMES[simulation.getPixelAtMapPos(mapPos)]+")"
    
    const matEl = document.getElementById("selectedMaterial"), selectedMat = simulation.selectedMaterial
    if (matEl.textContent != selectedMat) matEl.textContent = Simulation.MATERIAL_NAMES[selectedMat]

    const mapDims = document.getElementById("mapDim"), displayDims = simulation.mapGrid.displayDimensions+" ("+simulation.pixels.length+")"
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


simulation.load("1x30,25,25x0,262,4,1,0,29,4,1,0,29,4,1,0,29,4,1,0,1,4,1,0,27,4,1,0,1,4,1,0,13,4,1,0,1,4,1,0,11,4,1,256,1,4,1,0,13,4,1,256,1,4,1,0,11,4,1,256,1,4,1,0,13,4,1,256,1,4,1,0,11,4,1,256,1,4,1,0,13,4,1,256,1,4,1,0,11,4,1,256,1,4,1,0,13,4,1,256,1,4,13,256,1,4,1,0,13,4,1,256,15,4,1,0,13,4,17,0,155")

simulation.start()

//simulation.PERF_TEST_FULL_WATER_REG()
//simulation.PERF_TEST_FULL_WATER_HIGH()
//simulation.stop()

// GENERAL
document.oncontextmenu=e=>{
    e.preventDefault()
}

// CONTROLS BUTTONS
document.getElementById("startButton").onclick=()=>simulation.start()
document.getElementById("stopButton").onclick=()=>simulation.stop()

document.getElementById("stepButton").onclick=()=>simulation.step()
document.getElementById("backStepButton").onclick=()=>simulation.backStep()

document.getElementById("clearButton").onclick=()=>simulation.clear()

// SAVE/EXPORT + LOAD/IMPORT
const loadValueInput = document.getElementById("loadValueInput"), exportValueInput = document.getElementById("exportValueInput")

document.getElementById("saveButton").onclick=e=>{
    exportValueInput.value = simulation.exportAsText(e.ctrlKey, saveValue=>exportValueInput.value=saveValue)
}
document.getElementById("loadButton").onclick=e=>{
    const v = loadValueInput.value||exportValueInput.value
    if (e.ctrlKey) {
        const size = v.split(Simulation.EXPORT_SEPARATOR)[1].split(",").map(x=>+x)
        simulation.updateMapSize(size[0], size[1])
        simulation.updateMapPixelSize(size[2])
    }
    simulation.load(v)
}

loadValueInput.oncontextmenu=e=>{
    e.preventDefault()
    loadValueInput.value = ""
}

// WIDTH / HEIGHT / PIXEL SIZE
const widthInput = document.getElementById("widthInput"), heightInput = document.getElementById("heightInput"), pixelSizeInput = document.getElementById("pixelSizeInput")
widthInput.value = simulation.mapGrid.mapWidth
widthInput.oninput=e=>{
    const v = +widthInput.value
    if (v <= e.target.max && v >= e.target.min) simulation.updateMapSize(v)
}
widthInput.onwheel=e=>{
    e.preventDefault()
    const inc = e.ctrlKey?10:1, v = widthInput.value = e.deltaY > 0 ? +widthInput.value-inc : +widthInput.value+inc
    if (v <= e.target.max && v >= e.target.min) simulation.updateMapSize(v)
}

heightInput.value = simulation.mapGrid.mapHeight
heightInput.oninput=e=>{
    const v = +heightInput.value
    if (v <= e.target.max && v >= e.target.min) simulation.updateMapSize(null, v)
}
heightInput.onwheel=e=>{
    e.preventDefault()
    const inc = e.ctrlKey?10:1, v = heightInput.value = e.deltaY > 0 ? +heightInput.value-inc : +heightInput.value+inc
    if (v <= e.target.max && v >= e.target.min) simulation.updateMapSize(null, v)
}

pixelSizeInput.value = simulation.mapGrid.pixelSize
pixelSizeInput.oninput=e=>{
    const v = +pixelSizeInput.value
    if (v <= e.target.max && v >= e.target.min) simulation.updateMapPixelSize(v)
}
pixelSizeInput.onwheel=e=>{
    e.preventDefault()
    const inc = e.ctrlKey?10:1, v = pixelSizeInput.value = e.deltaY > 0 ? +pixelSizeInput.value-inc : +pixelSizeInput.value+inc
    if (v <= e.target.max && v >= e.target.min) simulation.updateMapPixelSize(v)
}

// BRUSH TYPES
const brushTypeOptions = document.getElementById("brushTypeOptions")
Object.keys(Simulation.BRUSH_TYPES).forEach((type, i)=>{
    const option = document.createElement("option")
    option.value = 1<<i
    option.textContent = type
    brushTypeOptions.appendChild(option)
})
brushTypeOptions.value = Simulation.DEFAULT_BRUSH_TYPE

brushTypeOptions.onwheel=e=>{
    const currentIndex = brushTypeOptions.selectedIndex
    if (e.deltaY <= 0 && currentIndex > 0) brushTypeOptions.selectedIndex = currentIndex-1
    else if (e.deltaY > 0 && currentIndex < brushTypeOptions.options.length-1) brushTypeOptions.selectedIndex = currentIndex+1
    simulation.brushType = +brushTypeOptions.value
}

brushTypeOptions.onchange=()=>{
    simulation.brushType = +brushTypeOptions.value
}


// MATERIAL TYPES
const materialOptions = document.getElementById("materialOptions")
Simulation.MATERIAL_NAMES.forEach((type, i)=>{
    const option = document.createElement("option")
    option.value = i
    option.textContent = type
    materialOptions.appendChild(option)
})
materialOptions.value = Simulation.DEFAULT_MATERIAL

materialOptions.onwheel=e=>{
    const currentIndex = materialOptions.selectedIndex
    if (e.deltaY <= 0 && currentIndex > 0) materialOptions.selectedIndex = materialOptions-1
    else if (e.deltaY > 0 && currentIndex < materialOptions.options.length-1) materialOptions.selectedIndex = currentIndex+1
    simulation.selectedMaterial = +materialOptions.value
}

materialOptions.onchange=()=>{
    simulation.selectedMaterial = +materialOptions.value
}