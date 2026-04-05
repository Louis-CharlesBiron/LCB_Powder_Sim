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

    if ((2**i) === simulation.selectedMaterial) smallBoxParent.dataset.selected = true

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