///[[@export]]
const SETTINGS = {

    MATERIALS: {// 0-15
        AIR: 1<<0,
        SAND: 1<<1,
        WATER: 1<<2,
        STONE: 1<<3,
        GRAVEL: 1<<4,
        INVERTED_WATER: 1<<5,
        CONTAMINANT: 1<<6,
        LAVA: 1<<7,
        ELECTRICITY: 1<<8,
        COPPER: 1<<9,
        VAPOR: 1<<10,
        FIRE: 1<<11,
    },

    MATERIAL_GROUPS: {
        GASES:null,
        REG_TRANSPIERCEABLE:null,
        LIQUIDS:null,
        CONTAMINABLE:null,
        MELTABLE:null,
        FIRE_EXTINGUISH: null,
        INFLAMMABLE:null,
        STATIC:null,

        ALIVE_TRACKING:null,
        HAS_VISUAL_EFFECTS:null,

        WATER_SKIPABLE:null,
        INVERTED_WATER_SKIPABLE: null,
        CONTAMINANT_SKIPABLE:null,
        LAVA_SKIPABLE:null,
        VAPOR_SKIPABLE:null,
        FIRE_SKIPABLE:null,
    },
    MATERIAL_NAMES: ["VOID "],

    MATERIAL_STATES: {
        EMPTY:0,
        COPPER: {
            LIT:1<<0,
            ORIGIN:1<<1,
            DISABLED:1<<2,
        }
    },

    MATERIAL_STATES_GROUPS: {
        COPPER: {
            ACTIVATED: null,
            SOURCEABLE: null,
        }
    },

    D: {b:1<<0, r:1<<1, l:1<<2, br:1<<3, bl:1<<4, t:1<<5, tr:1<<6, tl:1<<7},

    SIDE_PRIORITIES: {
        RANDOM:0,
        LEFT:1,
        RIGHT:2
    },
    SIDE_PRIORITY_NAMES: [],
    
    EXPORT_STATES: {RAW:0, COMPACTED:1, EXACT:2},
    EXPORT_SEPARATOR: "x",
    EXPORT_DYAMIC_SEPARATOR: "'",
    EXPORT_STATIC_SEPARATOR: "X",

    BRUSH_TYPES: {
        PIXEL:1<<0,
        VERTICAL_CROSS:1<<1,
        LINE3:1<<2, 
        ROW3:1<<3,
        BIG_DOT:1<<4, 
        X3:1<<5,
        X5:1<<6,
        X15:1<<7,
        X25:1<<8,
        X55:1<<9,
        X99:1<<10,
    },

    BRUSH_TYPE_NAMES: [],
    BRUSH_GROUPS: {},
    BRUSHES_X_VALUES: [],
    
    WORKER_RELATIVE_PATH: /*/[[@workerPath]]/*/"./src/physics/RemotePhysicsUnit.js"/*/[[@end]]/*/,
    WORKER_MESSAGE_TYPES: {
        INIT:0,
        STEP:1<<0,
        START_LOOP:1<<2,
        STOP_LOOP:1<<3,
        SIDE_PRIORITY:1<<4,
        MAP_SIZE:1<<5,
        PIXELS:1<<6,
    },
    WORKER_MESSAGE_GROUPS: {
        GIVES_PIXELS_TO_MAIN: null,
        GIVES_PIXELS_TO_WORKER: null,
    },

    PHYSICS_UNIT_TYPE: {
        LOCAL:0,
        WORKER:1,
    },

    INITIALIZED_STATES: {
        NOT_INITIALIZED:0,
        READY:1,
        INITIALIZED:2,
    },

    FILE_SERVED_WARN:`Web workers are disabled when serving with file:// protocol.\n  Serve this page over http(s):// to enable them.`,
    STANDALONE_KEYBIND_WARN:`The keybind pressed is not linked to any function.`,
    NOT_INITIALIZED_LOAD_WARN:`Tried loading with 'load()' while simulation is not yet initialized.\n Use the 'readyCB' callback to load a save on launch.`,
    NOT_INITIALIZED_MAP_SIZE_WARN:`Tried updating map size with 'updateMapSize()' while simulation is not yet initialized.\n Use the 'readyCB' callback to update map size on launch.`,
    NOT_INITIALIZED_PIXEL_SIZE_WARN:`Tried updating pixel size with 'updateMapPixelSize()' while simulation is not yet initialized.\n Use the 'readyCB' callback to update pixel size on launch.`,
    NOT_INITIALIZED_PHYSICS_TYPE_WARN:`Tried updating physics unit type with 'updatePhysicsUnitType()' while simulation is not yet initialized.\n Use the 'readyCB' callback to update physics unit type on launch.`,
    OUT_OF_MEMORY_WARN:mapGrid=>`The map size[${mapGrid.dimensions.join("x")}], or pixelSize[${mapGrid.pixelSize}], is too big. Try lowering the pixelSize, the width or height.`,

    DEFAULT_MAP_RESOLUTIONS: {
        HIGH: 2,
        MEDIUM: 10,
        SMALL: 18,
        DEFAULT: 10
    },

    REPLACE_MODES: {
        ALL: 0,
    }
}

