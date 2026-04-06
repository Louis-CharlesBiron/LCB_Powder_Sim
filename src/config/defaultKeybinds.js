///[[@export]]
const DEFAULT_KEYBINDS = {
    /**
        KEYBIND_NAME: {
            callback?: {Function?} The function to be called on keybind trigger. (simulation)=>{...}
            cancelKeys?: {[TypingDevice.KEYS]?} The keys that prevent the execution of the keybind
            requiredKeys?: {[TypingDevice.KEYS]?} The required modifier keys to execute the keybind (one of)
            keys: {[TypingDevice.KEYS]} The base key bind
            triggerType?: {TypingDevice.TRIGGER_TYPES?} The trigger type
            preventDefault?: {Boolean} Whether to e.preventDefault()
        }
    */

    MY_CUSTOM_SIZE_KEYBIND: {
        callback:simulation=>{
            simulation.updateMapSize(235, 149)
            simulation.updateMapPixelSize(4)
        },
        requiredKeys: [TypingDevice.KEYS.CONTROL, TypingDevice.KEYS.SHIFT],
        keys:[TypingDevice.KEYS.G],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },

    STEP: {
        callback:simulation=>{
            simulation.step()
        },
        keys:[TypingDevice.KEYS.ARROW_RIGHT],
        triggerType: TypingDevice.TRIGGER_TYPES.NORMAL
    },
    BACK_STEP: {
        callback:simulation=>{
            simulation.backStep()
        },
        keys:[TypingDevice.KEYS.ARROW_LEFT],
        triggerType: TypingDevice.TRIGGER_TYPES.NORMAL
    },
    BACK_STEP_ONCE: {
        callback:simulation=>{
            simulation.backStep()
        },
        requiredKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.Z],
        triggerType: TypingDevice.TRIGGER_TYPES.NORMAL,
        preventDefault: true
    },
    STEP_FAST: {
        callback:simulation=>{
            simulation.step()
        },
        keys:[TypingDevice.KEYS.ARROW_UP],
        triggerType: TypingDevice.TRIGGER_TYPES.FAST_REPEATING
    },
    BACK_STEP_FAST: {
        callback:simulation=>{
            simulation.backStep()
        },
        keys:[TypingDevice.KEYS.ARROW_DOWN],
        triggerType: TypingDevice.TRIGGER_TYPES.FAST_REPEATING
    },

    START: {
        callback:simulation=>{
            simulation.start()
        },
        keys:[TypingDevice.KEYS.SPACE],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE
    },
    STOP: {
        callback:simulation=>{
            simulation.stop()
        },
        keys:[TypingDevice.KEYS.ESCAPE],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    FULL_STOP: {
        callback:simulation=>{
            simulation.step(true)
        },
        requiredKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.X],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    CLEAR: {
        callback:simulation=>{
            simulation.clear()
        },
        requiredKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.BACKSPACE],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },

    DISABLE_WORKERS: {
        callback:simulation=>{
            simulation.updatePhysicsUnitType(false)
        },
        requiredKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.O],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    ENABLE_WORKERS: {
        callback:simulation=>{
            simulation.updatePhysicsUnitType(true)
        },
        requiredKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.P],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },

    SELECT_SAND: {
        callback:simulation=>{
            simulation.updateSelectedMaterial(SETTINGS.MATERIALS.SAND)
        },
        cancelKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_1, TypingDevice.KEYS.NUMPAD_1],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    SELECT_WATER: {
        callback:simulation=>{
            simulation.updateSelectedMaterial(SETTINGS.MATERIALS.WATER)
        },
        cancelKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_2, TypingDevice.KEYS.NUMPAD_2],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    SELECT_STONE: {
        callback:simulation=>{
            simulation.updateSelectedMaterial(SETTINGS.MATERIALS.STONE)
        },
        cancelKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_3, TypingDevice.KEYS.NUMPAD_3],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    SELECT_GRAVEL: {
        callback:simulation=>{
            simulation.updateSelectedMaterial(SETTINGS.MATERIALS.GRAVEL)
        },
        cancelKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_4, TypingDevice.KEYS.NUMPAD_4],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    SELECT_INVERTED_WATER: {
        callback:simulation=>{
            simulation.updateSelectedMaterial(SETTINGS.MATERIALS.INVERTED_WATER)
        },
        cancelKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_5, TypingDevice.KEYS.NUMPAD_5],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    SELECT_CONTAMINANT: {
        callback:simulation=>{
            simulation.updateSelectedMaterial(SETTINGS.MATERIALS.CONTAMINANT)
        },
        cancelKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_6, TypingDevice.KEYS.NUMPAD_6],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    SELECT_LAVA: {
        callback:simulation=>{
            simulation.updateSelectedMaterial(SETTINGS.MATERIALS.LAVA)
        },
        cancelKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_7, TypingDevice.KEYS.NUMPAD_7],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    SELECT_VAPOR: {
        callback:simulation=>{
            simulation.updateSelectedMaterial(SETTINGS.MATERIALS.VAPOR)
        },
        cancelKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_8, TypingDevice.KEYS.NUMPAD_8],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    SELECT_FIRE: {
        callback:simulation=>{
            simulation.updateSelectedMaterial(SETTINGS.MATERIALS.FIRE)
        },
        cancelKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_9, TypingDevice.KEYS.NUMPAD_9],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    SELECT_AIR: {
        callback:simulation=>{
            simulation.updateSelectedMaterial(SETTINGS.MATERIALS.AIR)
        },
        cancelKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_0, TypingDevice.KEYS.NUMPAD_0],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    

    BRUSH_PIXEL: {
        callback:simulation=>{
            simulation.updateBrushType(SETTINGS.BRUSH_TYPES.PIXEL)
        },
        requiredKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_1, TypingDevice.KEYS.NUMPAD_1],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    BRUSH_VERTICAL_CROSS: {
        callback:simulation=>{
            simulation.updateBrushType(SETTINGS.BRUSH_TYPES.VERTICAL_CROSS)
        },
        requiredKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_2, TypingDevice.KEYS.NUMPAD_2],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    BRUSH_X3: {
        callback:simulation=>{
            simulation.updateBrushType(SETTINGS.BRUSH_TYPES.X3)
        },
        requiredKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_3, TypingDevice.KEYS.NUMPAD_3],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    BRUSH_BIG_DOT: {
        callback:simulation=>{
            simulation.updateBrushType(SETTINGS.BRUSH_TYPES.BIG_DOT)
        },
        requiredKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_4, TypingDevice.KEYS.NUMPAD_4],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    BRUSH_X5: {
        callback:simulation=>{
            simulation.updateBrushType(SETTINGS.BRUSH_TYPES.X5)
        },
        requiredKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_5, TypingDevice.KEYS.NUMPAD_5],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    BRUSH_X15: {
        callback:simulation=>{
            simulation.updateBrushType(SETTINGS.BRUSH_TYPES.X15)
        },
        requiredKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_6, TypingDevice.KEYS.NUMPAD_6],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    BRUSH_X25: {
        callback:simulation=>{
            simulation.updateBrushType(SETTINGS.BRUSH_TYPES.X25)
        },
        requiredKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_7, TypingDevice.KEYS.NUMPAD_7],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    BRUSH_X55: {
        callback:simulation=>{
            simulation.updateBrushType(SETTINGS.BRUSH_TYPES.X55)
        },
        requiredKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_8, TypingDevice.KEYS.NUMPAD_8],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    BRUSH_X99: {
        callback:simulation=>{
            simulation.updateBrushType(SETTINGS.BRUSH_TYPES.X99)
        },
        requiredKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_9, TypingDevice.KEYS.NUMPAD_9],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
}