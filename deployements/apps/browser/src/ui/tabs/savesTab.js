// SAVE
let exportType = Simulation.EXPORT_STATES.EXACT

REGULAR_STORAGE.get(res=>{
    const savedExportType = +(res[STORAGE_KEYS.exportType]||exportType)
    exportType = savedExportType
    exportTypeSelect.value = savedExportType
})

saveButton.onclick=()=>simulation.exportAsText(exportType, textSave=>exportValueInput.value = textSave)
downloadSaveButton.onclick=()=>{
    const textSave = exportValueInput.value.trim()
    if (textSave) downloadFile(textSave, PROPOSED_FILE_NAME)
}

// LOAD
loadButton.onclick=e=>{
    const loadValue = loadValueInput.value||exportValueInput.value
    simulation.load(loadValue, e.ctrlKey)
}

uploadFile.oninput=e=>readFile(e.target.files[0], content=>loadValueInput.value = content)

loadValueInput.oncontextmenu=e=>{
    e.preventDefault()
    loadValueInput.value = ""
}

copyButton.onclick=()=>{
    const textSave = exportValueInput.value.trim()
    if (textSave) {
        navigator.clipboard.writeText(textSave).catch(err=>console.log("Failed to copy the save", err))
        copyButton.style.transform = "rotateZ(360deg)"
        setTimeout(()=>copyButton.style.transform = "rotateZ(0deg)", 450)
    }
}

exportTypeSelect.onchange=e=>{
    exportType = e.target.value
    REGULAR_STORAGE.set({[STORAGE_KEYS.exportType]: exportType})
}

// RESETS
resetSavedMapButton.onclick=()=>MAP_PERSISTENCE_STORAGE.remove(STORAGE_KEYS.savedMap)// TODO CONFIRMATION
resetAllButton.onclick=()=>REGULAR_STORAGE.clear()// TODO CONFIRMATION