const {Simulation} = lcbPS

// Creating the powder simulation
const simulation = new Simulation(
    document.getElementById("simulationCanvas"),
    readyCB,
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

function readyCB(simulation) {
    console.log("Sim loaded", simulation, Neutralino)
}