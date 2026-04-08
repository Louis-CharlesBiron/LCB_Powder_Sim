const STORAGE_TYPE = "sync"

// Open/close drawer
drawerControl.onclick=()=>{
    const isClosed = bottom.dataset.closed === "true"
    drawerControl.textContent = isClosed ? "∨" : "∧" 
    bottom.dataset.closed = isClosed ? false : true
}

// TABS SWITCHING
const tabs = document.querySelectorAll(".tabs > span"), tabContents = document.querySelectorAll(".tabContent > div")
function selectTab(e) {
    const dataset = e.target.dataset

    tabs.forEach(el=>el.dataset.selected = false)
    tabContents.forEach(el=>el.dataset.displayed = false)

    dataset.selected = true
    ;[...tabContents].find(el=>el.dataset.content === dataset.content).dataset.displayed = true
}

tabs.forEach(el=>el.onclick=selectTab)

// CSS VARIABLES
const root = document.querySelector(":root").style
root.setProperty("--tabsCount", tabs.length)

// HORIZONTAL SCROLL
document.querySelectorAll(".tabInputsParent").forEach(el=>{
    el.addEventListener("wheel", e=>{
        e.preventDefault()
        el.scrollLeft += e.deltaY
    })
})

// MATERIALS TAB
Object.entries(Simulation.MATERIALS).forEach(([name, mat], i)=>{
    const smallBoxParent = document.createElement("div"),
          smallBoxIcon = document.createElement("div")
          smallBoxText = document.createElement("span")

    smallBoxParent.appendChild(smallBoxIcon)
    smallBoxParent.appendChild(smallBoxText)
    materialsList.appendChild(smallBoxParent)

    if ((2**i) === simulation.selectedMaterial) smallBoxParent.dataset.selected = true

    const normalText = normalizeText(name)
    smallBoxText.textContent = normalText
    smallBoxText.style.fontSize = autoTextSize(normalText, 8.25, 19)

    const parentClassName = "smallBoxParent"
    smallBoxParent.className = parentClassName
    smallBoxIcon.className = "smallBoxIcon"
    smallBoxIcon.style.width = smallBoxIcon.getBoundingClientRect().height+"px"
    smallBoxIcon.style.height = smallBoxIcon.getBoundingClientRect().height+"px"
    smallBoxIcon.style.backgroundColor = new Color(simulation.colorSettings[name])
    smallBoxParent.onclick=()=>{
        simulation.updateSelectedMaterial(mat)
        materialsList.querySelectorAll("."+parentClassName).forEach(el=>el.dataset.selected = false)
        smallBoxParent.dataset.selected = true
    }
})

// BRUSHES TAB
Object.entries(Simulation.BRUSH_TYPES).forEach(([name, brush], i)=>{
    const smallBoxParent = document.createElement("div"),
          smallBoxIcon = document.createElement("div")
          smallBoxText = document.createElement("span")

    smallBoxParent.appendChild(smallBoxIcon)
    smallBoxParent.appendChild(smallBoxText)
    brushesList.appendChild(smallBoxParent)

    if ((2**i) === simulation.brushType) smallBoxParent.dataset.selected = true

    const normalText = normalizeText(name)
    smallBoxText.textContent = normalText
    smallBoxText.style.fontSize = autoTextSize(normalText, 8.25, 19)

    const parentClassName = "smallBoxParent"
    smallBoxParent.className = parentClassName
    smallBoxIcon.className = "smallBoxIcon"
    smallBoxIcon.style.width = smallBoxIcon.getBoundingClientRect().height+"px"
    smallBoxIcon.style.height = smallBoxIcon.getBoundingClientRect().height+"px"
    //smallBoxIcon.style.backgroundColor = new Color(simulation.colorSettings[name])
    smallBoxParent.onclick=()=>{
        simulation.updateBrushType(brush)
        brushesList.querySelectorAll("."+parentClassName).forEach(el=>el.dataset.selected = false)
        smallBoxParent.dataset.selected = true
    }
})

// MAP TAB
startButton.onclick=()=>simulation.start()
stopButton.onclick=()=>simulation.stop()
stepButton.onclick=()=>simulation.step()
backStepButton.onclick=()=>simulation.backStep()
clearButton.onclick=()=>simulation.clear()

c_width.value = simulation.mapGrid.mapWidth
setRegularNumberInput(c_width, v=>simulation.updateMapSize(v))
addWheelIncrement(c_width, [1,10,50], v=>simulation.updateMapSize(v))

c_height.value = simulation.mapGrid.mapHeight
setRegularNumberInput(c_height, v=>simulation.updateMapSize(null, v))
addWheelIncrement(c_height, [1,10,50], v=>simulation.updateMapSize(null, v))

c_pixelSize.value = simulation.mapGrid.pixelSize
setRegularNumberInput(c_pixelSize, v=>simulation.updateMapPixelSize(v))
addWheelIncrement(c_pixelSize, [1,5,10], v=>{
    simulation.updateMapPixelSize(v)
    if (simulation.autoSimulationSizing) simulation.autoFitMapSize(v)
})

