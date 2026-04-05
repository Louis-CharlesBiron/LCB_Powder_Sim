function normalizeText(text) {
    return capitalize(text.toLowerCase().replaceAll("_", " "))
}

function capitalize(text) {
    return text.replaceAll(/(?:\s|^)[a-z]/g,x=>x.toUpperCase())
}

function autoTextSize(text, minSize=5, maxSize=18, disableFormating) {
    const maxLength = text.split(" ").sort((a,b)=>b.length-a.length)[0].length*((maxSize/minSize)/2),
        size = (1-CDEUtils.normalize(CDEUtils.clamp(maxLength, minSize, maxSize), minSize, maxSize))*maxSize

    return disableFormating ? size : size.toFixed(2)+"px" 
}