;(()=>{
    // SET MATERIAL GROUPS
    const M = SETTINGS.MATERIALS, G = SETTINGS.MATERIAL_GROUPS
    G.GASES = M.AIR|M.VAPOR|M.FIRE
    G.LIQUIDS = M.WATER|M.INVERTED_WATER|M.CONTAMINANT
    G.REG_TRANSPIERCEABLE = G.LIQUIDS|G.GASES
    G.CONTAMINABLE = M.WATER|M.INVERTED_WATER
    G.MELTABLE = M.SAND|M.GRAVEL
    G.INFLAMMABLE = M.SAND
    G.FIRE_EXTINGUISH = G.LIQUIDS|M.GRAVEL
    G.STATIC = M.AIR|M.STONE

    G.WATER_SKIPABLE = M.STONE|M.GRAVEL|M.SAND|M.WATER
    G.INVERTED_WATER_SKIPABLE = M.STONE|M.GRAVEL|M.SAND|M.INVERTED_WATER
    G.CONTAMINANT_SKIPABLE = M.STONE|M.GRAVEL|M.SAND|M.CONTAMINANT
    G.LAVA_SKIPABLE = M.STONE|M.LAVA
    G.VAPOR_SKIPABLE = M.SAND|M.WATER|M.STONE|M.GRAVEL|M.INVERTED_WATER|M.CONTAMINANT|M.LAVA|M.VAPOR
    G.FIRE_SKIPABLE = M.SAND|M.WATER|M.STONE|M.GRAVEL|M.INVERTED_WATER|M.CONTAMINANT|M.LAVA|M.FIRE

    G.HAS_VISUAL_EFFECTS = M.ELECTRICITY|M.COPPER
    G.ALIVE_TRACKING = M.VAPOR|M.FIRE

    // SET MATERIAL STATES GROUPS
    SETTINGS.MATERIAL_STATES_GROUPS = {
        COPPER: {
            ACTIVATED: SETTINGS.MATERIAL_STATES.COPPER.LIT|SETTINGS.MATERIAL_STATES.COPPER.ORIGIN,
            SOURCEABLE: SETTINGS.MATERIAL_STATES.COPPER.LIT|SETTINGS.MATERIAL_STATES.COPPER.DISABLED
        }
    }

    // SET WORKER MESSAGE GROUPS
    SETTINGS.WORKER_MESSAGE_GROUPS = {
        GIVES_PIXELS_TO_MAIN: SETTINGS.WORKER_MESSAGE_TYPES.STEP|SETTINGS.WORKER_MESSAGE_TYPES.PIXELS,
        GIVES_PIXELS_TO_WORKER: SETTINGS.WORKER_MESSAGE_TYPES.STEP|SETTINGS.WORKER_MESSAGE_TYPES.PIXELS|SETTINGS.WORKER_MESSAGE_TYPES.START_LOOP,
    }

    // SET BRUSH GROUPS
    SETTINGS.BRUSH_GROUPS = {
        SMALL_OPTIMIZED:SETTINGS.BRUSH_TYPES.PIXEL|SETTINGS.BRUSH_TYPES.VERTICAL_CROSS|SETTINGS.BRUSH_TYPES.LINE3|SETTINGS.BRUSH_TYPES.ROW3,
        X:SETTINGS.BRUSH_TYPES.X3|SETTINGS.BRUSH_TYPES.X5|SETTINGS.BRUSH_TYPES.X15|SETTINGS.BRUSH_TYPES.X25|SETTINGS.BRUSH_TYPES.X55|SETTINGS.BRUSH_TYPES.X99,
    }

    // SET MATERIAL NAMES
    const materials = Object.keys(M), m_ll = materials.length
    for (let i=M.AIR,ii=0;ii<m_ll;i*=2,ii++) SETTINGS.MATERIAL_NAMES[i] = materials[ii]

    // SET BRUSH TYPE NAMES
    const B = SETTINGS.BRUSH_TYPES, brushTypes = Object.keys(B), bt_ll = brushTypes.length
    for (let i=M.AIR,ii=0;ii<bt_ll;i*=2,ii++) SETTINGS.BRUSH_TYPE_NAMES[i] = brushTypes[ii]

    // SET SIDE PRIORITY NAMES
    SETTINGS.SIDE_PRIORITY_NAMES = Object.keys(SETTINGS.SIDE_PRIORITIES)

    // SET BRUSHES X VALUES
    const brushesX = Object.keys(SETTINGS.BRUSH_TYPES).filter(b=>b.startsWith("X")), b_ll = brushesX.length
    for (let i=SETTINGS.BRUSH_TYPES[brushesX[0]],ii=0;ii<b_ll;i=!i?1:i*2,ii++) SETTINGS.BRUSHES_X_VALUES[i] = +brushesX[ii].slice(1)

    // SET REPLACE_MODES
    SETTINGS.REPLACE_MODES = {...SETTINGS.REPLACE_MODES, ...M}

    SETTINGS.REPLACE_MODES.LIQUIDS = G.LIQUIDS
    SETTINGS.REPLACE_MODES.CONTAMINABLE = G.CONTAMINABLE
    SETTINGS.REPLACE_MODES.MELTABLE = G.MELTABLE
    SETTINGS.REPLACE_MODES.STATIC = G.STATIC
})()