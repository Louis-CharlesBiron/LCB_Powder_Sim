const INPUT_STORAGE_TYPE = "sync",
      REGULAR_STORAGE = chrome.storage.sync
      MAP_PERSISTENCE_STORAGE = chrome.storage.local
      
      
const STORAGE_KEYS = {
    // INPUTS
    showGrid: "a",
    showBorder: "b",
    autoSizing: "c",
    showStatus: "d",
    showFPS: "e",
    showCursor: "f",
    showBrush: "g",
    smoothDrawing: "h",
    dragAndZoom: "i",
    useWorkers: "j",
    mapPersistence: "k",
    createFromMouseVel: "l",
    backstepSavingOptimization: "m",

    // OTHERS
    savedMap: "n",
    selectedTab: "o",
}