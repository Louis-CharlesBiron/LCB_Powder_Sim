(()=>{
keepCheckbox(c_showStatus, INPUT_STORAGE_TYPE, el=>STORAGE_KEYS[el.id.slice(2)], false, isChecked=>toggleShowStatus(isChecked))
keepCheckbox(c_showFPS, INPUT_STORAGE_TYPE, el=>STORAGE_KEYS[el.id.slice(2)], false, isChecked=>toggleFPSDisplay(isChecked))
keepCheckbox(c_showCursor, INPUT_STORAGE_TYPE, el=>STORAGE_KEYS[el.id.slice(2)], simulation.showCursor, isChecked=>simulation.showCursor = isChecked)
keepCheckbox(c_showBrush, INPUT_STORAGE_TYPE, el=>STORAGE_KEYS[el.id.slice(2)], simulation.showBrush, isChecked=>simulation.showBrush = isChecked)
keepCheckbox(c_smoothDrawing, INPUT_STORAGE_TYPE, el=>STORAGE_KEYS[el.id.slice(2)], simulation.smoothDrawingEnabled, isChecked=>simulation.smoothDrawingEnabled = isChecked)
keepCheckbox(c_dragAndZoom, INPUT_STORAGE_TYPE, el=>STORAGE_KEYS[el.id.slice(2)], simulation.dragAndZoomCanvasEnabled, isChecked=>simulation.dragAndZoomCanvasEnabled = isChecked)
keepCheckbox(c_useWorkers, INPUT_STORAGE_TYPE, el=>STORAGE_KEYS[el.id.slice(2)], simulation.worldStartSettings.usesWebWorkers, isChecked=>simulation.updatePhysicsUnitType(isChecked))
keepCheckbox(c_mapPersistence, INPUT_STORAGE_TYPE, el=>STORAGE_KEYS[el.id.slice(2)], true, isChecked=>toggleMapPersistence(isChecked))
keepCheckbox(c_createFromMouseVel, INPUT_STORAGE_TYPE, el=>STORAGE_KEYS[el.id.slice(2)], simulation.useMouseVelocityForCreation, isChecked=>simulation.useMouseVelocityForCreation = isChecked)
keepCheckbox(c_backstepSavingOptimization, INPUT_STORAGE_TYPE, el=>STORAGE_KEYS[el.id.slice(2)], !simulation.backStepSavingIsExact, isChecked=>simulation.backStepSavingIsExact = !isChecked)

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

// STATUS
const STATUS_REFRESH_RATE = 1000/10
let statusIntervalId = null
function toggleShowStatus(show) {
    clearInterval(statusIntervalId)
    if (show) {
        statusIntervalId = setInterval(()=>{
            const map = simulation.mapGrid, mousePos = simulation.mouse.pos

            // MOUSE MAP POS | MOUSE MAP INDEX | MOUSE ABSOLUTE POS 
            const mapPos = map.getLocalMapPixel(mousePos)
            mousePosStatus.textContent = `Mouse pos: ${mapPos ? "["+mapPos+"]" : "Out Of Bounds"} | Index: ${mapPos ? map.mapPosToIndex(mapPos) : "Out Of Bounds"}`

            // MAP DIMENSIONS
            const mapDimensionsText = "Map: "+map.displayDimensions+"/"+map.pixelSize+"px\nParticles: "+simulation._indexCount[0]+"/"+(map.mapWidth*map.mapHeight)
            if (mapDimensionsStatus.textContent !== mapDimensionsText) mapDimensionsStatus.textContent = mapDimensionsText

            // SIDE PRIORITY
            const sidePriorityText = "Side priority: "+Simulation.SIDE_PRIORITY_NAMES[simulation.sidePriority]
            if (sidePriorityStatus.textContent !== sidePriorityText) sidePriorityStatus.textContent = sidePriorityText

            // IS RUNNING
            const isRunningText = "State: "+(simulation.isRunning ? "RUNNING" : "STOPPED")
            if (isRunningStatus.textContent !== isRunningText) isRunningStatus.textContent = isRunningText

            // PHYSICS UNIT TYPE
            const physicsUnitTypeText = "Physics: "+(simulation.usingWebWorkers ? "WORKERS ("+simulation.physicsUnit.threadCount+"x)" : "LOCAL")
            if (physicsUnitTypeStatus.textContent !== physicsUnitTypeText) physicsUnitTypeStatus.textContent = physicsUnitTypeText

            // TIMESTAMP
            const timeStampText = "Timestamp: "+(simulation.CVS.timeStamp|0)
            if (timeStampStatus.textContent !== timeStampText) timeStampStatus.textContent = timeStampText

            // ZOOM LEVEL
            const zoomText = "Zoom: "+CDEUtils.truncateDecimals(simulation.CVS.zoom, 3)+"x"
            if (zoomStatus.textContent !== zoomText) zoomStatus.textContent = zoomText

            tempStatus.textContent = "Skips: todo\nStep time: todo"

            // MOUSE PARTICLE INFO
            if (simulation.isMouseWithinSimulation && mapPos) {
                const particleInfo = simulation.getPixelInfo(map.mapPosToIndex(mapPos))
                particleStatus.innerHTML = Array.isArray(particleInfo) ? `
--- Pointed Particle ---
Material: ${Simulation.MATERIAL_NAMES[particleInfo[0]]}
Particle index: ${particleInfo[1]}
Flags: ${particleInfo[2]}
Pos: [${particleInfo[3].toFixed(2)}, ${particleInfo[4].toFixed(2)}]
Vel: [${particleInfo[5].toFixed(2)}, ${particleInfo[6].toFixed(2)}]
Gravity: ${particleInfo[7]}
StepsAlive: ${particleInfo[8]}
                ` : ""
            }

        }, STATUS_REFRESH_RATE)
    }
    else {
        statusIntervalId = null
        ;[...statusParent.children].forEach(el=>el.textContent = "")
    }
}

// MAP PERSISTENCE
let currentSavedMap = "", persistenceIntervalId = null
function toggleMapPersistence(enable) {
    clearInterval(persistenceIntervalId)
    if (enable) {
        persistenceIntervalId = setInterval(()=>{
            const newSavedMap = simulation.exportAsText(Simulation.EXPORT_STATES.COMPACTED)
            if (currentSavedMap !== newSavedMap) {
                currentSavedMap = newSavedMap
                MAP_PERSISTENCE_STORAGE.set({[STORAGE_KEYS.savedMap]:currentSavedMap})
            }
        }, 500)
    }
    else {
        currentSavedMap = ""
        MAP_PERSISTENCE_STORAGE.remove(STORAGE_KEYS.savedMap)
    }
}

})()