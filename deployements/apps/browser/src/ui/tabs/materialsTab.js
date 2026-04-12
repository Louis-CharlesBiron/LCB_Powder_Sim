(()=>{
const parentClassName = "smallBoxParent"
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

function selectUIMaterial(index) {
    materialsList.querySelectorAll("."+parentClassName).forEach(el=>el.dataset.selected = false)
    materialsList.children[index].dataset.selected = true
}

simulation.onSelectedMaterialChanged=newValue=>{
    const materialName = Simulation.MATERIAL_NAMES[newValue]
    selectUIMaterial(Object.values(Simulation.MATERIAL_NAMES).indexOf(materialName)-1)
    displayUpdate("Selected Material: "+normalizeText(materialName))
}

})()