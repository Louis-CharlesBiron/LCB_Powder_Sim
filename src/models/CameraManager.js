class CameraManager {
    #simulation = null
    constructor(simulation) {
        this.#simulation = simulation
        this.#setCanvasZoomAndDrag()
    }

    resetCamera() {
        this.#simulation.CVS.resetTransformations(true)
    }
    
    // Zooms in/out towards the provided pos
    #zoomTowardsPos(pos, zoomDirection) {
        const CVS = this.#simulation.CVS, userSettings = this.#simulation.userSettings, newZoom = CVS.zoom+(zoomDirection<0 ? userSettings.zoomInIncrement : userSettings.zoomOutIncrement)
        if (newZoom > userSettings.minZoomThreshold && newZoom < userSettings.maxZoomThreshold) {
            CVS.zoomAtPos(pos, newZoom)
            return pos
        }  else return false
    }

    // Adds the ability do zoom/move around the canvas (if dragAndZoomCanvasEnabled)
    #setCanvasZoomAndDrag() {
        const CVS = this.#simulation.CVS, userSettings = this.#simulation.userSettings

        Canvas.preventNativeZoom((dir, isMouse)=>{
            if (userSettings.dragAndZoomCanvasEnabled && !isMouse) this.#zoomTowardsPos(CVS.getCenter(), dir)
        })

        if (userSettings.dragAndZoomCanvasEnabled) {
            const frame = CVS.frame, mouse = CVS.mouse
            let isCameraMoving = false, lastDragPos = [0,0]

            frame.addEventListener("wheel", e=>{
                if (userSettings.dragAndZoomCanvasEnabled && this.#zoomTowardsPos(mouse.rawPos, e.deltaY)) lastDragPos = [...mouse.rawPos]
            })

            frame.addEventListener("mousedown", e=>{
                if (userSettings.dragAndZoomCanvasEnabled) {
                    if (e.button === Mouse.BUTTON_TYPES.RIGHT) {
                        isCameraMoving = true
                        lastDragPos = [e.clientX, e.clientY]
                    }
                    else if (userSettings.useMiddleClickToResetDragAndZoom && e.button === Mouse.BUTTON_TYPES.MIDDLE) {
                        this.resetCamera()
                        e.preventDefault()
                    }
                }
            })

            frame.addEventListener("mousemove", e=>{
                if (userSettings.dragAndZoomCanvasEnabled && isCameraMoving) {
                    const {clientX, clientY} = e, [vx, vy] = CVS.viewPos, dx = clientX-lastDragPos[0], dy = clientY-lastDragPos[1]
                    CVS.moveViewAt([vx+dx, vy+dy])
                    lastDragPos = [clientX, clientY]
                }
            })

            frame.addEventListener("mouseleave", e=>{
                if (userSettings.dragAndZoomCanvasEnabled && isCameraMoving) {
                    const {clientX, clientY} = e
                    lastDragPos = [clientX, clientY]
                    isCameraMoving = false
                }
            })

            frame.addEventListener("mouseup", e=>{
                if (isCameraMoving && e.button === Mouse.BUTTON_TYPES.RIGHT) isCameraMoving = false
            })

            frame.addEventListener("contextmenu", e=>e.preventDefault())

            return true
        }
        else return false
    }
}