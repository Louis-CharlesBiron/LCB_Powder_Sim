
// CONSTANTS
let WORKER_MESSAGE_TYPES,
    WORKER_MESSAGE_GROUPS,
    MATERIALS,
    MATERIAL_GROUPS,
    MATERIAL_NAMES,
    SIDE_PRIORITIES,
    PHYSICS_DATA_ATTRIBUTES,
    MATERIALS_SETTINGS,
    physicsConfig

// WORKER GLOBALS
let id,
    threadCount

self.onmessage=e=>{
    const data = e.data, type = data.type 

    // INIT
    if (!type) {
        WORKER_MESSAGE_TYPES = data.WORKER_MESSAGE_TYPES
        WORKER_MESSAGE_GROUPS = data.WORKER_MESSAGE_GROUPS
        MATERIALS = data.MATERIALS
        MATERIAL_GROUPS = data.MATERIAL_GROUPS
        MATERIAL_NAMES = data.MATERIAL_NAMES
        SIDE_PRIORITIES = data.SIDE_PRIORITIES
        PHYSICS_DATA_ATTRIBUTES = data.PHYSICS_DATA_ATTRIBUTES
        MATERIALS_SETTINGS = data.MATERIALS_SETTINGS
        physicsConfig = data.physicsConfig

        id = data.id
        threadCount = data.threadCount

        console.log("thread", id)
    }
}


