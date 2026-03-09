const FLAGS = {
    COLLISION_BOTTOM: 1<<0,
    COLLISION_RIGHT: 1<<1,
    COLLISION_LEFT: 1<<2,
    COLLISION_TOP: 1<<3,
    COLLISION_X: (1<<1)|(1<<2),
    COLLISION_Y: (1<<3)|(1<<0),
}

const X_COLLISION_VELOCITY_DIFFERENCE_THRESHOLD = 5,
    Y_COLLISION_VELOCITY_DIFFERENCE_THRESHOLD = 5,
    X_VELOCITY_SKIP_THRESHOLD = 5,
    GROUND_VELX_DECELERATION_RATE = 135

// DOC TODO
function createPhysicsCore(CONFIG, M, G, S, SG, SP, D) {
    console.log("%cCONTEXT: "+self.constructor.name, "font-size:10px;color:#9c9c9c;")
    
    // CONSTANTS //
    const RTSize = CONFIG.$randomTableSize-1,
        RANDOM_TABLE = createRandomTable(),
        BIT32 = 31,

    // ENUMS DESTRUCTURING
    {AIR, SAND, WATER, GRAVEL, INVERTED_WATER, CONTAMINANT, LAVA, ELECTRICITY, COPPER, GAS} = M,
    {GASES, REG_TRANSPIERCEABLE, LIQUIDS, CONTAMINABLE, MELTABLE, STATIC} = G,
    {RANDOM, LEFT, RIGHT} = SP,
    {COLLISION_BOTTOM, COLLISION_RIGHT, COLLISION_LEFT, COLLISION_TOP, COLLISION_X, COLLISION_Y} = FLAGS

    // VARIABLES //
    // TIMER
    let timerCount = 0, skipsCount = 0,
    // RANDOMNESS
    randomIndex = 0,
    // GLOBAL CACHES
    SP_RANDOM = null, SP_LEFT = null, SP_RIGHT = null, MAP_WIDTH = null,
    // PARAMS
    particle = {
        gridIndexes: null,
        gridMaterials: null,
        indexFlags: null,
        indexPosX: null,
        indexPosY: null,
        indexVelX: null,
        indexVelY: null,
        indexGravity: null,
    },
    cache = {
        dx: null,
        dy: null,
        velX: null,
        velY: null,
        newX: null,
        newY: null,
    }


    // DOC TODO
    function physicsStep(
        gridIndexes, gridMaterials,
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

        particle.gridIndexes = gridIndexes,
        particle.gridMaterials = gridMaterials,
        particle.indexFlags = indexFlags,
        particle.indexPosX = indexPosX,
        particle.indexPosY = indexPosY,
        particle.indexVelX = indexVelX,
        particle.indexVelY = indexVelY,
        particle.indexGravity = indexGravity

        // SKIPS (PERF)
        let skip1=0, skip2=0, skip3=0, pass1=0, pass2=0, pass3=0

        let countIndex = 0, count = indexCount[0]
        for (;countIndex<count;countIndex++) {
            const ox = indexPosX[countIndex], oy = indexPosY[countIndex], oldX = ox|0, oldY = oy|0, gi = oldY*mapWidth+oldX, mat = gridMaterials[gi], i = gridIndexes[gi], flags = indexFlags[i]

            let transpierceableMain = REG_TRANSPIERCEABLE, transpierceableSec = GASES
            cache.dx = 0
            cache.dy = 0
            cache.velX = indexVelX[i]
            cache.velY = indexVelY[i]

            if (i==null || i == -1) console.log("gi:",gi, [oldX, oldY], "i:", i, "|", countIndex)//DEBUG



            if (mat === SAND) {
                // IF COLLSION BOTTOM
                if (flags&COLLISION_BOTTOM) {
                    const m_B = gridMaterials[getAdjacencyCoords(oldX, oldY+1)], m_R = gridMaterials[getAdjacencyCoords(oldX+1, oldY)], m_L = gridMaterials[getAdjacencyCoords(oldX-1, oldY)], m_BR = gridMaterials[getAdjacencyCoords(oldX+1, oldY+1)], m_BL = gridMaterials[getAdjacencyCoords(oldX-1, oldY+1)]

                    // SKIP IF CONTAINED
                    if ((m_B^mat) === 0 && ((m_BR^mat|m_BL^mat) === 0 || (m_R^mat|m_L^mat) === 0) && abs(indexVelX[i]) <= X_VELOCITY_SKIP_THRESHOLD) {skip1++;continue}pass1++

                    // CHECK MAIN DIRECTIONS
                    applySandPhysics(i, m_B, m_R, m_L, m_BR, m_BL, transpierceableMain, transpierceableSec, indexFlags, cache)
                    // TODO JUST UPDATE GRID THEN AND THERE ?
                } 
            }
            else if (mat === WATER) {
                transpierceableMain = GASES
                if (flags&COLLISION_BOTTOM) {
                    const m_B = gridMaterials[getAdjacencyCoords(oldX, oldY+1)], m_R = gridMaterials[getAdjacencyCoords(oldX+1, oldY)], m_L = gridMaterials[getAdjacencyCoords(oldX-1, oldY)], m_BR = gridMaterials[getAdjacencyCoords(oldX+1, oldY+1)], m_BL = gridMaterials[getAdjacencyCoords(oldX-1, oldY+1)]
                    if ((m_B^mat|m_BR^mat|m_BL^mat|m_R^mat|m_L^mat) === 0 && abs(indexVelX[i]) <= X_VELOCITY_SKIP_THRESHOLD) {skip1++;continue}pass1++
                    applyWaterPhysics(i, m_B, m_R, m_L, m_BR, m_BL, transpierceableMain, transpierceableSec, indexFlags, cache)
                } 
            }
            else if (mat === GRAVEL) {
                if (flags&COLLISION_BOTTOM) {
                    const m_B = gridMaterials[getAdjacencyCoords(oldX, oldY+1)]
                    if (m_B&mat && abs(indexVelX[i]) <= X_VELOCITY_SKIP_THRESHOLD) {skip1++;continue}pass1++
                    applyGravelPhysics(i, m_B, transpierceableMain, indexFlags)
                } 
            }
            else if (mat === INVERTED_WATER) {// TODO, give water a 5% chance to travel through it a block
                transpierceableMain = GASES
                if (flags&COLLISION_TOP) {
                    const m_T = gridMaterials[getAdjacencyCoords(oldX, oldY-1)], m_TR = gridMaterials[getAdjacencyCoords(oldX+1, oldY-1)], m_TL = gridMaterials[getAdjacencyCoords(oldX-1, oldY-1)], m_R = gridMaterials[getAdjacencyCoords(oldX+1, oldY)], m_L = gridMaterials[getAdjacencyCoords(oldX-1, oldY)]
                    if ((m_T^mat|m_TR^mat|m_TL^mat|m_R^mat|m_L^mat) === 0 && abs(indexVelX[i]) <= X_VELOCITY_SKIP_THRESHOLD) {skip1++;continue}pass1++
                    applyInvertedWaterPhysics(i, m_T, m_R, m_L, m_TR, m_TL, transpierceableMain, transpierceableSec, indexFlags, cache)
                } 
            }



            // APPLY MOVEMENTS
            applyMovements(i, deltaTime, particle, cache)
            const dx = cache.dx, dy = cache.dy
            if (!(dy || dx)) {skip2++;continue}pass2++

            // MOVE
            if (dx) indexPosX[i] = safeTrunc(clamp(ox+dx))
            if (dy) indexPosY[i] += safeTrunc(dy)

            const newX = (ox+dx)|0, newY = indexPosY[i]|0, gdx = newX-oldX, gdy = newY-oldY, hasNoGdx = gdx === 0, hasNoGdy = gdy === 0
            if (hasNoGdy && hasNoGdx) {skip3++;continue}pass3++
            cache.newX = newX
            cache.newY = newY

            // CHECK FOR COLLISION X/Y
            if (!hasNoGdy) checkCollisionsY(i, mat, gdy, oldX, oldY, transpierceableMain, particle, cache)
            if (!hasNoGdx) checkCollisionsX(i, gi, gdx, oldX, transpierceableMain, particle, cache)
            
            // UPDATE GRID
            updateGrid(i, gi, mat, oldX, oldY, ox, oy, transpierceableMain, particle, cache)
        }

        // PERF
        if (CONFIG.showSkips && count) {
            const skipped = skip1+skip2+skip3, total = count||1
            console.log("SKIPS :", skipped+"/"+total, "("+((skipped/total)*100).toFixed(1)+"%)", "\n -> 1:", skip1, "2:", skip2, "3:", skip3, "\nACTIVE:", (total-skipped)+"/"+total, "("+(((total-skipped)/total)*100).toFixed(1)+"%)", "\n -> p1:", pass1, "p2:", pass2, "p3:", pass3)
            skip1 = skip2 = skip3 = 0
            pass1 = pass2 = pass3 = 0
            if (skipsCount++ > CONFIG.maxLogCount) {
                skipsCount = 0
                console.clear()
            }
        }
        if (CONFIG.timerEnabled) console.timeEnd(CONFIG.timerName)
    }

    // DOC TODO (R?)
    function applySandPhysics(i, m_B, m_R, m_L, m_BR, m_BL, transpierceableMain, transpierceableSec, indexFlags, cache) {
        if (m_B & transpierceableMain) indexFlags[i] ^= COLLISION_BOTTOM
        else {
            // GO SIDES
            if (getSideSelectionPriority()) {
                if (m_R & transpierceableSec && m_BR & transpierceableSec) {
                    cache.dx += 1
                    cache.dy += 1
                } 
            } else {
                if (m_L & transpierceableSec && m_BL & transpierceableSec) {
                    cache.dx -= 1
                    cache.dy += 1
                } 
            }
        }
    }

    // DOC TODO (R?)
    function applyWaterPhysics(i, m_B, m_R, m_L, m_BR, m_BL, transpierceableMain, transpierceableSec, indexFlags, cache) {
        if (m_B & transpierceableMain) indexFlags[i] ^= COLLISION_BOTTOM
        else {
            // GO SIDES
            if (getSideSelectionPriority()) {
                const rightEmpty = m_R & transpierceableSec, leftEmpty = m_L & transpierceableSec
                if (leftEmpty && m_BL & transpierceableSec) {
                    cache.dx -= 1
                    cache.dy += 1
                } else if (rightEmpty && m_BR & transpierceableSec) {
                    cache.dx += 1
                    cache.dy += 1
                }
                else if (leftEmpty) cache.dx -= 1
                else if (rightEmpty) cache.dx += 1
            } else {
                const rightEmpty = m_R & transpierceableSec, leftEmpty = m_L & transpierceableSec
                if (rightEmpty && m_BR & transpierceableSec) {
                    cache.dx += 1
                    cache.dy += 1
                } else if (leftEmpty && m_BL & transpierceableSec) {
                    cache.dx -= 1
                    cache.dy += 1
                }
                else if (rightEmpty) cache.dx += 1
                else if (leftEmpty) cache.dx -= 1
            }
        }
    }
    
    // DOC TODO (R?)
    function applyGravelPhysics(i, m_B, transpierceableMain, indexFlags) {
        if (m_B & transpierceableMain) indexFlags[i] ^= COLLISION_BOTTOM
    }

    // DOC TODO (R?)
    function applyInvertedWaterPhysics(i, m_T, m_R, m_L, m_TR, m_TL, transpierceableMain, transpierceableSec, indexFlags, cache) {
        if (m_T & transpierceableMain) indexFlags[i] ^= COLLISION_TOP
        else {
            // GO SIDES
            if (getSideSelectionPriority()) {
                const rightEmpty = m_R & transpierceableSec, leftEmpty = m_L & transpierceableSec
                if (leftEmpty && m_TL & transpierceableSec) {
                    cache.dx -= 1
                    cache.dy -= 1
                } else if (rightEmpty && m_TR & transpierceableSec) {
                    cache.dx += 1
                    cache.dy -= 1
                }
                else if (leftEmpty) cache.dx -= 1
                else if (rightEmpty) cache.dx += 1
            } else {
                const rightEmpty = m_R & transpierceableSec, leftEmpty = m_L & transpierceableSec
                if (rightEmpty && m_TR & transpierceableSec) {
                    cache.dx += 1
                    cache.dy -= 1
                } else if (leftEmpty && m_TL & transpierceableSec) {
                    cache.dx -= 1
                    cache.dy -= 1
                }
                else if (rightEmpty) cache.dx += 1
                else if (leftEmpty) cache.dx -= 1
            }
        }
    }


    function applyMovements(i, deltaTime, particle, cache) {
        const indexFlags = particle.indexFlags, flags = indexFlags[i], gravity = particle.indexGravity[i], isBottomGravity = gravity >= 0
        let velX = cache.velX, velY = cache.velY

        // ADD VERTICAL FORCES
        if (isBottomGravity ? (flags&COLLISION_BOTTOM) === 0 : (flags&COLLISION_TOP) === 0) velY = particle.indexVelY[i] += gravity*deltaTime
        // DECELERATE X VEL WHEN ON GROUND
        else {
            const indexVelX = particle.indexVelX, rate = GROUND_VELX_DECELERATION_RATE*deltaTime
            if (velX > 0) velX = indexVelX[i] = velX > rate ? velX-rate : 0
            else velX =  indexVelX[i] = velX < -rate ? velX+rate : 0
        }

        cache.velX = velX
        cache.velY = velY
        cache.dx += velX*deltaTime
        cache.dy += velY*deltaTime
    }

    function checkCollisionsY(i, mat, gdy, oldX, oldY, transpierceableMain, particle, cache) {
        const gridMaterials = particle.gridMaterials,
            indexVelY = particle.indexVelY,
            indexPosY = particle.indexPosY,
            indexFlags = particle.indexFlags

        const absGdy = abs(gdy), dirGdy = 1|(gdy>>BIT32)

        if (absGdy > 1) {// check collision at oldY..newY
            for (let colY=oldY+dirGdy,colI=0; colI<absGdy; colI++,colY+=dirGdy) {
                const gi_Dest = getAdjacencyCoords(oldX, colY), m_Dest = gridMaterials[gi_Dest], hasCollision = !(m_Dest & transpierceableMain)
                if (hasCollision) {
                    cache.newY = (indexPosY[i] = colY-dirGdy)|0
                    indexFlags[i] |= dirGdy===1 ? COLLISION_BOTTOM : COLLISION_TOP
                    if (m_Dest && m_Dest !== mat) indexVelY[i] = 2*dirGdy
                    else if (!m_Dest) indexVelY[i] = 0
                    break
                }
            }
        } else {// check collision at destination pos
            const gi_Dest = getAdjacencyCoords(oldX, cache.newY), m_Dest = gridMaterials[gi_Dest], hasCollision = !(m_Dest & transpierceableMain)
            if (hasCollision) {
                cache.newY = (indexPosY[i] = oldY)|0
                indexFlags[i] |= dirGdy===1 ? COLLISION_BOTTOM : COLLISION_TOP
                if (m_Dest && m_Dest !== mat) indexVelY[i] = 2*dirGdy
                else if (!m_Dest) indexVelY[i] = 0
            }
        }
    }
    
    function checkCollisionsX(i, gi, gdx, oldX, transpierceableMain, particle, cache) {
        const gridMaterials = particle.gridMaterials,
            gridIndexes = particle.gridIndexes,
            indexVelX = particle.indexVelX,
            indexPosX = particle.indexPosX,
            indexFlags = particle.indexFlags,
            velX = cache.vel,
            newX = cache.newX,
            newY = cache.newY

        const absGdx = abs(gdx), dirGdx = 1|(gdx>>BIT32)

        if (absGdx > 1) {// check collision at oldX..newX
            for (let colX=oldX+dirGdx,colI=0; colI<absGdx; colI++,colX+=dirGdx) {
                const gi_Dest = getAdjacencyCoords(colX, newY), m_Dest = gridMaterials[gi_Dest], hasCollision = !(m_Dest & transpierceableMain)
                if (hasCollision) {
                    const velDiff = abs(indexVelX[gridIndexes[gi_Dest]]-velX)
                    if (m_Dest & STATIC || gi_Dest === gi || velDiff > X_COLLISION_VELOCITY_DIFFERENCE_THRESHOLD) {
                        indexVelX[i] = 0
                        indexFlags[i] |= dirGdx===1 ? COLLISION_RIGHT : COLLISION_LEFT
                    }
                    return cache.newX = (indexPosX[i] = colX-dirGdx)|0
                }
            }
        } else {// check collision at destination pos
            const gi_Dest = getAdjacencyCoords(newX, newY), m_Dest = gridMaterials[gi_Dest], hasCollision = !(m_Dest & transpierceableMain)
            if (hasCollision) {
                const velDiff = abs(indexVelX[gridIndexes[gi_Dest]]-velX)
                if (m_Dest & STATIC || gi_Dest === gi || velDiff > X_COLLISION_VELOCITY_DIFFERENCE_THRESHOLD) {
                    indexVelX[i] = 0
                    indexFlags[i] |= dirGdx===1 ? COLLISION_RIGHT : COLLISION_LEFT
                }
                return cache.newX = (indexPosX[i] = oldX)|0
            }
        }
    }

    function updateGrid(i, gi, mat, oldX, oldY, ox, oy, transpierceableMain, particle, cache) {
        const gridMaterials = particle.gridMaterials,
            gridIndexes = particle.gridIndexes,
            //indexFlags = particle.indexFlags,
            //indexVelX = particle.indexVelX,
            //indexVelY = particle.indexVelY,
            indexPosX = particle.indexPosX,
            indexPosY = particle.indexPosY,
            //indexGravity = particle.indexGravity,
            newX = cache.newX,
            newY = cache.newY

        const newGridI = getAdjacencyCoords(newX, newY), m_Dest = gridMaterials[newGridI] & transpierceableMain
        // SWITCH ONLY IF DEST IS TRANSPIERCEABLE
        if (m_Dest !== 0) {
            const atI = gridIndexes[newGridI]
            // move to new pos
            gridIndexes[newGridI] = i
            gridMaterials[newGridI] = mat

            // switch info
            gridIndexes[gi] = atI
            gridMaterials[gi] = m_Dest
            if (atI !== -1) {
                //indexFlags[atI] = indexFlags[i]
                indexPosX[atI] = ox
                indexPosY[atI] = oy
                //indexVelX[atI] = indexVelX[i]
                //indexVelY[atI] = indexVelY[i]
                //indexGravity[atI] = indexGravity[i]
            }
        } else {
            if (newX-oldX !== 0) {
                console.log(i, "-------CANCEL-X", ": changes ->", newX-oldX, newY-oldY, "|", [indexPosX[i], indexPosY[i]], [ox, oy], "go", [newX, newY])
                indexPosX[i] = ox
            }
            if (newY-oldY !== 0) {
                console.log(i, "-------CANCEL-Y", ": changes ->", newX-oldX, newY-oldY, "|", [indexPosX[i], indexPosY[i]], [ox, oy], "go", [newX, newY])
                indexPosY[i] = oy
            }
        }
    }

    // UTILS //

    // DOC TODO
    const FLOAT32_TRUNC_ARR = new Float32Array(1), UINT32_TRUNC_ARR = new Uint32Array(FLOAT32_TRUNC_ARR.buffer)
    function safeTrunc(num) {
        FLOAT32_TRUNC_ARR[0] = num
        if (FLOAT32_TRUNC_ARR[0] > num) UINT32_TRUNC_ARR[0]--
        return FLOAT32_TRUNC_ARR[0]
    }

    // DOC TODO
    function abs(num) {
       return (num^(num>>BIT32))-(num>>BIT32)
    }
    
    // DOC TODO
    function getAdjacencyCoords(x, y) {
        return y*MAP_WIDTH+clamp(x)
    }

    // DOC TODO
    function getSideSelectionPriority() {
        if (SP_LEFT) return true
        if (SP_RIGHT) return false
        if (SP_RANDOM) return RANDOM_TABLE[randomIndex++&RTSize] < .5
    }

    // DOC TODO
    function clamp(num, min=0, max=MAP_WIDTH-1) {
        return num < min ? min : num > max ? max : num
    }

    // DOC TODO
    function handleTimerPre() {
        if (timerCount++ > CONFIG.maxLogCount) {
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