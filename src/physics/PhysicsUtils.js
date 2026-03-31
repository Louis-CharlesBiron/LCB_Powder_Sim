function getPhysicsUtils(RTSize, MATERIALS_SETTINGS, MATERIAL_GROUPS, PHYSICS_DATA_ATTRIBUTES) {
    // GLOBAL CONSTANTS
    const {STATIC} = MATERIAL_GROUPS,
        RT = createRandomTable()

    // GLOBAL VARS
    let SP_RANDOM,
        SP_LEFT,
        SP_RIGHT,
        MAP_WIDTH,
        CLAMP_MAX

    function _updatePhysicsUtilsGlobals(mapWidth, spRandom, spLeft, spRight) {
        CLAMP_MAX = (MAP_WIDTH = mapWidth)-1
        SP_RANDOM = spRandom
        SP_LEFT = spLeft
        SP_RIGHT = spRight
    }

    
    let _rIndex=0
    // TODO DOC
    function nextRandom() {
        return RT[_rIndex++&RTSize]
    }

    const FLOAT32_TRUNC_ARR = new Float32Array(1), UINT32_TRUNC_ARR = new Uint32Array(FLOAT32_TRUNC_ARR.buffer)
    // DOC TODO
    function safeTrunc(num) {
        FLOAT32_TRUNC_ARR[0] = num
        if (FLOAT32_TRUNC_ARR[0] > num) UINT32_TRUNC_ARR[0]--
        return FLOAT32_TRUNC_ARR[0]
    }

    // DOC TODO
    const BIT32 = 31
    function abs(num) {
       return (num^(num>>BIT32))-(num>>BIT32)
    }

    // DOC TODO
    function clamp(num, min=0, max=CLAMP_MAX) {
        return num < min ? min : num > max ? max : num
    }

    // DOC TODO
    function getAdjacencyCoords(x, y) {
        return y*MAP_WIDTH+clamp(x, 0, CLAMP_MAX)
    }

    /**
     * Returns a random number within the min and max range
     * @param {Number} min: the minimal possible value (included)
     * @param {Number} max: the maximal possible value (included)
     * @param {Number?} decimals: the decimal point. (Defaults to 0 (integers))
     * @returns the generated number
     */
    function random(min, max, decimals=0) {
        const precision = 10**decimals
        return Math.floor(Math.random()*((max-min)*precision+1))/precision+min
    }
    
    // DOC TODO
    function replaceParticleAtIndex(gridIndex, material, indexCount, gridMaterials, gridIndexes, indexFlags, indexPhysicsData, indexGravity, indexStepsAlive) {
        const oldIndex = gridIndexes[gridIndex], oiPD = oldIndex*PHYSICS_DATA_ATTRIBUTES

        if (material & STATIC) {
            const i = --indexCount[0]
            if (oldIndex !== i) {
                const iPD = i*PHYSICS_DATA_ATTRIBUTES,
                x = indexPhysicsData[oiPD] = indexPhysicsData[iPD], 
                y = indexPhysicsData[oiPD+1] = indexPhysicsData[iPD+1]
                indexFlags[oldIndex] = indexFlags[i]
                indexPhysicsData[oiPD+2] = indexPhysicsData[iPD+2]
                indexPhysicsData[oiPD+3] = indexPhysicsData[iPD+3]
                indexGravity[oldIndex] = indexGravity[i]
                indexStepsAlive[oldIndex] = indexStepsAlive[i]
                gridIndexes[(y|0)*MAP_WIDTH+(x|0)] = oldIndex
            }
            gridIndexes[gridIndex] = -1
        } else {
            const y = (gridIndex/MAP_WIDTH)|0,
                  x = gridIndex-y*MAP_WIDTH,
                  materialSettings = MATERIALS_SETTINGS[material]
        
            indexFlags[oldIndex] = materialSettings.flags
            indexPhysicsData[oiPD] = x+(materialSettings.hasPosXOffset ? random(materialSettings.posXOffsetMin, materialSettings.posXOffsetMax, materialSettings.posXOffsetDecimals) : 0)
            indexPhysicsData[oiPD+1] = y+(materialSettings.hasPosYOffset ? random(materialSettings.posYOffsetMin, materialSettings.posYOffsetMax, materialSettings.posYOffsetDecimals) : 0)
            indexPhysicsData[oiPD+2] = materialSettings.velX+(materialSettings.hasVelXOffset ? random(materialSettings.velXOffsetMin, materialSettings.velXOffsetMax, materialSettings.velXOffsetDecimals) : 0)
            indexPhysicsData[oiPD+3] = materialSettings.velY+(materialSettings.hasVelYOffset ? random(materialSettings.velYOffsetMin, materialSettings.velYOffsetMax, materialSettings.velYOffsetDecimals) : 0)
            indexGravity[oldIndex] = materialSettings.gravity+(materialSettings.hasGravityOffset ? random(materialSettings.gravityOffsetMin, materialSettings.gravityOffsetMax, materialSettings.gravityOffsetDecimals) : 0)
            indexStepsAlive[oldIndex] = materialSettings.stepsAlive+(materialSettings.hasStepsAliveOffset ? random(materialSettings.stepsAliveOffsetMin, materialSettings.stepsAliveOffsetMax) : 0)
            gridIndexes[gridIndex] = oldIndex
        }

        return gridMaterials[gridIndex] = material
    }
    
    function workerReplaceParticleAtIndex(gridIndex, material, indexCount, gridMaterials, gridIndexes, indexFlags, indexPhysicsData, indexGravity, indexStepsAlive) {
        const oldIndex = Atomics.load(gridIndexes, gridIndex), oiPD = oldIndex*PHYSICS_DATA_ATTRIBUTES

        if (material & STATIC) {
            const i = Atomics.sub(indexCount, 0, 1)-1
            if (oldIndex !== i) {
                const iPD = i*PHYSICS_DATA_ATTRIBUTES
                x = indexPhysicsData[oiPD] = indexPhysicsData[iPD], 
                y = indexPhysicsData[oiPD+1] = indexPhysicsData[iPD+1]
                indexFlags[oldIndex] = indexFlags[i]
                indexPhysicsData[oiPD+2] = indexPhysicsData[iPD+2]
                indexPhysicsData[oiPD+3] = indexPhysicsData[iPD+3]
                indexGravity[oldIndex] = indexGravity[i]
                indexStepsAlive[oldIndex] = indexStepsAlive[i]
                Atomics.store(gridIndexes, (y|0)*MAP_WIDTH+(x|0), oldIndex)
            }
            Atomics.store(gridIndexes, gridIndex, -1)
        } else {
            const y = (gridIndex/MAP_WIDTH)|0,
                  x = gridIndex-y*MAP_WIDTH,
                  materialSettings = MATERIALS_SETTINGS[material]
        
            indexFlags[oldIndex] = materialSettings.flags
            indexPhysicsData[oiPD] = x+(materialSettings.hasPosXOffset ? random(materialSettings.posXOffsetMin, materialSettings.posXOffsetMax, materialSettings.posXOffsetDecimals) : 0)
            indexPhysicsData[oiPD+1] = y+(materialSettings.hasPosYOffset ? random(materialSettings.posYOffsetMin, materialSettings.posYOffsetMax, materialSettings.posYOffsetDecimals) : 0)
            indexPhysicsData[oiPD+2] = materialSettings.velX+(materialSettings.hasVelXOffset ? random(materialSettings.velXOffsetMin, materialSettings.velXOffsetMax, materialSettings.velXOffsetDecimals) : 0)
            indexPhysicsData[oiPD+3] = materialSettings.velY+(materialSettings.hasVelYOffset ? random(materialSettings.velYOffsetMin, materialSettings.velYOffsetMax, materialSettings.velYOffsetDecimals) : 0)
            indexGravity[oldIndex] = materialSettings.gravity+(materialSettings.hasGravityOffset ? random(materialSettings.gravityOffsetMin, materialSettings.gravityOffsetMax, materialSettings.gravityOffsetDecimals) : 0)
            indexStepsAlive[oldIndex] = materialSettings.stepsAlive+(materialSettings.hasStepsAliveOffset ? random(materialSettings.stepsAliveOffsetMin, materialSettings.stepsAliveOffsetMax) : 0)
            Atomics.store(gridIndexes, gridIndex, oldIndex)
        }

        Atomics.store(gridMaterials, gridIndex, material)

        return material
    }

    // DOC TODO
    function getSideSelectionPriority() {
        if (SP_RANDOM) return RT[_rIndex++&RTSize] < .5
        else if (SP_LEFT) return true
        else if (SP_RIGHT) return false
    }

    
    // DOC TODO
    function createRandomTable() {
        const table = new Float32Array(RTSize), random = Math.random
        for (let i=0;i<RTSize;i++) table[i] = random()
        return table
    }

    return {_updatePhysicsUtilsGlobals, safeTrunc, abs, clamp, getAdjacencyCoords, random, replaceParticleAtIndex, workerReplaceParticleAtIndex, getSideSelectionPriority, nextRandom}
}