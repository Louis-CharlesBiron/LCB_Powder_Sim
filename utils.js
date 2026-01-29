// DOC TODO
function addWheelIncrement(input, step=[1,1,1], actionCB) {
    if (typeof step === "number" || !step) step = [step||1, step||1, step||1]
    let callback = null

    const {nodeName, type} = input, hasActionCB = CDEUtils.isFunction(actionCB),
          normalStep = step[0],
          ctrlStep = step[1]??normalStep,
          shiftStep = step[2]??ctrlStep


    if (nodeName === "INPUT" && type === "number") callback=e=>{
        e.preventDefault()
        const min = +input.min||0, max = +input.max||Infinity, isFowardStep = e.deltaY>0
        let stepChosen = normalStep, v = +input.value
        if (e.ctrlKey) stepChosen = ctrlStep
        else if (e.shiftKey) stepChosen = shiftStep

        v = input.value = CDEUtils.clamp(isFowardStep ? v-stepChosen : v+stepChosen, min, max)
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

// DOC TODO
function fillSelectOptions(input, optionNames, valueMapper) {
    const hasValueMapper = CDEUtils.isFunction(valueMapper)
    optionNames.forEach((name, i)=>{
        const option = document.createElement("option")
        option.value = hasValueMapper ? valueMapper(i, name) : i
        option.textContent = name
        input.appendChild(option)
    })
}

// DOC TODO
function setRegularNumberInput(input, actionCB) {
    const hasActionCB = CDEUtils.isFunction(actionCB), min = +input.min||0, max = +input.max||Infinity
    input.oninput=()=>{
        input.value = CDEUtils.clamp(+input.value, min, max)
        if (hasActionCB) actionCB(+input.value)
    }
}