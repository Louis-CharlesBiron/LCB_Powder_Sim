importScripts("../PhysicsCore.js")
importScripts("../PhysicsUtils.js")
importScripts("../MaterialsBehavior.js")

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
let WORKER_DEPENDENCIES,
    PHYSICS_CORE

// WORKER GLOBALS
let id,
    threadCount,
    SABDependencies,
    signals,
    gridIndexes,
    gridMaterials,
    indexCount,
    indexFlags,
    indexPhysicsData,
    indexGravity,
    indexStepsAlive


self.onmessage=e=>{
    const data = e.data, type = data.type 

    // INIT
    if (!type) {
        id = data.id
        threadCount = data.threadCount
        WORKER_DEPENDENCIES = data.workerDependencies
        SABDependencies = data.SABDependencies

        createArrays()
        PHYSICS_CORE = createPhysicsCore(
            WORKER_DEPENDENCIES.physicsConfig,
            WORKER_DEPENDENCIES.MATERIALS_SETTINGS,
            WORKER_DEPENDENCIES.MATERIALS,
            WORKER_DEPENDENCIES.MATERIAL_GROUPS,
            WORKER_DEPENDENCIES.MATERIAL_NAMES,
            WORKER_DEPENDENCIES.SIDE_PRIORITIES,
            WORKER_DEPENDENCIES.PHYSICS_DATA_ATTRIBUTES
        )

        console.log("thread", id, SABDependencies.SAB, WORKER_DEPENDENCIES)
    }
    // STEP
    else if (type === WORKER_DEPENDENCIES.WORKER_MESSAGE_TYPES.STEP) {
        console.log("STEP", id)
        PHYSICS_CORE.physicsStep(// TODO
            gridIndexes, gridMaterials, indexCount, indexFlags, indexPhysicsData, indexGravity, indexStepsAlive,
            sidePriority, mapWidth, deltaTime
        )

    }

}




function createArrays() {
    const {SAB, offsets, arraySize, aPD} = SABDependencies, C = WORKER_DEPENDENCIES.CONTAINER_NAMES
    signals = new ARRAY_MAP[C.C_SIGNALS](SAB, offsets[0], arraySize)
    gridIndexes = new ARRAY_MAP[C.C_GRID_INDEXES](SAB, offsets[1], arraySize)
    gridMaterials = new ARRAY_MAP[C.C_GRID_MATERIALS](SAB, offsets[2], arraySize)
    indexCount = new ARRAY_MAP[C.C_COUNT](SAB, offsets[3], 1)
    indexFlags = new ARRAY_MAP[C.C_FLAGS](SAB, offsets[4], arraySize)
    indexPhysicsData = new ARRAY_MAP[C.C_PHYSICS_DATA](SAB, offsets[5], aPD)
    indexGravity = new ARRAY_MAP[C.C_GRAVITY](SAB, offsets[6], arraySize)
    indexStepsAlive  = new ARRAY_MAP[C.C_STEPS_ALIVE](SAB, offsets[7], arraySize)
}
