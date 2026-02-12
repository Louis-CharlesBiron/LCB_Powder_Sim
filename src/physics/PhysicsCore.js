const FLAGS = {
    COLLISION_BOTTOM: 1<<0,
    COLLISION_RIGHT: 1<<1,
    COLLISION_LEFT: 1<<2,
    COLLISION_TOP: 1<<3,

    COLLISION_X: (1<<1)|(1<<2),
    COLLISION_Y: (1<<3)|(1<<0),
}

const COLLISION_VELOCITY_DIFFERENCE_THRESHOLD = 5

// DOC TODO
function createPhysicsCore(CONFIG, M, G, S, SG, SP, D) {
    console.log("CONTEXT:", self.constructor.name)
    
    // CONSTANTS //
    const RTSize = CONFIG.randomTableSize-1,
        RANDOM_TABLE = createRandomTable(),
        LAST_BIT = 31,

    // ENUMS DESTRUCTURING
    {AIR, SAND, WATER, STONE, GRAVEL, INVERTED_WATER, CONTAMINANT, LAVA, ELECTRICITY, COPPER, TREE, GAS} = M,
    {GASES, REG_TRANSPIERCEABLE, LIQUIDS, CONTAMINABLE, MELTABLE, STATIC, DOWN_MAIN_CONTAINED_SKIPABLE} = G,
    {RANDOM, LEFT, RIGHT} = SP,
    {COLLISION_BOTTOM, COLLISION_RIGHT, COLLISION_LEFT, COLLISION_TOP, COLLISION_X, COLLISION_Y} = FLAGS

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
        SP_RANDOM = sidePriority===RANDOM
        SP_LEFT = sidePriority===LEFT
        SP_RIGHT = sidePriority===RIGHT
        MAP_WIDTH = mapWidth 
        MAP_HEIGHT = mapHeight 
        WIDTH2 = mapWidth>>1

        // DEBUG
        let skippedENABLE = false,
            skip1 = 0, skip2 = 0, skip3 = 0, skip4 = 0

    deltaTime = 0.016


        let countIndex = 0, count = indexCount[0]
        for (;countIndex<count;countIndex++) {
            const ox = indexPosX[countIndex], oy = indexPosY[countIndex], oldX = ox|0, oldY = oy|0, gi = oldY*mapWidth+oldX, 
                mat = gridMaterials[gi], i = gridIndexes[gi]

            
            //console.log(mat, gi, oldX, oldY, i)
            if (mat === SAND) {
                const m_B = gridMaterials[getAdjacencyCoords(oldX, oldY+1)]
                let dx = 0, dy = 0
                
                // SKIP IF EARLY COLLISION
                //if (m_B !== mat && !(m_B & REG_TRANSPIERCEABLE)) {
                //    indexFlags[i] |= COLLISION_BOTTOM
                //    skip1++
                //    continue
                //}

                // IF COLLSION BOTTOM
                if (indexFlags[i]&COLLISION_BOTTOM) {
                    const gi_R = getAdjacencyCoords(oldX+1, oldY), gi_L = getAdjacencyCoords(oldX-1, oldY),
                          m_R = gridMaterials[gi_R], m_L = gridMaterials[gi_L], m_BR = gridMaterials[getAdjacencyCoords(oldX+1, oldY+1)], m_BL = gridMaterials[getAdjacencyCoords(oldX-1, oldY+1)]

                    // SKIP IF CONTAINED
                    if ((indexFlags[i]&COLLISION_X) && mat & DOWN_MAIN_CONTAINED_SKIPABLE && (m_B^mat) === 0 && ((m_BR^mat|m_BL^mat) === 0 || (m_R^mat|m_L^mat) === 0)) {
                        skip2++
                        continue
                    }


                    // CHECK MAIN DIRECTIONS
                    if (m_B & REG_TRANSPIERCEABLE) indexFlags[i] ^= COLLISION_BOTTOM
                    else {
                        // GO SIDES
                        if (getSideSelectionPriority(gi)) {
                            if (m_R & GASES && m_BR & GASES) {
                                dx += 1
                                dy += 1
                            } 
                        } else {
                            if (m_L & GASES && m_BL & GASES) {
                                dx -= 1
                                dy += 1
                            } 
                        }
                    }
                } 
                
                // NO COLLISION BOTTOM
                if (!(indexFlags[i]&COLLISION_BOTTOM)) {
                    // ADD VERTICAL FORCES
                    const velY = indexVelY[i] += indexGravity[i]*deltaTime
                    dy += velY*deltaTime
                }

                // NO COLLISION LEFT/RIGHT
                if (!(indexFlags[i]&COLLISION_X)) {
                    // ADD HORIZONTAL FORCES
                    dx += indexVelX[i]*deltaTime
                }


                // MOVE
                const hasPhysicsMovements = dy || dx
                if (!hasPhysicsMovements) {skip3++;continue}

                indexPosX[i] = safeTrunc(clamp(ox+dx))
                indexPosY[i] += safeTrunc(dy)
                let newX = (ox+dx)|0, newY = indexPosY[i]|0

                const gdx = newX-oldX, gdy = newY-oldY, 
                    hasNoGdx = gdx === 0, hasNoGdy = gdy === 0

                //console.log(i, [newX, newY], "| +", clamp(ox+dx), ox+dx, [gdx, gdy], "y", indexPosY[i])


                // NO GRID MOVEMENT -> skip
                if (hasNoGdy && hasNoGdx) {skip4++;continue}

                const absGdx = abs(gdx), absGdy = abs(gdy),
                    dirGdy = 1|(gdy>>LAST_BIT), dirGdx = 1|(gdx>>LAST_BIT)


                // CHECK FOR COLLISION Y
                if (absGdy > 1) {
                    for (let colY=oldY+dirGdy,colI=0; colI<absGdy; colI++,colY+=dirGdy) {
                        // check collision at oldY..newY
                        const gi_Dest = getAdjacencyCoords(newX, colY), hasCollision = !(gridMaterials[gi_Dest] & REG_TRANSPIERCEABLE)
                        //console.log(i, "2TR-Y", gi_Dest, gi, [newX, newY], gridMaterials[gi_Dest])
                        if (hasCollision) {
                            newY = (indexPosY[i] = colY-dirGdy)|0
                            //console.log(i, "2Y", gi_Dest, gi, [newX, newY])

                            indexFlags[i] |= dirGdy===1 ? COLLISION_BOTTOM : COLLISION_TOP
                            if (gridMaterials[gi_Dest] !== mat) indexVelY[i] = 2
                            break
                        }
                    }
                } else if (!hasNoGdy) {
                    // check collision at destination pos
                    const gi_Dest = getAdjacencyCoords(newX, newY), hasCollision = !(gridMaterials[gi_Dest] & REG_TRANSPIERCEABLE)
                    //console.log(i, "TR-Y", gi_Dest, gi, [newX, newY], "old", [oldX, oldY], gridMaterials[gi_Dest])
                    if (hasCollision) {
                        newY = (indexPosY[i] = oldY)|0// TRY oy instead of oldY TODO
                        //console.log(i, "Y", gi_Dest, gi, [newX, newY])
                        if (gridMaterials[gi_Dest] !== mat) indexVelY[i] = 2
                        if (gi_Dest)
                        indexFlags[i] |= dirGdy===1 ? COLLISION_BOTTOM : COLLISION_TOP
                    }
                }

                // CHECK FOR COLLISION X
                if (absGdx > 1) {
                    for (let colX=oldX+dirGdx,colI=0; colI<absGdx; colI++,colX+=dirGdx) {
                        // check collision at oldX..newX
                        const gi_Dest = getAdjacencyCoords(colX, newY), hasCollision = !(gridMaterials[gi_Dest] & REG_TRANSPIERCEABLE)
                        if (hasCollision) {

                            if (gi_Dest === gi && (dirGdx > 0 ? newX < mapWidth-1 : newX > 0)) console.log("VERY BAD auto collision", gi_Dest, gi, [newX, newY])//


                            newX = (indexPosX[i] = colX-dirGdx)|0

                            const velDiff = abs(indexVelX[gridIndexes[gi_Dest]]-indexVelX[i])
                            //console.log(i, [newX, newY], "2col x", gi_Dest, gi, "2VEL:", indexVelX[i], "->", indexVelX[gridIndexes[gi_Dest]], "|", gi_Dest === gi, velDiff > COLLISION_VELOCITY_DIFFERENCE_THRESHOLD)

                            if (gridMaterials[gi_Dest] & STATIC || gi_Dest === gi || velDiff > COLLISION_VELOCITY_DIFFERENCE_THRESHOLD) {
                                //console.log("RESET VEL2", i)
                                indexVelX[i] = 0
                                indexFlags[i] |= dirGdx===1 ? COLLISION_RIGHT : COLLISION_LEFT
                            }
                            break
                        }
                    }
                } else if (!hasNoGdx) {
                    // check collision at destination pos
                    const gi_Dest = getAdjacencyCoords(newX, newY), hasCollision = !(gridMaterials[gi_Dest] & REG_TRANSPIERCEABLE)
                    //console.log("CHEK COL", gi, gi_Dest, hasCollision)

                    if (hasCollision) {

                        if (gi_Dest === gi && (dirGdx > 0 ? newX < mapWidth-1 : newX > 0)) console.log("VERY BAD auto collision", gi_Dest, gi, [newX, newY])//


                        newX = (indexPosX[i] = oldX)|0

                        const velDiff = abs(indexVelX[gridIndexes[gi_Dest]]-indexVelX[i])
                        //console.log(i, [newX, newY], "col x", gi_Dest, gi, "VEL:", indexVelX[i], "->", indexVelX[gridIndexes[gi_Dest]], "|", gi_Dest === gi, velDiff > COLLISION_VELOCITY_DIFFERENCE_THRESHOLD)

                        if (gridMaterials[gi_Dest] & STATIC || gi_Dest === gi || velDiff > COLLISION_VELOCITY_DIFFERENCE_THRESHOLD) {
                            //console.log("RESET VEL", i)
                            indexVelX[i] = 0
                            indexFlags[i] |= dirGdx===1 ? COLLISION_RIGHT : COLLISION_LEFT
                        }
                    }
                }

                // UPDATE GRID
                const newGridI = getAdjacencyCoords(newX, newY), m_Dest = gridMaterials[newGridI] & REG_TRANSPIERCEABLE
                //console.log("GRID", i, ": new pos ->", newX, newY, " | . ", indexPosX[i], indexPosY[i], "|", !!m_Dest, m_Dest, newGridI, "replace mat", gridMaterials[newGridI])

                // SWITCH ONLY IF DEST IS TRANSPIERCEABLE
                if (m_Dest !== 0) {
                    const atGridI = gridIndexes[newGridI]
                    // move to new pos
                    gridIndexes[newGridI] = i
                    gridMaterials[newGridI] = mat

                    // switch info 
                    gridIndexes[gi] = atGridI
                    gridMaterials[gi] = m_Dest
                } else {
                    if (newX-oldX !== 0) {
                        //console.log(i, "-------CANCEL-X", ": changes ->", gdx, gdy, "|", newX-oldX, newY-oldY, "|", indexPosX[i], indexPosY[i], ox, oy)
                        indexPosX[i] = ox
                    }
                    if (newY-oldY !== 0) {
                        //console.log(i, "-------CANCEL-Y", ": changes ->", gdx, gdy, "|", newX-oldX, newY-oldY, "|", indexPosX[i], indexPosY[i], ox, oy)
                        indexPosY[i] = oy
                    }
                    
                    //console.log("------------CANCEL", i, ": changes ->", gdx, gdy, "|", newX-oldX, newY-oldY, "|", indexPosX[i], indexPosY[i], ox, oy)
                }
            }
        }

        if (skippedENABLE) console.log("1:", skip1, "2:", skip2, "3:", skip3, "4:", skip4)
        skip1 = 0
        skip2 = 0
        skip3 = 0
        skip4 = 0
        if (CONFIG.timerEnabled) console.timeEnd(CONFIG.timerName)
    }


    function TEMP_VERIFY(
        gridIndexes, gridMaterials, lastGridMaterials,
        indexCount, indexFlags, indexPosX, indexPosY, indexVelX, indexVelY, indexGravity,
        sidePriority, mapWidth, mapHeight,
    ) {
        let countIndex = 0, count = indexCount[0]
        for (;countIndex<count;countIndex++) {
            const oldX = indexPosX[countIndex]|0, oldY = indexPosY[countIndex]|0, gi = oldY*mapWidth+oldX, 
                mat = gridMaterials[gi], i = gridIndexes[gi]
            
            if (mat !== gridMaterials[getAdjacencyCoords(oldX, oldY)]) console.log("BADDDD")
        }
    }

    function safeTrunc(num) {
        return (num*1e5|0)*1e-5
    }

    function abs(num) {
       return (num^(num>>LAST_BIT))-(num>>LAST_BIT)
    }
    
    function getAdjacencyCoords(x, y) {
        return y*MAP_WIDTH+clamp(x)
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

    function clamp(num, min=0, max=MAP_WIDTH-1) {
        return num < min ? min : num > max ? max : num
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