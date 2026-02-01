const SETTINGS = {

    MATERIALS: {// 0-15
        AIR:0,
        SAND:1<<0,
        WATER:1<<1,
        STONE:1<<2,
        GRAVEL:1<<3,
        INVERTED_WATER:1<<4,
        CONTAMINANT:1<<5,
        LAVA:1<<6,
        ELECTRICITY:1<<7,
        COPPER:1<<8,
    },

    MATERIAL_GROUPS: {
        TRANSPIERCEABLE:null,
        LIQUIDS:null,
        CONTAMINABLE:null,
        MELTABLE:null,
        HAS_VISUAL_EFFECTS:null,
        REVERSE_LOOP_CONTAINED_SKIPABLE:null,
        FOWARD_LOOP_CONTAINED_SKIPABLE:null,
    },
    MATERIAL_NAMES: [],

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
        RIGHT:2,
        MAP_DEPENDANT:3
    },
    SIDE_PRIORITY_NAMES: [],

    DEFAULT_BACK_STEP_SAVING_COUNT: 500,

    EXPORT_STATES: {RAW:0, COMPACTED:1},
    EXPORT_SEPARATOR: "x",

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
    
    WORKER_RELATIVE_PATH: "./src/physics/RemotePhysicsUnit.js",
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
    
    DEFAULT_WORLD_START_SETTINGS: {
        autoStart: true,
        usesWebWorkers: true,
        aimedFPS: 60,
        zoom: null,

        cameraCenterPos: undefined,
        mapWidth: null,
        mapHeight: null,
        mapPixelSize: null,
    },

    DEFAULT_USER_SETTINGS: {
        autoSimulationSizing: null,
        dragAndZoomCanvasEnabled: true,
        minZoomThreshold: .1,
        maxZoomThreshold: Infinity,
        zoomInIncrement: .25,
        zoomOutIncrement: -.2,
        warningsDisabled: false,
        showBorder: true,
        showGrid: true,
        smoothDrawingEnabled: true,
        visualEffectsEnabled: true,
    },

    DEFAULT_COLOR_SETTINGS: {
        grid: [240,248,255,.2],
        border: [240,248,255,1],

        AIR:[0,0,0,0],
        SAND:[235,235,158,1],
        WATER:[0,15,242,.7],
        STONE:[100,100,100,1],
        GRAVEL:[188,188,188,1], 
        INVERTED_WATER:[55,75,180,.75],
        CONTAMINANT:[30,95,65,.75],
        LAVA:[255,132,0,.88],
        ELECTRICITY:[255,235,0,0.9],
        COPPER:[121,65,52,1],
    },

    DEFAULT_MAP_RESOLUTIONS: {
        HIGH: 2,
        MEDIUM: 10,
        SMALL: 18,
        DEFAULT: 10
    },
}

// SET DEFAULT USER SETTINGS autoSimulationSizing
if (SETTINGS.DEFAULT_USER_SETTINGS.autoSimulationSizing === null) SETTINGS.DEFAULT_USER_SETTINGS.autoSimulationSizing = SETTINGS.DEFAULT_MAP_RESOLUTIONS.DEFAULT

// SET MATERIAL GROUPS
SETTINGS.MATERIAL_GROUPS = {
    TRANSPIERCEABLE:SETTINGS.MATERIALS.WATER|SETTINGS.MATERIALS.INVERTED_WATER|SETTINGS.MATERIALS.AIR|SETTINGS.MATERIALS.CONTAMINANT,
    LIQUIDS:SETTINGS.MATERIALS.WATER|SETTINGS.MATERIALS.INVERTED_WATER|SETTINGS.MATERIALS.CONTAMINANT,
    CONTAMINABLE:SETTINGS.MATERIALS.WATER|SETTINGS.MATERIALS.INVERTED_WATER,
    MELTABLE:SETTINGS.MATERIALS.SAND|SETTINGS.MATERIALS.GRAVEL,

    HAS_VISUAL_EFFECTS:SETTINGS.MATERIALS.ELECTRICITY|SETTINGS.MATERIALS.COPPER,

    REVERSE_LOOP_CONTAINED_SKIPABLE:SETTINGS.MATERIALS.SAND|SETTINGS.MATERIALS.WATER|SETTINGS.MATERIALS.GRAVEL|SETTINGS.MATERIALS.CONTAMINANT|SETTINGS.MATERIALS.LAVA|SETTINGS.MATERIALS.ELECTRICITY,
    FORWARDS_LOOP_CONTAINED_SKIPABLE:SETTINGS.MATERIALS.INVERTED_WATER,
}

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
const M = SETTINGS.MATERIALS, materials = Object.keys(M), m_ll = materials.length
for (let i=0,ii=0;ii<m_ll;i=!i?1:i*2,ii++) SETTINGS.MATERIAL_NAMES[i] = materials[ii]

// SET BRUSH TYPE NAMES
const B = SETTINGS.BRUSH_TYPES, brushTypes = Object.keys(B), bt_ll = brushTypes.length
for (let i=1,ii=0;ii<bt_ll;i=!i?1:i*2,ii++) SETTINGS.BRUSH_TYPE_NAMES[i] = brushTypes[ii]

// SET SIDE PRIORITY NAMES
SETTINGS.SIDE_PRIORITY_NAMES = Object.keys(SETTINGS.SIDE_PRIORITIES)

// SET BRUSHES X VALUES
const brushesX = Object.keys(SETTINGS.BRUSH_TYPES).filter(b=>b.startsWith("X")), b_ll = brushesX.length
for (let i=SETTINGS.BRUSH_TYPES[brushesX[0]],ii=0;ii<b_ll;i=!i?1:i*2,ii++) SETTINGS.BRUSHES_X_VALUES[i] = +brushesX[ii].slice(1)