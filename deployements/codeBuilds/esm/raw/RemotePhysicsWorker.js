//lcb-powder-sim ESM - v2.0.0
"use strict"
import {createPhysicsCoreWorker} from "./lcb-ps.js"

console.log("%cCREATED: "+self.constructor.name, "font-size:10px;color:#9c9c9c;")

// CONSTANTS
const ARRAY_MAP = {
    Uint8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array,
    BigInt64Array,
    BigUint64Array,
    Float16Array: self.Float16Array ?? Float32Array,
}

// INIT CONSTANTS
let WORKER_DEPENDENCIES = {WORKER_MESSAGE_TYPES:{}},
    PHYSICS_CORE

// WORKER GLOBALS
let id,
    threadCount,
    SABDependencies,
// ARRAYS
    signals,
    gridIndexes,
    gridMaterials,
    indexCount,
    indexFlags,
    indexPhysicsData,
    indexGravity,
    indexStepsAlive,
// UPDATABLE
    sidePriority,
    mapWidth,
    deltaTime,
    arraySize


self.onmessage=e=>{
    const data = e.data, type = data.type

    // INIT
    if (!type) {
        id = data.id
        threadCount = data.threadCount
        sidePriority = data.initUpdatables.sidePriority
        mapWidth = data.initUpdatables.mapWidth
        deltaTime = data.initUpdatables.deltaTime
        WORKER_DEPENDENCIES = data.workerDependencies
        SABDependencies = data.SABDependencies

        createArrays()
        PHYSICS_CORE = createPhysicsCoreWorker(WORKER_DEPENDENCIES.physicsConfig, WORKER_DEPENDENCIES.MATERIALS_SETTINGS, WORKER_DEPENDENCIES.MATERIALS, WORKER_DEPENDENCIES.MATERIAL_GROUPS, WORKER_DEPENDENCIES.MATERIAL_NAMES, WORKER_DEPENDENCIES.SIDE_PRIORITIES, WORKER_DEPENDENCIES.PHYSICS_DATA_ATTRIBUTES)
        startLoop()
    }
}


function startLoop() {
    const SI = WORKER_DEPENDENCIES.SIGNALS_INDEXES, S = WORKER_DEPENDENCIES.SIGNALS

    while (true) {
        // WAIT FOR SIGNAL
        Atomics.wait(signals, SI.SLEEP_STATUS, S.SLEEP_STATUS.DEAD)

        // UPDATABLES
        sidePriority = Atomics.load(signals, SI.DATA.SIDE_PRIORITY)
        mapWidth = Atomics.load(signals, SI.DATA.MAP_WIDTH)
        deltaTime = Atomics.load(signals, SI.DATA.DELTATIME)/1000
        arraySize = Atomics.load(signals, SI.DATA.ARRAY_SIZE)

        // RUN PHYSICS STEP
        PHYSICS_CORE(
            id, threadCount,
            gridIndexes, gridMaterials, indexCount, indexFlags, indexPhysicsData, indexGravity, indexStepsAlive,
            sidePriority, mapWidth, deltaTime, arraySize
        )
        //console.log("OK", id)

        // ALL STEPS COMPLETED
        Atomics.add(signals, SI.COMPLETION_STATUS, S.COMPLETION_STATUS.COMPLETED)
        while (Atomics.load(signals, SI.SLEEP_STATUS) === S.SLEEP_STATUS.WAKE) {}
    }
}


// Creates the data arrays views based on the received SAB, offsets and array sizes 
function createArrays() {
    const {SAB, offsets, sizes} = SABDependencies, C = WORKER_DEPENDENCIES.CONTAINER_NAMES
    signals = new ARRAY_MAP[C.C_SIGNALS](SAB, offsets[0], sizes.signals)
    gridIndexes = new ARRAY_MAP[C.C_GRID_INDEXES](SAB, offsets[1], sizes.arraySize)
    gridMaterials = new ARRAY_MAP[C.C_GRID_MATERIALS](SAB, offsets[2], sizes.arraySize)
    indexCount = new ARRAY_MAP[C.C_COUNT](SAB, offsets[3], sizes.indexCount)
    indexFlags = new ARRAY_MAP[C.C_FLAGS](SAB, offsets[4], sizes.arraySize)
    indexPhysicsData = new ARRAY_MAP[C.C_PHYSICS_DATA](SAB, offsets[5], sizes.indexPhysicsData)
    indexGravity = new ARRAY_MAP[C.C_GRAVITY](SAB, offsets[6], sizes.arraySize)
    indexStepsAlive  = new ARRAY_MAP[C.C_STEPS_ALIVE](SAB, offsets[7], sizes.arraySize)
}