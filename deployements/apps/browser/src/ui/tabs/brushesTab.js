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

simulation.onBrushTypeChanged=newValue=>{
    displayUpdate("Selected Brush: "+normalizeText(Simulation.BRUSH_TYPE_NAMES[newValue]))
}