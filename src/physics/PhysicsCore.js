class PhysicsCore {
    static D = {t:1<<0, r:1<<1, b:1<<2, l:1<<3, br:1<<4, bl:1<<5, tr:1<<6, tl:1<<7}

    static #RANDOM_CACHE = null
    static #RANDOM_TABLE_SIZE = 1<<16
    static #RANDOM_INDEX = 0

    static #SAND_SP_BIT = 1<<6
    static #SAND_TABLE_SIZE = 1<<7
    static #SAND_MOVES = {I:0, B:1, BR:2, BL:3}
    static #SAND_CACHE = new Int32Array(PhysicsCore.#SAND_TABLE_SIZE)

    static #WATER_SP_BIT = 1<<6
    static #WATER_TABLE_SIZE = 1<<7
    static #WATER_MOVES = {I:0, B:1, R:2, L:3, BR:4, BL:5}
    static #WATER_CACHE = new Int32Array(PhysicsCore.#WATER_TABLE_SIZE)

    static {
        // FILL CACHED RANDOM TABLE 
        const rt_ll = PhysicsCore.#RANDOM_TABLE_SIZE, table = PhysicsCore.#RANDOM_CACHE = new Float32Array(rt_ll)
        for (let i=0;i<rt_ll;i++) table[i] = Math.random()

        const D = PhysicsCore.D

        // FILL CACHED WATER TABLE
        const water_ll = PhysicsCore.#WATER_TABLE_SIZE, water_cache = PhysicsCore.#WATER_CACHE
        for (let i=0;i<water_ll;i++) water_cache[i] = PhysicsCore.#updateCachedWaterTable(PhysicsCore.D, i)

        // FILL CACHED WATER TABLE
        const sand_ll = PhysicsCore.#SAND_TABLE_SIZE, sand_cache = PhysicsCore.#SAND_CACHE
        for (let i=0;i<sand_ll;i++) sand_cache[i] = PhysicsCore.#updateCachedSandTable(PhysicsCore.D, i)
    }

    static #updateCachedWaterTable(D, mask) {
        const isLeftFirst = mask & PhysicsCore.#WATER_SP_BIT, MOVES = PhysicsCore.#WATER_MOVES,
              b = mask & D.b,
              r = mask & D.r,
              l = mask & D.l,
              br = mask & D.br,
              bl = mask & D.bl

        if (b) return MOVES.B
        if (isLeftFirst) {
            if (bl) return MOVES.BL
            if (br) return MOVES.BR
            if (l) return MOVES.L
            if (r) return MOVES.R
        } else {
            if (br) return MOVES.BR
            if (bl) return MOVES.BL
            if (r) return MOVES.R
            if (l) return MOVES.L
        }
        return MOVES.I
    }

    static #updateCachedSandTable(D, mask) {
        const isLeftFirst = mask & PhysicsCore.#SAND_SP_BIT, MOVES = PhysicsCore.#SAND_MOVES,
              b = mask & D.b,
              br = mask & D.br,
              bl = mask & D.bl

        if (b) return MOVES.B
        if (isLeftFirst) {
            if (bl) return MOVES.BL
            if (br) return MOVES.BR
        } else {
            if (br) return MOVES.BR
            if (bl) return MOVES.BL
        }
        return MOVES.I
    }

    /**
    * Runs one physics step
    */
    step(pixels, pxStepUpdated, pxStates, sidePriority, mapWidth, mapHeight, M, G, D, S, SG, P) {// TODO OPTIMIZE AGAIN
        const p_ll = pixels.length-1, AIR = M.AIR, PX = 1, STATE = 2,
              RT = PhysicsCore.#RANDOM_CACHE, RS = PhysicsCore.#RANDOM_TABLE_SIZE-1, SP_RANDOM = sidePriority===P.RANDOM, SP_LEFT = sidePriority===P.LEFT, SP_RIGHT = sidePriority===P.RIGHT, width2 = mapWidth>>1
        pxStepUpdated.fill(0)


        // TODO CLEANUP
        const WATER_MOVES = PhysicsCore.#WATER_MOVES, WATER_CACHE = PhysicsCore.#WATER_CACHE, WATER_SP_BIT = PhysicsCore.#WATER_SP_BIT
        const SAND_MOVES = PhysicsCore.#SAND_MOVES, SAND_CACHE = PhysicsCore.#SAND_CACHE, SAND_SP_BIT = PhysicsCore.#SAND_SP_BIT

        function getSideSelectionPriority(i) {
            if (SP_LEFT) return true
            if (SP_RIGHT) return false
            if (SP_RANDOM) return RT[PhysicsCore.#RANDOM_INDEX++&(PhysicsCore.#RANDOM_TABLE_SIZE-1)] < 0.5
            return (i%mapWidth) < width2
        }

        const a = 0             // TODO CLEANUP 
        if (a) console.time(".")// (8.63ms avg)

        for (let i=p_ll;i>=0;i--) {
            const mat = pixels[i]
            if (mat === AIR || pxStepUpdated[i]) continue
            const x = i%mapWidth, y = (i/mapWidth)|0, hasL = x>0, hasR = x<mapWidth-1, hasT = y>0, hasB = y<mapHeight-1,
                  i_B  = hasB ? i+mapWidth:i, i_T  = hasT ? i-mapWidth:i, i_L  = hasL ? i-1:i, i_R  = hasR ? i+1:i, i_BL = (hasB&&hasL) ? i+mapWidth - 1:i, i_BR = (hasB&&hasR) ? i+mapWidth+1:i,
                  p_B = pixels[i_B], p_R = pixels[i_R], p_L = pixels[i_L]

            let newMaterial = mat, newIndex = -1, replaceMaterial = AIR

            // SAND
            if (mat === M.SAND) {
                const m_B = p_B&G.TRANSPIERCEABLE

                let stack = 0
                stack |= (p_B === AIR || (p_B&G.TRANSPIERCEABLE) !== 0)*D.b // B - GO THROUGH TRANSPIERCEABLE
                stack |= (pixels[i_BR] === AIR)*D.br                        // BR - GO THROUGH AIR
                stack |= (pixels[i_BL] === AIR)*D.bl                        // BL - GO THROUGH AIR
                if (getSideSelectionPriority(i)) stack |= SAND_SP_BIT

                const move = SAND_CACHE[stack]
                if      (move === SAND_MOVES.B)  newIndex = i_B
                else if (move === SAND_MOVES.BR) newIndex = i_BR
                else if (move === SAND_MOVES.BL) newIndex = i_BL

                if (newIndex !== -1 && (p_L&G.LIQUIDS || p_R&G.LIQUIDS || pixels[i_T]===AIR)) replaceMaterial = m_B
            }

            // WATER
            else if (mat === M.WATER) {
                let stack = 0
                stack |= (p_B === AIR)*D.b           // B - GO THROUGH AIR
                stack |= (pixels[i_BR] === AIR)*D.br // BR - GO THROUGH AIR
                stack |= (pixels[i_BL] === AIR)*D.bl // BL - GO THROUGH AIR
                stack |= (p_R === AIR)*D.r           // R - GO THROUGH AIR
                stack |= (p_L === AIR)*D.l           // L - GO THROUGH AIR
                if (getSideSelectionPriority(i)) stack |= WATER_SP_BIT

                const move = WATER_CACHE[stack]
                if      (move === WATER_MOVES.B)  newIndex = i_B
                else if (move === WATER_MOVES.BR) newIndex = i_BR
                else if (move === WATER_MOVES.BL) newIndex = i_BL
                else if (move === WATER_MOVES.R)  newIndex = i_R
                else if (move === WATER_MOVES.L)  newIndex = i_L
            }

            // GRAVEL
            else if (mat === M.GRAVEL) {
                const transpiercedLiquid = p_B&G.LIQUIDS
                // check if can go down
                if (p_B === AIR || transpiercedLiquid) newIndex = i_B
                // check what to replace prev pos with
                if (transpiercedLiquid && (p_L&G.LIQUIDS || p_R&G.LIQUIDS)) replaceMaterial = transpiercedLiquid
            }

            // INVERTED WATER
            else if (mat === M.INVERTED_WATER) {
                const i_T = ADJ[D.t], transpiercedMaterial = pixels[i_T]
                // check if can go up or sides
                if (transpiercedMaterial === AIR) newIndex = i_T
                else {
                    const isLeftFirst = getSideSelectionPriority(i), leftIsAir = p_L === AIR, i_TL = ADJ[D.tl], i_TR = ADJ[D.tr]
                    if (isLeftFirst) {
                        if (pixels[i_TL] === AIR && leftIsAir) newIndex = i_TL
                        else if (pixels[i_TR] === AIR && p_R === AIR) newIndex = i_TR
                        else if (leftIsAir) newIndex = i_L
                        else if (p_R === AIR) newIndex = i_R
                    } else {
                        if (pixels[i_TR] === AIR && p_R === AIR) newIndex = i_TR
                        else if (pixels[i_TL] === AIR && leftIsAir) newIndex = i_TL
                        else if (p_R === AIR) newIndex = i_R
                        else if (leftIsAir) newIndex = i_L
                    }
                }
            }

            // CONTAMINANT
            else if (mat === M.CONTAMINANT) {
                // check if can go down or sides
                if (p_B === AIR) newIndex = i_B
                else {
                    const isLeftFirst = getSideSelectionPriority(i),  i_T = ADJ[D.t],
                    leftIsAir = p_L === AIR, 
                    i_BL = ADJ[D.bl], 
                    i_BR = ADJ[D.br]

                    if (RT[PhysicsCore.#RANDOM_INDEX++&RS]>0.5 && p_L&G.CONTAMINABLE) {
                        pixels[i_L] = M.CONTAMINANT
                        pxStepUpdated[i_L] = PX
                    }
                    if (RT[PhysicsCore.#RANDOM_INDEX++&RS]>0.5 && p_R&G.CONTAMINABLE) {
                        pixels[i_R] = M.CONTAMINANT
                        pxStepUpdated[i_R] = PX
                    }
                    if (RT[PhysicsCore.#RANDOM_INDEX++&RS]>0.5 && pixels[i_T]&G.CONTAMINABLE) {
                        pixels[i_T] = M.CONTAMINANT
                        pxStepUpdated[i_T] = PX
                    }
                    if (RT[PhysicsCore.#RANDOM_INDEX++&RS]>0.5 && p_B&G.CONTAMINABLE) {
                        pixels[i_B] = M.CONTAMINANT
                        pxStepUpdated[i_B] = PX
                    }

                    if (isLeftFirst) {
                        if (pixels[i_BL] === AIR && leftIsAir) newIndex = i_BL
                        else if (pixels[i_BR] === AIR && p_R === AIR) newIndex = i_BR
                        else if (leftIsAir) newIndex = i_L
                        else if (p_R === AIR) newIndex = i_R
                    } else {
                        if (pixels[i_BR] === AIR && p_R === AIR) newIndex = i_BR
                        else if (pixels[i_BL] === AIR && leftIsAir) newIndex = i_BL
                        else if (p_R === AIR) newIndex = i_R
                        else if (leftIsAir) newIndex = i_L
                    }
                }
            }

            // LAVA
            else if (mat === M.LAVA) {
                // check if can go down or sides
                if (p_B === AIR) newIndex = i_B
                else {
                    const isLeftFirst = getSideSelectionPriority(i), i_T = ADJ[D.t],
                    leftIsAir = p_L === AIR,
                    i_BL = ADJ[D.bl],
                    i_BR = ADJ[D.br],
                    p_T = pixels[i_T]
                    
   
                    if (p_L&G.LIQUIDS || p_R&G.LIQUIDS || p_T&G.LIQUIDS || p_B&G.LIQUIDS) {
                        pixels[i] = M.STONE
                        pxStepUpdated[i] = PX
                    } else if ((p_L&G.MELTABLE || p_R&G.MELTABLE || p_T&G.MELTABLE || p_B&G.MELTABLE) && RT[PhysicsCore.#RANDOM_INDEX++&RS]>0.999) {
                        // TODO PLZ SOMETHING BETTER
                        if (p_L&G.MELTABLE) {
                            pixels[i_L] = M.LAVA
                            pxStepUpdated[i_L] = PX
                        } else if (p_R&G.MELTABLE) {
                            pixels[i_R] = M.LAVA
                            pxStepUpdated[i_R] = PX
                        } else if (p_B&G.MELTABLE) {
                            pixels[i_B] = M.LAVA
                            pxStepUpdated[i_B] = PX
                        } else if (p_T&G.MELTABLE) {
                            pixels[i_T] = M.LAVA
                            pxStepUpdated[i_T] = PX
                        }
                    }
                    else if (RT[PhysicsCore.#RANDOM_INDEX++&RS]>0.935) {
                        if (isLeftFirst) {
                            if (pixels[i_BL] === AIR && leftIsAir) newIndex = i_BL
                            else if (pixels[i_BR] === AIR && p_R === AIR) newIndex = i_BR
                            else if (leftIsAir) newIndex = i_L
                            else if (p_R === AIR) newIndex = i_R
                        } else {
                            if (pixels[i_BR] === AIR && p_R === AIR) newIndex = i_BR
                            else if (pixels[i_BL] === AIR && leftIsAir) newIndex = i_BL
                            else if (p_R === AIR) newIndex = i_R
                            else if (leftIsAir) newIndex = i_L
                        }
                    }
                }
            }
            // ELECTRICITY
            else if (mat === M.ELECTRICITY) {
                const i_T = ADJ[D.t]
                      ORIGIN = SG.COPPER.ORIGIN


                // check if can go down or sides
                if (p_B === AIR) newIndex = i_B
                else {
                    // TODO OPTIMIZE PLZPLZPLPZLZ BITMASK THIS
                    if (p_B === M.COPPER && (!pxStates[i_B] || pxStates[i_B] === S.COPPER.DISABLED || pxStates[i_B] === S.COPPER.LIT)) {
                        pxStates[i_B] = ORIGIN
                        pxStepUpdated[i_B] = STATE
                    }
                    if (pixels[i_T] === M.COPPER && (!pxStates[i_T] || pxStates[i_T] === S.COPPER.DISABLED || pxStates[i_T] === S.COPPER.LIT)) {
                        pxStates[i_T] = ORIGIN
                        pxStepUpdated[i_T] = STATE
                    }
                    if (p_R === M.COPPER && (!pxStates[i_R] || pxStates[i_R] === S.COPPER.DISABLED || pxStates[i_R] === S.COPPER.LIT)) {
                        pxStates[i_R] = ORIGIN
                        pxStepUpdated[i_R] = STATE
                    }
                    if (p_L === M.COPPER && (!pxStates[i_L] ||pxStates[i_L] === S.COPPER.DISABLED || pxStates[i_L] === S.COPPER.LIT)) {
                        pxStates[i_L] = ORIGIN
                        pxStepUpdated[i_L] = STATE
                    }
                }
            }
            // COPPER
            else if (mat === M.COPPER) {
                // TODO SEVERE OPTIMIZATIONS PLZPLZPLPZLZ 

                //    FIRST LIT
                //    0 -> ORIGIN (by electricity) OK
                //    0 -> LIT (by origin) OK ---1
                //    0 -> LIT (by lit) [propagation] OK ---2

                //    FIRST DISABLE
                //    ORIGIN -> DISABLED (by !electricity) OK ---3
                //    LIT -> DISABLED (by disabled) [propagation] OK ---4

                //    SECOND LIT
                //    DISABLED -> ORIGIN (by electricity) OK
                //    DISABLED -> 0 (by origin) ---5
                //    DISABLED -> 0 (by 0) [propagation] OK ---6
                

                const i_T = ADJ[D.t], p_T = pixels[i_T],
                      state = pxStates[i],

                      ACTIVATED = SG.COPPER.ACTIVATED,
                      ORIGIN = SG.COPPER.ORIGIN,
                      ELECTRICITY = M.ELECTRICITY


                // IF ORIGIN AND NOT CONNETED TO ELECTRICITY -> DISABLED
                if (state === ORIGIN) {// ---3
                    if (p_B !== ELECTRICITY && p_T !== ELECTRICITY && p_R !== ELECTRICITY && p_L !== ELECTRICITY) {
                        pxStates[i] = S.COPPER.DISABLED
                        pxStepUpdated[i] = STATE
                    }
                }
                // IF EMPTY AND CONNECTED TO LIT/ORIGIN -> LIT
                else if (!state) {// ---1 + ---2
                    if (p_B === mat && pxStates[i_B]&ACTIVATED) {
                        pxStates[i] = S.COPPER.LIT
                        pxStepUpdated[i] = STATE
                        pxStepUpdated[i_T] = STATE
                        pxStepUpdated[i_R] = STATE
                        pxStepUpdated[i_L] = STATE
                    }
                    if (p_T === mat && pxStates[i_T]&ACTIVATED) {
                        pxStates[i] = S.COPPER.LIT
                        pxStepUpdated[i] = STATE
                        pxStepUpdated[i_B] = STATE
                        pxStepUpdated[i_R] = STATE
                        pxStepUpdated[i_L] = STATE
                    }
                    if (p_R === mat && pxStates[i_R]&ACTIVATED) {
                        pxStates[i] = S.COPPER.LIT
                        pxStepUpdated[i] = STATE
                        pxStepUpdated[i_T] = STATE
                        pxStepUpdated[i_B] = STATE
                        pxStepUpdated[i_L] = STATE
                    }
                    if (p_L === mat && pxStates[i_L]&ACTIVATED) {
                        pxStates[i] = S.COPPER.LIT
                        pxStepUpdated[i] = STATE
                        pxStepUpdated[i_T] = STATE
                        pxStepUpdated[i_B] = STATE
                        pxStepUpdated[i_R] = STATE
                    }
                } else if (state === S.COPPER.LIT) {// ---4
                    // IF NOT CONNECTED TO ELECTRICITY ANYMORE -> DISABLE
                    if (p_B === mat && pxStates[i_B] === S.COPPER.DISABLED) {
                        pxStates[i] = S.COPPER.DISABLED
                        pxStepUpdated[i] = STATE
                        pxStepUpdated[i_T] = STATE//
                        pxStepUpdated[i_B] = STATE//
                        pxStepUpdated[i_R] = STATE//
                        pxStepUpdated[i_L] = STATE//
                    }
                    if (p_T === mat && pxStates[i_T] === S.COPPER.DISABLED) {
                        pxStates[i] = S.COPPER.DISABLED
                        pxStepUpdated[i] = STATE
                        pxStepUpdated[i_T] = STATE
                        pxStepUpdated[i_B] = STATE
                        pxStepUpdated[i_R] = STATE
                        pxStepUpdated[i_L] = STATE
                    }
                    if (p_R === mat && pxStates[i_R] === S.COPPER.DISABLED) {
                        pxStates[i] = S.COPPER.DISABLED
                        pxStepUpdated[i] = STATE
                        pxStepUpdated[i_T] = STATE
                        pxStepUpdated[i_B] = STATE
                        pxStepUpdated[i_R] = STATE
                        pxStepUpdated[i_L] = STATE
                    }
                    if (p_L === mat && pxStates[i_L] === S.COPPER.DISABLED) {
                        pxStates[i] = S.COPPER.DISABLED
                        pxStepUpdated[i] = STATE
                        pxStepUpdated[i_T] = STATE
                        pxStepUpdated[i_B] = STATE
                        pxStepUpdated[i_R] = STATE
                        pxStepUpdated[i_L] = STATE
                    }
                } 
                else if (state === S.COPPER.DISABLED) {// ---5 + ---6
                    // START RESET
                    if (
                        (p_B === mat && (pxStates[i_B] === ORIGIN || !pxStates[i_B])) ||
                        (p_T === mat && (pxStates[i_T] === ORIGIN || !pxStates[i_T])) ||
                        (p_R === mat && (pxStates[i_R] === ORIGIN || !pxStates[i_R])) ||
                        (p_L === mat && (pxStates[i_L] === ORIGIN || !pxStates[i_L]))
                    ) pxStates[i] = 0
                }
            }



            // UPDATE
            if (newIndex !== -1) {
                pxStepUpdated[newIndex] = PX
                pixels[newIndex] = newMaterial
                pixels[i] = replaceMaterial
            }
        }
        if (a) console.timeEnd(".")

        return [pixels, pxStates]
    }
}

// TODO CLEANUP
    //updateCachedAdjacencyTable(D, mapWidth, mapHeight, arraySize) {
    //    const arr = PhysicsCore.#ADJACENCY_CACHE = new Array(arraySize)
    //    for (let i=0;i<arraySize;i++) {
    //        const row = (i/mapWidth)|0, col = i%mapWidth
    //        arr[i] = {
    //            [D.b]:  row<mapHeight-1 ? i+mapWidth : i,
    //            [D.t]:  row>0           ? i-mapWidth : i,
    //            [D.r]:  col<mapWidth-1  ? i+1        : i,
    //            [D.l]:  col>0           ? i-1        : i,
    //            [D.br]: (row<mapHeight-1 && col<mapWidth-1) ? i+mapWidth+1 : i,
    //            [D.bl]: (row<mapHeight-1 && col>0)          ? i+mapWidth-1 : i,
    //            [D.tr]: (row>0 && col<mapWidth-1)           ? i-mapWidth+1 : i,
    //            [D.tl]: (row>0 && col>0)                    ? i-mapWidth-1 : i,
    //        }
    //    }
    //}

    ///**
    //* Calculates the adjacent index based on the provided index, direction and distance
    //* @param {Number} i The index of a pixel in the pixels array
    //* @param {Simulation.D} direction A direction specified by one of Simulation.D
    //* @param {Number?} distance The distance to go by in the provided direction (defaults to 1)
    //* @returns The calculated adjacent index
    //*/
    //getAdjacency(D, mapWidth, i, direction, distance=1) { // OPTIMIZATION, TODO
    //    const dWidth = mapWidth*distance
    //    if (direction === D.b)       return i+dWidth
    //    else if (direction === D.t)  return i-dWidth
    //    else if (direction === D.r)  return (i+1)%mapWidth ? i+distance : i
    //    else if (direction === D.l)  return i%mapWidth     ? i-distance : i
    //    else if (direction === D.tr) return (i-dWidth+1)%mapWidth ? i-dWidth+distance : i
    //    else if (direction === D.br) return (i+dWidth+1)%mapWidth ? i+dWidth+distance : i
    //    else if (direction === D.tl) return (i-dWidth)%mapWidth   ? i-dWidth-distance : i
    //    else if (direction === D.bl) return (i+dWidth)%mapWidth   ? i+dWidth-distance : i
    //}