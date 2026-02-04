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
 * Fills the options of a select element
 * @param {HTMLSelectElement} input The input of 'number' type
 * @param {Array} optionNames The name of each option 
 * @param {Function?} valueMapper Can be used to define a custom option's value. (index, optionName)=>{return optionValue}
 */
function fillSelectOptions(input, optionNames, valueMapper) {
    const hasValueMapper = typeof valueMapper === "function"
    optionNames.forEach((name, i)=>{
        const option = document.createElement("option")
        option.value = hasValueMapper ? valueMapper(i, name) : i
        option.textContent = name
        input.appendChild(option)
    })
}

/**
 * Sets a regular onInput listener, but with min/max clamping
 * @param {HTMLInputElement} input The input of 'number' type
 * @param {Function?} actionCB A callback called on input. (value)=>{}
 */
function setRegularNumberInput(input, actionCB) {
    const hasActionCB = typeof actionCB === "function", min = +input.min||0, max = +input.max||Infinity
    input.addEventListener("input", ()=>{
        const v = +input.value
        input.value = v < min ? min : v > max ? max : v
        if (hasActionCB) actionCB(+input.value)
    })
}