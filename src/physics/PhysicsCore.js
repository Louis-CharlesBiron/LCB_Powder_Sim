class PhysicsCore {
    constructor(type) {
        this._type = type
        console.log(type)
    }

    /**
    * Calculates the adjacent index based on the provided index, direction and distance
    * @param {Number} i The index of a pixel in the pixels array
    * @param {Simulation.D} direction A direction specified by one of Simulation.D
    * @param {Number?} distance The distance to go by in the provided direction (defaults to 1)
    * @returns The calculated adjacent index
    */
    getAdjacency(D, mapWidth, i, direction, distance=1) { // OPTIMIZATION, TODO
        const dWidth = mapWidth*distance
        if (direction == D.b)       return i+dWidth
        else if (direction == D.t)  return i-dWidth
        else if (direction == D.r)  return (i+1)%mapWidth ? i+distance : i
        else if (direction == D.l)  return i%mapWidth     ? i-distance : i
        else if (direction == D.tr) return (i-dWidth+1)%mapWidth ? i-dWidth+distance : i
        else if (direction == D.br) return (i+dWidth+1)%mapWidth ? i+dWidth+distance : i
        else if (direction == D.tl) return (i-dWidth)%mapWidth   ? i-dWidth-distance : i
        else if (direction == D.bl) return (i+dWidth)%mapWidth   ? i+dWidth-distance : i
    }

    /**
    * Runs one physics step
    */
    step(pixels, pxStepUpdated, sidePriority, mapWidth, MATERIALS, MATERIAL_GROUPS, D, SIDE_PRIORITIES) {
        const p_ll = pixels.length-1, AIR = MATERIALS.AIR, getAdjacency = this.getAdjacency
        pxStepUpdated.fill(0)
        //.saveStep() CHECK

        for (let i=p_ll;i>=0;i--) {
            const mat = pixels[i]
            if (mat == AIR || pxStepUpdated[i]) continue
            let newMaterial = mat, newIndex = -1, replaceMaterial = AIR

            // SAND
            if (mat == MATERIALS.SAND) {
                const transpiercedMaterialIndex = getAdjacency(D, mapWidth, i, D.b), transpiercedMaterial = pixels[transpiercedMaterialIndex], transpierceable = transpiercedMaterial&MATERIAL_GROUPS.TRANSPIERCEABLE
                // check if can go down or sides
                if (transpiercedMaterial == AIR || transpierceable) newIndex = transpiercedMaterialIndex
                else {
                    const isLeftFirst = this.#getSideSelectionPriority(sidePriority, SIDE_PRIORITIES, i, mapWidth), i_BL = getAdjacency(D, mapWidth, i, D.bl), i_BR = getAdjacency(D, mapWidth, i, D.br)
                    if (isLeftFirst) {
                        if (pixels[i_BL] == AIR) newIndex = i_BL
                        else if (pixels[i_BR] == AIR) newIndex = i_BR
                    } else {
                        if (pixels[i_BR] == AIR) newIndex = i_BR
                        else if (pixels[i_BL] == AIR) newIndex = i_BL
                    }
                }
                // check what to replace prev pos with
                if (newIndex != -1) replaceMaterial = pixels[newIndex] // && (pixels[getAdjacency(D, i, D.l)]&G.LIQUIDS || pixels[getAdjacency(D, i, D.r)]&G.LIQUIDS)
            }
            // WATER
            else if (mat == MATERIALS.WATER) {
                const transpiercedMaterialIndex = getAdjacency(D, mapWidth, i, D.b), transpiercedMaterial = pixels[transpiercedMaterialIndex]
                // check if can go down or sides
                if (transpiercedMaterial == AIR) newIndex = transpiercedMaterialIndex
                else {
                    const isLeftFirst = this.#getSideSelectionPriority(sidePriority, SIDE_PRIORITIES, i, mapWidth), i_L = getAdjacency(D, mapWidth, i, D.l), leftIsAir = pixels[i_L] == AIR, i_BL = getAdjacency(D, mapWidth, i, D.bl), i_BR = getAdjacency(D, mapWidth, i, D.br), i_R = getAdjacency(D, mapWidth, i, D.r)
                    if (isLeftFirst) {
                        if (pixels[i_BL] == AIR && leftIsAir) newIndex = i_BL
                        else if (pixels[i_BR] == AIR && pixels[i_R] == AIR) newIndex = i_BR
                        else if (leftIsAir) newIndex = i_L
                        else if (pixels[i_R] == AIR) newIndex = i_R
                    } else {
                        if (pixels[i_BR] == AIR && pixels[i_R] == AIR) newIndex = i_BR
                        else if (pixels[i_BL] == AIR && leftIsAir) newIndex = i_BL
                        else if (pixels[i_R] == AIR) newIndex = i_R
                        else if (leftIsAir) newIndex = i_L
                    }
                }
            }
            // GRAVEL
            else if (mat == MATERIALS.GRAVEL) {
                const transpiercedMaterialIndex = getAdjacency(D, mapWidth, i, D.b), transpiercedMaterial = pixels[transpiercedMaterialIndex], transpiercedLiquid = transpiercedMaterial&MATERIAL_GROUPS.LIQUIDS
                // check if can go down
                if (transpiercedMaterial == AIR || transpiercedLiquid) newIndex = transpiercedMaterialIndex
                // check what to replace prev pos with
                if (transpiercedLiquid && (pixels[getAdjacency(D, mapWidth, i, D.l)]&MATERIAL_GROUPS.LIQUIDS || pixels[getAdjacency(D, mapWidth, i, D.r)]&MATERIAL_GROUPS.LIQUIDS)) replaceMaterial = transpiercedLiquid
            }
            // INVERTED WATER
            else if (mat == MATERIALS.INVERTED_WATER) {
                const transpiercedMaterialIndex = getAdjacency(D, mapWidth, i, D.t), transpiercedMaterial = pixels[transpiercedMaterialIndex]
                // check if can go down or sides
                if (transpiercedMaterial == AIR) newIndex = transpiercedMaterialIndex
                else {
                    const isLeftFirst = this.#getSideSelectionPriority(sidePriority, SIDE_PRIORITIES, i, mapWidth), i_L = getAdjacency(D, mapWidth, i, D.l), leftIsAir = pixels[i_L] == AIR, i_TL = getAdjacency(D, mapWidth, i, D.tl), i_TR = getAdjacency(D, mapWidth, i, D.tr), i_R = getAdjacency(D, mapWidth, i, D.r)
                    if (isLeftFirst) {
                        if (pixels[i_TL] == AIR && leftIsAir) newIndex = i_TL
                        else if (pixels[i_TR] == AIR && pixels[i_R] == AIR) newIndex = i_TR
                        else if (leftIsAir) newIndex = i_L
                        else if (pixels[i_R] == AIR) newIndex = i_R
                    } else {
                        if (pixels[i_TR] == AIR && pixels[i_R] == AIR) newIndex = i_TR
                        else if (pixels[i_TL] == AIR && leftIsAir) newIndex = i_TL
                        else if (pixels[i_R] == AIR) newIndex = i_R
                        else if (leftIsAir) newIndex = i_L
                    }
                }
            }

            // UPDATE
            if (newIndex != -1) {
                pxStepUpdated[newIndex] = 1
                pixels[newIndex] = newMaterial
                pixels[i] = replaceMaterial
            }
        }

        return pixels
    }

    /**
    * Returns whether the side priority is left or not 
    * @param {Number?} i The index of the pixel (used internally for the MAP_DEPENDANT mode) 
    * @param {Number?} mapWidth The width of the map (used internally for the MAP_DEPENDANT mode) 
    * @returns Whether the side priority is left first or not
    */
    #getSideSelectionPriority(sidePriority, SIDE_PRIORITIES, i, mapWidth) {
        const isRandom = sidePriority==SIDE_PRIORITIES.RANDOM, isLeft = sidePriority==SIDE_PRIORITIES.LEFT
        let leftFirst = isLeft
        if (isRandom) leftFirst = Math.random()<0.5
        else if (sidePriority==SIDE_PRIORITIES.MAP_DEPENDANT) leftFirst = (i%mapWidth)<(mapWidth/2)
        return leftFirst
    }
}