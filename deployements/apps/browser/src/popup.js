//const {Simulation} = lcbPS
if (window.lcbPS) {
    window.Simulation = window.lcbPS.Simulation
    window.FPSCounter = window.lcbPS.FPSCounter
    window.CDEUtils = window.lcbPS.CDEUtils
}


//Display version
chrome.management.getSelf(e=>document.getElementById("version").textContent="V"+e.versionName)

// Creating the powder simulation
const simulation = new Simulation(
    document.getElementById("simulationCanvas"),
    readyCB,
    {
        usesWebWorkers: false,
        aimedFPS: 60,
    },
    {
        autoSimulationSizing: 5,
        showBorder: true,
        showGrid: true,
        visualEffectsEnabled: true,
        warningsDisabled: 1,
        showCursor: false
    }
)

// READY FUNCTION
function readyCB(simulation) {
    console.log("%cSIMULATION LOADED", "font-size:9.5px;color:#9c9c9c;")
    if (!(simulation instanceof Simulation)) return

    //simulation.updateSelectedMaterial(Simulation.MATERIALS.WATER)
    //simulation.updateMapSize(231, 149)
    //simulation.updateMapPixelSize(4)
    simulation.updateBrushType(Simulation.BRUSH_TYPES.X3)
}



