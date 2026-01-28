const fpsCounter = new FPSCounter(), stepFpsCounter = new FPSCounter(), CVS = new Canvas(document.getElementById("sim"), null, 60), simulation = new Simulation(CVS, 1)
      
simulation.loopExtra=()=>{ // optimise for event updates instead of loop
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


//simulation.load("1x30,25,25x0,262,4,1,0,29,4,1,0,29,4,1,0,29,4,1,0,1,4,1,0,27,4,1,0,1,4,1,0,13,4,1,0,1,4,1,0,11,4,1,256,1,4,1,0,13,4,1,256,1,4,1,0,11,4,1,256,1,4,1,0,13,4,1,256,1,4,1,0,11,4,1,256,1,4,1,0,13,4,1,256,1,4,1,0,11,4,1,256,1,4,1,0,13,4,1,256,1,4,13,256,1,4,1,0,13,4,1,256,15,4,1,0,13,4,17,0,155")

//simulation.updateMapPixelSize(10)
//simulation.updateMapSize(91, 68)
//simulation.load("1x91,68,10x0,78,256,5,0,1,256,4,0,81,256,11,0,62,256,2,0,14,256,14,0,60,256,32,0,59,256,32,0,19,256,1,0,20,256,4,0,15,256,17,0,1,256,14,0,18,256,3,0,17,256,7,0,14,256,3,0,15,256,14,0,18,256,3,0,16,256,9,0,4,4,4,0,4,256,3,0,16,256,14,0,18,256,3,0,16,256,3,0,3,256,3,0,4,4,1,0,2,4,1,0,4,256,3,0,6,256,1,0,9,256,14,0,18,256,3,0,15,256,4,0,3,256,3,0,4,4,1,0,2,4,1,0,3,256,4,0,5,256,3,0,8,256,14,0,19,256,3,0,3,256,1,0,10,256,3,0,4,256,3,0,4,4,1,0,2,256,9,0,3,256,5,0,7,256,14,0,19,256,3,0,2,256,3,0,9,256,3,0,3,256,4,0,4,4,1,256,20,0,5,256,15,0,15,256,1,0,3,256,4,0,1,256,3,0,9,256,3,0,2,256,4,0,5,256,21,0,5,256,15,0,14,256,3,0,3,256,3,0,1,256,3,0,9,256,3,0,2,256,3,0,5,256,22,0,5,256,15,0,12,256,5,0,3,256,7,0,9,256,3,0,1,256,3,0,6,256,21,0,6,256,15,0,11,256,6,0,4,256,5,0,10,256,6,0,6,256,22,0,5,256,16,0,10,256,7,0,5,256,4,0,10,256,6,0,6,256,21,0,6,256,16,0,9,256,3,0,2,256,4,0,4,256,7,0,6,256,6,0,6,256,19,0,9,256,16,0,8,256,3,0,4,256,25,0,6,256,3,0,1,256,16,0,9,256,16,0,7,256,4,0,5,256,8,0,1,256,15,0,5,256,3,0,2,256,15,0,10,256,16,0,6,256,4,0,7,256,5,0,7,256,6,0,3,256,10,0,3,256,17,0,7,256,16,0,6,256,3,0,30,256,8,0,5,256,39,0,5,256,3,0,5,256,17,0,10,256,5,0,8,256,10,0,1,256,27,0,4,256,3,0,3,256,21,0,25,256,5,0,7,256,23,0,3,256,4,0,2,256,23,0,25,256,3,0,6,256,25,0,2,256,4,0,2,256,6,0,15,256,3,0,33,256,26,0,2,256,3,0,3,256,3,0,5,256,8,0,5,256,3,0,33,256,26,0,2,256,3,0,2,256,4,0,4,256,10,0,4,256,3,0,34,256,25,0,2,256,3,0,2,256,3,0,2,256,13,0,4,256,3,0,42,256,17,0,1,256,3,0,2,256,4,0,1,256,6,0,4,256,4,0,4,256,3,0,43,256,16,0,1,256,3,0,2,256,3,0,1,256,7,0,1,256,6,0,5,256,3,0,47,256,12,0,1,256,3,0,2,256,3,0,2,256,1,0,3,256,8,0,5,256,4,0,33,256,3,0,16,256,7,0,1,256,3,0,2,256,3,0,4,256,8,0,6,256,4,0,34,256,1,0,1,256,11,0,6,256,7,0,1,256,3,0,2,256,3,0,3,256,7,0,7,256,4,0,34,256,2,0,18,256,7,0,1,256,3,0,2,256,9,0,8,256,6,0,35,256,1,0,19,256,7,0,1,256,3,0,3,256,7,0,6,256,8,0,36,256,1,0,20,256,6,0,1,256,3,0,4,256,5,0,4,256,9,0,38,256,1,0,21,256,4,0,3,256,3,0,10,256,9,0,40,256,1,0,23,256,1,0,4,256,19,0,43,256,1,0,29,256,15,0,19,256,7,0,20,256,1,0,30,256,11,0,11,256,31,0,7,256,1,0,42,256,60,0,22,256,21,0,2,256,1,0,5,256,1,0,5,256,1,0,4,256,1,0,9,256,2,0,15,256,1,0,22,256,3,0,1,256,7,0,7,256,1,0,5,256,1,0,5,256,1,0,5,256,1,0,4,256,1,0,10,256,1,0,15,256,1,0,3,256,13,0,10,256,1,0,1,256,2,0,10,256,1,0,5,256,1,0,5,256,1,0,5,256,1,0,4,256,1,0,10,256,1,0,14,256,2,0,3,256,1,0,22,256,1,0,13,256,1,0,5,256,1,0,5,256,1,0,5,256,1,0,4,256,1,0,10,256,1,0,14,256,1,0,4,256,1,0,22,256,1,0,5,256,32,0,10,256,1,0,14,256,1,0,4,256,1,0,22,256,1,0,4,256,1,0,7,256,1,0,6,256,1,0,6,256,1,0,4,256,1,0,15,256,1,0,14,256,14,0,14,256,1,0,4,256,1,0,7,256,1,0,5,256,2,0,6,256,1,0,4,256,1,0,15,256,1,0,19,256,1,0,7,256,1,0,14,256,1,0,4,256,1,0,7,256,1,0,5,256,1,0,7,256,1,0,4,256,1,0,15,256,1,0,1,256,5,0,2,256,24,0,10,256,1,0,4,256,1,0,7,256,2,0,4,256,1,0,7,256,1,0,4,256,1,0,11,256,7,0,3,256,4,0,10,256,2,0,5,256,1,0,15,256,1,0,4,256,10,0,4,256,9,0,4,256,1,0,5,256,7,0,3,256,1,0,20,256,1,0,5,256,1,0,15,256,1,0,13,256,6,0,11,256,8,0,9,256,1,0,20,256,1,0,5,256,1,0,15,256,1,0,13,256,1,0,3,256,1,0,10,256,4,0,15,256,1,0,20,256,1,0,5,256,1,0,15,256,1,0,13,256,1,0,3,256,1,0,10,256,1,0,2,256,1,0,15,256,1,0,21,256,6,0,15,256,1,0,13,256,1,0,2,256,2,0,9,256,2,0,2,256,1,0,16,256,1,0,41,256,15,0,2,256,1,0,9,256,2,0,3,256,18,0,58,256,1,0,9,256,1,0,80,256,1,0,5,256,5,0,80,256,6,0,3,256,2,0,781")

//simulation.visualEffectsEnabled = false
//simulation.fill(Simulation.MATERIALS.ELECTRICITY)
//simulation.PERF_TEST_FULL_WATER_REG()
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