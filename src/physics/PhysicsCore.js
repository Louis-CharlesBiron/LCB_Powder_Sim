class PhysicsCore {
    static D = {b:1<<0, r:1<<1, l:1<<2, br:1<<3, bl:1<<4, t:1<<5, tr:1<<6, tl:1<<7}
    static #TEMP_DEBUG_CLS = 0

    static #RANDOM_CACHE = null
    static #RANDOM_TABLE_SIZE = 1<<16
    static #RANDOM_INDEX = 0

    static #REGULAR_MOVES = {I:0, B:1, R:2, L:3, BR:4, BL:5, T:6, TR:7, TL:8}

    static #SAND_SP_BIT = PhysicsCore.D.bl<<1
    static #SAND_CACHE = new Uint8Array(PhysicsCore.#SAND_SP_BIT<<1)

    static #WATER_SP_BIT = PhysicsCore.D.bl<<1
    static #WATER_CACHE = new Uint8Array(PhysicsCore.#WATER_SP_BIT<<1)

    static #INVERTED_WATER_SP_BIT = PhysicsCore.D.tl<<1
    static #INVERTED_WATER_CACHE = new Uint8Array(PhysicsCore.#INVERTED_WATER_SP_BIT<<1)

    static {
        const D = PhysicsCore.D
        // FILL CACHED RANDOM TABLE 
        const rt_ll = PhysicsCore.#RANDOM_TABLE_SIZE, table = PhysicsCore.#RANDOM_CACHE = new Float32Array(rt_ll)
        for (let i=0;i<rt_ll;i++) table[i] = Math.random()

        // FILL CACHED SAND TABLE
        const sandCache = PhysicsCore.#SAND_CACHE, sand_ll = sandCache.length 
        for (let i=0;i<sand_ll;i++) sandCache[i] = PhysicsCore.#updateCachedSandTable(D, i)

        // FILL CACHED WATER TABLE
        const waterCache = PhysicsCore.#WATER_CACHE, water_ll = waterCache.length
        for (let i=0;i<water_ll;i++) waterCache[i] = PhysicsCore.#updateCachedWaterTable(D, i)

        // FILL CACHED INVERTED WATER TABLE
        const invertedWaterCache = PhysicsCore.#INVERTED_WATER_CACHE, invertedWater_ll = invertedWaterCache.length 
        for (let i=0;i<invertedWater_ll;i++) invertedWaterCache[i] = PhysicsCore.#updateCachedInvertedWaterTable(D, i)
    }

    // DOC TODO
    step(pixels, pxStepUpdated, pxStates, sidePriority, mapWidth, mapHeight, M, G, D, S, SG, P) {
        const p_ll = pixels.length-1, width2 = mapWidth>>1, PX = 1, STATE = 2,
              AIR = M.AIR, STONE = M.STONE, LIQUIDS = G.LIQUIDS, MELTABLE = G.MELTABLE, CONTAINED_SKIPABLE = G.REVERSE_LOOP_CONTAINED_SKIPABLE,
              RT = PhysicsCore.#RANDOM_CACHE, RS = PhysicsCore.#RANDOM_TABLE_SIZE-1, SP_RANDOM = sidePriority===P.RANDOM, SP_LEFT = sidePriority===P.LEFT, SP_RIGHT = sidePriority===P.RIGH,
              {B, R, L, BR, BL, T, TR, TL} = PhysicsCore.#REGULAR_MOVES,
              SAND_CACHE = PhysicsCore.#SAND_CACHE, SAND_SP_BIT = PhysicsCore.#SAND_SP_BIT,
              WATER_CACHE = PhysicsCore.#WATER_CACHE, WATER_SP_BIT = PhysicsCore.#WATER_SP_BIT,
              INVERTED_WATER_CACHE = PhysicsCore.#INVERTED_WATER_CACHE, INVERTED_WATER_SP_BIT = PhysicsCore.#INVERTED_WATER_SP_BIT
        
        pxStepUpdated.fill(0)

        function getSideSelectionPriority(i) {
            if (SP_LEFT) return true
            if (SP_RIGHT) return false
            if (SP_RANDOM) return RT[PhysicsCore.#RANDOM_INDEX++&RS] < 0.5
            return (i%mapWidth) < width2
        }

        // TODO TEMP
        const timer = 0
        if (timer) {
            if (PhysicsCore.#TEMP_DEBUG_CLS++ > 18) {
                console.clear()
                PhysicsCore.#TEMP_DEBUG_CLS = 0
            }
            console.time(".")
        }

        for (let i=p_ll;i>=0;i--) {
            const mat = pixels[i]
            if (mat === AIR || pxStepUpdated[i] || mat === STONE) continue
            const x = i%mapWidth, y = (i/mapWidth)|0, hasL = x>0, hasR = x<mapWidth-1, hasT = y>0, hasB = y<mapHeight-1,
                  i_B  = hasB ? i+mapWidth:i, i_T  = hasT ? i-mapWidth:i, i_L  = hasL ? i-1:i, i_R  = hasR ? i+1:i,
                  p_B = pixels[i_B], p_R = pixels[i_R], p_L = pixels[i_L], p_T = pixels[i_T]

            if (mat & CONTAINED_SKIPABLE && (p_B^mat|p_R^mat|p_L^mat|p_T^mat) === 0) continue

            const i_BL = (hasB&&hasL) ? i+mapWidth-1:i, i_BR = (hasB&&hasR) ? i+mapWidth+1:i, i_TL = (hasT&&hasL) ? i-mapWidth-1:i, i_TR = (hasT&&hasR) ? i-mapWidth+1:i

            let newMaterial = mat, newIndex = -1, replaceMaterial = AIR

            // SAND
            if (mat === M.SAND) {
                const m_B = p_B&G.TRANSPIERCEABLE, 
                      stack = (p_B === AIR || (p_B&G.TRANSPIERCEABLE) !== 0)*D.b | // B  - GO THROUGH TRANSPIERCEABLE
                              (pixels[i_BR] === AIR)*D.br |                        // BR - GO THROUGH AIR
                              (pixels[i_BL] === AIR)*D.bl |                        // BL - GO THROUGH AIR
                              getSideSelectionPriority(i)*SAND_SP_BIT

                const move = SAND_CACHE[stack]
                if      (move === B)  newIndex = i_B
                else if (move === BR) newIndex = i_BR
                else if (move === BL) newIndex = i_BL

                if (newIndex !== -1 && (p_L&LIQUIDS || p_R&LIQUIDS)) replaceMaterial = m_B
            }

            // WATER
            else if (mat === M.WATER) {
                const stack = (p_B === AIR)*D.b |         // B  - GO THROUGH AIR
                            (pixels[i_BR] === AIR)*D.br | // BR - GO THROUGH AIR
                            (pixels[i_BL] === AIR)*D.bl | // BL - GO THROUGH AIR
                            (p_R === AIR)*D.r |           // R  - GO THROUGH AIR
                            (p_L === AIR)*D.l |           // L  - GO THROUGH AIR
                            getSideSelectionPriority(i)*WATER_SP_BIT

                const move = WATER_CACHE[stack]
                if      (move === B)  newIndex = i_B
                else if (move === BR) newIndex = i_BR
                else if (move === BL) newIndex = i_BL
                else if (move === R)  newIndex = i_R
                else if (move === L)  newIndex = i_L
            }

            // GRAVEL
            else if (mat === M.GRAVEL) {
                const m_B = p_B&LIQUIDS 
                if (p_B === AIR || (p_B&G.TRANSPIERCEABLE) !== 0) newIndex = i_B // GO THROUGH TRANSPIERCEABLE

                // check what to replace prev pos with
                if (m_B && (p_L&LIQUIDS || p_R&LIQUIDS)) replaceMaterial = m_B
            }

            // INVERTED WATER
            else if (mat === M.INVERTED_WATER) {
                const stack = (p_T === AIR)*D.t |   // T  - GO THROUGH AIR
                              (pixels[i_TR] === AIR)*D.tr | // TR - GO THROUGH AIR
                              (pixels[i_TL] === AIR)*D.tl | // TL - GO THROUGH AIR
                              (p_R === AIR)*D.r |           // R  - GO THROUGH AIR
                              (p_L === AIR)*D.l |           // L  - GO THROUGH AIR
                              getSideSelectionPriority(i)*INVERTED_WATER_SP_BIT

                const move = INVERTED_WATER_CACHE[stack]
                if      (move === T)  newIndex = i_T
                else if (move === TR) newIndex = i_TR
                else if (move === TL) newIndex = i_TL
                else if (move === R)  newIndex = i_R
                else if (move === L)  newIndex = i_L
            }

            // CONTAMINANT
            else if (mat === M.CONTAMINANT) {
                let move = WATER_CACHE[
                        (p_B === AIR)*D.b // B  - GO THROUGH AIR
                ]

                const contaminationThreshold = 0.5
                if (move === B)  newIndex = i_B
                else {
                    move = WATER_CACHE[
                        (pixels[i_BR] === AIR)*D.br | // BR - GO THROUGH AIR
                        (pixels[i_BL] === AIR)*D.bl | // BL - GO THROUGH AIR
                        (p_R === AIR)*D.r |           // R  - GO THROUGH AIR
                        (p_L === AIR)*D.l |           // L  - GO THROUGH AIR
                        getSideSelectionPriority(i)*WATER_SP_BIT
                    ]

                    if (move === BR) newIndex = i_BR
                    else if (move === BL) newIndex = i_BL
                    else if (move === R)  newIndex = i_R
                    else if (move === L)  newIndex = i_L

                    if (p_L&G.CONTAMINABLE && RT[PhysicsCore.#RANDOM_INDEX++&RS]>contaminationThreshold) {
                        pixels[i_L] = mat
                        pxStepUpdated[i_L] = PX
                    }
                    if (p_R&G.CONTAMINABLE && RT[PhysicsCore.#RANDOM_INDEX++&RS]>contaminationThreshold) {
                        pixels[i_R] = mat
                        pxStepUpdated[i_R] = PX
                    }
                    if (p_B&G.CONTAMINABLE && RT[PhysicsCore.#RANDOM_INDEX++&RS]>contaminationThreshold) {
                        pixels[i_B] = mat
                        pxStepUpdated[i_B] = PX
                    }
                    if (p_T&G.CONTAMINABLE && RT[PhysicsCore.#RANDOM_INDEX++&RS]>contaminationThreshold) {
                        pixels[i_T] = mat
                        pxStepUpdated[i_T] = PX
                    }
                }
            }

            // LAVA
            else if (mat === M.LAVA) {
                if (p_L&LIQUIDS || p_R&LIQUIDS || p_T&LIQUIDS || p_B&LIQUIDS) {// CREATE STONE
                    pixels[i] = M.STONE
                    pxStepUpdated[i] = PX
                }
                else {// FALL DOWN
                    let move = WATER_CACHE[
                        (p_B === AIR)*D.b // B  - GO THROUGH AIR
                    ]

                    const movementThreshold = 0.935, meltThreshold = 0.9992
                    if (move === B)  newIndex = i_B
                    else if (RT[PhysicsCore.#RANDOM_INDEX++&RS]>movementThreshold) {// MOVE SOMETIMES
                        move = WATER_CACHE[
                            (pixels[i_BR] === AIR)*D.br | // BR - GO THROUGH AIR
                            (pixels[i_BL] === AIR)*D.bl | // BL - GO THROUGH AIR
                            (p_R === AIR)*D.r |           // R  - GO THROUGH AIR
                            (p_L === AIR)*D.l |           // L  - GO THROUGH AIR
                            getSideSelectionPriority(i)*WATER_SP_BIT
                        ]

                        if (move === BR) newIndex = i_BR
                        else if (move === BL) newIndex = i_BL
                        else if (move === R)  newIndex = i_R
                        else if (move === L)  newIndex = i_L
                    }
                    else if ((p_L&MELTABLE || p_R&MELTABLE || p_T&MELTABLE || p_B&MELTABLE) && RT[PhysicsCore.#RANDOM_INDEX++&RS]>meltThreshold) {// MELT SOMETIMES
                        if (p_L&MELTABLE) {
                            pixels[i_L] = mat
                            pxStepUpdated[i_L] = PX
                        } else if (p_R&MELTABLE) {
                            pixels[i_R] = mat
                            pxStepUpdated[i_R] = PX
                        } else if (p_B&MELTABLE) {
                            pixels[i_B] = mat
                            pxStepUpdated[i_B] = PX
                        } else if (p_T&MELTABLE) {
                            pixels[i_T] = mat
                            pxStepUpdated[i_T] = PX
                        }
                    }
                }
            }
            // ELECTRICITY
            else if (mat === M.ELECTRICITY) {
                const ORIGIN = S.COPPER.ORIGIN

                // check if can go down
                if (p_B === AIR) newIndex = i_B
                else {
                    let COPPER = M.COPPER, SOURCEABLE = SG.COPPER.SOURCEABLE, s_B, s_T, s_R, s_L
                    if (p_B === COPPER && ((s_B=pxStates[i_B]) === 0 || s_B&SOURCEABLE)) {
                        pxStates[i_B] = ORIGIN
                        pxStepUpdated[i_B] = STATE
                    }
                    if (p_T === COPPER && ((s_T=pxStates[i_T]) === 0 || s_T&SOURCEABLE)) {
                        pxStates[i_T] = ORIGIN
                        pxStepUpdated[i_T] = STATE
                    }
                    if (p_R === COPPER&& ((s_R=pxStates[i_R]) === 0 || s_R&SOURCEABLE)) {
                        pxStates[i_R] = ORIGIN
                        pxStepUpdated[i_R] = STATE
                    }
                    if (p_L === COPPER && ((s_L=pxStates[i_L]) === 0 || s_L&SOURCEABLE)) {
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

                const state = pxStates[i],

                      ACTIVATED = SG.COPPER.ACTIVATED,
                      ORIGIN = S.COPPER.ORIGIN,
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
        if (timer) console.timeEnd(".")

        return [pixels, pxStates]
    }


    // DOC TODO
    static #updateCachedSandTable(D, stack) {
        const isLeftFirst = stack & PhysicsCore.#SAND_SP_BIT, MOVES = PhysicsCore.#REGULAR_MOVES,
              b = stack & D.b,
              br = stack & D.br,
              bl = stack & D.bl

        if (b) return MOVES.B// OPTIMIZE
        if (isLeftFirst) {
            if (bl) return MOVES.BL
            if (br) return MOVES.BR
        } else {
            if (br) return MOVES.BR
            if (bl) return MOVES.BL
        }
        return MOVES.I
    }

    // DOC TODO
    static #updateCachedWaterTable(D, stack) {
        const isLeftFirst = stack & PhysicsCore.#WATER_SP_BIT, MOVES = PhysicsCore.#REGULAR_MOVES,
              b = stack & D.b,
              r = stack & D.r,
              l = stack & D.l,
              br = stack & D.br,
              bl = stack & D.bl

        if (b) return MOVES.B// OPTIMIZE
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

    // DOC TODO
    static #updateCachedInvertedWaterTable(D, stack) {
        const isLeftFirst = stack & PhysicsCore.#INVERTED_WATER_SP_BIT, MOVES = PhysicsCore.#REGULAR_MOVES,
              t = stack & D.t,
              r = stack & D.r,
              l = stack & D.l,
              tr = stack & D.tr,
              tl = stack & D.tl

        if (t) return MOVES.T
        if (isLeftFirst) {
            if (tl) return MOVES.TL// OPTIMIZE
            if (tr) return MOVES.TR
            if (l) return MOVES.L
            if (r) return MOVES.R
        } else {
            if (tr) return MOVES.TR
            if (tl) return MOVES.TL
            if (r) return MOVES.R
            if (l) return MOVES.L
        }
        return MOVES.I
    }
}