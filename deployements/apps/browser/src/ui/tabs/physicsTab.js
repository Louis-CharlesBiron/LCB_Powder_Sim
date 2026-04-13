(()=>{
const dynamicMaterials = Object.entries(Simulation.MATERIALS).filter(x=>!(x[1]&Simulation.MATERIAL_GROUPS.STATIC))
let targetMat = null
fillSelectOptions(materialSettingsSelect, dynamicMaterials.map(x=>normalizeText(x[0])), i=>dynamicMaterials[i][1])
addWheelIncrement(materialSettingsSelect, null, v=>handeMaterialSettingsSelect(+v))
materialSettingsSelect.onchange=e=>handeMaterialSettingsSelect(+e.target.value)
materialSettingsSelect.value = Simulation.DEFAULT_MATERIAL

function handeMaterialSettingsSelect(mat) {
    const physicsSettings = simulation.getMaterialSettings(mat)
    targetMat = mat

    c_materialSettingsGravity.value = physicsSettings.gravity
    c_materialSettingsVelocityX.value = physicsSettings.velX
    c_materialSettingsVelocityY.value = physicsSettings.velY

    c_materialSettingsGravityRange.value = physicsSettings.gravityOffsetMax
    c_materialSettingsVelocityXRange.value = physicsSettings.velXOffsetMax
    c_materialSettingsVelocityYRange.value = physicsSettings.velYOffsetMax

}handeMaterialSettingsSelect(Simulation.MATERIALS.SAND)

setRegularNumberInput(c_materialSettingsGravity, v=>simulation.updateMaterialSettings(targetMat, {gravity:v}))
addWheelIncrement(c_materialSettingsGravity, [1,25,100], v=>simulation.updateMaterialSettings(targetMat, {gravity:v}))

setRegularNumberInput(c_materialSettingsVelocityX, v=>simulation.updateMaterialSettings(targetMat, {velX:v}))
addWheelIncrement(c_materialSettingsVelocityX, [1,25,100], v=>simulation.updateMaterialSettings(targetMat, {velX:v}))

setRegularNumberInput(c_materialSettingsVelocityY, v=>simulation.updateMaterialSettings(targetMat, {velY:v}))
addWheelIncrement(c_materialSettingsVelocityY, [1,25,100], v=>simulation.updateMaterialSettings(targetMat, {velY:v}))

setRegularNumberInput(c_materialSettingsGravityRange, v=>simulation.updateMaterialSettings(targetMat, {gravityOffsetMin:-v, gravityOffsetMax:v}))
addWheelIncrement(c_materialSettingsGravity, [1,25,100], v=>simulation.updateMaterialSettings(targetMat, {gravityOffsetMin:-v, gravityOffsetMax:v}))

setRegularNumberInput(c_materialSettingsVelocityXRange, v=>simulation.updateMaterialSettings(targetMat, {velXOffsetMin:-v, velXOffsetMax:v}))
addWheelIncrement(c_materialSettingsVelocityXRange, [1,25,100], v=>simulation.updateMaterialSettings(targetMat, {velXOffsetMin:-v, velXOffsetMax:v}))

setRegularNumberInput(c_materialSettingsVelocityYRange, v=>simulation.updateMaterialSettings(targetMat, {velYOffsetMin:-v, velYOffsetMax:v}))
addWheelIncrement(c_materialSettingsVelocityYRange, [1,25,100], v=>simulation.updateMaterialSettings(targetMat, {velYOffsetMin:-v, velYOffsetMax:v}))


keepCheckbox(c_crazyVel, INPUT_STORAGE_TYPE, el=>STORAGE_KEYS[el.id.slice(2)], false, isChecked=>toggleCrazyInitVelocity(isChecked))
keepCheckbox(c_secondFallUni, INPUT_STORAGE_TYPE, el=>STORAGE_KEYS[el.id.slice(2)], simulation.physicsSettings.enable2ndFallUniformity, isChecked=>simulation.physicsSettings.enable2ndFallUniformity = isChecked)

resetPhysicsButton.onclick=()=>{
    simulation.resetAllMaterialSettings()
    simulation.resetPhysicsSettings()

    c_baseFriction.value = simulation.baseFriction
    c_frictionCoefficient.value = simulation.frictionCoefficient.toFixed(4)
    c_finalCollisionTime.value = simulation.collisionFinalizationTime
    c_contaminationChance.value = simulation.contaminationChance.toFixed(4)
    c_meltChance.value = simulation.lavaMeltChance.toFixed(4)
    c_inflammationChance.value = simulation.fireInflammationChance.toFixed(4)
    c_fireExtinguishesVaporCreationChance.value = simulation.fireExtinguishesVaporCreationChance.toFixed(4)
    c_fireExtinguishesVaporCreationChance.value = simulation.fireExtinguishesVaporCreationChance.toFixed(4)
    c_fireDecayThreshold.value = simulation.fireDecayThreshold
    c_vaporDecayThreshold.value = simulation.vaporDecayThreshold

    handeMaterialSettingsSelect(targetMat)
}

c_baseFriction.value = simulation.baseFriction
setRegularNumberInput(c_baseFriction, v=>simulation.baseFriction = v)
addWheelIncrement(c_baseFriction, [.5,1,3], v=>simulation.baseFriction = v)

c_frictionCoefficient.value = simulation.frictionCoefficient
setRegularNumberInput(c_frictionCoefficient, v=>simulation.frictionCoefficient = v)
addWheelIncrement(c_frictionCoefficient, [.001,.005,.01], v=>simulation.frictionCoefficient = v)

c_finalCollisionTime.value = simulation.collisionFinalizationTime
setRegularNumberInput(c_finalCollisionTime, v=>simulation.collisionFinalizationTime = v)
addWheelIncrement(c_finalCollisionTime, [5,10,25], v=>simulation.collisionFinalizationTime = v)

c_contaminationChance.value = simulation.contaminationChance
setRegularNumberInput(c_contaminationChance, v=>simulation.contaminationChance = v)
addWheelIncrement(c_contaminationChance, [.05,0.1,0.25], v=>simulation.contaminationChance = v)

c_meltChance.value = simulation.lavaMeltChance
setRegularNumberInput(c_meltChance, v=>simulation.lavaMeltChance = v)
addWheelIncrement(c_meltChance, [.0001,.0005,.001], v=>simulation.lavaMeltChance = v)

c_inflammationChance.value = simulation.fireInflammationChance
setRegularNumberInput(c_inflammationChance, v=>simulation.fireInflammationChance = v)
addWheelIncrement(c_inflammationChance, [.05,0.1,0.25], v=>simulation.fireInflammationChance = v)

c_fireExtinguishesVaporCreationChance.value = simulation.fireExtinguishesVaporCreationChance
setRegularNumberInput(c_fireExtinguishesVaporCreationChance, v=>simulation.fireExtinguishesVaporCreationChance = v)
addWheelIncrement(c_fireExtinguishesVaporCreationChance, [.05,0.1,0.25], v=>simulation.fireExtinguishesVaporCreationChance = v)

c_firePropagatesVaporCreationChance.value = simulation.firePropagatesVaporCreationChance
setRegularNumberInput(c_firePropagatesVaporCreationChance, v=>simulation.firePropagatesVaporCreationChance = v)
addWheelIncrement(c_firePropagatesVaporCreationChance, [.05,0.1,0.25], v=>simulation.firePropagatesVaporCreationChance = v)

c_fireDecayThreshold.value = simulation.fireDecayThreshold
setRegularNumberInput(c_fireDecayThreshold, v=>simulation.fireDecayThreshold = v)
addWheelIncrement(c_fireDecayThreshold, [1,10,100], v=>simulation.fireDecayThreshold = v)

c_vaporDecayThreshold.value = simulation.vaporDecayThreshold
setRegularNumberInput(c_vaporDecayThreshold, v=>simulation.vaporDecayThreshold = v)
addWheelIncrement(c_vaporDecayThreshold, [1,10,100], v=>simulation.vaporDecayThreshold = v)

simulation.onMaterialSettingsChanged = (newValue, mat)=>{
    //console.log(newValue, mat)
}

let isCrazy = false
function toggleCrazyInitVelocity(enable) {
    if (enable) {
        Object.values(Simulation.MATERIALS).forEach(mat=>{
            simulation.updateMaterialSettings(mat, {
                hasVelXOffset: true,
                hasVelYOffset: true,
                velXOffsetMin: -200,
                velXOffsetMax: 200,
                velYOffsetMin: -200,
                velYOffsetMax: 200,
            })
        })
        isCrazy = true
    }
    else if (isCrazy) {
        simulation.resetAllMaterialSettings()
        isCrazy = false
    }
}




})()