keepCheckbox(c_showGrid, STORAGE_TYPE, "c_showGrid", simulation.showGrid, isChecked=>simulation.showGrid = isChecked)  
keepCheckbox(c_showBorder, STORAGE_TYPE, "c_showBorder", simulation.showBorder, isChecked=>simulation.showBorder = isChecked)  
keepCheckbox(c_autoSizing, STORAGE_TYPE, "c_autoSizing", simulation.autoSimulationSizing, isChecked=>simulation.autoSimulationSizing = isChecked ? (+c_pixelSize.value)||5 : false)  

// SETTINGS TAB
keepCheckbox(c_showStatus, STORAGE_TYPE, "c_showStatus", false, (isChecked, _, n)=>console.log(n, isChecked, "TODO"))
keepCheckbox(c_showFPS, STORAGE_TYPE, "c_showFPS", false, isChecked=>toggleFPSDisplay(isChecked))
keepCheckbox(c_showCursor, STORAGE_TYPE, "c_showCursor", simulation.showCursor, isChecked=>simulation.showCursor = isChecked)
keepCheckbox(c_showBrush, STORAGE_TYPE, "c_showBrush", simulation.showBrush, isChecked=>simulation.showBrush = isChecked)
keepCheckbox(c_smoothDrawing, STORAGE_TYPE, "c_smoothDrawing", simulation.smoothDrawingEnabled, isChecked=>simulation.smoothDrawingEnabled = isChecked)
keepCheckbox(c_dragAndZoom, STORAGE_TYPE, "c_dragAndZoom", simulation.dragAndZoomCanvasEnabled, isChecked=>simulation.dragAndZoomCanvasEnabled = isChecked)
keepCheckbox(c_useWorkers, STORAGE_TYPE, "c_useWorkers", simulation.worldStartSettings.usesWebWorkers, isChecked=>simulation.updatePhysicsUnitType(isChecked))
keepCheckbox(c_mapPersistence, STORAGE_TYPE, "c_mapPersistence", true, isChecked=>toggleMapPersistence(isChecked))
keepCheckbox(c_createFromMouseVel, STORAGE_TYPE, "c_createFromMouseVel", simulation.useMouseVelocityForCreation, isChecked=>simulation.useMouseVelocityForCreation = isChecked)
keepCheckbox(c_backstepSavingOptimization, STORAGE_TYPE, "c_backstepSavingOptimization", !simulation.backStepSavingIsExact, isChecked=>simulation.backStepSavingIsExact = !isChecked)

c_maxDynamicMaterials.value = simulation.maxDynamicMaterialCount
setRegularNumberInput(c_maxDynamicMaterials, v=>simulation.maxDynamicMaterialCount = v)
addWheelIncrement(c_maxDynamicMaterials, [100,1000,5000], v=>simulation.maxDynamicMaterialCount = v)

c_maxBackstepSaves.value = simulation.backStepSavingCount
setRegularNumberInput(c_maxBackstepSaves, v=>simulation.backStepSavingCount = v)
addWheelIncrement(c_maxBackstepSaves, [10,50,100], v=>simulation.backStepSavingCount = v)

c_maxFPS.value = simulation.aimedFPS
setRegularNumberInput(c_maxFPS, v=>simulation.aimedFPS = v)
addWheelIncrement(c_maxFPS, [1,2,5], v=>simulation.aimedFPS = v)

// FPS / STEPS COUNTERS
const fpsCounter = new FPSCounter(), stepFpsCounter = new FPSCounter()
let stepFps = 0
function toggleFPSDisplay(show) {
    if (show) {
        simulation.stepExtra=()=>stepFps = stepFpsCounter.getFps()
        simulation.loopExtra=()=>{
            const fpsValue = fpsCounter.getFps()+"FPS"
            if (fpsDisplay.textContent !== fpsValue) fpsDisplay.textContent = fpsValue

            const fpsStepValue = fpsStepDisplay.textContent = "|"+stepFps+"SPS"
            if (fpsStepDisplay.textContent !== fpsStepValue) fpsStepDisplay.textContent = fpsStepValue
            if (stepFps > 0) stepFps--
        }
    }
    else {
        simulation.stepExtra = null
        simulation.loopExtra = null
        fpsDisplay.textContent = ""
        fpsStepDisplay.textContent = ""
        stepFps = 0
    }
}

// MAP PERSISTENCE
let currentSavedMap = "", persistenceIntervalId = null
function toggleMapPersistence(enable) {
    if (enable) {
        persistenceIntervalId = setInterval(()=>{
            const newSavedMap = simulation.exportAsText(Simulation.EXPORT_STATES.COMPACTED)
            if (currentSavedMap !== newSavedMap) {
                currentSavedMap = newSavedMap
                chrome.storage.local.set({savedMap:currentSavedMap})
            }
        }, 500)
    }
    else {
        clearInterval(persistenceIntervalId)
        currentSavedMap = ""
        chrome.storage.local.remove("savedMap")
    }
}
