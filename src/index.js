const fpsCounter = new FPSCounter(), CVS = new Canvas(document.getElementById("sim"), null, 60), simulation = new Simulation(CVS, new MapGrid())
      
simulation.addLoopExtra(()=>{ // optimise for event updates instead of loop
    document.getElementById("fpsDisplay").textContent = fpsCounter.getFps()+" fps"

    const mapPos = simulation.mapGrid.getLocalMapPixel(CVS.mouse.pos)
    if (simulation.isMouseWithinSimulation && mapPos) document.getElementById("mousePos").textContent = mapPos+" | "+simulation.mapGrid.mapPosToIndex(mapPos)

    if (simulation.isMouseWithinSimulation && mapPos) document.getElementById("mouseMaterial").textContent = "("+Simulation.MATERIAL_NAMES[simulation.pixels[simulation.mapGrid.mapPosToIndex(mapPos)]]+")"
    
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
document.getElementById("startButton").onclick=()=>simulation.start()
document.getElementById("stopButton").onclick=()=>simulation.stop()

document.getElementById("stepButton").onclick=()=>simulation.step()
document.getElementById("backStepButton").onclick=()=>simulation.backStep()

document.getElementById("clearButton").onclick=()=>simulation.clear()

// SAVE/EXPORT + LOAD/IMPORT
document.getElementById("saveButton").onclick=e=>document.getElementById("exportValueInput").value = simulation.exportAsText(e.ctrlKey)
const loadValueInput = document.getElementById("loadValueInput")
document.getElementById("loadButton").onclick=()=>simulation.load(loadValueInput.value)
loadValueInput.oncontextmenu=e=>{
    e.preventDefault()
    loadValueInput.value = ""
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

materialOptions.onchange=()=>{
    simulation.selectedMaterial = +materialOptions.value
}