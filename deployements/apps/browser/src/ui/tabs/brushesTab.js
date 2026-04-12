(()=>{
const parentClassName = "smallBoxParent"
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

    smallBoxParent.className = parentClassName
    smallBoxIcon.className = "smallBoxIcon"
    smallBoxIcon.style.width = smallBoxIcon.getBoundingClientRect().height+"px"
    smallBoxIcon.style.height = smallBoxIcon.getBoundingClientRect().height+"px"
    //smallBoxIcon.style.backgroundColor = new Color(simulation.colorSettings[name])
    smallBoxParent.onclick=()=>{
        simulation.updateBrushType(brush)
        selectUIBrush(i)
    }
})

function selectUIBrush(index) {
    brushesList.querySelectorAll("."+parentClassName).forEach(el=>el.dataset.selected = false)
    brushesList.children[index].dataset.selected = true
}

simulation.onBrushTypeChanged=newValue=>{
    const brushName = Simulation.BRUSH_TYPE_NAMES[newValue]
    selectUIBrush(Object.values(Simulation.BRUSH_TYPE_NAMES).indexOf(brushName))
    displayUpdate("Selected Brush: "+normalizeText(brushName))
    
}

})()