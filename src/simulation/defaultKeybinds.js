//[[@export]]
const DEFAULT_KEYBINDS = {
    /**
        KEYBIND_NAME: {
            defaultFunction?: {string?} The simulation function to call
            defaultParams?: {Array?} The parameters to pass to the defaultFunction call
            cancelKeys?: {[TypingDevice.KEYS]?} The keys that prevent the execution of the keybind
            requiredKeys?: {[TypingDevice.KEYS]?} The required modifier keys to execute the keybind
            keys: {[TypingDevice.KEYS]} The base key bind
            triggerType?: {TypingDevice.TRIGGER_TYPES?} The trigger type
            preventDefault?: {Boolean} Whether to e.preventDefault()
        }
    */

    MY_CUSTOM_SIZE_KEYBIND: {
        requiredKeys: [TypingDevice.KEYS.CONTROL, TypingDevice.KEYS.SHIFT],
        keys:[TypingDevice.KEYS.G],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },

    STEP: {
        defaultFunction: "step",
        keys:[TypingDevice.KEYS.ARROW_RIGHT],
        triggerType: TypingDevice.TRIGGER_TYPES.MEDIUM_REPEATING
    },
    BACK_STEP: {
        defaultFunction: "backStep",
        keys:[TypingDevice.KEYS.ARROW_LEFT],
        triggerType: TypingDevice.TRIGGER_TYPES.MEDIUM_REPEATING
    },
    STEP_FAST: {
        defaultFunction: "step",
        keys:[TypingDevice.KEYS.ARROW_UP],
        triggerType: TypingDevice.TRIGGER_TYPES.FAST_REPEATING
    },
    BACK_STEP_FAST: {
        defaultFunction: "backStep",
        keys:[TypingDevice.KEYS.ARROW_DOWN],
        triggerType: TypingDevice.TRIGGER_TYPES.FAST_REPEATING
    },

    START: {
        defaultFunction: "start",
        keys:[TypingDevice.KEYS.SPACE],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE
    },
    STOP: {
        defaultFunction: "stop",
        defaultParams: ["test"],
        keys:[TypingDevice.KEYS.ESCAPE],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE
    },
    CLEAR: {
        defaultFunction: "clear",
        requiredKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.BACKSPACE],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },

    SELECT_SAND: {
        defaultFunction: "updateSelectedMaterial",
        defaultParams: [SETTINGS.MATERIALS.SAND],
        cancelKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_1, TypingDevice.KEYS.NUMPAD_1],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    SELECT_WATER: {
        defaultFunction: "updateSelectedMaterial",
        defaultParams: [SETTINGS.MATERIALS.WATER],
        cancelKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_2, TypingDevice.KEYS.NUMPAD_2],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    SELECT_STONE: {
        defaultFunction: "updateSelectedMaterial",
        defaultParams: [SETTINGS.MATERIALS.STONE],
        cancelKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_3, TypingDevice.KEYS.NUMPAD_3],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    SELECT_GRAVEL: {
        defaultFunction: "updateSelectedMaterial",
        defaultParams: [SETTINGS.MATERIALS.GRAVEL],
        cancelKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_4, TypingDevice.KEYS.NUMPAD_4],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    SELECT_INVERTED_WATER: {
        defaultFunction: "updateSelectedMaterial",
        defaultParams: [SETTINGS.MATERIALS.INVERTED_WATER],
        cancelKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_5, TypingDevice.KEYS.NUMPAD_5],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    SELECT_CONTAMINANT: {
        defaultFunction: "updateSelectedMaterial",
        defaultParams: [SETTINGS.MATERIALS.CONTAMINANT],
        cancelKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_6, TypingDevice.KEYS.NUMPAD_6],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    SELECT_LAVA: {
        defaultFunction: "updateSelectedMaterial",
        defaultParams: [SETTINGS.MATERIALS.LAVA],
        cancelKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_7, TypingDevice.KEYS.NUMPAD_7],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    SELECT_ELECTRICITY: {
        defaultFunction: "updateSelectedMaterial",
        defaultParams: [SETTINGS.MATERIALS.ELECTRICITY],
        cancelKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_8, TypingDevice.KEYS.NUMPAD_8],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    SELECT_COPPER: {
        defaultFunction: "updateSelectedMaterial",
        defaultParams: [SETTINGS.MATERIALS.COPPER],
        cancelKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_9, TypingDevice.KEYS.NUMPAD_9],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    SELECT_AIR: {
        defaultFunction: "updateSelectedMaterial",
        defaultParams: [SETTINGS.MATERIALS.AIR],
        cancelKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_0, TypingDevice.KEYS.NUMPAD_0],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    

    BRUSH_PIXEL: {
        defaultFunction: "updateBrushType",
        defaultParams: [SETTINGS.BRUSH_TYPES.PIXEL],
        requiredKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_1, TypingDevice.KEYS.NUMPAD_1],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    BRUSH_VERTICAL_CROSS: {
        defaultFunction: "updateBrushType",
        defaultParams: [SETTINGS.BRUSH_TYPES.VERTICAL_CROSS],
        requiredKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_2, TypingDevice.KEYS.NUMPAD_2],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    BRUSH_X3: {
        defaultFunction: "updateBrushType",
        defaultParams: [SETTINGS.BRUSH_TYPES.X3],
        requiredKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_3, TypingDevice.KEYS.NUMPAD_3],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    BRUSH_BIG_DOT: {
        defaultFunction: "updateBrushType",
        defaultParams: [SETTINGS.BRUSH_TYPES.BIG_DOT],
        requiredKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_4, TypingDevice.KEYS.NUMPAD_4],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    BRUSH_X5: {
        defaultFunction: "updateBrushType",
        defaultParams: [SETTINGS.BRUSH_TYPES.X5],
        requiredKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_5, TypingDevice.KEYS.NUMPAD_5],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    BRUSH_X15: {
        defaultFunction: "updateBrushType",
        defaultParams: [SETTINGS.BRUSH_TYPES.X15],
        requiredKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_6, TypingDevice.KEYS.NUMPAD_6],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    BRUSH_X25: {
        defaultFunction: "updateBrushType",
        defaultParams: [SETTINGS.BRUSH_TYPES.X25],
        requiredKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_7, TypingDevice.KEYS.NUMPAD_7],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    BRUSH_X55: {
        defaultFunction: "updateBrushType",
        defaultParams: [SETTINGS.BRUSH_TYPES.X55],
        requiredKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_8, TypingDevice.KEYS.NUMPAD_9],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
    BRUSH_X99: {
        defaultFunction: "updateBrushType",
        defaultParams: [SETTINGS.BRUSH_TYPES.X99],
        requiredKeys: [TypingDevice.KEYS.CONTROL],
        keys:[TypingDevice.KEYS.DIGIT_0, TypingDevice.KEYS.NUMPAD_0],
        triggerType: TypingDevice.TRIGGER_TYPES.ONCE,
        preventDefault: true
    },
}