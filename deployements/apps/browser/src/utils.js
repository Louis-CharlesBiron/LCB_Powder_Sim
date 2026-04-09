// TODO DOC
function normalizeText(text) {
    return capitalize(text.toLowerCase().replaceAll("_", " "))
}

// TODO DOC
function capitalize(text) {
    return text.replaceAll(/(?:\s|^)[a-z]/g,x=>x.toUpperCase())
}

// TODO DOC
function autoTextSize(text, minSize=5, maxSize=18, disableFormating) {
    const maxLength = text.split(" ").sort((a,b)=>b.length-a.length)[0].length*((maxSize/minSize)/2),
        size = (1-CDEUtils.normalize(CDEUtils.clamp(maxLength, minSize, maxSize), minSize, maxSize))*maxSize

    return disableFormating ? size : size.toFixed(2)+"px" 
}

/**
 * Adds a custom wheel increment functionality to the provided input
 * @param {HTMLInputElement | HTMLSelectElement} input The input
 * @param {Number? | Array} step Defines the value of possible increments. [normalStep, ctrlStep, shiftStep]
 * @param {Function?} actionCB A callback called on wheel. (value)=>{}
 */
function addWheelIncrement(input, step=[1,1,1], actionCB) {
    if (typeof step === "number" || !step) step = [step||1, step||1, step||1]
    let callback = null

    const {nodeName, type} = input, hasActionCB = typeof actionCB === "function",
          normalStep = step[0],
          ctrlStep = step[1]??normalStep,
          shiftStep = step[2]??ctrlStep

    if (nodeName === "INPUT" && type === "number") callback=e=>{
        e.preventDefault()
        const min = +input.min||0, max = +input.max||Infinity, isFowardStep = e.deltaY>0
        let stepChosen = normalStep, v = +input.value
        if (e.ctrlKey) stepChosen = ctrlStep
        else if (e.shiftKey) stepChosen = shiftStep
        const value = isFowardStep ? v-stepChosen : v+stepChosen
        v = input.value = value < min ? min : value > max ? max : value
        if (hasActionCB) actionCB(+input.value)
    }
    else if (nodeName === "SELECT") callback=e=>{
        const currentIndex = input.selectedIndex, isFowardStep = e.deltaY>0
        let stepChosen = normalStep
        if (e.ctrlKey) stepChosen = ctrlStep
        else if (e.shiftKey) stepChosen = shiftStep

        if (isFowardStep) input.selectedIndex = Math.min(input.options.length-1, currentIndex+stepChosen)
        else input.selectedIndex = Math.max(0, currentIndex-stepChosen)
        if (hasActionCB) actionCB(input.value)
    }
    else console.warn("addWheelIncrement: Input not supported", input, nodeName)

    input.onwheel=callback
}

/**
 * Sets a regular onInput listener, but with min/max clamping
 * @param {HTMLInputElement} input The input of 'number' type
 * @param {Function?} actionCB A callback called on input. (value)=>{}
 */
function setRegularNumberInput(input, actionCB) {
    const hasActionCB = typeof actionCB === "function", min = +input.min||0, max = +input.max||Infinity
    input.title = `Min: ${min} | Max: ${max}`

    input.addEventListener("input", ()=>{
        const v = +input.value
        input.value = v > max ? max : v
        if (hasActionCB) actionCB(+input.value)
    })
    input.addEventListener("blur", ()=>{
        const v = +input.value
        input.value = v < min ? min : v > max ? max : v
    })
}

/**
 * 
 * @param {HTMLInputElement} element The checkbox element
 * @param {String?} storageType Either "sync", "local" or "session". Defaults to "sync". 
 * @param {String | Function} storageName The storage key as a string, or a callback returning a string. (element, storageType)=>{return key}
 * @param {Boolean} initChecked Whether the checkbox is initially checked 
 * @param {Function?} actionCB The action callback, triggers on click and at launch. (isChecked, isAtLaunch, storageName) 
 * @returns The click event listener
 */
function keepCheckbox(element, storageType, storageName, initChecked, actionCB) {
    const hasActionCB = typeof actionCB === "function", storage = chrome.storage[storageType||"sync"], key = typeof storageName === "function" ? storageName(element, storageType) : storageName
    storage.get(res=>{
        const isChecked = element.checked = res[key]??initChecked
        if (hasActionCB) actionCB(isChecked, true, key)
    })
    return element.addEventListener("click", ()=>{
        const isChecked = element.checked
        if (hasActionCB) actionCB(isChecked, false, key)
        storage.set({[key]:isChecked})
    })
}