const FLAGS = {
    COLLISION_Y: 1<<0,
}

// DOC TODO
function createPhysicsCore(CONFIG, M, G, S, SG, SP, D) {
    console.log("CONTEXT:", self.constructor.name)
    
    // CONSTANTS //
    const RTSize = CONFIG.randomTableSize-1,
        RANDOM_TABLE = createRandomTable()
        
    // VARIABLES //
    // TIMER
    let timerCount = 0,
    // RANDOMNESS
    randomIndex = 0,
    // GLOBAL CACHES
    SP_RANDOM = null, SP_LEFT = null, SP_RIGHT = null,
    MAP_WIDTH = null, MAP_HEIGHT = null, WIDTH2 = null



    // DOC TODO
    function physicsStep(
        gridIndexes, gridMaterials, lastGridMaterials,
        indexCount, indexFlags, indexPosX, indexPosY, indexVelX, indexVelY, indexGravity,
        sidePriority, mapWidth, mapHeight,
        deltaTime
    ) {
        if (CONFIG.timerEnabled) handleTimerPre()

        // VARIABLES UPDATES
        SP_RANDOM = sidePriority===SP.RANDOM
        SP_LEFT = sidePriority===SP.LEFT
        SP_RIGHT = sidePriority===SP.RIGH
        MAP_WIDTH = mapWidth 
        MAP_HEIGHT = mapHeight 
        WIDTH2 = mapWidth>>1

        let countIndex = 0, count = indexCount[0]
        for (;countIndex<count;countIndex++) {
            const oldX = indexPosX[countIndex]|0, oldY = indexPosY[countIndex]|0, gi = oldY*mapWidth+oldX, 
                mat = gridMaterials[gi], i = gridIndexes[gi]


            //const gi_B = getAdjacencyCoords(oldX, oldY+1), gi_T = getAdjacencyCoords(oldX, oldY-1),
            //      gi_R = getAdjacencyCoords(oldX+1, oldY), gi_L = getAdjacencyCoords(oldX-1, oldY),
            //      m_B = gridMaterials[gi_B], m_R = gridMaterials[gi_R], m_L = gridMaterials[gi_L], m_T = gridMaterials[gi_T]
            //if (mat & G.DOWN_MAIN_CONTAINED_SKIPABLE && (m_B^mat|m_R^mat|m_L^mat|m_T^mat) === 0) continue

            
            //console.log(mat, gi, oldX, oldY, i)
            if (mat === M.SAND) {

                let dx = 0, dy = 0

                // IF COLLSION
                if (indexFlags[i] & FLAGS.COLLISION_Y) {
                    // CHECK MAIN DIRECTIONS
                    if (gridMaterials[getAdjacencyCoords(oldX, oldY+1)] & G.REG_TRANSPIERCEABLE) {
                        // can go down
                        indexFlags[i] ^= FLAGS.COLLISION_Y
                    } 
                    else {
                        if (getSideSelectionPriority(gi)) {
                            if (gridMaterials[getAdjacencyCoords(oldX+1, oldY+1)] & G.GASES) {
                                dx += 1
                                dy += 1
                            }
                        } else {
                            if (gridMaterials[getAdjacencyCoords(oldX-1, oldY+1)] & G.GASES) {
                                dx -= 1
                                dy += 1
                            }
                        }
                    }
                }


                // ADD FORCES
                indexVelY[i] += indexGravity[i]*deltaTime

                // MOVE
                dx += indexVelX[i]*deltaTime
                dy += indexVelY[i]*deltaTime
                indexPosX[i] += dx
                indexPosY[i] += dy



                let newX = indexPosX[i]|0, newY = indexPosY[i]|0
                const gdx = newX-oldX, gdy = newY-oldY

                // CHECK FOR COLLISION (only y for now)
                if (gdy > 1) {
                    for (let colY=oldY+1;colY<=newY;colY++) {
                        // check collision at oldY..newY
                        const gi_Dest = getAdjacencyCoords(newX, colY), hasCollision = !(gridMaterials[gi_Dest] & G.REG_TRANSPIERCEABLE)
                        if (hasCollision) {
                            indexPosY[i] = colY-1
                            indexFlags[i] |= FLAGS.COLLISION_Y
                            //if (gridMaterials[gi_Dest] !== mat) indexVelY[i] = 0
                            break
                        }
                    }
                } else if (gdy !== 0) {
                    // check collision at destination pos
                    const gi_Dest = getAdjacencyCoords(newX, newY), hasCollision = !(gridMaterials[gi_Dest] & G.REG_TRANSPIERCEABLE)
                    if (hasCollision) {
                        indexPosY[i] = oldY
                        indexFlags[i] |= FLAGS.COLLISION_Y
                        //if (gridMaterials[gi_Dest] !== mat) indexVelY[i] = 0
                    }
                }

                newX = indexPosX[i]|0
                newY = indexPosY[i]|0

                


                // UPDATE GRID
                const newGridI = getAdjacencyCoords(newX, newY), m_Dest = gridMaterials[newGridI] & G.REG_TRANSPIERCEABLE

                // fall down
                if (m_Dest) {
                    const atGridI = gridIndexes[newGridI]
                    // move to new pos
                    gridIndexes[newGridI] = i
                    gridMaterials[newGridI] = mat

                    // switch info 
                    gridIndexes[gi] = atGridI
                    gridMaterials[gi] = m_Dest
                }

            }
        }


        if (CONFIG.timerEnabled) console.timeEnd(CONFIG.timerName)
    }

    function getSideSelectionPriority(gi) {
        if (SP_LEFT) return true
        if (SP_RIGHT) return false
        if (SP_RANDOM) return RANDOM_TABLE[randomIndex++&RTSize] < .5
        return (gi%MAP_WIDTH) < WIDTH2
    }


    /**
    * Calculates the adjacent index based on the provided index, direction and distance
    * @param {Number} i The index of a pixel in the pixels array
    * @param {Simulation.D} direction A direction specified by one of Simulation.D
    * @param {Number?} distance The distance to go by in the provided direction (defaults to 1)
    * @returns The calculated adjacent index
    */
    function getAdjacency(i, mapWidth, mapHeight, direction, distance=1) {
        const dWidth = mapWidth*distance, x = i%mapWidth, y = (i/mapWidth)|0, hasL = x>=distance, hasR = x+distance<mapWidth, hasT = y>=distance, hasB = y+distance<mapHeight
        if (direction === D.b)       return hasB ? i+dWidth:i
        else if (direction === D.t)  return hasT ? i-dWidth:i
        else if (direction === D.l)  return hasL ? i-distance:i
        else if (direction === D.r)  return hasR ? i+distance:i
        else if (direction === D.bl) return (hasB&&hasL) ? i+dWidth-distance:i
        else if (direction === D.br) return (hasB&&hasR) ? i+dWidth+distance:i
        else if (direction === D.tl) return (hasT&&hasL) ? i-dWidth-distance:i
        else if (direction === D.tr) return (hasT&&hasR) ? i-dWidth+distance:i
    }

    function getAdjacencyCoords(x, y) {
        return y*MAP_WIDTH+x
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
        const table = new Float32Array(RTSize), random = Math.random
        for (let i=0;i<RTSize;i++) table[i] = random()
        return table
    }


    return physicsStep
}