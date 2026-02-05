const {Simulation} = lcbPS

// Creating the powder simulation
const simulation = new Simulation(
    document.getElementById("simulationCanvasId"),
    onSimulationReady,
    {
        usesWebWorkers: true,
        autoStart: true,
        aimedFPS: 60,
    },
    {
        autoSimulationSizing: true,
        showBorder: true,
        showGrid: true,
        visualEffectsEnabled: true,
    }
)

// Function that runs when the simulation is loaded
function onSimulationReady(simulation) {
    console.log("The simulation is ready!")
}