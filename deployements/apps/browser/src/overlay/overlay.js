const {Simulation, FPSCounter, CDEUtils, Color, Canvas} = lcbPS

const PX_SIZE = 4

const simulation = new Simulation(
    createCanvas(),
    onSimulationReady,
    {
        usesWebWorkers: false,
        aimedFPS: 60,
    },
    {
        autoSimulationSizing: CVS=>[PX_SIZE, [CVS.width+PX_SIZE/2, CVS.height+PX_SIZE/2]],
        showBorder: true,
        showGrid: true,
        warningsDisabled: 1,
        showCursor: true,
        showBrush: true,
        maxDynamicMaterialCount: 1000000,
        dragAndZoomCanvasEnabled: false
    }
)

function onSimulationReady(simulation) {
    console.log("%cOVERLAY CREATED | SIMULATION LOADED !", "font-size:9.5px;color:#9c9c9c;")

    toggleIntegrationVisibility(false, simulation)
    toggleInputIsolation(true)
    
    simulation.updateBrushType(Simulation.BRUSH_TYPES.VERTICAL_CROSS)
}

chrome.runtime.onMessage.addListener((message, _, sendResponse)=>{
    const type = message.type, value = message.value
    if (type === "init") {
        console.log(value)
    }
    else if (type === "inputIsolation") toggleInputIsolation(value)
    else if (type === "fixedPosition") toggleFixedPosition(value, simulation.CVS)
    else if (type === "integrationVisibility") toggleIntegrationVisibility(value, simulation)
    
})
