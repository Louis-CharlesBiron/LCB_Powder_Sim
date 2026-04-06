// Open/close drawer
const drawerControl = document.getElementById("drawerControl"), drawer = document.getElementById("bottom")
drawerControl.onclick=()=>{
    const isClosed = drawer.dataset.closed === "true"
    drawerControl.textContent = isClosed ? "∨" : "∧" 
    drawer.dataset.closed = isClosed ? false : true
}

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

// HORIZONTAL SCROLL
document.querySelectorAll(".tabInputsParent").forEach(el=>{
    el.addEventListener("wheel", e=>{
        e.preventDefault()
        el.scrollLeft += e.deltaY
    })
})

// MATERIALS TAB
const materialsList = document.getElementById("materialsList")
Object.entries(Simulation.MATERIALS).forEach(([name, mat], i)=>{
    const smallBoxParent = document.createElement("div"),
          smallBoxIcon = document.createElement("div")
          smallBoxText = document.createElement("span")

    smallBoxParent.appendChild(smallBoxIcon)
    smallBoxParent.appendChild(smallBoxText)
    materialsList.appendChild(smallBoxParent)

    if ((2**i) === simulation.selectedMaterial) smallBoxParent.dataset.selected = true

    const normalText = normalizeText(name)
    smallBoxText.textContent = normalText
    smallBoxText.style.fontSize = autoTextSize(normalText, 8.25, 19)

    const parentClassName = "smallBoxParent"
    smallBoxParent.className = parentClassName
    smallBoxIcon.className = "smallBoxIcon"
    smallBoxIcon.style.width = smallBoxIcon.getBoundingClientRect().height+"px"
    smallBoxIcon.style.height = smallBoxIcon.getBoundingClientRect().height+"px"
    smallBoxIcon.style.backgroundColor = new Color(simulation.colorSettings[name])
    smallBoxParent.onclick=()=>{
        simulation.updateSelectedMaterial(mat)
        materialsList.querySelectorAll("."+parentClassName).forEach(el=>el.dataset.selected = false)
        smallBoxParent.dataset.selected = true
    }
})

// BRUSHES TAB
const brushesList = document.getElementById("brushesList")
Object.entries(Simulation.BRUSH_TYPES).forEach(([name, brush], i)=>{
    const smallBoxParent = document.createElement("div"),
          smallBoxIcon = document.createElement("div")
          smallBoxText = document.createElement("span")

    smallBoxParent.appendChild(smallBoxIcon)
    smallBoxParent.appendChild(smallBoxText)
    brushesList.appendChild(smallBoxParent)

    if ((2**i) === simulation.brushType) smallBoxParent.dataset.selected = true

    const normalText = normalizeText(name)
    smallBoxText.textContent = normalText
    smallBoxText.style.fontSize = autoTextSize(normalText, 8.25, 19)

    const parentClassName = "smallBoxParent"
    smallBoxParent.className = parentClassName
    smallBoxIcon.className = "smallBoxIcon"
    smallBoxIcon.style.width = smallBoxIcon.getBoundingClientRect().height+"px"
    smallBoxIcon.style.height = smallBoxIcon.getBoundingClientRect().height+"px"
    //smallBoxIcon.style.backgroundColor = new Color(simulation.colorSettings[name])
    smallBoxParent.onclick=()=>{
        simulation.updateBrushType(brush)
        brushesList.querySelectorAll("."+parentClassName).forEach(el=>el.dataset.selected = false)
        smallBoxParent.dataset.selected = true
    }
})


// MAP TAB
document.getElementById("startButton").onclick=()=>simulation.start()
document.getElementById("stopButton").onclick=()=>simulation.stop()
document.getElementById("stepButton").onclick=()=>simulation.step()
document.getElementById("backStepButton").onclick=()=>simulation.backStep()
document.getElementById("clearButton").onclick=()=>simulation.clear()

const c_width = document.getElementById("c_width")
c_width.value = simulation.mapGrid.mapWidth
setRegularNumberInput(c_width, v=>simulation.updateMapSize(v))
addWheelIncrement(c_width, [1,10,50], v=>simulation.updateMapSize(v))

const c_height = document.getElementById("c_height")
c_height.value = simulation.mapGrid.mapHeight
setRegularNumberInput(c_height, v=>simulation.updateMapSize(null, v))
addWheelIncrement(c_height, [1,10,50], v=>simulation.updateMapSize(null, v))

const c_pixelSize = document.getElementById("c_pixelSize")
c_pixelSize.value = simulation.mapGrid.pixelSize
setRegularNumberInput(c_pixelSize, v=>simulation.updateMapPixelSize(v))
addWheelIncrement(c_pixelSize, [1,5,10], v=>{
    simulation.updateMapPixelSize(v)
    if (simulation.autoSimulationSizing) simulation.autoFitMapSize(v)
})

const c_showGrid = document.getElementById("c_showGrid")
c_showGrid.checked = simulation.showGrid
c_showGrid.onchange=e=>simulation.showGrid = e.target.checked

const c_showBorder = document.getElementById("c_showBorder")
c_showBorder.checked = simulation.showBorder
c_showBorder.onchange=e=>simulation.showBorder = e.target.checked

c_autoSizing.checked = simulation.autoSimulationSizing
c_autoSizing.onchange=e=>simulation.autoSimulationSizing = e.target.checked ? (+c_pixelSize.value)||5 : false