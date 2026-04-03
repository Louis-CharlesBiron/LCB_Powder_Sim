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
    (simulation)=>{
        console.log("%cSIMULATION LOADED", "font-size:9.5px;color:#9c9c9c;")
        simulation.updateBrushType(Simulation.BRUSH_TYPES.X3)
    },
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


// TABS SWITCHING
const tabs = document.querySelectorAll(".tabs > span"), tabContents = document.querySelectorAll(".tabContent > div")

function selectTab(e) {
    const dataset = e.target.dataset

    tabs.forEach(el=>el.dataset.selected = false)
    tabContents.forEach(el=>el.dataset.displayed = false)

    dataset.selected = true
    ;[...tabContents].find(el=>el.dataset.content === dataset.content).dataset.displayed = true
}

tabs.forEach(el=>el.onclick=selectTab)


// CSS VARIABLES
const root = document.querySelector(":root").style
root.setProperty("--tabsCount", tabs.length)


// MATERIALS TAB
const materialsList = document.getElementById("materialsList")
Object.entries(Simulation.MATERIALS).forEach(([name, mat])=>{
    const box = document.createElement("div")
    box.textContent = name
    box.onclick=()=>simulation.updateSelectedMaterial(mat)

    materialsList.appendChild(box)
})

// BRUSHES TAB
const brushesList = document.getElementById("brushesList")
Object.entries(Simulation.BRUSH_TYPES).forEach(([name, brush])=>{
    const box = document.createElement("div")
    box.textContent = name
    box.onclick=()=>simulation.updateBrushType(brush)

    brushesList.appendChild(box)
})