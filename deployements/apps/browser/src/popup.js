const {Simulation, FPSCounter, CDEUtils, Color} = lcbPS

console.log("Hey! If you want to directly use the simulation API, use the global 'simulation' variable!")

//Display version
chrome.management.getSelf(e=>document.getElementById("version").textContent="v"+e.versionName)

// UI GLOBALS
const globals = {

}

// Creating the powder simulation
const simulation = new Simulation(
    document.getElementById("simulationCanvas"),
    onSimulationReady,
    {
        usesWebWorkers: false,
        aimedFPS: 60,
    },
    {
        autoSimulationSizing: false,
        showBorder: true,
        showGrid: true,
        visualEffectsEnabled: true,
        warningsDisabled: 1,
        showCursor: false,
        maxDynamicMaterialCount: 1000000,
    }
)

function onSimulationReady(simulation) {
        console.log("%cSIMULATION LOADED !", "font-size:9.5px;color:#9c9c9c;")
        simulation.updateBrushType(Simulation.BRUSH_TYPES.VERTICAL_CROSS)
        simulation.updateMapPixelSize(4)
        simulation.updateMapSize(195, 109)

        // MAP PERSISTENCE
        chrome.storage.local.get(res=>{
            const savedMap = res[STORAGE_KEYS.savedMap]
            if (savedMap) simulation.load(savedMap, true)
        })
        
}