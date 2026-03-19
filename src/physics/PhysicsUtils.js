function getPhysicsUtils(RTSize, MATERIALS_SETTINGS, MATERIAL_GROUPS) {
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
    function replaceParticleAtIndex(gridIndex, material, particle) {
        const gridMaterials = particle.gridMaterials, gridIndexes = particle.gridIndexes, indexCount = particle.indexCount,
              indexFlags = particle.indexFlags, indexPosX = particle.indexPosX, indexPosY = particle.indexPosY, indexVelX = particle.indexVelX, indexVelY = particle.indexVelY, indexGravity = particle.indexGravity, indexStepsAlive = particle.indexStepsAlive,
              isStatic = material & STATIC, oldIndex = gridIndexes[gridIndex]

        if (!isStatic) {
            const y = (gridIndex/MAP_WIDTH)|0,
                  x = gridIndex-y*MAP_WIDTH,
                  materialSettings = MATERIALS_SETTINGS[material]
        
            indexFlags[oldIndex] = materialSettings.flags
            indexPosX[oldIndex] = x+(materialSettings.hasPosXOffset ? random(materialSettings.posXOffsetMin, materialSettings.posXOffsetMax, materialSettings.posXOffsetDecimals) : 0)
            indexPosY[oldIndex] = y+(materialSettings.hasPosYOffset ? random(materialSettings.posYOffsetMin, materialSettings.posYOffsetMax, materialSettings.posYOffsetDecimals) : 0)
            indexVelX[oldIndex] = materialSettings.velX+(materialSettings.hasVelXOffset ? random(materialSettings.velXOffsetMin, materialSettings.velXOffsetMax, materialSettings.velXOffsetDecimals) : 0)
            indexVelY[oldIndex] = materialSettings.velY+(materialSettings.hasVelYOffset ? random(materialSettings.velYOffsetMin, materialSettings.velYOffsetMax, materialSettings.velYOffsetDecimals) : 0)
            indexGravity[oldIndex] = materialSettings.gravity+(materialSettings.hasGravityOffset ? random(materialSettings.gravityOffsetMin, materialSettings.gravityOffsetMax, materialSettings.gravityOffsetDecimals) : 0)
            indexStepsAlive[oldIndex] = materialSettings.stepsAlive+(materialSettings.hasStepsAliveOffset ? random(materialSettings.stepsAliveOffsetMin, materialSettings.stepsAliveOffsetMax) : 0)
            gridIndexes[gridIndex] = oldIndex
        }
        else if (isStatic) {
            const i = --indexCount[0]
            if (oldIndex !== i) {
                const x = indexPosX[oldIndex] = indexPosX[i], 
                      y = indexPosY[oldIndex] = indexPosY[i]
                indexFlags[oldIndex] = indexFlags[i]
                indexVelX[oldIndex] = indexVelX[i]
                indexVelY[oldIndex] = indexVelY[i]
                indexGravity[oldIndex] = indexGravity[i]
                indexStepsAlive[oldIndex] = indexStepsAlive[i]
                gridIndexes[(y|0)*MAP_WIDTH+(x|0)] = oldIndex
            }
            gridIndexes[gridIndex] = -1
        }

        return gridMaterials[gridIndex] = material
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

    return {_updatePhysicsUtilsGlobals, safeTrunc, abs, clamp, getAdjacencyCoords, random, replaceParticleAtIndex, getSideSelectionPriority, nextRandom}
}