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

openOverlayButton.onclick=()=>{
    chrome.tabs.query({active: true, currentWindow: true}, ([tab])=>{
        if (tab) {
            chrome.scripting.executeScript({
                target: {tabId: tab.id},
                files: [
                    "src/lcb-ps/lcbPS.min.js",
                    "src/overlay.js",
                ]
            })
            window.close()
        }
        else console.warn("NO TAB FOUND TODO ERROR")
    })
}


})()