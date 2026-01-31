importScripts("PhysicsCore.js")
importScripts("../simulation/settings.js")

// CONSTANTS
const WORKER_MESSAGE_TYPES = SETTINGS.WORKER_MESSAGE_TYPES,
      WORKER_MESSAGE_GROUPS = SETTINGS.WORKER_MESSAGE_GROUPS,
      MATERIALS = SETTINGS.MATERIALS,
      MATERIAL_GROUPS = SETTINGS.MATERIAL_GROUPS,
      MATERIAL_STATES = SETTINGS.MATERIAL_STATES,
      MATERIAL_STATES_GROUPS = SETTINGS.MATERIAL_STATES_GROUPS,
      SIDE_PRIORITIES = SETTINGS.SIDE_PRIORITIES,
      D  = SETTINGS.D,
      physicsCore = new PhysicsCore()

// ATTRIBUTES / VARABLES
let pixels, pxStepUpdated, pxStates, sidePriority,
    mapWidth, mapHeight

let isLoopStarted = false, lastTime = 0, lastStepTime = 0, PHYSICS_DELAY = 1000/60, timeAcc = 0

self.onmessage=e=>{
    const data = e.data, type = data.type
    if (type & WORKER_MESSAGE_GROUPS.GIVES_PIXELS_TO_WORKER) {
        pixels = data.pixels
        pxStates = data.pxStates
    }

    // SINGLE STEP
    if (type === WORKER_MESSAGE_TYPES.STEP) step()
    // AUTO STEP
    else if (type === WORKER_MESSAGE_TYPES.PIXELS && performance.now()-lastStepTime > PHYSICS_DELAY) step()
    // START LOOP
    else if (type === WORKER_MESSAGE_TYPES.START_LOOP) startLoop()
    // STOP LOOP
    else if (type === WORKER_MESSAGE_TYPES.STOP_LOOP) stopLoop()
    // UPDATE SIDE PRIORITY
    else if (type === WORKER_MESSAGE_TYPES.SIDE_PRIORITY) sidePriority = data.sidePriority
    // UPDATE MAP SIZE
    else if (type === WORKER_MESSAGE_TYPES.MAP_SIZE) {
        mapWidth = data.mapWidth
        mapHeight = data.mapHeight
        pxStepUpdated = new Uint8Array(data.arraySize)
        pxStates = new Uint8Array(data.arraySize)
    }
    else if (type === WORKER_MESSAGE_TYPES.INIT) {// INIT
        PHYSICS_DELAY = 1000/(data.aimedFps)

        pixels = data.pixels
        pxStepUpdated = data.pxStepUpdated
        pxStates = data.pxStates
        sidePriority = data.sidePriority

        mapWidth = data.mapWidth
        mapHeight = data.mapHeight
    }
}

/**
 * The physics loop core
 */
function loopCore() {
    if (isLoopStarted) {
        const time = performance.now(), deltaTime = time-lastTime
        timeAcc += deltaTime
        lastTime = time

        while (timeAcc >= PHYSICS_DELAY) {
            step()
            timeAcc -= PHYSICS_DELAY
        }
        setTimeout(loopCore, 0)
    }
}

/**
 * Starts the physics loop
 */
function startLoop() {
    if (!isLoopStarted) {
        isLoopStarted = true
        loopCore()
    }
}

/**
 * Stops the physics loop
 */
function stopLoop() {
    if (isLoopStarted) {
        isLoopStarted = false
        if (pixels.buffer.byteLength) postMessage({type:WORKER_MESSAGE_TYPES.PIXELS, pixels, pxStates}, [pixels.buffer, pxStates.buffer])
    }
}

/**
 * Runs a physics step and returns the result to the main thread
 */
function step() {
    if (pixels.buffer.byteLength) {
        lastStepTime = performance.now()
        physicsCore.step(pixels, pxStepUpdated, pxStates, sidePriority, mapWidth, mapHeight, MATERIALS, MATERIAL_GROUPS, D, MATERIAL_STATES, MATERIAL_STATES_GROUPS, SIDE_PRIORITIES)

        
        postMessage({type:WORKER_MESSAGE_TYPES.STEP, pixels, pxStates}, [pixels.buffer, pxStates.buffer])
    }
}