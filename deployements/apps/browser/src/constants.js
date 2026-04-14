const _SK = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"]
let _sk_i = 0
const STORAGE_KEYS = {
    // INPUTS
    showGrid: _SK[_sk_i++],
    showBorder: _SK[_sk_i++],
    autoSizing: _SK[_sk_i++],
    showStatus: _SK[_sk_i++],
    showFPS: _SK[_sk_i++],
    showCursor: _SK[_sk_i++],
    showBrush: _SK[_sk_i++],
    smoothDrawing: _SK[_sk_i++],
    dragAndZoom: _SK[_sk_i++],
    useWorkers: _SK[_sk_i++],
    mapPersistence: _SK[_sk_i++],
    createFromMouseVel: _SK[_sk_i++],
    backstepSavingOptimization: _SK[_sk_i++],
    crazyVel: _SK[_sk_i++],
    secondFallUni:_SK[_sk_i++],

    // OTHERS
    savedMap: _SK[_sk_i++],
    selectedTab: _SK[_sk_i++],
    exportType: _SK[_sk_i++],
    overlayTabId: _SK[_sk_i++],
    inputIsolation: _SK[_sk_i++],
    fixedPosition: _SK[_sk_i++],
    integrationVisibility: _SK[_sk_i++],
}

const INPUT_STORAGE_TYPE = "sync",
      REGULAR_STORAGE = chrome.storage.sync
      LOCAL_STORAGE = chrome.storage.local,
      FILE_EXTENSION = ".lcbps",
      PROPOSED_FILE_NAME = "LCBPowderSimulator"+FILE_EXTENSION,
      OVERLAY_ON_APP_HEIGHT = "145px",
      OVERLAY_OFF_APP_HEIGHT = "580px"

const STRINGS = {
    OVERLAY_OFF: "Open overlay",
    OVERLAY_ON: "Close overlay",
}