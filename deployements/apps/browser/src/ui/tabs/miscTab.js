(()=>{
fillSelectOptions(sidePrioritiesSelect, Simulation.SIDE_PRIORITY_NAMES.map(x=>normalizeText(x)), i=>Object.values(Simulation.SIDE_PRIORITIES)[i])
addWheelIncrement(sidePrioritiesSelect, null, v=>simulation.sidePriority = +v)
sidePrioritiesSelect.onchange=e=>simulation.sidePriority = +e.target.value
sidePrioritiesSelect.value = simulation.sidePriority

fillSelectOptions(replaceModesSelect, Object.keys(Simulation.REPLACE_MODES).map(x=>normalizeText(x)), i=>Object.values(Simulation.REPLACE_MODES)[i])
addWheelIncrement(replaceModesSelect, null, v=>simulation.replaceMode = +v)
replaceModesSelect.onchange=e=>simulation.replaceMode = +e.target.value
replaceModesSelect.value = simulation.replaceMode

resetMisc.onclick=()=>{
    sidePrioritiesSelect.value = simulation.sidePriority = Simulation.DEFAULT_SIDE_PRIORITY
    replaceModesSelect.value = simulation.replaceMode = Simulation.DEFAULT_REPLACE_MODE
}

openFullPageButton.onclick=()=>{
    chrome.tabs.create({
        url: chrome.runtime.getURL(location.pathname),
        active: true
    })
}

// OVERLAY
const overlayConfig = {
    inputIsolation: true,
    fixedPosition: true,
    integrationVisibility: false,
}
let _overlayId = null
LOCAL_STORAGE.get(res=>_overlayId = res[STORAGE_KEYS.overlayTabId])

toggleOverlayButton.onclick=()=>{
    if (_overlayId) {
        chrome.tabs.reload(_overlayId)
        _overlayId = null
        LOCAL_STORAGE.set({[STORAGE_KEYS.overlayTabId]:null})
        toggleOverlayAppDisplay(false)
    }
    else chrome.tabs.query({active: true, currentWindow: true}, ([tab])=>{
        if (tab) {
            chrome.scripting.executeScript({
                target: {tabId: tab.id},
                files: [
                    "src/lcb-ps/lcbPS.min.js",
                    "src/overlay/utils.js",
                    "src/overlay/overlay.js",
                ]
            }).then(()=>{
                _overlayId = tab.id
                sendToOverlay({type:"init", value:"sim"})
                LOCAL_STORAGE.set({[STORAGE_KEYS.overlayTabId]:_overlayId})
                setTimeout(()=>window.close(),100)
            }).catch(err=>console.warn("NO TAB FOUND TODO ERROR", err))
        }
        else console.warn("NO TAB FOUND TODO ERROR")
    })
}


keepCheckbox(c_inputIsolation, INPUT_STORAGE_TYPE, el=>STORAGE_KEYS[el.id.slice(2)], overlayConfig.inputIsolation, isChecked=>{
    overlayConfig.inputIsolation = isChecked
    sendToOverlay({type:"inputIsolation", value:isChecked})
})
keepCheckbox(c_fixedPosition, INPUT_STORAGE_TYPE, el=>STORAGE_KEYS[el.id.slice(2)], overlayConfig.fixedPosition, isChecked=>{
    overlayConfig.fixedPosition = isChecked
    sendToOverlay({type:"fixedPosition", value:isChecked})
})
keepCheckbox(c_integrationVisibility, INPUT_STORAGE_TYPE, el=>STORAGE_KEYS[el.id.slice(2)], overlayConfig.integrationVisibility, isChecked=>{
    overlayConfig.integrationVisibility = isChecked
    sendToOverlay({type:"integrationVisibility", value:isChecked})
})

function sendToOverlay(obj) {
    console.log(_overlayId, obj)
    if (_overlayId) chrome.tabs.sendMessage(_overlayId, obj)
}



})()