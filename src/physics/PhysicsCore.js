// DOC TODO
function createPhysicsCore(CONFIG, M, G, S, SG, SP, D) {
    console.log("CONTEXT:", self.constructor.name)
    
    // CONSTANTS //
    const RANDOM_TABLE = createRandomTable()

    // VARIABLES //
    // TIMER
    let timerCount = 0,
    // RANDOMNESS
    randomIndex = 0


    // DOC TODO
    function physicsStep(// TODO, check for delta time
        gridIndexes, gridMaterials, lastGridMaterials,
        indexCount, indexFlags, indexPosX, indexPosY, indexVelX, indexVelY, indexGravity,
        sidePriority, mapWidth, mapHeight
    ) {
        if (CONFIG.timerEnabled) handleTimerPre()

        const count = indexCount[0]
        for (let i=0;i<count;i++) {
            const x = indexPosX[i]|0, y = indexPosY[i]|0, gridIndex = y*mapWidth+x
            
            const mat = gridMaterials[gridIndex]
            
            //console.log([x,y], mat, i)

            if (mat === M.SAND) {
                console.log("hey")
            }
        }


        if (CONFIG.timerEnabled) console.timeEnd(CONFIG.timerName)
    }



    // DOC TODO
    function handleTimerPre() {
        if (timerCount++ > CONFIG.timerMaxLog) {
            console.clear()
            timerCount = 0
        }
        console.time(CONFIG.timerName)
    }

    // DOC TODO
    function createRandomTable() {
        const rt_ll = CONFIG.randomTableSize, table = new Float32Array(rt_ll), random = Math.random
        for (let i=0;i<rt_ll;i++) table[i] = random()
        return table
    }


    return physicsStep
}











/*class PhysicsCore {
    static #DEBUG_CLS_THRESHOLD = 0

    constructor(globals) {
        this.#createGlobalConstants(globals)
    }

    #createGlobalConstants(globals) {
        Object.entries(globals||[]).forEach(([name, value])=>self[name] = value)
    }

    // Calculates a physics step on all pixels
    step(pixels, pxStepUpdated, pxStates, sidePriority, mapWidth, mapHeight, M, G, D, S, SG, P) {
        console.log("STEP", pixels)

        _physicsStep()
        return

        const p_ll = pixels.length-1, width2 = mapWidth>>1, PX = 1, STATE = 2,
              AIR = M.AIR, LIQUIDS = G.LIQUIDS, MELTABLE = G.MELTABLE, TRANSPIERCEABLE = G.REG_TRANSPIERCEABLE, GASES = G.GASES,
              CONTAINED_SKIPABLE = G.REVERSE_LOOP_CONTAINED_SKIPABLE, STATIC = G.STATIC,
              SP_RANDOM = sidePriority===P.RANDOM, SP_LEFT = sidePriority===P.LEFT, SP_RIGHT = sidePriority===P.RIGH
        
        //pxStepUpdated.fill(0)

        // PERFORMANCES TESTING
        const timerEnabled = 0
        if (timerEnabled) {
            if (PhysicsCore.#DEBUG_CLS_THRESHOLD++ > 18) {console.clear();PhysicsCore.#DEBUG_CLS_THRESHOLD = 0}
            console.time(".")
        }


        let i = p_ll
        for (;i>=0;i--) {
            const mat = pixels[i]||AIR
            // SKIP IF STATIC MATERIAL OR ALREADY UPDATED
            if (mat & STATIC || pxStepUpdated[i]) continue

            // DEFINE USEFUL VARS
            const x = i%mapWidth, y = (i/mapWidth)|0, hasL = x>0, hasR = x<mapWidth-1, hasT = y>0, hasB = y<mapHeight-1,
                  i_B  = hasB ? i+mapWidth:i, i_T  = hasT ? i-mapWidth:i, i_L  = hasL ? i-1:i, i_R  = hasR ? i+1:i,
                  p_B = pixels[i_B], p_R = pixels[i_R], p_L = pixels[i_L], p_T = pixels[i_T]

            // SKIP IF MATERIAL SUROUNDED BY ITSELF
            if (mat & CONTAINED_SKIPABLE && (p_B^mat|p_R^mat|p_L^mat|p_T^mat) === 0) continue

            // DEFINE USEFUL VARS (CORNERS)
            const i_BL = (hasB&&hasL) ? i+mapWidth-1:i, i_BR = (hasB&&hasR) ? i+mapWidth+1:i, i_TL = (hasT&&hasL) ? i-mapWidth-1:i, i_TR = (hasT&&hasR) ? i-mapWidth+1:i

            // DEFINE REGULAR RESULT VARS
            let newMaterial = mat, newIndex = -1, replaceMaterial = AIR


            // ↓ MATERIALS PHYSICS ↓ //

            // SAND //
            if (mat === M.SAND) {

            }

        }

        if (timerEnabled) console.timeEnd(".")
    }
}*/
