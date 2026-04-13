const {Simulation, FPSCounter, CDEUtils, Color, Canvas} = lcbPS

console.log("Overlay created")


function toggleIntegrationVisibility(enable, simulation) {
    if (enable) {
        simulation.showBrush = true
        simulation.showGrid = true
        simulation.showBorder = true
    }
    else {
        simulation.showBrush = false
        simulation.showGrid = false
        simulation.showBorder = false
    }
}

let styleElement = null
function toggleInputIsolation(enable) {
    if (enable) styleElement = appendStyle("html:active *:not([_cvsde=true])", `pointer-events: none !important; user-select: none !important;`)
    else if (styleElement) styleElement.remove() 
}

function appendStyle(selector, styles, target=document.documentElement) {
    const css = selector+"{"+styles+"}", style = document.createElement("style")

    if (style.styleSheet) style.styleSheet.cssText = css
    else style.appendChild(document.createTextNode(css))
    target.appendChild(style)
    return style
}

function toggleFixedPosition(enable) {
    if (enable) CVS.cvs.style.position = "fixed"
    else CVS.cvs.style.position = "absolute"
}




const CVS = Canvas.create()
CVS.cvs.style.zIndex = 99999999999999
if (+CVS.cvs.height > window.innerHeight) CVS.cvs.height = window.innerHeight
toggleFixedPosition(true)

const PX_SIZE = 4
const simulation = new Simulation(
    CVS,
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
    console.log("%cSIMULATION LOADED !", "font-size:9.5px;color:#9c9c9c;")

    toggleIntegrationVisibility(false, simulation)
    toggleInputIsolation(true)
    
    simulation.updateBrushType(Simulation.BRUSH_TYPES.VERTICAL_CROSS)
}