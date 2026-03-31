/**
 * Create a function to compute physics steps and the context for it
 * @returns The function that computes physics steps
 */
function createPhysicsCoreWorker(CONFIG, MATERIALS_SETTINGS, MATERIALS, MATERIAL_GROUPS, MATERIAL_NAMES, SIDE_PRIORITIES, PHYSICS_DATA_ATTRIBUTES) {    
    // CONSTANTS //
    let _FLAGS_I = 0
    const RTSize = CONFIG.$randomTableSize-1,
        BIT32 = 31,
        X_VELOCITY_SKIP_THRESHOLD = 5,
        TRANSFORM_PREFIX = "TRANSFORM_",
        FLAGS = {
            FINALIZED: 1<<_FLAGS_I++,
            COLLISION_BOTTOM: 1<<_FLAGS_I++,
            COLLISION_RIGHT: 1<<_FLAGS_I++,
            COLLISION_LEFT: 1<<_FLAGS_I++,
            COLLISION_TOP: 1<<_FLAGS_I++,
            COLLISION_Y: null,

            TRANSFORM_CONTAMINANT: 1<<_FLAGS_I++,
            TRANSFORM_LAVA: 1<<_FLAGS_I++,
            TRANSFORM_STONE: 1<<_FLAGS_I++,
            TRANSFORM_FIRE: 1<<_FLAGS_I++,
            TRANSFORM_VAPOR: 1<<_FLAGS_I++,
            TRANSFORM_AIR: 1<<_FLAGS_I++,
        }
            
    FLAGS.COLLISION_Y = FLAGS.COLLISION_BOTTOM|FLAGS.COLLISION_TOP

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

    // ENUMS DESTRUCTURING
    const {AIR, SAND, WATER, GRAVEL, INVERTED_WATER, CONTAMINANT, LAVA, FIRE, VAPOR} = MATERIALS,
          {RANDOM, LEFT, RIGHT} = SIDE_PRIORITIES,
          {
              GASES, REG_TRANSPIERCEABLE, LIQUIDS, CONTAMINABLE, MELTABLE, INFLAMMABLE, FIRE_EXTINGUISH, STATIC,
              ALIVE_TRACKING, DEPOSITABLE,
              SAND_SKIPABLE, WATER_SKIPABLE, GRAVEL_SKIPABLE, INVERTED_WATER_SKIPABLE, CONTAMINANT_SKIPABLE, LAVA_SKIPABLE, VAPOR_SKIPABLE, FIRE_SKIPABLE,
          } = MATERIAL_GROUPS,
          {
              FINALIZED,
              COLLISION_BOTTOM, COLLISION_TOP, COLLISION_Y,
              TRANSFORM_FIRE,
          } = FLAGS,

    // UTILS / MATERIALS BEHAVIOR
    {_updatePhysicsUtilsGlobals, safeTrunc, abs, clamp, getAdjacencyCoords, getSideSelectionPriority, replaceParticleAtIndex, nextRandom} = getPhysicsUtils(RTSize, MATERIALS_SETTINGS, MATERIAL_GROUPS, PHYSICS_DATA_ATTRIBUTES),
    {_updateMaterialsBehaviorGlobals, applySandBehavior, applyLiquidBehavior, applyGravelBehavior, applyInvertedWaterBehavior, applyContaminantBehavior, applyLavaBehavior, applyVaporBehavior, applyFireBehavior} = getMaterialsBehavior(MATERIAL_GROUPS, FLAGS, getSideSelectionPriority, nextRandom)

    // VARIABLES //
    // TIMER
    let timerCount = 0, skipsCount = 0,
    // PARAMS
    cache = {
        dx: null,
        dy: null,
        velX: null,
        velY: null,
        newX: null,
        newY: null
    },
    // CONFIG
    ARRAY_SIZE = 0,
    DECAY_THRESHOLDS = [],
    BASE_FRICTION,
    FRICTION_COEFFICIENT,
    VAPOR_MOVEMENT_CHANCE,
    LAVA_MOVEMENT_CHANCE,
    EQUIVALENT_TRANSPIERCE_CHANCE,
    COLLISION_FINALIZATION_TIME,
    FIRE_PROPAGATES_VAPOR_CREATION_CHANCE,
    FIRE_EXTINGUISHES_VAPOR_CREATION_CHANCE,
    ENABLE_2ND_FALL_UNIFORMITY

    // Computes a physics step
    function physicsStep(
        startI, threadCount,
        gridIndexes, gridMaterials, indexCount, indexFlags, indexPhysicsData, indexGravity, indexStepsAlive,
        sidePriority, mapWidth, deltaTime, arraySize
    ) {
        // VARIABLES UPDATES
        _updatePhysicsUtilsGlobals(mapWidth, sidePriority===RANDOM, sidePriority===LEFT, sidePriority===RIGHT)
        _updateMaterialsBehaviorGlobals(CONFIG.contaminationChance, CONFIG.lavaMeltChance, CONFIG.fireExtinguishesVaporCreationChance, CONFIG.fireInflammationChance)
        // CONFIG
        ENABLE_2ND_FALL_UNIFORMITY = CONFIG.enable2ndFallUniformity
        BASE_FRICTION = CONFIG.baseFriction
        FRICTION_COEFFICIENT = CONFIG.frictionCoefficient
        DECAY_THRESHOLDS[VAPOR] = CONFIG.vaporDecayThreshold
        DECAY_THRESHOLDS[FIRE] = CONFIG.fireDecayThreshold
        VAPOR_MOVEMENT_CHANCE = CONFIG.vaporMovementChance
        LAVA_MOVEMENT_CHANCE = CONFIG.lavaMovementChance
        EQUIVALENT_TRANSPIERCE_CHANCE = CONFIG.equivalentTranspierceChance
        COLLISION_FINALIZATION_TIME = CONFIG.collisionFinalizationTime
        FIRE_PROPAGATES_VAPOR_CREATION_CHANCE = CONFIG.firePropagatesVaporCreationChance
        FIRE_EXTINGUISHES_VAPOR_CREATION_CHANCE = CONFIG.fireExtinguishesVaporCreationChance
        ARRAY_SIZE = arraySize-1

        // SKIPS (PERF)
        let skip1=0, skip2=0, skip3=0, skip4=0,
            pass1=0, pass2=0, pass3=0

        let countIndex = startI, count = indexCount[0]
        for (;countIndex<count;countIndex+=threadCount) {
            const ciPD = countIndex*PHYSICS_DATA_ATTRIBUTES, ox = indexPhysicsData[ciPD], oy = indexPhysicsData[ciPD+1], oldX = ox|0, oldY = oy|0,
                  gi = oldY*mapWidth+oldX, i = gridIndexes[gi], iPD = i*PHYSICS_DATA_ATTRIBUTES

                  //console.log(gi, countIndex, [oldX, oldY])
            let transpierceableMain = REG_TRANSPIERCEABLE, transpierceableSec = GASES, mat = Atomics.load(gridMaterials, gi), flags = indexFlags[i]
            cache.dx = 0
            cache.dy = 0
            cache.velX = indexPhysicsData[iPD+2]
            cache.velY = indexPhysicsData[iPD+3]

            //DEBUG
            if (countIndex >= count) console.warn("YOOO", countIndex, count)
            if (i==null || i === -1) {
                console.log("T:"+startI, "SYNC ERROR gi:", gi, [ox, oy], [oldX, oldY], "i:", i, "|", countIndex, mat)
                break
            }

            // DECAY
            if ((mat&ALIVE_TRACKING) && ++indexStepsAlive[i] >= DECAY_THRESHOLDS[mat]) {
                let newMat = AIR

                if (nextRandom() <= FIRE_EXTINGUISHES_VAPOR_CREATION_CHANCE) newMat = VAPOR

                replaceParticleAtIndex(gi, newMat, indexCount, gridMaterials, gridIndexes, indexFlags, indexPhysicsData, indexGravity, indexStepsAlive)
                continue
            }

            // 2ND FALL UNIFORMITY
            //if (ENABLE_2ND_FALL_UNIFORMITY && mat&DEPOSITABLE) {
            //    const hasBottomCollision = flags&COLLISION_BOTTOM, isFinalized = flags&FINALIZED
//
            //    if (isFinalized && hasBottomCollision===0) {
            //        indexFlags[i] &= ~FINALIZED
            //        indexStepsAlive[i] = 0
            //    }
            //    else if (isFinalized===0 && hasBottomCollision && ++indexStepsAlive[i] > COLLISION_FINALIZATION_TIME) {
            //        indexFlags[i] |= FINALIZED
            //        indexPhysicsData[iPD+3] = MATERIALS_SETTINGS[mat].gravity*.45
            //        indexStepsAlive[i] = 0
            //    }
            //}

            // TRANSFORMS
            const transformFlag = flags & HAS_TRANSFORM
            if (transformFlag) {
                let newMat = TRANSFORMS_MAP[transformFlag]

                if ((flags&TRANSFORM_FIRE) && nextRandom() <= FIRE_PROPAGATES_VAPOR_CREATION_CHANCE) newMat = VAPOR

                mat = replaceParticleAtIndex(gi, newMat, indexCount, gridMaterials, gridIndexes, indexFlags, indexPhysicsData, indexGravity, indexStepsAlive)
                if (mat&STATIC) continue
                flags = indexFlags[i] &= ~transformFlag
            }

            // MATERIAL SPECIFICS
            if (mat === SAND) {
                // IF COLLSION BOTTOM
                if (flags&COLLISION_BOTTOM) {
                    const m_B = getAdjacencyCoords(oldX, oldY+1)>ARRAY_SIZE ? null : Atomics.load(gridMaterials, getAdjacencyCoords(oldX, oldY+1)),
                          m_R = Atomics.load(gridMaterials, getAdjacencyCoords(oldX+1, oldY)),
                          m_L = Atomics.load(gridMaterials, getAdjacencyCoords(oldX-1, oldY)),
                          m_BR = getAdjacencyCoords(oldX+1, oldY+1)>ARRAY_SIZE ? null : Atomics.load(gridMaterials, getAdjacencyCoords(oldX+1, oldY+1)),
                          m_BL = getAdjacencyCoords(oldX-1, oldY+1)>ARRAY_SIZE ? null : Atomics.load(gridMaterials, getAdjacencyCoords(oldX-1, oldY+1))

                    // SKIP IF CONTAINED
                    if (m_B&SAND_SKIPABLE&&m_BR&SAND_SKIPABLE&&m_BL&SAND_SKIPABLE&&m_R&SAND_SKIPABLE&&m_L&SAND_SKIPABLE && abs(indexPhysicsData[iPD+2]) <= X_VELOCITY_SKIP_THRESHOLD) {skip1++;continue}pass1++ 

                    // CHECK MAIN DIRECTIONS
                    applySandBehavior(i, m_B, m_R, m_L, m_BR, m_BL, transpierceableMain, transpierceableSec, indexFlags, cache)
                } 
            }
            else if (mat === WATER) {
                transpierceableMain = GASES
                if (flags&COLLISION_BOTTOM) {
                    const m_B = getAdjacencyCoords(oldX, oldY+1)>ARRAY_SIZE ? null : Atomics.load(gridMaterials, getAdjacencyCoords(oldX, oldY+1)),
                          m_R = Atomics.load(gridMaterials, getAdjacencyCoords(oldX+1, oldY)),
                          m_L = Atomics.load(gridMaterials, getAdjacencyCoords(oldX-1, oldY)),
                          m_BR = getAdjacencyCoords(oldX+1, oldY+1)>ARRAY_SIZE ? null : Atomics.load(gridMaterials, getAdjacencyCoords(oldX+1, oldY+1)),
                          m_BL = getAdjacencyCoords(oldX-1, oldY+1)>ARRAY_SIZE ? null : Atomics.load(gridMaterials, getAdjacencyCoords(oldX-1, oldY+1))
                    
                    if (m_B&WATER_SKIPABLE&&m_BR&WATER_SKIPABLE&&m_BL&WATER_SKIPABLE&&m_R&WATER_SKIPABLE&&m_L&WATER_SKIPABLE && abs(indexPhysicsData[iPD+2]) <= X_VELOCITY_SKIP_THRESHOLD) {skip1++;continue}pass1++ 
                    
                    if (nextRandom() <= EQUIVALENT_TRANSPIERCE_CHANCE) transpierceableMain |= INVERTED_WATER
                    applyLiquidBehavior(i, m_B, m_R, m_L, transpierceableMain, transpierceableSec, indexFlags, cache)
                }
            }
            else if (mat === GRAVEL) {
                if (flags&COLLISION_BOTTOM) {
                    const m_B = getAdjacencyCoords(oldX, oldY+1)>ARRAY_SIZE ? null : Atomics.load(gridMaterials, getAdjacencyCoords(oldX, oldY+1))
                    if (m_B&GRAVEL_SKIPABLE && abs(indexPhysicsData[iPD+2]) <= X_VELOCITY_SKIP_THRESHOLD) {skip1++;continue}pass1++ 
                    applyGravelBehavior(i, m_B, transpierceableMain, indexFlags)
                }
            }
            else if (mat === INVERTED_WATER) {
                transpierceableMain = GASES
                if (flags&COLLISION_TOP) {
                    const m_T = getAdjacencyCoords(oldX, oldY-1)<0 ? null : Atomics.load(gridMaterials, getAdjacencyCoords(oldX, oldY-1))||mat,
                          m_TR =  getAdjacencyCoords(oldX+1, oldY-1)<0 ? null : Atomics.load(gridMaterials, getAdjacencyCoords(oldX+1, oldY-1)),
                          m_TL =  getAdjacencyCoords(oldX-1, oldY-1)<0 ? null : Atomics.load(gridMaterials, getAdjacencyCoords(oldX-1, oldY-1)),
                          m_R = Atomics.load(gridMaterials, getAdjacencyCoords(oldX+1, oldY)),
                          m_L = Atomics.load(gridMaterials, getAdjacencyCoords(oldX-1, oldY))
                      
                    if (m_T&INVERTED_WATER_SKIPABLE&&m_TR&INVERTED_WATER_SKIPABLE&&m_TL&INVERTED_WATER_SKIPABLE&&m_R&INVERTED_WATER_SKIPABLE&&m_L&INVERTED_WATER_SKIPABLE && abs(indexPhysicsData[iPD+2]) <= X_VELOCITY_SKIP_THRESHOLD) {skip1++;continue}pass1++
                    
                    if (nextRandom() <= EQUIVALENT_TRANSPIERCE_CHANCE) transpierceableMain |= WATER
                    applyInvertedWaterBehavior(i, m_T, m_R, m_L, transpierceableMain, transpierceableSec, indexFlags, cache)
                }
            }
            else if (mat === CONTAMINANT) {
                transpierceableMain = GASES
                if (flags&COLLISION_Y) {
                    const gi_B = getAdjacencyCoords(oldX, oldY+1), m_B = gi_B>ARRAY_SIZE ? null : Atomics.load(gridMaterials, gi_B),
                          gi_R = getAdjacencyCoords(oldX+1, oldY), m_R = Atomics.load(gridMaterials, gi_R),
                          gi_L = getAdjacencyCoords(oldX-1, oldY), m_L = Atomics.load(gridMaterials, gi_L),
                          gi_T = getAdjacencyCoords(oldX, oldY-1), m_T = gi_T<0 ? null : Atomics.load(gridMaterials,gi_T)||mat,
                          m_BR = getAdjacencyCoords(oldX+1, oldY+1)>ARRAY_SIZE ? null : Atomics.load(gridMaterials, getAdjacencyCoords(oldX+1, oldY+1)),
                          m_BL = getAdjacencyCoords(oldX-1, oldY+1)>ARRAY_SIZE ? null : Atomics.load(gridMaterials, getAdjacencyCoords(oldX-1, oldY+1))


                    if ((m_B|m_R|m_L|m_T) & CONTAMINABLE) applyContaminantBehavior(m_B, m_R, m_L, m_T, gi_B, gi_R, gi_L, gi_T, gridIndexes, indexFlags)

                    if (m_B&CONTAMINANT_SKIPABLE&&m_BR&CONTAMINANT_SKIPABLE&&m_BL&CONTAMINANT_SKIPABLE&&m_R&CONTAMINANT_SKIPABLE&&m_L&CONTAMINANT_SKIPABLE && abs(indexPhysicsData[iPD+2]) <= X_VELOCITY_SKIP_THRESHOLD) {skip1++;continue}pass1++
                    applyLiquidBehavior(i, m_B, m_R, m_L, transpierceableMain, transpierceableSec, indexFlags, cache)
                } 
            }
            else if (mat === LAVA) {
                transpierceableMain = GASES
                if (flags&COLLISION_BOTTOM) {
                    if (nextRandom() <= LAVA_MOVEMENT_CHANCE) {skip4++;continue}

                    const gi_B = getAdjacencyCoords(oldX, oldY+1), m_B = gi_B>ARRAY_SIZE ? null : Atomics.load(gridMaterials, gi_B),
                          gi_R = getAdjacencyCoords(oldX+1, oldY), m_R = Atomics.load(gridMaterials, gi_R),
                          gi_L = getAdjacencyCoords(oldX-1, oldY), m_L = Atomics.load(gridMaterials, gi_L),
                          gi_T = getAdjacencyCoords(oldX, oldY-1), m_T = gi_T<0 ? null : Atomics.load(gridMaterials,gi_T)||mat,
                          m_BR = getAdjacencyCoords(oldX+1, oldY+1)>ARRAY_SIZE ? null : Atomics.load(gridMaterials, getAdjacencyCoords(oldX+1, oldY+1)),
                          m_BL = getAdjacencyCoords(oldX-1, oldY+1)>ARRAY_SIZE ? null : Atomics.load(gridMaterials, getAdjacencyCoords(oldX-1, oldY+1))
                    
                    if ((m_B|m_R|m_L|m_T) & (MELTABLE|LIQUIDS)) applyLavaBehavior(gi, m_B, m_R, m_L, m_T, gi_B, gi_R, gi_L, gi_T, gridIndexes, indexFlags)

                    if (m_B&LAVA_SKIPABLE&&m_BR&LAVA_SKIPABLE&&m_BL&LAVA_SKIPABLE&&m_R&LAVA_SKIPABLE&&m_L&LAVA_SKIPABLE && abs(indexPhysicsData[iPD+2]) <= X_VELOCITY_SKIP_THRESHOLD) {skip1++;continue}pass1++
                    applyLiquidBehavior(i, m_B, m_R, m_L, transpierceableMain, transpierceableSec, indexFlags, cache)
                } 
            }
            else if (mat === VAPOR) {
                transpierceableMain = AIR
                if (flags&COLLISION_TOP) {
                    if (nextRandom() <= VAPOR_MOVEMENT_CHANCE) {skip4++;continue}

                    const m_T = getAdjacencyCoords(oldX, oldY-1)<0 ? null : Atomics.load(gridMaterials, getAdjacencyCoords(oldX, oldY-1))||mat,
                          m_R = Atomics.load(gridMaterials, getAdjacencyCoords(oldX+1, oldY)),
                          m_L = Atomics.load(gridMaterials, getAdjacencyCoords(oldX-1, oldY))

                    if (m_T&VAPOR_SKIPABLE&&m_R&VAPOR_SKIPABLE&&m_L&VAPOR_SKIPABLE) {skip1++;continue}pass1++

                    applyVaporBehavior(i, m_T, m_R, m_L, transpierceableMain, indexFlags, cache)
                }
            }
            else if (mat === FIRE) {
                transpierceableMain = AIR|VAPOR

                const gi_B = getAdjacencyCoords(oldX, oldY+1), m_B = gi_B>ARRAY_SIZE ? null : Atomics.load(gridMaterials, gi_B),
                      gi_R = getAdjacencyCoords(oldX+1, oldY), m_R = Atomics.load(gridMaterials, gi_R),
                      gi_L = getAdjacencyCoords(oldX-1, oldY), m_L = Atomics.load(gridMaterials, gi_L),
                      gi_T = getAdjacencyCoords(oldX, oldY-1), m_T = gi_T<0 ? null : Atomics.load(gridMaterials,gi_T)||mat


                if ((m_B|m_R|m_L|m_T) & (INFLAMMABLE|FIRE_EXTINGUISH)) applyFireBehavior(gi, m_B, m_R, m_L, m_T, gi_B, gi_R, gi_L, gi_T, gridIndexes, indexFlags)

                if (flags&COLLISION_TOP) {
                    const m_TR =  getAdjacencyCoords(oldX+1, oldY-1)<0 ? null : Atomics.load(gridMaterials, getAdjacencyCoords(oldX+1, oldY-1)),
                          m_TL =  getAdjacencyCoords(oldX-1, oldY-1)<0 ? null : Atomics.load(gridMaterials, getAdjacencyCoords(oldX-1, oldY-1))

                    if (m_T&FIRE_SKIPABLE&&m_TR&FIRE_SKIPABLE&&m_TL&FIRE_SKIPABLE&&m_R&FIRE_SKIPABLE&&m_L&FIRE_SKIPABLE) {skip1++;continue}pass1++
                    applyInvertedWaterBehavior(i, m_T, m_R, m_L, transpierceableMain, transpierceableSec, indexFlags, cache)
                }
            }

            // APPLY MOVEMENTS
            applyForces(i, iPD, deltaTime, indexFlags, indexGravity, indexPhysicsData, cache)
            const dx = cache.dx,
                  dy = cache.dy
            if (!(dy || dx)) {skip2++;continue}pass2++

            // MOVE
            if (dx) indexPhysicsData[iPD] = safeTrunc(clamp(ox+dx))
            if (dy) indexPhysicsData[iPD+1] += safeTrunc(dy)

            const newX = (ox+dx)|0, newY = indexPhysicsData[iPD+1]|0, gdx = newX-oldX, gdy = newY-oldY, hasNoGdx = gdx === 0, hasNoGdy = gdy === 0
            if (hasNoGdy && hasNoGdx) {skip3++;continue}pass3++
            cache.newX = newX
            cache.newY = newY

            // CHECK FOR COLLISION X/Y
            if (!hasNoGdy) checkCollisionsY(i, iPD, mat, gdy, oldX, oldY, transpierceableMain, gridMaterials, indexFlags, indexPhysicsData, cache)
            if (!hasNoGdx) checkCollisionsX(iPD, gi, mat, gdx, oldX, transpierceableMain, gridMaterials, indexPhysicsData, cache)
            
            // UPDATE GRID
            updateGrid(i, gi, mat, ox, oy, transpierceableMain, gridMaterials, gridIndexes, indexPhysicsData, cache)

            // TEMP PERF
            const pxSize = 0
            if (pxSize) simulation.render.stroke(Render.getPositionsRect([cache.newX*pxSize-1, cache.newY*pxSize-1], [cache.newX*pxSize+pxSize+1, cache.newY*pxSize+pxSize+1]), [0,255,255,1])
        }
    }


    function applyForces(i, iPD, deltaTime, indexFlags, indexGravity, indexPhysicsData, cache) {
        const flags = indexFlags[i], gravity = indexGravity[i], isBottomGravity = gravity >= 0
        let velX = cache.velX, velY = cache.velY

        // ADD VERTICAL FORCES
        if (isBottomGravity ? (flags&COLLISION_BOTTOM) === 0 : (flags&COLLISION_TOP) === 0) velY = indexPhysicsData[iPD+3] += gravity*deltaTime

        // HORIZONTAL FRICTION
        if (velX) {
            const speed = abs(velX), rate = (BASE_FRICTION+speed*speed*.5*FRICTION_COEFFICIENT)*deltaTime
            indexPhysicsData[iPD+2] = speed>rate ? velX-((velX/speed)*rate) : 0
        }

        cache.velX = velX
        cache.velY = velY
        cache.dx += velX*deltaTime
        cache.dy += velY*deltaTime
    }

    function checkCollisionsY(i, iPD, mat, gdy, oldX, oldY, transpierceableMain, gridMaterials, indexFlags, indexPhysicsData, cache) {
        const absGdy = abs(gdy), dirGdy = 1|(gdy>>BIT32)

        if (absGdy > 1) {// check collision at oldY..newY
            for (let colY=oldY+dirGdy,colI=0; colI<absGdy; colI++,colY+=dirGdy) {
                const gi_Dest = getAdjacencyCoords(oldX, colY), m_Dest = gi_Dest>ARRAY_SIZE||gi_Dest<0 ? null : Atomics.load(gridMaterials, gi_Dest), hasCollision = !(m_Dest & transpierceableMain)
                if (hasCollision) {
                    cache.newY = (indexPhysicsData[iPD+1] = colY-dirGdy)|0
                    indexFlags[i] |= dirGdy===1 ? COLLISION_BOTTOM : COLLISION_TOP
                    if ((mat&GASES) === 0) {
                        if (m_Dest && m_Dest !== mat) indexPhysicsData[iPD+3] = 2*dirGdy
                        else if (!m_Dest) indexPhysicsData[iPD+3] = 0
                    }
                    break
                }
            }
        } else {// check collision at destination pos
            const gi_Dest = getAdjacencyCoords(oldX, cache.newY), m_Dest = gi_Dest>ARRAY_SIZE||gi_Dest<0 ? null : Atomics.load(gridMaterials, gi_Dest), hasCollision = !(m_Dest & transpierceableMain)
            if (hasCollision) {
                cache.newY = (indexPhysicsData[iPD+1] = oldY)|0
                indexFlags[i] |= dirGdy===1 ? COLLISION_BOTTOM : COLLISION_TOP
                if ((mat&GASES) === 0) {
                    if (m_Dest && m_Dest !== mat) indexPhysicsData[iPD+3] = 2*dirGdy
                    else if (!m_Dest) indexPhysicsData[iPD+3] = 0
                }
            }
        }
    }
    
    function checkCollisionsX(iPD, gi, mat, gdx, oldX, transpierceableMain, gridMaterials, indexPhysicsData, cache) {
        const newX = cache.newX, newY = cache.newY, absGdx = abs(gdx), dirGdx = 1|(gdx>>BIT32)

        if (absGdx > 1) {// check collision at oldX..newX
            for (let colX=oldX+dirGdx,colI=0; colI<absGdx; colI++,colX+=dirGdx) {
                const gi_Dest = getAdjacencyCoords(colX, newY), m_Dest = Atomics.load(gridMaterials, gi_Dest), hasCollision = !(m_Dest & transpierceableMain)
                if (hasCollision) {
                    if ((mat&GASES) === 0 && (m_Dest & STATIC || gi_Dest === gi)) indexPhysicsData[iPD+2] = 0
                    return cache.newX = (indexPhysicsData[iPD] = colX-dirGdx)|0
                }
            }
        } else {// check collision at destination pos
            const gi_Dest = getAdjacencyCoords(newX, newY), m_Dest = Atomics.load(gridMaterials, gi_Dest), hasCollision = !(m_Dest & transpierceableMain)
            if (hasCollision) {
                if ((mat&GASES) === 0 && (m_Dest & STATIC || gi_Dest === gi)) indexPhysicsData[iPD+2] = 0
                return cache.newX = (indexPhysicsData[iPD] = oldX)|0
            }
        }
    }

    function updateGrid(i, gi, mat, ox, oy, transpierceableMain, gridMaterials, gridIndexes, indexPhysicsData, cache) {
        const newGridI = getAdjacencyCoords(cache.newX, cache.newY)

         if (newGridI > ARRAY_SIZE) {
            const iPD = i*PHYSICS_DATA_ATTRIBUTES
            indexPhysicsData[iPD] = ox
            indexPhysicsData[iPD+1] = oy
            return
         }

        const targetMat = Atomics.load(gridMaterials, newGridI), m_Dest = targetMat & transpierceableMain
            
        if (m_Dest !== 0) {
            const oldTargetMat = Atomics.compareExchange(gridMaterials, newGridI, targetMat, mat)

            if (oldTargetMat === targetMat) {
                const atI = Atomics.load(gridIndexes, newGridI)
                
                Atomics.store(gridIndexes, newGridI, i)

                Atomics.store(gridIndexes, gi, atI)
                Atomics.store(gridMaterials, gi, m_Dest)
                if (atI !== -1) {
                    const atIPD = atI*PHYSICS_DATA_ATTRIBUTES
                    indexPhysicsData[atIPD] = ox
                    indexPhysicsData[atIPD+1] = oy
                }
            }
            else console.warn("AAAAAAAAAAAAAAAAAAAA")// CLEANUP
        }

        //console.warn("UPDATE GRID ERROR", i, gi, "|", [ox, oy], [cache.newX, cache.newY], m_Dest)
        //const iPD = i*PHYSICS_DATA_ATTRIBUTES
        //indexPhysicsData[iPD] = ox
        //indexPhysicsData[iPD+1] = oy
    }

    return physicsStep
}