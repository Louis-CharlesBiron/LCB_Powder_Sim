const FLAGS = {
    COLLISION_BOTTOM: 1<<0,
    COLLISION_RIGHT: 1<<1,
    COLLISION_LEFT: 1<<2,
    COLLISION_TOP: 1<<3,
    COLLISION_X: (1<<1)|(1<<2),
    COLLISION_Y: (1<<3)|(1<<0),

    TRANSFORM_CONTAMINANT: 1<<4,
    TRANSFORM_LAVA: 1<<5,
    TRANSFORM_STONE: 1<<6,
    TRANSFORM_FIRE: 1<<7,
    TRANSFORM_VAPOR: 1<<8,
    TRANSFORM_AIR: 1<<9,
}

const X_COLLISION_VELOCITY_DIFFERENCE_THRESHOLD = 5,
    Y_COLLISION_VELOCITY_DIFFERENCE_THRESHOLD = 5,
    X_VELOCITY_SKIP_THRESHOLD = 5,
    GROUND_VELX_DECELERATION_RATE = 135,
    TRANSFORM_PREFIX = "TRANSFORM_"

// DOC TODO
function createPhysicsCore(CONFIG, MATERIALS, MATERIAL_GROUPS, MATERIAL_NAMES, SIDE_PRIORITIES) {
    console.log("%cCONTEXT: "+self.constructor.name, "font-size:10px;color:#9c9c9c;")
    
    // COMPUTE VAR UTILS
    const TRANSFORMS_MAP = [],
          HAS_TRANSFORM = Object.entries(FLAGS).reduce((a,b)=>{
                const isTransforms = b[0].includes(TRANSFORM_PREFIX)
                if (isTransforms) {
                    a |= b[1]
                    TRANSFORMS_MAP[b[1]] = MATERIAL_NAMES.indexOf(b[0].split(TRANSFORM_PREFIX)[1])
                }
                return a
            }, 0)

    // CONSTANTS //
    const RTSize = CONFIG.$randomTableSize-1,
        RT = createRandomTable(),
        BIT32 = 31,

    // ENUMS DESTRUCTURING
    {AIR, SAND, WATER, GRAVEL, INVERTED_WATER, CONTAMINANT, LAVA, FIRE, VAPOR} = MATERIALS,
    {
        GASES, REG_TRANSPIERCEABLE, LIQUIDS, CONTAMINABLE, MELTABLE, INFLAMMABLE, FIRE_EXTINGUISH, STATIC,
        ALIVE_TRACKING,
        WATER_SKIPABLE, INVERTED_WATER_SKIPABLE, CONTAMINANT_SKIPABLE, LAVA_SKIPABLE, VAPOR_SKIPABLE, FIRE_SKIPABLE,
    } = MATERIAL_GROUPS,
    {RANDOM, LEFT, RIGHT} = SIDE_PRIORITIES,
    {
        COLLISION_BOTTOM, COLLISION_RIGHT, COLLISION_LEFT, COLLISION_TOP, COLLISION_Y, COLLISION_X,
        TRANSFORM_CONTAMINANT, TRANSFORM_LAVA, TRANSFORM_STONE, TRANSFORM_FIRE, TRANSFORM_VAPOR, TRANSFORM_AIR
    } = FLAGS

    // VARIABLES //
    // TIMER
    let timerCount = 0, skipsCount = 0,
    // RANDOMNESS
    rIndex = 0,
    // GLOBAL CACHES
    SP_RANDOM = null, SP_LEFT = null, SP_RIGHT = null, MAP_WIDTH = null,
    // PARAMS
    particle = {
        indexCount: null,
        gridIndexes: null,
        gridMaterials: null,
        indexFlags: null,
        indexPosX: null,
        indexPosY: null,
        indexVelX: null,
        indexVelY: null,
        indexGravity: null,
        indexStepsAlive: null,
    },
    cache = {dx: null,dy: null,velX: null,velY: null,newX: null,newY: null},
    // CONFIG
    BASE_FRICTION = null,
    FRICTION_COEFFICIENT = null,
    DECAY_THRESHOLDS = [],
    CONTAMINATION_CHANCE = null,
    FIRE_INFLAMMATION_CHANCE = null,
    VAPOR_MOVEMENT_CHANCE = null,
    LAVA_MOVEMENT_CHANCE = null,
    LAVA_MELT_CHANCE = null,
    EQUIVALENT_TRANSPIERCE_CHANCE = null,
    FIRE_PROPAGATES_VAPOR_CREATION_CHANCE = null,
    FIRE_EXTINGUISHES_VAPOR_CREATION_CHANCE = null
    

    // DOC TODO
    function physicsStep(
        gridIndexes, gridMaterials,
        indexCount, indexFlags, indexPosX, indexPosY, indexVelX, indexVelY, indexGravity, indexStepsAlive,
        sidePriority, mapWidth,
        deltaTime
    ) {
        if (CONFIG.timerEnabled) handleTimerPre()

        // VARIABLES UPDATES
        SP_RANDOM = sidePriority===RANDOM
        SP_LEFT = sidePriority===LEFT
        SP_RIGHT = sidePriority===RIGHT
        MAP_WIDTH = mapWidth 
        // CONFIG
        BASE_FRICTION = CONFIG.baseFriction
        FRICTION_COEFFICIENT = CONFIG.frictionCoefficient
        DECAY_THRESHOLDS[VAPOR] = CONFIG.vaporDecayThreshold
        DECAY_THRESHOLDS[FIRE] = CONFIG.fireDecayThreshold
        CONTAMINATION_CHANCE = CONFIG.contaminationChance
        VAPOR_MOVEMENT_CHANCE = CONFIG.vaporMovementChance
        LAVA_MOVEMENT_CHANCE = CONFIG.lavaMovementChance
        LAVA_MELT_CHANCE = CONFIG.lavaMeltChance
        EQUIVALENT_TRANSPIERCE_CHANCE = CONFIG.equivalentTranspierceChance
        FIRE_INFLAMMATION_CHANCE = CONFIG.fireInflammationChance
        FIRE_PROPAGATES_VAPOR_CREATION_CHANCE = CONFIG.firePropagatesVaporCreationChance
        FIRE_EXTINGUISHES_VAPOR_CREATION_CHANCE = CONFIG.fireExtinguishesVaporCreationChance

        particle.indexCount = indexCount
        particle.gridIndexes = gridIndexes
        particle.gridMaterials = gridMaterials
        particle.indexFlags = indexFlags
        particle.indexPosX = indexPosX
        particle.indexPosY = indexPosY
        particle.indexVelX = indexVelX
        particle.indexVelY = indexVelY
        particle.indexGravity = indexGravity
        particle.indexStepsAlive = indexStepsAlive

        // SKIPS (PERF)
        let skip1=0, skip2=0, skip3=0, skip4=0,
            pass1=0, pass2=0, pass3=0

        let countIndex = 0, count = indexCount[0]
        for (;countIndex<count;countIndex++) {
            const ox = indexPosX[countIndex], oy = indexPosY[countIndex], oldX = ox|0, oldY = oy|0, gi = oldY*mapWidth+oldX, i = gridIndexes[gi]
            let behaviorMovementLock = true, transpierceableMain = REG_TRANSPIERCEABLE, transpierceableSec = GASES, mat = gridMaterials[gi], flags = indexFlags[i]
            cache.dx = 0
            cache.dy = 0
            cache.velX = indexVelX[i]
            cache.velY = indexVelY[i]

            if (i==null || i == -1) console.log("SYNC ERROR gi:", gi, [ox, oy], [oldX, oldY], "i:", i, "|", countIndex, SETTINGS.MATERIAL_NAMES[mat])//DEBUG

            // DECAY
            if ((mat & ALIVE_TRACKING) && ++indexStepsAlive[i] >= DECAY_THRESHOLDS[mat]) {
                let newMat = AIR

                if (RT[rIndex++&RTSize] <= FIRE_EXTINGUISHES_VAPOR_CREATION_CHANCE) newMat = VAPOR

                replaceParticleAtIndex(gi, newMat, particle)
                continue
            }

            // TRANSFORMS
            const transformFlag = flags & HAS_TRANSFORM
            if (transformFlag) {
                let newMat = TRANSFORMS_MAP[transformFlag]

                if ((flags & TRANSFORM_FIRE) && RT[rIndex++&RTSize] <= FIRE_PROPAGATES_VAPOR_CREATION_CHANCE) newMat = VAPOR

                mat = replaceParticleAtIndex(gi, newMat, particle)
                if (mat & STATIC) continue
                flags = indexFlags[i] &= ~transformFlag
            }

            // MATERIAL SPECIFICS
            if (mat === SAND) {
                // IF COLLSION BOTTOM
                if (flags&COLLISION_BOTTOM) {
                    const m_B = gridMaterials[getAdjacencyCoords(oldX, oldY+1)], m_R = gridMaterials[getAdjacencyCoords(oldX+1, oldY)], m_L = gridMaterials[getAdjacencyCoords(oldX-1, oldY)], m_BR = gridMaterials[getAdjacencyCoords(oldX+1, oldY+1)], m_BL = gridMaterials[getAdjacencyCoords(oldX-1, oldY+1)]

                    // SKIP IF CONTAINED
                    if ((m_B^mat) === 0 && ((m_BR^mat|m_BL^mat) === 0 || (m_R^mat|m_L^mat) === 0) && abs(indexVelX[i]) <= X_VELOCITY_SKIP_THRESHOLD) {skip1++;continue}pass1++

                    // CHECK MAIN DIRECTIONS
                    applySandBehavior(i, m_B, m_R, m_L, m_BR, m_BL, transpierceableMain, transpierceableSec, indexFlags, cache)
                    behaviorMovementLock = false
                } 
            }
            else if (mat === WATER) {
                transpierceableMain = GASES
                if (flags&COLLISION_BOTTOM) {
                    const m_B = gridMaterials[getAdjacencyCoords(oldX, oldY+1)], m_R = gridMaterials[getAdjacencyCoords(oldX+1, oldY)], m_L = gridMaterials[getAdjacencyCoords(oldX-1, oldY)], m_BR = gridMaterials[getAdjacencyCoords(oldX+1, oldY+1)], m_BL = gridMaterials[getAdjacencyCoords(oldX-1, oldY+1)]
                    
                    if (m_B&WATER_SKIPABLE&&m_BR&WATER_SKIPABLE&&m_BL&WATER_SKIPABLE&&m_R&WATER_SKIPABLE&&m_L&WATER_SKIPABLE && abs(indexVelX[i]) <= X_VELOCITY_SKIP_THRESHOLD) {skip1++;continue}pass1++ 
                    
                    if (RT[rIndex++&RTSize] <= EQUIVALENT_TRANSPIERCE_CHANCE) transpierceableMain |= INVERTED_WATER
                    applyLiquidBehavior(i, m_B, m_R, m_L, m_BR, m_BL, transpierceableMain, transpierceableSec, indexFlags, cache)
                    //behaviorMovementLock = false // TODO FIX
                }
            }
            else if (mat === GRAVEL) {
                if (flags&COLLISION_BOTTOM) {
                    const m_B = gridMaterials[getAdjacencyCoords(oldX, oldY+1)]
                    if (m_B&mat && abs(indexVelX[i]) <= X_VELOCITY_SKIP_THRESHOLD) {skip1++;continue}pass1++
                    applyGravelBehavior(i, m_B, transpierceableMain, indexFlags)
                    behaviorMovementLock = false
                }
            }
            else if (mat === INVERTED_WATER) {
                transpierceableMain = GASES
                if (flags&COLLISION_TOP) {
                    const m_T = gridMaterials[getAdjacencyCoords(oldX, oldY-1)], m_TR = gridMaterials[getAdjacencyCoords(oldX+1, oldY-1)], m_TL = gridMaterials[getAdjacencyCoords(oldX-1, oldY-1)], m_R = gridMaterials[getAdjacencyCoords(oldX+1, oldY)], m_L = gridMaterials[getAdjacencyCoords(oldX-1, oldY)]
                    if (m_T&INVERTED_WATER_SKIPABLE&&m_TR&INVERTED_WATER_SKIPABLE&&m_TL&INVERTED_WATER_SKIPABLE&&m_R&INVERTED_WATER_SKIPABLE&&m_L&INVERTED_WATER_SKIPABLE && abs(indexVelX[i]) <= X_VELOCITY_SKIP_THRESHOLD) {skip1++;continue}pass1++
                    
                    if (RT[rIndex++&RTSize] <= EQUIVALENT_TRANSPIERCE_CHANCE) transpierceableMain |= WATER
                    applyInvertedWaterBehavior(i, m_T, m_R, m_L, m_TR, m_TL, transpierceableMain, transpierceableSec, indexFlags, cache)
                    //behaviorMovementLock = false //TODO FIX
                }
            }
            else if (mat === CONTAMINANT) {
                transpierceableMain = GASES
                if (flags&COLLISION_Y) {
                    const gi_B = getAdjacencyCoords(oldX, oldY+1), m_B = gridMaterials[gi_B], 
                          gi_R = getAdjacencyCoords(oldX+1, oldY), m_R = gridMaterials[gi_R],
                          gi_L = getAdjacencyCoords(oldX-1, oldY), m_L = gridMaterials[gi_L],
                          gi_T = getAdjacencyCoords(oldX, oldY-1), m_T = gridMaterials[gi_T]??mat,
                          m_BR = gridMaterials[getAdjacencyCoords(oldX+1, oldY+1)],
                          m_BL = gridMaterials[getAdjacencyCoords(oldX-1, oldY+1)]

                    if ((m_B|m_R|m_L|m_T) & CONTAMINABLE) applyContaminantBehavior(m_B, m_R, m_L, m_T, gi_B, gi_R, gi_L, gi_T, particle)

                    if (m_B&CONTAMINANT_SKIPABLE&&m_BR&CONTAMINANT_SKIPABLE&&m_BL&CONTAMINANT_SKIPABLE&&m_R&CONTAMINANT_SKIPABLE&&m_L&CONTAMINANT_SKIPABLE && abs(indexVelX[i]) <= X_VELOCITY_SKIP_THRESHOLD) {skip1++;continue}pass1++
                    applyLiquidBehavior(i, m_B, m_R, m_L, m_BR, m_BL, transpierceableMain, transpierceableSec, indexFlags, cache)
                    //behaviorMovementLock = false //TODO FIX
                } 
            }
            else if (mat === LAVA) {
                transpierceableMain = GASES
                if (flags&COLLISION_BOTTOM) {
                    if (RT[rIndex++&RTSize] <= LAVA_MOVEMENT_CHANCE) {skip4++;continue}

                    const gi_B = getAdjacencyCoords(oldX, oldY+1), m_B = gridMaterials[gi_B], 
                          gi_R = getAdjacencyCoords(oldX+1, oldY), m_R = gridMaterials[gi_R],
                          gi_L = getAdjacencyCoords(oldX-1, oldY), m_L = gridMaterials[gi_L],
                          gi_T = getAdjacencyCoords(oldX, oldY-1), m_T = gridMaterials[gi_T]??mat,
                          m_BR = gridMaterials[getAdjacencyCoords(oldX+1, oldY+1)],
                          m_BL = gridMaterials[getAdjacencyCoords(oldX-1, oldY+1)]
                    
                    if ((m_B|m_R|m_L|m_T) & (MELTABLE|LIQUIDS)) applyLavaBehavior(gi, m_B, m_R, m_L, m_T, gi_B, gi_R, gi_L, gi_T, particle)

                    if (m_B&LAVA_SKIPABLE&&m_BR&LAVA_SKIPABLE&&m_BL&LAVA_SKIPABLE&&m_R&LAVA_SKIPABLE&&m_L&LAVA_SKIPABLE && abs(indexVelX[i]) <= X_VELOCITY_SKIP_THRESHOLD) {skip1++;continue}pass1++
                    applyLiquidBehavior(i, m_B, m_R, m_L, m_BR, m_BL, transpierceableMain, transpierceableSec, indexFlags, cache)
                    behaviorMovementLock = false //TODO FIX
                } 
            }
            else if (mat === VAPOR) {
                transpierceableMain = AIR
                if (flags&COLLISION_TOP) {
                    if (RT[rIndex++&RTSize] <= VAPOR_MOVEMENT_CHANCE) {skip4++;continue}

                    const m_T = gridMaterials[getAdjacencyCoords(oldX, oldY-1)]??mat, m_R = gridMaterials[getAdjacencyCoords(oldX+1, oldY)], m_L = gridMaterials[getAdjacencyCoords(oldX-1, oldY)]
                    if (m_T&VAPOR_SKIPABLE&&m_R&VAPOR_SKIPABLE&&m_L&VAPOR_SKIPABLE) {skip1++;continue}pass1++

                    applyVaporBehavior(i, m_T, m_R, m_L, transpierceableMain, indexFlags, cache)
                }
            }
            else if (mat === FIRE) {
                transpierceableMain = AIR|VAPOR

                const gi_B = getAdjacencyCoords(oldX, oldY+1), m_B = gridMaterials[gi_B], 
                      gi_R = getAdjacencyCoords(oldX+1, oldY), m_R = gridMaterials[gi_R],
                      gi_L = getAdjacencyCoords(oldX-1, oldY), m_L = gridMaterials[gi_L],
                      gi_T = getAdjacencyCoords(oldX, oldY-1), m_T = gridMaterials[gi_T]??mat

                if ((m_B|m_R|m_L|m_T) & (INFLAMMABLE|FIRE_EXTINGUISH)) applyFireBehavior(gi, m_B, m_R, m_L, m_T, gi_B, gi_R, gi_L, gi_T, particle)

                if (flags&COLLISION_TOP) {
                    const m_TR = gridMaterials[getAdjacencyCoords(oldX+1, oldY-1)], m_TL = gridMaterials[getAdjacencyCoords(oldX-1, oldY-1)]

                    if (m_T&FIRE_SKIPABLE&&m_TR&FIRE_SKIPABLE&&m_TL&FIRE_SKIPABLE&&m_R&FIRE_SKIPABLE&&m_L&FIRE_SKIPABLE) {skip1++;continue}pass1++
                    applyInvertedWaterBehavior(i, m_T, m_R, m_L, m_TR, m_TL, transpierceableMain, transpierceableSec, indexFlags, cache)
                }
            }

            // APPLY MOVEMENTS
            if (behaviorMovementLock) applyForces(i, deltaTime, particle, cache)
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
            if (behaviorMovementLock) {
                if (!hasNoGdy) checkCollisionsY(i, mat, gdy, oldX, oldY, transpierceableMain, particle, cache)
                if (!hasNoGdx) checkCollisionsX(i, gi, mat, gdx, oldX, transpierceableMain, particle, cache)
            }
            
            // UPDATE GRID
            updateGrid(i, gi, mat, ox, oy, transpierceableMain, particle, cache)

            // TEMP PERF
            const pxSize = 0
            if (pxSize) simulation.render.stroke(Render.getPositionsRect([cache.newX*pxSize-1, cache.newY*pxSize-1], [cache.newX*pxSize+pxSize+1, cache.newY*pxSize+pxSize+1]), [0,255,255,1])
        }

        // PERF
        if (CONFIG.showSkips && count) {
            const skipped = skip1+skip2+skip3, total = count||1
            console.log("SKIPS :", skipped+"/"+total, "("+((skipped/total)*100).toFixed(1)+"%)", "\n -> 1:", skip1, "2:", skip2, "3:", skip3, "4:", skip4, "\nACTIVE:", (total-skipped)+"/"+total, "("+(((total-skipped)/total)*100).toFixed(1)+"%)", "\n -> p1:", pass1, "p2:", pass2, "p3:", pass3)
            skip1 = skip2 = skip3 = skip4 = 0
            pass1 = pass2 = pass3 = 0
            if (skipsCount++ > CONFIG.maxLogCount) {
                skipsCount = 0
                console.clear()
            }
        }
        if (CONFIG.timerEnabled) console.timeEnd(CONFIG.timerName)
    }

    // DOC TODO (R?)
    function applySandBehavior(i, m_B, m_R, m_L, m_BR, m_BL, transpierceableMain, transpierceableSec, indexFlags, cache) {
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
    function applyLiquidBehavior(i, m_B, m_R, m_L, m_BR, m_BL, transpierceableMain, transpierceableSec, indexFlags, cache) {
        if (m_B & transpierceableMain) indexFlags[i] &= ~COLLISION_BOTTOM
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
    function applyGravelBehavior(i, m_B, transpierceableMain, indexFlags) {
        if (m_B & transpierceableMain) indexFlags[i] ^= COLLISION_BOTTOM
    }

    // DOC TODO (R?)
    function applyInvertedWaterBehavior(i, m_T, m_R, m_L, m_TR, m_TL, transpierceableMain, transpierceableSec, indexFlags, cache) {
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

    // DOC TODO (R?)
    function applyContaminantBehavior(m_B, m_R, m_L, m_T, gi_B, gi_R, gi_L, gi_T, particle) {
        const gridIndexes = particle.gridIndexes, indexFlags = particle.indexFlags

        if (m_B&CONTAMINABLE && RT[rIndex++&RTSize] <= CONTAMINATION_CHANCE) indexFlags[gridIndexes[gi_B]] |= TRANSFORM_CONTAMINANT
        if (m_R&CONTAMINABLE && RT[rIndex++&RTSize] <= CONTAMINATION_CHANCE) indexFlags[gridIndexes[gi_R]] |= TRANSFORM_CONTAMINANT
        if (m_L&CONTAMINABLE && RT[rIndex++&RTSize] <= CONTAMINATION_CHANCE) indexFlags[gridIndexes[gi_L]] |= TRANSFORM_CONTAMINANT
        if (m_T&CONTAMINABLE && RT[rIndex++&RTSize] <= CONTAMINATION_CHANCE) indexFlags[gridIndexes[gi_T]] |= TRANSFORM_CONTAMINANT
    }
    
    // DOC TODO (R?)
    function applyLavaBehavior(gi, m_B, m_R, m_L, m_T, gi_B, gi_R, gi_L, gi_T, particle) {
        const gridIndexes = particle.gridIndexes, indexFlags = particle.indexFlags

        if (m_B&LIQUIDS||m_R&LIQUIDS||m_L&LIQUIDS||m_T&LIQUIDS) indexFlags[gridIndexes[gi]] |= TRANSFORM_STONE

        if (m_B&MELTABLE && RT[rIndex++&RTSize] <= LAVA_MELT_CHANCE) indexFlags[gridIndexes[gi_B]] |= TRANSFORM_LAVA
        if (m_R&MELTABLE && RT[rIndex++&RTSize] <= LAVA_MELT_CHANCE) indexFlags[gridIndexes[gi_R]] |= TRANSFORM_LAVA
        if (m_L&MELTABLE && RT[rIndex++&RTSize] <= LAVA_MELT_CHANCE) indexFlags[gridIndexes[gi_L]] |= TRANSFORM_LAVA
        if (m_T&MELTABLE && RT[rIndex++&RTSize] <= LAVA_MELT_CHANCE) indexFlags[gridIndexes[gi_T]] |= TRANSFORM_LAVA
    }

    // DOC TODO (R?)
    function applyVaporBehavior(i, m_T, m_R, m_L, transpierceableMain, indexFlags, cache) {
        if (m_T & transpierceableMain) indexFlags[i] ^= COLLISION_TOP
        else {
            // GO SIDES
            if (getSideSelectionPriority()) {
                if (m_L & transpierceableMain) cache.dx -= 1
                else if (m_R & transpierceableMain) cache.dx += 1
            } else {
                if (m_R & transpierceableMain) cache.dx += 1
                else if (m_L & transpierceableMain) cache.dx -= 1
            }
        }
    }
    
    // DOC TODO (R?)
    function applyFireBehavior(gi, m_B, m_R, m_L, m_T, gi_B, gi_R, gi_L, gi_T, particle) {
        const gridIndexes = particle.gridIndexes, indexFlags = particle.indexFlags

        if ((m_B|m_R|m_L|m_T) & FIRE_EXTINGUISH) indexFlags[gridIndexes[gi]] |= RT[rIndex++&RTSize] <= FIRE_EXTINGUISHES_VAPOR_CREATION_CHANCE ? TRANSFORM_VAPOR : TRANSFORM_AIR

        if (m_B&INFLAMMABLE && RT[rIndex++&RTSize] <= FIRE_INFLAMMATION_CHANCE) indexFlags[gridIndexes[gi_B]] |= TRANSFORM_FIRE
        if (m_R&INFLAMMABLE && RT[rIndex++&RTSize] <= FIRE_INFLAMMATION_CHANCE) indexFlags[gridIndexes[gi_R]] |= TRANSFORM_FIRE
        if (m_L&INFLAMMABLE && RT[rIndex++&RTSize] <= FIRE_INFLAMMATION_CHANCE) indexFlags[gridIndexes[gi_L]] |= TRANSFORM_FIRE
        if (m_T&INFLAMMABLE && RT[rIndex++&RTSize] <= FIRE_INFLAMMATION_CHANCE) indexFlags[gridIndexes[gi_T]] |= TRANSFORM_FIRE
    }



    function applyForces(i, deltaTime, particle, cache) {
        const indexFlags = particle.indexFlags, indexVelX = particle.indexVelX, flags = indexFlags[i], gravity = particle.indexGravity[i], isBottomGravity = gravity >= 0
        let velX = cache.velX, velY = cache.velY

        // ADD VERTICAL FORCES
        if (isBottomGravity ? (flags&COLLISION_BOTTOM) === 0 : (flags&COLLISION_TOP) === 0) velY = particle.indexVelY[i] += gravity*deltaTime

        // HORIZONTAL FRICTION
        const speed = abs(velX), rate = (BASE_FRICTION+speed*speed*.5*FRICTION_COEFFICIENT)*deltaTime
        indexVelX[i] = speed>rate ? velX-((velX/speed)*rate) : 0 

        cache.velX = velX
        cache.velY = velY
        cache.dx += velX*deltaTime
        cache.dy += velY*deltaTime
    }

    function checkCollisionsY(i, mat, gdy, oldX, oldY, transpierceableMain, particle, cache) {
        const gridMaterials = particle.gridMaterials,
            indexVelY = particle.indexVelY,
            indexPosY = particle.indexPosY,
            indexFlags = particle.indexFlags,
            absGdy = abs(gdy),
            dirGdy = 1|(gdy>>BIT32)

        if (absGdy > 1) {// check collision at oldY..newY
            for (let colY=oldY+dirGdy,colI=0; colI<absGdy; colI++,colY+=dirGdy) {
                const gi_Dest = getAdjacencyCoords(oldX, colY), m_Dest = gridMaterials[gi_Dest], hasCollision = !(m_Dest & transpierceableMain)
                if (hasCollision) {
                    cache.newY = (indexPosY[i] = colY-dirGdy)|0
                    indexFlags[i] |= dirGdy===1 ? COLLISION_BOTTOM : COLLISION_TOP
                    if ((mat&GASES) === 0) {
                        if (m_Dest && m_Dest !== mat) indexVelY[i] = 2*dirGdy
                        else if (!m_Dest) indexVelY[i] = 0
                    }
                    break
                }
            }
        } else {// check collision at destination pos
            const gi_Dest = getAdjacencyCoords(oldX, cache.newY), m_Dest = gridMaterials[gi_Dest], hasCollision = !(m_Dest & transpierceableMain)
            if (hasCollision) {
                cache.newY = (indexPosY[i] = oldY)|0
                indexFlags[i] |= dirGdy===1 ? COLLISION_BOTTOM : COLLISION_TOP
                if ((mat&GASES) === 0) {
                    if (m_Dest && m_Dest !== mat) indexVelY[i] = 2*dirGdy
                    else if (!m_Dest) indexVelY[i] = 0
                }
            }
        }
    }
    
    function checkCollisionsX(i, gi, mat, gdx, oldX, transpierceableMain, particle, cache) {
        const gridMaterials = particle.gridMaterials,
            gridIndexes = particle.gridIndexes,
            indexVelX = particle.indexVelX,
            indexPosX = particle.indexPosX,
            indexFlags = particle.indexFlags,
            velX = cache.vel,
            newX = cache.newX,
            newY = cache.newY,
            absGdx = abs(gdx),
            dirGdx = 1|(gdx>>BIT32)

        if (absGdx > 1) {// check collision at oldX..newX
            for (let colX=oldX+dirGdx,colI=0; colI<absGdx; colI++,colX+=dirGdx) {
                const gi_Dest = getAdjacencyCoords(colX, newY), m_Dest = gridMaterials[gi_Dest], hasCollision = !(m_Dest & transpierceableMain)
                if (hasCollision) {
                    const velDiff = abs(indexVelX[gridIndexes[gi_Dest]]-velX)
                    if ((mat&GASES) === 0 && (m_Dest & STATIC || gi_Dest === gi || velDiff > X_COLLISION_VELOCITY_DIFFERENCE_THRESHOLD)) {
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
                if ((mat&GASES) === 0 && (m_Dest & STATIC || gi_Dest === gi || velDiff > X_COLLISION_VELOCITY_DIFFERENCE_THRESHOLD)) {
                    indexVelX[i] = 0
                    indexFlags[i] |= dirGdx===1 ? COLLISION_RIGHT : COLLISION_LEFT
                }
                return cache.newX = (indexPosX[i] = oldX)|0
            }
        }
    }

    function updateGrid(i, gi, mat, ox, oy, transpierceableMain, particle, cache) {
        const gridMaterials = particle.gridMaterials,
            gridIndexes = particle.gridIndexes,
            indexPosX = particle.indexPosX,
            indexPosY = particle.indexPosY,
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
                indexPosX[atI] = ox
                indexPosY[atI] = oy
            }
        } 
    }

    // DOC TODO
    function replaceParticleAtIndex(gridIndex, material, particle) {
        const gridMaterials = particle.gridMaterials, gridIndexes = particle.gridIndexes, indexCount = particle.indexCount,
              indexFlags = particle.indexFlags, indexPosX = particle.indexPosX, indexPosY = particle.indexPosY, indexVelX = particle.indexVelX, indexVelY = particle.indexVelY, indexGravity = particle.indexGravity, indexStepsAlive = particle.indexStepsAlive,
              isStatic = material & STATIC, oldIndex = gridIndexes[gridIndex]

    
        // INIT IF DYNAMIC
        if (!isStatic) {
            const random = SimUtils.random,
                y = (gridIndex/MAP_WIDTH)|0,
                x = gridIndex-y*MAP_WIDTH,
                materialSettings = MaterialSettings.MATERIALS_SETTINGS[material]
        
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
                const x = indexPosX[oldIndex] = indexPosX[i], y = indexPosY[oldIndex] = indexPosY[i]
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

    // UTILS //

    // DOC TODO
    const FLOAT32_TRUNC_ARR = new Float32Array(1), UINT32_TRUNC_ARR = new Uint32Array(FLOAT32_TRUNC_ARR.buffer)
    function safeTrunc(num) {// (R?)
        FLOAT32_TRUNC_ARR[0] = num
        if (FLOAT32_TRUNC_ARR[0] > num) UINT32_TRUNC_ARR[0]--
        return FLOAT32_TRUNC_ARR[0]
    }

    // DOC TODO
    function abs(num) {// (R?)
       return (num^(num>>BIT32))-(num>>BIT32)
    }
    
    // DOC TODO
    function getAdjacencyCoords(x, y) {// (R?)
        return y*MAP_WIDTH+clamp(x)
    }

    // DOC TODO
    function getSideSelectionPriority() {// (R?)
        if (SP_RANDOM) return RT[rIndex++&RTSize] < .5
        else if (SP_LEFT) return true
        else if (SP_RIGHT) return false
    }

    // DOC TODO
    function clamp(num, min=0, max=MAP_WIDTH-1) {// (R?)
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