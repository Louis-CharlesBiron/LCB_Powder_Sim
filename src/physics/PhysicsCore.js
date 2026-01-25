class PhysicsCore {
    constructor(type) {
        this._type = type
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
        if (direction === D.b)       return i+dWidth
        else if (direction === D.t)  return i-dWidth
        else if (direction === D.r)  return (i+1)%mapWidth ? i+distance : i
        else if (direction === D.l)  return i%mapWidth     ? i-distance : i
        else if (direction === D.tr) return (i-dWidth+1)%mapWidth ? i-dWidth+distance : i
        else if (direction === D.br) return (i+dWidth+1)%mapWidth ? i+dWidth+distance : i
        else if (direction === D.tl) return (i-dWidth)%mapWidth   ? i-dWidth-distance : i
        else if (direction === D.bl) return (i+dWidth)%mapWidth   ? i+dWidth-distance : i
    }

    /**
    * Runs one physics step
    */
    step(pixels, pxStepUpdated, pxStates, sidePriority, mapWidth, M, G, D, S, SG, P) {// TODO OPTIMIZE AGAIN
        const p_ll = pixels.length-1, AIR = M.AIR, getAdjacency = this.getAdjacency, PX = 1, STATE = 2
        pxStepUpdated.fill(0)

        for (let i=p_ll;i>=0;i--) {
            const mat = pixels[i]
            if (mat === AIR || pxStepUpdated[i]) continue
            let newMaterial = mat, newIndex = -1, replaceMaterial = AIR

            // SAND
            if (mat === M.SAND) {
                const i_B = getAdjacency(D, mapWidth, i, D.b), transpiercedMaterial = pixels[i_B], transpierceable = transpiercedMaterial&G.TRANSPIERCEABLE
                // check if can go down or sides
                if (transpiercedMaterial === AIR || transpierceable) newIndex = i_B
                else {
                    const isLeftFirst = this.#getSideSelectionPriority(sidePriority, P, i, mapWidth), i_BL = getAdjacency(D, mapWidth, i, D.bl), i_BR = getAdjacency(D, mapWidth, i, D.br)
                    if (isLeftFirst) {
                        if (pixels[i_BL] === AIR) newIndex = i_BL
                        else if (pixels[i_BR] === AIR) newIndex = i_BR
                    } else {
                        if (pixels[i_BR] === AIR) newIndex = i_BR
                        else if (pixels[i_BL] === AIR) newIndex = i_BL
                    }
                }
                // check what to replace prev pos with
                if (newIndex !== -1 && (
                    pixels[getAdjacency(D, mapWidth, i, D.l)]&G.LIQUIDS ||
                    pixels[getAdjacency(D, mapWidth, i, D.r)]&G.LIQUIDS ||
                    pixels[getAdjacency(D, mapWidth, i, D.t)]===M.AIR)
                ) replaceMaterial = pixels[newIndex]
            }

            // WATER
            else if (mat === M.WATER) {
                const i_B = getAdjacency(D, mapWidth, i, D.b), transpiercedMaterial = pixels[i_B]
                // check if can go down or sides
                if (transpiercedMaterial === AIR) newIndex = i_B
                else {
                    const isLeftFirst = this.#getSideSelectionPriority(sidePriority, P, i, mapWidth), i_L = getAdjacency(D, mapWidth, i, D.l), leftIsAir = pixels[i_L] === AIR, i_BL = getAdjacency(D, mapWidth, i, D.bl), i_BR = getAdjacency(D, mapWidth, i, D.br), i_R = getAdjacency(D, mapWidth, i, D.r)
                    if (isLeftFirst) {
                        if (pixels[i_BL] === AIR && leftIsAir) newIndex = i_BL
                        else if (pixels[i_BR] === AIR && pixels[i_R] === AIR) newIndex = i_BR
                        else if (leftIsAir) newIndex = i_L
                        else if (pixels[i_R] === AIR) newIndex = i_R
                    } else {
                        if (pixels[i_BR] === AIR && pixels[i_R] === AIR) newIndex = i_BR
                        else if (pixels[i_BL] === AIR && leftIsAir) newIndex = i_BL
                        else if (pixels[i_R] === AIR) newIndex = i_R
                        else if (leftIsAir) newIndex = i_L
                    }
                }
            }

            // GRAVEL
            else if (mat === M.GRAVEL) {
                const i_B = getAdjacency(D, mapWidth, i, D.b), transpiercedMaterial = pixels[i_B], transpiercedLiquid = transpiercedMaterial&G.LIQUIDS
                // check if can go down
                if (transpiercedMaterial === AIR || transpiercedLiquid) newIndex = i_B
                // check what to replace prev pos with
                if (transpiercedLiquid && (pixels[getAdjacency(D, mapWidth, i, D.l)]&G.LIQUIDS || pixels[getAdjacency(D, mapWidth, i, D.r)]&G.LIQUIDS)) replaceMaterial = transpiercedLiquid
            }

            // INVERTED WATER
            else if (mat === M.INVERTED_WATER) {
                const i_T = getAdjacency(D, mapWidth, i, D.t), transpiercedMaterial = pixels[i_T]
                // check if can go up or sides
                if (transpiercedMaterial === AIR) newIndex = i_T
                else {
                    const isLeftFirst = this.#getSideSelectionPriority(sidePriority, P, i, mapWidth), i_L = getAdjacency(D, mapWidth, i, D.l), leftIsAir = pixels[i_L] === AIR, i_TL = getAdjacency(D, mapWidth, i, D.tl), i_TR = getAdjacency(D, mapWidth, i, D.tr), i_R = getAdjacency(D, mapWidth, i, D.r)
                    if (isLeftFirst) {
                        if (pixels[i_TL] === AIR && leftIsAir) newIndex = i_TL
                        else if (pixels[i_TR] === AIR && pixels[i_R] === AIR) newIndex = i_TR
                        else if (leftIsAir) newIndex = i_L
                        else if (pixels[i_R] === AIR) newIndex = i_R
                    } else {
                        if (pixels[i_TR] === AIR && pixels[i_R] === AIR) newIndex = i_TR
                        else if (pixels[i_TL] === AIR && leftIsAir) newIndex = i_TL
                        else if (pixels[i_R] === AIR) newIndex = i_R
                        else if (leftIsAir) newIndex = i_L
                    }
                }
            }

            // CONTAMINANT
            else if (mat === M.CONTAMINANT) {
                const i_B = getAdjacency(D, mapWidth, i, D.b), transpiercedMaterial = pixels[i_B]
                // check if can go down or sides
                if (transpiercedMaterial === AIR) newIndex = i_B
                else {
                    const isLeftFirst = this.#getSideSelectionPriority(sidePriority, P, i, mapWidth), 
                    i_L = getAdjacency(D, mapWidth, i, D.l), 
                    i_R = getAdjacency(D, mapWidth, i, D.r),
                    i_T = getAdjacency(D, mapWidth, i, D.t),
                    
                    leftIsAir = pixels[i_L] === AIR, 
                    i_BL = getAdjacency(D, mapWidth, i, D.bl), 
                    i_BR = getAdjacency(D, mapWidth, i, D.br)

                    if (Math.random()>0.5 && pixels[i_L]&G.CONTAMINABLE) {
                        pixels[i_L] = M.CONTAMINANT
                        pxStepUpdated[i_L] = PX
                    }
                    if (Math.random()>0.5 && pixels[i_R]&G.CONTAMINABLE) {
                        pixels[i_R] = M.CONTAMINANT
                        pxStepUpdated[i_R] = PX
                    }
                    if (Math.random()>0.5 && pixels[i_T]&G.CONTAMINABLE) {
                        pixels[i_T] = M.CONTAMINANT
                        pxStepUpdated[i_T] = PX
                    }
                    if (Math.random()>0.5 && pixels[i_B]&G.CONTAMINABLE) {
                        pixels[i_B] = M.CONTAMINANT
                        pxStepUpdated[i_B] = PX
                    }

                    if (isLeftFirst) {
                        if (pixels[i_BL] === AIR && leftIsAir) newIndex = i_BL
                        else if (pixels[i_BR] === AIR && pixels[i_R] === AIR) newIndex = i_BR
                        else if (leftIsAir) newIndex = i_L
                        else if (pixels[i_R] === AIR) newIndex = i_R
                    } else {
                        if (pixels[i_BR] === AIR && pixels[i_R] === AIR) newIndex = i_BR
                        else if (pixels[i_BL] === AIR && leftIsAir) newIndex = i_BL
                        else if (pixels[i_R] === AIR) newIndex = i_R
                        else if (leftIsAir) newIndex = i_L
                    }
                }
            }

            // LAVA
            else if (mat === M.LAVA) {
                const i_B = getAdjacency(D, mapWidth, i, D.b), transpiercedMaterial = pixels[i_B]
                // check if can go down or sides
                if (transpiercedMaterial === AIR) newIndex = i_B
                else {
                    const isLeftFirst = this.#getSideSelectionPriority(sidePriority, P, i, mapWidth),
                    i_L = getAdjacency(D, mapWidth, i, D.l),
                    i_R = getAdjacency(D, mapWidth, i, D.r),
                    i_T = getAdjacency(D, mapWidth, i, D.t),

                    leftIsAir = pixels[i_L] === AIR,
                    i_BL = getAdjacency(D, mapWidth, i, D.bl),
                    i_BR = getAdjacency(D, mapWidth, i, D.br)
                    
   
                    if (pixels[i_L]&G.LIQUIDS || pixels[i_R]&G.LIQUIDS || pixels[i_T]&G.LIQUIDS || pixels[i_B]&G.LIQUIDS) {
                        pixels[i] = M.STONE
                        pxStepUpdated[i] = PX
                    } else if ((pixels[i_L]&G.MELTABLE || pixels[i_R]&G.MELTABLE || pixels[i_T]&G.MELTABLE || pixels[i_B]&G.MELTABLE) && Math.random()>0.999) {
                        // TODO PLZ SOMETHING BETTER
                        if (pixels[i_L]&G.MELTABLE) {
                            pixels[i_L] = M.LAVA
                            pxStepUpdated[i_L] = PX
                        } else if (pixels[i_R]&G.MELTABLE) {
                            pixels[i_R] = M.LAVA
                            pxStepUpdated[i_R] = PX
                        } else if (pixels[i_B]&G.MELTABLE) {
                            pixels[i_B] = M.LAVA
                            pxStepUpdated[i_B] = PX
                        } else if (pixels[i_T]&G.MELTABLE) {
                            pixels[i_T] = M.LAVA
                            pxStepUpdated[i_T] = PX
                        }
                    }
                    else if (Math.random()>0.935) {
                        if (isLeftFirst) {
                            if (pixels[i_BL] === AIR && leftIsAir) newIndex = i_BL
                            else if (pixels[i_BR] === AIR && pixels[i_R] === AIR) newIndex = i_BR
                            else if (leftIsAir) newIndex = i_L
                            else if (pixels[i_R] === AIR) newIndex = i_R
                        } else {
                            if (pixels[i_BR] === AIR && pixels[i_R] === AIR) newIndex = i_BR
                            else if (pixels[i_BL] === AIR && leftIsAir) newIndex = i_BL
                            else if (pixels[i_R] === AIR) newIndex = i_R
                            else if (leftIsAir) newIndex = i_L
                        }
                    }
                }
            }
            // ELECTRICITY
            else if (mat === M.ELECTRICITY) {
                const i_B = getAdjacency(D, mapWidth, i, D.b),
                      i_T = getAdjacency(D, mapWidth, i, D.t),
                      i_R = getAdjacency(D, mapWidth, i, D.r),
                      i_L = getAdjacency(D, mapWidth, i, D.l),
                      p_B = pixels[i_B]

                // check if can go down or sides
                if (p_B === AIR) newIndex = i_B
                else {
                    // TODO OPTIMIZE PLZPLZPLPZLZ BITMASK THIS
                    if (p_B === M.COPPER && (!pxStates[i_B] || pxStates[i_B] === S.COPPER.DISABLED || pxStates[i_B] === S.COPPER.LIT)) {
                        pxStates[i_B] = S.COPPER.ORIGIN
                        pxStepUpdated[i_B] = STATE
                    }
                    if (pixels[i_T] === M.COPPER && (!pxStates[i_T] || pxStates[i_T] === S.COPPER.DISABLED || pxStates[i_T] === S.COPPER.LIT)) {
                        pxStates[i_T] = S.COPPER.ORIGIN
                        pxStepUpdated[i_T] = STATE
                    }
                    if (pixels[i_R] === M.COPPER && (!pxStates[i_R] || pxStates[i_R] === S.COPPER.DISABLED || pxStates[i_R] === S.COPPER.LIT)) {
                        pxStates[i_R] = S.COPPER.ORIGIN
                        pxStepUpdated[i_R] = STATE
                    }
                    if (pixels[i_L] === M.COPPER && (!pxStates[i_L] ||pxStates[i_L] === S.COPPER.DISABLED || pxStates[i_L] === S.COPPER.LIT)) {
                        pxStates[i_L] = S.COPPER.ORIGIN
                        pxStepUpdated[i_L] = STATE
                    }
                }
            }
            // COPPER
            else if (mat === M.COPPER) {
                
                /*
                    // TODO SEVERE OPTIMIZATIONS PLZPLZPLPZLZ 
                    FIRST LIT (DONE)
                    0 -> ORIGIN (by electricity) OK
                    0 -> LIT (by origin) OK ---1
                    0 -> LIT (by lit) [propagation] OK ---2

                    FIRST DISABLE (DONE)
                    ORIGIN -> DISABLED (by !electricity) OK ---3
                    LIT -> DISABLED (by disabled) [propagation] OK ---4

                    SECOND LIT (TODO)
                    DISABLED -> ORIGIN (by electricity) OK
                    DISABLED -> 0 (by origin) ---5
                    DISABLED -> 0 (by 0) [propagation] OK ---6
                */

                const i_B = getAdjacency(D, mapWidth, i, D.b),
                      i_T = getAdjacency(D, mapWidth, i, D.t),
                      i_R = getAdjacency(D, mapWidth, i, D.r),
                      i_L = getAdjacency(D, mapWidth, i, D.l)


                // IF ORIGIN AND NOT CONNETED TO ELECTRICITY -> DISABLED
                if (pxStates[i] === S.COPPER.ORIGIN) {// ---3
                    if (pixels[i_B] !== M.ELECTRICITY && pixels[i_T] !== M.ELECTRICITY && pixels[i_R] !== M.ELECTRICITY && pixels[i_L] !== M.ELECTRICITY) {
                        //console.log("TURN OFF")
                        pxStates[i] = S.COPPER.DISABLED
                        pxStepUpdated[i] = STATE
                    }
                }
                // IF EMPTY AND CONNECTED TO LIT/ORIGIN -> LIT
                else if (!pxStates[i]) {// ---1 + ---2
                    if (pixels[i_B] === mat && pxStates[i_B]&SG.COPPER.ACTIVATED) {
                        //console.log("LIT")
                        pxStates[i] = S.COPPER.LIT
                        pxStepUpdated[i] = STATE
                        pxStepUpdated[i_T] = STATE
                        pxStepUpdated[i_R] = STATE
                        pxStepUpdated[i_L] = STATE
                    }
                    if (pixels[i_T] === mat && pxStates[i_T]&SG.COPPER.ACTIVATED) {
                        //console.log("LIT")
                        pxStates[i] = S.COPPER.LIT
                        pxStepUpdated[i] = STATE
                        pxStepUpdated[i_B] = STATE
                        pxStepUpdated[i_R] = STATE
                        pxStepUpdated[i_L] = STATE
                    }
                    if (pixels[i_R] === mat && pxStates[i_R]&SG.COPPER.ACTIVATED) {
                        //console.log("LIT")
                        pxStates[i] = S.COPPER.LIT
                        pxStepUpdated[i] = STATE
                        pxStepUpdated[i_T] = STATE
                        pxStepUpdated[i_B] = STATE
                        pxStepUpdated[i_L] = STATE
                    }
                    if (pixels[i_L] === mat && pxStates[i_L]&SG.COPPER.ACTIVATED) {
                        //console.log("LIT")
                        pxStates[i] = S.COPPER.LIT
                        pxStepUpdated[i] = STATE
                        pxStepUpdated[i_T] = STATE
                        pxStepUpdated[i_B] = STATE
                        pxStepUpdated[i_R] = STATE
                    }
                } else if (pxStates[i] === S.COPPER.LIT) {// ---4
                    // IF NOT CONNECTED TO ELECTRICITY ANYMORE -> DISABLE
                    if (pixels[i_B] === mat && pxStates[i_B] === S.COPPER.DISABLED) {
                        //console.log("-> DISABLE")
                        pxStates[i] = S.COPPER.DISABLED
                        pxStepUpdated[i] = STATE
                        pxStepUpdated[i_T] = STATE//
                        pxStepUpdated[i_B] = STATE//
                        pxStepUpdated[i_R] = STATE//
                        pxStepUpdated[i_L] = STATE//
                    }
                    if (pixels[i_T] === mat && pxStates[i_T] === S.COPPER.DISABLED) {
                        //console.log("-> DISABLE")
                        pxStates[i] = S.COPPER.DISABLED
                        pxStepUpdated[i] = STATE
                        pxStepUpdated[i_T] = STATE
                        pxStepUpdated[i_B] = STATE
                        pxStepUpdated[i_R] = STATE
                        pxStepUpdated[i_L] = STATE
                    }
                    if (pixels[i_R] === mat && pxStates[i_R] === S.COPPER.DISABLED) {
                        //console.log("-> DISABLE")
                        pxStates[i] = S.COPPER.DISABLED
                        pxStepUpdated[i] = STATE
                        pxStepUpdated[i_T] = STATE
                        pxStepUpdated[i_B] = STATE
                        pxStepUpdated[i_R] = STATE
                        pxStepUpdated[i_L] = STATE
                    }
                    if (pixels[i_L] === mat && pxStates[i_L] === S.COPPER.DISABLED) {
                        //console.log("-> DISABLE")
                        pxStates[i] = S.COPPER.DISABLED
                        pxStepUpdated[i] = STATE
                        pxStepUpdated[i_T] = STATE
                        pxStepUpdated[i_B] = STATE
                        pxStepUpdated[i_R] = STATE
                        pxStepUpdated[i_L] = STATE
                    }
                } 
                else if (pxStates[i] === S.COPPER.DISABLED) {// ---5 + ---6
                    // START RESET
                    if (pixels[i_B] === mat && (pxStates[i_B] === S.COPPER.ORIGIN || !pxStates[i_B])) {
                        //console.log("START RESET")
                        pxStates[i] = 0
                        //pxStepUpdated[i] = STATE
                    }
                    if (pixels[i_T] === mat && (pxStates[i_T] === S.COPPER.ORIGIN || !pxStates[i_T])) {
                        //console.log("START RESET")
                        pxStates[i] = 0
                        //pxStepUpdated[i] = STATE
                    }
                    if (pixels[i_R] === mat && (pxStates[i_R] === S.COPPER.ORIGIN || !pxStates[i_R])) {
                        //console.log("START RESET")
                        pxStates[i] = 0
                        //pxStepUpdated[i] = STATE
                    }
                    if (pixels[i_L] === mat && (pxStates[i_L] === S.COPPER.ORIGIN || !pxStates[i_L])) {
                        //console.log("START RESET")
                        pxStates[i] = 0
                        //pxStepUpdated[i] = STATE
                    }
                }


            }




            // UPDATE
            if (newIndex !== -1) {
                pxStepUpdated[newIndex] = PX
                pixels[newIndex] = newMaterial
                pixels[i] = replaceMaterial
            }
        }

        /*console.log(
            pxStates[429],
            pxStates[459],
            pxStates[489],
            pxStates[549],
            "|",
            pxStates[550],
            pxStates[551],
            pxStates[552],
            pxStates[553],
            pxStates[554],
            pxStates[555],
            pxStates[556],
            pxStates[557],
            pxStates[558],
            pxStates[559],
            pxStates[560],
            pxStates[561],
            pxStates[562],
            pxStates[563],
            "|",
            pxStates[533],
            pxStates[503],
            pxStates[473],
            pxStates[443],
            pxStates[413],
        )*/
    }

    /**
    * Returns whether the side priority is left or not 
    * @param {Number?} i The index of the pixel (used internally for the MAP_DEPENDANT mode) 
    * @param {Number?} mapWidth The width of the map (used internally for the MAP_DEPENDANT mode) 
    * @returns Whether the side priority is left first or not
    */
    #getSideSelectionPriority(sidePriority, SIDE_PRIORITIES, i, mapWidth) {
        const isRandom = sidePriority===SIDE_PRIORITIES.RANDOM, isLeft = sidePriority===SIDE_PRIORITIES.LEFT
        let leftFirst = isLeft
        if (isRandom) leftFirst = Math.random()<0.5
        else if (sidePriority===SIDE_PRIORITIES.MAP_DEPENDANT) leftFirst = (i%mapWidth)<(mapWidth/2)
        return leftFirst
    }
}