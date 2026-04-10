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

simulation.onSelectedMaterialChanged=newValue=>{
    displayUpdate("Selected Material: "+normalizeText(Simulation.MATERIAL_NAMES[newValue]))
}