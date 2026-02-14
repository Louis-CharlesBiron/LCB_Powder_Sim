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
            skip1=0, skip2=0, skip3=0, skip4=0


        let countIndex = 0, count = indexCount[0]
        for (;countIndex<count;countIndex++) {
            const ox = indexPosX[countIndex], oy = indexPosY[countIndex], oldX = ox|0, oldY = oy|0, gi = oldY*mapWidth+oldX, 
                mat = gridMaterials[gi], i = gridIndexes[gi]

            
            if (i==null || i == -1) console.log("gi:",gi, [oldX, oldY], "i:", i, "|", countIndex)

            if (mat === SAND) {
                // B  - GO THROUGH TRANSPIERCEABLE
                // BR - GO THROUGH GASES
                // BL - GO THROUGH GASES
                const transpierceableMain = REG_TRANSPIERCEABLE, transpierceableSec = GASES, m_B = gridMaterials[getAdjacencyCoords(oldX, oldY+1)], hasColX = indexFlags[i]&COLLISION_X
                let dx = 0, dy = 0

                // IF COLLSION BOTTOM
                if (indexFlags[i]&COLLISION_BOTTOM) {
                    const gi_R = getAdjacencyCoords(oldX+1, oldY), gi_L = getAdjacencyCoords(oldX-1, oldY),
                          m_R = gridMaterials[gi_R], m_L = gridMaterials[gi_L], m_BR = gridMaterials[getAdjacencyCoords(oldX+1, oldY+1)], m_BL = gridMaterials[getAdjacencyCoords(oldX-1, oldY+1)]

                    // SKIP IF CONTAINED
                    if (hasColX && mat & DOWN_MAIN_CONTAINED_SKIPABLE && (m_B^mat) === 0 && ((m_BR^mat|m_BL^mat) === 0 || (m_R^mat|m_L^mat) === 0)) {skip1++;continue}

                    // CHECK MAIN DIRECTIONS
                    if (m_B & transpierceableMain) indexFlags[i] ^= COLLISION_BOTTOM
                    else {
                        // GO SIDES
                        if (getSideSelectionPriority(gi)) {
                            if (m_R & transpierceableSec && m_BR & transpierceableSec) {
                                dx += 1
                                dy += 1
                            } 
                        } else {
                            if (m_L & transpierceableSec && m_BL & transpierceableSec) {
                                dx -= 1
                                dy += 1
                            } 
                        }
                    }
                } 
                
                // NO COLLISION BOTTOM
                if (!(indexFlags[i]&COLLISION_BOTTOM)) {
                    // ADD VERTICAL FORCES
                    indexVelY[i] += indexGravity[i]*deltaTime
                    dy += indexVelY[i]*deltaTime
                }


                // NO COLLISION LEFT/RIGHT
                if (!hasColX) {
                    // ADD HORIZONTAL FORCES
                    //indexVelX[i] += indexGravity[i]*deltaTime
                    dx += indexVelX[i]*deltaTime
                }

                // MOVE
                const hasPhysicsMovements = dy || dx
                if (!hasPhysicsMovements) {skip2++;continue}
                //console.log(dy, dx, indexVelY[i])

                if (dx) indexPosX[i] = safeTrunc(clamp(ox+dx))
                if (dy)  indexPosY[i] += safeTrunc(dy)
                let newX = (ox+dx)|0, newY = indexPosY[i]|0
                const gdx = newX-oldX, gdy = newY-oldY, hasNoGdx = gdx === 0, hasNoGdy = gdy === 0
                //console.log(i, [newX, newY], "| +", safeTrunc(clamp(ox+dx)), safeTrunc(ox+dx), [gdx, gdy], "x/y", [indexPosX[i],indexPosY[i]])

                // NO GRID MOVEMENT -> skip (RECONSIDER)
                if (hasNoGdy && hasNoGdx) {skip3++;continue}

                const absGdx = abs(gdx), absGdy = abs(gdy), dirGdy = 1|(gdy>>LAST_BIT), dirGdx = 1|(gdx>>LAST_BIT)

                // CHECK FOR COLLISION Y
                if (absGdy > 1) {
                    for (let colY=oldY+dirGdy,colI=0; colI<absGdy; colI++,colY+=dirGdy) {
                        // check collision at oldY..newY
                        const gi_Dest = getAdjacencyCoords(newX, colY), m_dest = gridMaterials[gi_Dest], hasCollision = !(m_dest & transpierceableMain)
                        //console.log(i, "2TR-Y", gi_Dest, gi, [newX, newY], m_dest)
                        if (hasCollision) {
                            newY = (indexPosY[i] = colY-dirGdy)|0
                            //console.log(i, "2Y", gi_Dest, gi, [newX, newY])

                            indexFlags[i] |= dirGdy===1 ? COLLISION_BOTTOM : COLLISION_TOP
                            if (m_dest && m_dest !== mat) indexVelY[i] = 2
                            else if (!m_dest) indexVelY[i] = 0
                            break
                        }
                    }
                } else if (!hasNoGdy) {
                    // check collision at destination pos
                    const gi_Dest = getAdjacencyCoords(newX, newY), m_dest = gridMaterials[gi_Dest], hasCollision = !(m_dest & transpierceableMain)
                    //console.log(i, "TR-Y", gi_Dest, gi, [newX, newY], "old", [oldX, oldY], m_dest)
                    if (hasCollision) {
                        //console.log(i, "Y", gi_Dest, gi, [newX, newY], velDiff)
                        newY = (indexPosY[i] = oldY)|0

                        indexFlags[i] |= dirGdy===1 ? COLLISION_BOTTOM : COLLISION_TOP
                        if (m_dest && m_dest !== mat) indexVelY[i] = 2
                        else if (!m_dest) indexVelY[i] = 0
                    }
                }

                // CHECK FOR COLLISION X
                if (absGdx > 1) {
                    for (let colX=oldX+dirGdx,colI=0; colI<absGdx; colI++,colX+=dirGdx) {
                        // check collision at oldX..newX
                        const gi_Dest = getAdjacencyCoords(colX, newY), m_dest = gridMaterials[gi_Dest], hasCollision = !(m_dest & transpierceableMain)
                        if (hasCollision) {
                            newX = (indexPosX[i] = colX-dirGdx)|0

                            const velDiff = abs(indexVelX[gridIndexes[gi_Dest]]-indexVelX[i])// TODO put velocity threshold in Y collisions too
                            //console.log(i, [newX, newY], "2col x", gi_Dest, gi, "2VEL:", indexVelX[i], "->", indexVelX[gridIndexes[gi_Dest]], "|", gi_Dest === gi, velDiff > COLLISION_VELOCITY_DIFFERENCE_THRESHOLD)
                            if (m_dest & STATIC || gi_Dest === gi || velDiff > COLLISION_VELOCITY_DIFFERENCE_THRESHOLD) {
                                //console.log("RESET VEL2", i)
                                indexVelX[i] = 0
                                indexFlags[i] |= dirGdx===1 ? COLLISION_RIGHT : COLLISION_LEFT
                            }
                            break
                        }
                    }
                } else if (!hasNoGdx) {
                    // check collision at destination pos
                    const gi_Dest = getAdjacencyCoords(newX, newY), m_dest = gridMaterials[gi_Dest], hasCollision = !(m_dest & transpierceableMain)
                    //console.log("CHEK COL", gi, gi_Dest, hasCollision)

                    if (hasCollision) {
                        newX = (indexPosX[i] = oldX)|0

                        const velDiff = abs(indexVelX[gridIndexes[gi_Dest]]-indexVelX[i])
                        //console.log(i, [newX, newY], "col x", gi_Dest, gi, "VEL:", indexVelX[i], "->", indexVelX[gridIndexes[gi_Dest]], "|", gi_Dest === gi, velDiff > COLLISION_VELOCITY_DIFFERENCE_THRESHOLD)
                        if (m_dest & STATIC || gi_Dest === gi || velDiff > COLLISION_VELOCITY_DIFFERENCE_THRESHOLD) {
                            //console.log("RESET VEL", i)
                            indexVelX[i] = 0
                            indexFlags[i] |= dirGdx===1 ? COLLISION_RIGHT : COLLISION_LEFT
                        }
                    }
                }

                // UPDATE GRID
                const newGridI = getAdjacencyCoords(newX, newY), m_Dest = gridMaterials[newGridI] & transpierceableMain

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
                }
            }

            if (mat === WATER) {
                // B  - GO THROUGH GASES
                // BR - GO THROUGH GASES
                // BL - GO THROUGH GASES
                // R  - GO THROUGH GASES
                // L  - GO THROUGH GASES
                const transpierceableMain = GASES, transpierceableSec = GASES, m_B = gridMaterials[getAdjacencyCoords(oldX, oldY+1)], hasColX = indexFlags[i]&COLLISION_X
                let dx = 0, dy = 0

                // IF COLLSION BOTTOM
                if (indexFlags[i]&COLLISION_BOTTOM) {
                    const gi_R = getAdjacencyCoords(oldX+1, oldY), gi_L = getAdjacencyCoords(oldX-1, oldY),
                          m_R = gridMaterials[gi_R], m_L = gridMaterials[gi_L], m_BR = gridMaterials[getAdjacencyCoords(oldX+1, oldY+1)], m_BL = gridMaterials[getAdjacencyCoords(oldX-1, oldY+1)]

                    // SKIP IF CONTAINED
                    //if (hasColX && mat & DOWN_MAIN_CONTAINED_SKIPABLE && (m_B^mat) === 0 && ((m_BR^mat|m_BL^mat) === 0 || (m_R^mat|m_L^mat) === 0)) {skip1++;continue}

                    // CHECK MAIN DIRECTIONS
                    if (m_B & transpierceableMain) indexFlags[i] ^= COLLISION_BOTTOM
                    else {
                        // GO SIDES
                        if (getSideSelectionPriority(gi)) {
                            const rightEmpty = m_R & transpierceableSec, leftEmpty = m_L & transpierceableSec
                            if (leftEmpty && m_BL & transpierceableSec) {
                                dx -= 1
                                dy += 1
                            } else if (rightEmpty && m_BR & transpierceableSec) {
                                dx += 1
                                dy += 1
                            }
                            else if (leftEmpty) dx -= 1
                            else if (rightEmpty) dx += 1
                        } else {
                            const rightEmpty = m_R & transpierceableSec, leftEmpty = m_L & transpierceableSec
                            if (rightEmpty && m_BR & transpierceableSec) {
                                dx += 1
                                dy += 1
                            } else if (leftEmpty && m_BL & transpierceableSec) {
                                dx -= 1
                                dy += 1
                            }
                            else if (rightEmpty) dx += 1
                            else if (leftEmpty) dx -= 1
                        }
                    }
                }

                // NO COLLISION BOTTOM
                if (!(indexFlags[i]&COLLISION_BOTTOM)) {
                    // ADD VERTICAL FORCES
                    indexVelY[i] += indexGravity[i]*deltaTime
                }
                    dy += indexVelY[i]*deltaTime

                // NO COLLISION LEFT/RIGHT
                if (!hasColX) {
                    // ADD HORIZONTAL FORCES
                }
                    dx += indexVelX[i]*deltaTime

                
                // MOVE
                const hasPhysicsMovements = dy || dx
                if (!hasPhysicsMovements) {skip2++;continue}

                if (dx) indexPosX[i] = safeTrunc(clamp(ox+dx))
                if (dy)  indexPosY[i] += safeTrunc(dy)
                let newX = (ox+dx)|0, newY = indexPosY[i]|0
                const gdx = newX-oldX, gdy = newY-oldY, hasNoGdx = gdx === 0, hasNoGdy = gdy === 0

                // NO GRID MOVEMENT -> skip (RECONSIDER)
                if (hasNoGdy && hasNoGdx) {skip3++;continue}

                const absGdx = abs(gdx), absGdy = abs(gdy), dirGdy = 1|(gdy>>LAST_BIT), dirGdx = 1|(gdx>>LAST_BIT)

                // CHECK FOR COLLISION Y
                if (absGdy > 1) {
                    // check collision at oldY..newY
                    for (let colY=oldY+dirGdy,colI=0; colI<absGdy; colI++,colY+=dirGdy) {
                        const gi_Dest = getAdjacencyCoords(newX, colY), m_dest = gridMaterials[gi_Dest], hasCollision = !(m_dest & transpierceableMain)
                        if (hasCollision) {
                            newY = (indexPosY[i] = colY-dirGdy)|0
                            indexFlags[i] |= dirGdy===1 ? COLLISION_BOTTOM : COLLISION_TOP
                            if (m_dest && m_dest !== mat) indexVelY[i] = 2
                            else if (!m_dest) indexVelY[i] = 0
                            break
                        }
                    }
                } else if (!hasNoGdy) {
                    // check collision at destination pos
                    const gi_Dest = getAdjacencyCoords(newX, newY), m_dest = gridMaterials[gi_Dest], hasCollision = !(m_dest & transpierceableMain)
                    if (hasCollision) {
                        newY = (indexPosY[i] = oldY)|0
                        indexFlags[i] |= dirGdy===1 ? COLLISION_BOTTOM : COLLISION_TOP
                        if (m_dest && m_dest !== mat) indexVelY[i] = 2
                        else if (!m_dest) indexVelY[i] = 0
                    }
                }

                // CHECK FOR COLLISION X
                if (absGdx > 1) {
                    // check collision at oldX..newX
                    for (let colX=oldX+dirGdx,colI=0; colI<absGdx; colI++,colX+=dirGdx) {
                        const gi_Dest = getAdjacencyCoords(colX, newY), m_dest = gridMaterials[gi_Dest], hasCollision = !(m_dest & transpierceableMain)
                        if (hasCollision) {
                            const velDiff = abs(indexVelX[gridIndexes[gi_Dest]]-indexVelX[i])
                            newX = (indexPosX[i] = colX-dirGdx)|0
                            if (m_dest & STATIC || gi_Dest === gi || velDiff > COLLISION_VELOCITY_DIFFERENCE_THRESHOLD) {
                                //console.log("RESET VEL2", i)
                                indexVelX[i] = 0
                                indexFlags[i] |= dirGdx===1 ? COLLISION_RIGHT : COLLISION_LEFT
                            }
                            break
                        }
                    }
                } else if (!hasNoGdx) {
                    // check collision at destination pos
                    const gi_Dest = getAdjacencyCoords(newX, newY), m_dest = gridMaterials[gi_Dest], hasCollision = !(m_dest & transpierceableMain)
                    if (hasCollision) {
                        const velDiff = abs(indexVelX[gridIndexes[gi_Dest]]-indexVelX[i])
                        newX = (indexPosX[i] = oldX)|0
                        if (m_dest & STATIC || gi_Dest === gi || velDiff > COLLISION_VELOCITY_DIFFERENCE_THRESHOLD) {
                            indexVelX[i] = 0
                            indexFlags[i] |= dirGdx===1 ? COLLISION_RIGHT : COLLISION_LEFT
                        }
                    }
                }


                // UPDATE GRID
                const newGridI = getAdjacencyCoords(newX, newY), m_Dest = gridMaterials[newGridI] & transpierceableMain

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
                        indexPosX[i] = ox
                    }
                    if (newY-oldY !== 0) {
                        indexPosY[i] = oy
                    }
                }

            }
        }


        if (skippedENABLE) console.log("1:", skip1, "2:", skip2, "3:", skip3, "4:", skip4)
        skip1 = skip2 = skip3 = skip4 = 0
        if (CONFIG.timerEnabled) console.timeEnd(CONFIG.timerName)
    }


    const FLOAT32_TRUNC_ARR = new Float32Array(1), UINT32_TRUNC_ARR = new Uint32Array(FLOAT32_TRUNC_ARR.buffer)
    function safeTrunc(num) {
        FLOAT32_TRUNC_ARR[0] = num
        if (FLOAT32_TRUNC_ARR[0] > num) UINT32_TRUNC_ARR[0]--
        return FLOAT32_TRUNC_ARR[0]
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