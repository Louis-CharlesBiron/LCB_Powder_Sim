(()=>{
startButton.onclick=()=>simulation.start()
stopButton.onclick=()=>simulation.stop()
stepButton.onclick=()=>simulation.step()
backStepButton.onclick=()=>simulation.backStep()
clearButton.onclick=()=>simulation.clear()
resetZoomButton.onclick=()=>simulation.cameraManager.resetCamera()

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
    if (simulation.autoSimulationSizing) {
        simulation.autoFitMapSize(v)
        simulation.cameraManager.resetCamera()
    }
})

keepCheckbox(c_showGrid, INPUT_STORAGE_TYPE, el=>STORAGE_KEYS[el.id.slice(2)], simulation.showGrid, isChecked=>simulation.showGrid = isChecked)  
keepCheckbox(c_showBorder, INPUT_STORAGE_TYPE, el=>STORAGE_KEYS[el.id.slice(2)], simulation.showBorder, isChecked=>simulation.showBorder = isChecked)  
keepCheckbox(c_autoSizing, INPUT_STORAGE_TYPE, el=>STORAGE_KEYS[el.id.slice(2)], simulation.autoSimulationSizing, isChecked=>simulation.autoSimulationSizing = isChecked ? (+c_pixelSize.value)||5 : false)

// LISTENERS
simulation.onMapSizeChanged=newSize=>{
    c_width.value = newSize[0]
    c_height.value = newSize[1]
    displayUpdate("New Size: "+newSize[0]+"x"+newSize[1])
}

simulation.onMapPixelSizeChanged=newValue=>{
    displayUpdate("New Pixel Size: "+newValue)
}

})()