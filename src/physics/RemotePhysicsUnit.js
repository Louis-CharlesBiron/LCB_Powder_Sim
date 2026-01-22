importScripts("PhysicsCore.js")

const WORKER_MESSAGE_TYPES = {INIT:0, STEP:1, START_LOOP:2, STOP_LOOP:3, SIDE_PRIORITY:4, MAP_WIDTH:5, PIXELS:6},
      physicsCore = new PhysicsCore("WORKER")

let isLoopStarted = false, lastTime = 0, lastStepTime = 0, PHYSICS_DELAY = 1000/60, timeAcc = 0

// CONSTANTS
let MATERIALS, D, MATERIAL_GROUPS, SIDE_PRIORITIES
// ATTRIBUTES
let pixels, pxStepUpdated, sidePriority,
    mapWidth

self.onmessage=e=>{
    const data = e.data, type = data.type
    if (type == WORKER_MESSAGE_TYPES.STEP) {// SINGLE STEP
        pixels = data.pixels
        step()
    } 
    else if (type == WORKER_MESSAGE_TYPES.PIXELS) {
        pixels = data.pixels
        if (performance.now()-lastStepTime > PHYSICS_DELAY) step()
    }
    else if (type == WORKER_MESSAGE_TYPES.START_LOOP) {// START LOOP
        pixels = data.pixels
        startLoop()
    }
    // STOP LOOP
    else if (type == WORKER_MESSAGE_TYPES.STOP_LOOP) stopLoop()
    // UPDATE SIDE PRIORITY
    else if (type == WORKER_MESSAGE_TYPES.SIDE_PRIORITY) sidePriority = data.sidePriority
    // UPDATE MAP SIZE
    else if (type === WORKER_MESSAGE_TYPES.MAP_WIDTH) {
        mapWidth = data.mapWidth
        pxStepUpdated = new Uint8Array(data.arraySize)
    }
    else if (type == WORKER_MESSAGE_TYPES.INIT) {// INIT
        MATERIALS = data.MATERIALS
        D = data.D
        MATERIAL_GROUPS = data.MATERIAL_GROUPS
        SIDE_PRIORITIES = data.SIDE_PRIORITIES

        PHYSICS_DELAY = 1000/(data.aimedFps)

        pixels = data.pixels
        pxStepUpdated = data.pxStepUpdated
        sidePriority = data.sidePriority

        mapWidth = data.mapWidth
    }
}

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

function startLoop() {
    if (!isLoopStarted) {
        isLoopStarted = true
        loopCore()
    }
}

function stopLoop() {
    if (isLoopStarted) {
        isLoopStarted = false
        if (pixels.buffer.byteLength) postMessage({type:WORKER_MESSAGE_TYPES.PIXELS, pixels}, [pixels.buffer])
    }
}

function step() {
    if (pixels.buffer.byteLength) {
        lastStepTime = performance.now()
        pixels = physicsCore.step(pixels, pxStepUpdated, sidePriority, mapWidth, MATERIALS, MATERIAL_GROUPS, D, SIDE_PRIORITIES)
        postMessage({type:WORKER_MESSAGE_TYPES.STEP, pixels}, [pixels.buffer])
    }
}