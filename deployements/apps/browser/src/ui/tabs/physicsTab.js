(()=>{

let selectedMat = null

materialSettingsSelect.onchange=e=>selectedMat = +e.target.value
fillSelectOptions(materialSettingsSelect, Object.keys(Simulation.MATERIALS).map(x=>normalizeText(x)), i=>1<<i)
addWheelIncrement(materialSettingsSelect, null, v=>selectedMat = +v)
materialSettingsSelect.value = Simulation.DEFAULT_MATERIAL

})()