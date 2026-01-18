const fpsCounter = new FPSCounter(), CVS = new Canvas(document.getElementById("sim"), null, 60), simulation = new Simulation(CVS, new MapGrid())
      
simulation.addLoopExtra(()=>{ // optimise for event updates instead of loop
    document.getElementById("fpsDisplay").textContent = fpsCounter.getFps()+" fps"

    const mapPos = simulation.mapGrid.getLocalMapPixel(CVS.mouse.pos)
    if (simulation.isMouseWithinSimulation && mapPos) document.getElementById("mousePos").textContent = mapPos+" | "+simulation.mapGrid.mapPosToIndex(mapPos)

    if (simulation.isMouseWithinSimulation && mapPos) document.getElementById("mouseMaterial").textContent = "("+Simulation.MATERIAL_NAMES[simulation.pixels[simulation.mapGrid.mapPosToIndex(mapPos)]]+")"
    
    const matEl = document.getElementById("selectedMaterial"), selectedMat = simulation.selectedMaterial
    if (matEl.textContent != selectedMat) matEl.textContent = Simulation.MATERIAL_NAMES[selectedMat]

    const mapDims = document.getElementById("mapDim"), displayDims = simulation.mapGrid.displayDimensions+" ("+simulation.pixels.length+")"
    if (mapDims.textContent != displayDims) mapDims.textContent = displayDims

    const sideP = document.getElementById("sidePriorityText"), sidePriority = Simulation.SIDE_PRIORITY_NAMES[simulation.sidePriority]
    if (sideP.textContent != sidePriority) sideP.textContent = sidePriority

    const isRunningText = document.getElementById("isRunningText"), isRunning = simulation.isRunning
    if (isRunningText.textContent != isRunning) isRunningText.textContent = isRunning?"RUNNING":"STOPPED"
})


// CONTROLS BUTTONS
document.getElementById("startButton").onclick=()=>simulation.start()
document.getElementById("stopButton").onclick=()=>simulation.stop()

document.getElementById("stepButton").onclick=()=>simulation.step()
document.getElementById("backStepButton").onclick=()=>simulation.backStep()

document.getElementById("clearButton").onclick=()=>simulation.clear()

// SAVE/EXPORT + LOAD/IMPORT
const loadValueInput = document.getElementById("loadValueInput"), exportValueInput = document.getElementById("exportValueInput")

document.getElementById("saveButton").onclick=e=>exportValueInput.value = simulation.exportAsText(e.ctrlKey)
document.getElementById("loadButton").onclick=()=>simulation.load(loadValueInput.value||exportValueInput.value)

loadValueInput.oncontextmenu=e=>{
    e.preventDefault()
    loadValueInput.value = ""
}

// WIDTH / HEIGHT / PIXEL SIZE
const widthInput = document.getElementById("widthInput"), heightInput = document.getElementById("heightInput"), pixelSizeInput = document.getElementById("pixelSizeInput")
widthInput.value = simulation.mapGrid.mapWidth
widthInput.oninput=()=>{
    const v = +widthInput.value
    if (v < 1200 && v > 0) simulation.updateMapSize(v)
}
widthInput.onwheel=e=>{
    const v = widthInput.value = e.deltaY > 0 ? +widthInput.value-1 : +widthInput.value+1
    if (v < 1200 && v > 0) simulation.updateMapSize(v)
}

heightInput.value = simulation.mapGrid.mapHeight
heightInput.oninput=()=>{
    const v = +heightInput.value
    if (v < 1000 && v > 0) simulation.updateMapSize(null, v)
}
heightInput.onwheel=e=>{
    const v = heightInput.value = e.deltaY > 0 ? +heightInput.value-1 : +heightInput.value+1
    if (v < 1000 && v > 0) simulation.updateMapSize(null, v)
}

pixelSizeInput.value = simulation.mapGrid.pixelSize
pixelSizeInput.oninput=()=>{
    const v = +pixelSizeInput.value
    if (v < 50 && v > 0) simulation.updateMapPixelSize(v)
}
pixelSizeInput.onwheel=e=>{
    const v = pixelSizeInput.value = e.deltaY > 0 ? +pixelSizeInput.value-1 : +pixelSizeInput.value+1
    if (v < 50 && v > 0) simulation.updateMapPixelSize(v)
}

// BRUSH TYPES
const brushTypeOptions = document.getElementById("brushTypeOptions")
Object.keys(Simulation.BRUSH_TYPES).forEach((type, i)=>{
    const option = document.createElement("option")
    option.value = i
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