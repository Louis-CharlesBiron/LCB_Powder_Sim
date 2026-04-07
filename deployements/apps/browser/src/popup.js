const {Simulation, FPSCounter, CDEUtils, Color} = lcbPS

console.log("Hey! \nIf you want to directly use the simulation API, use the global 'simulation' variable!")

//Display version
chrome.management.getSelf(e=>document.getElementById("version").textContent="v"+e.versionName)

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
        showCursor: false
    }
)

function onSimulationReady(simulation) {
        console.log("%cSIMULATION LOADED !", "font-size:9.5px;color:#9c9c9c;")
        simulation.updateBrushType(Simulation.BRUSH_TYPES.VERTICAL_CROSS)
        simulation.updateMapPixelSize(4)
        simulation.updateMapSize(195, 109)
}