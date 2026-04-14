function createCanvas() {
    const CVS = Canvas.create()
    CVS.cvs.style.zIndex = 99999999999999
    if (+CVS.cvs.height > window.innerHeight) CVS.cvs.height = window.innerHeight
    toggleFixedPosition(true, CVS)
    return CVS
}

let styleElement = null
function toggleInputIsolation(enable) {
    if (enable) styleElement = appendStyle("html:active *:not([_cvsde=true])", `pointer-events: none !important; user-select: none !important;`)
    else if (styleElement) styleElement.remove() 
}

function toggleFixedPosition(enable, CVS) {
    if (enable) CVS.cvs.style.position = "fixed"
    else CVS.cvs.style.position = "absolute"
}

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

function appendStyle(selector, styles, target=document.documentElement) {
    const css = selector+"{"+styles+"}", style = document.createElement("style")
    if (style.styleSheet) style.styleSheet.cssText = css
    else style.appendChild(document.createTextNode(css))
    target.appendChild(style)
    return style
}