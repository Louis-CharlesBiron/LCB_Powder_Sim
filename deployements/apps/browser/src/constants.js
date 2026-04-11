const INPUT_STORAGE_TYPE = "sync",
      REGULAR_STORAGE = chrome.storage.sync
      MAP_PERSISTENCE_STORAGE = chrome.storage.local,
      FILE_EXTENSION = ".lcbps",
      PROPOSED_FILE_NAME = "LCBPowderSimulator"+FILE_EXTENSION
      

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
    crazyVel: "q",
    secondFallUni:"r",

    // OTHERS
    savedMap: "n",
    selectedTab: "o",
    exportType: "p",
}


// TODO
// conflicts: Mouse Velocity Create & Crazy Init Vel