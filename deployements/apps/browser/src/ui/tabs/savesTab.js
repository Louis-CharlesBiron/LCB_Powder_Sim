// SAVE
saveButton.onclick=e=>{
    simulation.exportAsText(e.ctrlKey ? Simulation.EXPORT_STATES.RAW : Simulation.EXPORT_STATES.COMPACTED, textSave=>exportValueInput.value = textSave)
}
downloadSaveButton.onclick=()=>{
    const textSave = exportValueInput.value.trim()
    if (textSave) downloadFile(textSave, PROPOSED_FILE_NAME)
}

// LOAD
loadButton.onclick=e=>{
    const loadValue = loadValueInput.value||exportValueInput.value
    simulation.load(loadValue, e.ctrlKey)
}

uploadFile.oninput=e=>{
    readFile(e.target.files[0], content=>loadValueInput.value = content)
}

loadValueInput.oncontextmenu=e=>{
    e.preventDefault()
    loadValueInput.value = ""
}

// RESETS
resetSavedMapButton.onclick=()=>MAP_PERSISTENCE_STORAGE.remove(STORAGE_KEYS.savedMap)// TODO CONFIRMATION
resetAllButton.onclick=()=>REGULAR_STORAGE.clear()// TODO CONFIRMATION