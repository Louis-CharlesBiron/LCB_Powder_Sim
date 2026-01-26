class Simulation {
    static MATERIALS = SETTINGS.MATERIALS
    static MATERIAL_COLORS = SETTINGS.MATERIAL_COLORS
    static MATERIAL_GROUPS = SETTINGS.MATERIAL_GROUPS
    static MATERIAL_COLORS_INDEXED = SETTINGS.MATERIAL_COLORS_INDEXED
    static MATERIAL_NAMES = SETTINGS.MATERIAL_NAMES
    static MATERIAL_STATES = SETTINGS.MATERIAL_STATES
    static MATERIAL_STATES_GROUPS = SETTINGS.MATERIAL_STATES_GROUPS
    static D = SETTINGS.D
    static SIDE_PRIORITIES = SETTINGS.SIDE_PRIORITIES
    static SIDE_PRIORITY_NAMES = SETTINGS.SIDE_PRIORITY_NAMES
    static EXPORT_STATES = SETTINGS.EXPORT_STATES
    static EXPORT_SEPARATOR = SETTINGS.EXPORT_SEPARATOR
    static BRUSH_TYPES = SETTINGS.BRUSH_TYPES
    static #BRUSHES_X_VALUES = SETTINGS.BRUSHES_X_VALUES
    static #BRUSH_GROUPS = SETTINGS.BRUSH_GROUPS
    static #WORKER_RELATIVE_PATH = SETTINGS.WORKER_RELATIVE_PATH
    static #WORKER_MESSAGE_TYPES = SETTINGS.WORKER_MESSAGE_TYPES
    static #WORKER_MESSAGE_GROUPS = SETTINGS.WORKER_MESSAGE_GROUPS
    static PHYSICS_UNIT_TYPE = SETTINGS.PHYSICS_UNIT_TYPE
    // CACHES
    static #CACHED_MATERIALS_ROWS = []
    static #CACHED_GRID_LINES = null
    static #CACHED_GRID_BORDER = null
    // DEFAULTS
    static DEFAULT_PHYSICS_UNIT_TYPE = Simulation.PHYSICS_UNIT_TYPE.WORKER
    static DEFAULT_MATERIAL = Simulation.MATERIALS.SAND
    static DEFAULT_BRUSH_TYPE = Simulation.BRUSH_TYPES.PIXEL
    static DEFAULT_BACK_STEP_SAVING_COUNT = SETTINGS.DEFAULT_BACK_STEP_SAVING_COUNT


    #simulationHasPixelsBuffer = true
    #lastPlacedPos = null
    constructor(CVS, mapGrid, usesWebWorkers=Simulation.DEFAULT_PHYSICS_UNIT_TYPE) {
        // SIMULATION
        this._CVS = CVS
        this._mapGrid = mapGrid
        this._pixels = new Uint16Array(mapGrid.arraySize)
        this._lastPixels = new Uint16Array(mapGrid.arraySize)
        this._pxStepUpdated = new Uint8Array(mapGrid.arraySize)
        this._pxStates = new Uint8Array(mapGrid.arraySize)
        this._backStepSavingMaxCount = Simulation.DEFAULT_BACK_STEP_SAVING_COUNT
        this._backStepSaves = []
        this._isMouseWithinSimulation = true
        this._isRunning = false
        this._selectedMaterial = Simulation.MATERIALS.SAND
        this._sidePriority = Simulation.SIDE_PRIORITIES.RANDOM
        this._lastStepTime = null
        this._queuedBufferOperations = []
        this.updatePhysicsUnitType(usesWebWorkers)
        this.#updateCachedMapPixelsRows()

        // DISPLAY
        this._userSettings = {
            showBorder: true,
            showGrid: true,
            smoothDrawingEnabled: true,
            visualEffectsEnabled: true,
        }
        this._mapGridRenderStyles = CVS.render.profile1.update(MapGrid.GRID_DISPLAY_COLOR, null, null, null, 1)
        this._imgMap = CVS.ctx.createImageData(...mapGrid.realDimensions)
        this._simImgMapDrawLoop = CanvasUtils.createEmptyObj(CVS, null, this.#simImgMapDraw.bind(this))
        this._brushType = Simulation.BRUSH_TYPES.PIXEL
        this._loopExtra = null
        this._stepExtra = null
        this.#updateCachedGridDisplays()

        // CANVAS
        CVS.loopingCB = this.#main.bind(this)
        CVS.setMouseMove()
        CVS.setMouseLeave()
        CVS.setMouseDown(this.#mouseDown.bind(this))
        CVS.setMouseUp(this.#mouseUp.bind(this))
        CVS.setKeyUp(null, true)
        CVS.setKeyDown(this.#keyDown.bind(this), true)
        CVS.start()
        this._mouseListenerIds = [
            CVS.mouse.addListener([[0,0],mapGrid.realDimensions], Mouse.LISTENER_TYPES.ENTER, ()=>this._isMouseWithinSimulation = true),
            CVS.mouse.addListener([[0,0],mapGrid.realDimensions], Mouse.LISTENER_TYPES.MOVE, ()=>this._isMouseWithinSimulation = true),
            CVS.mouse.addListener([[0,0],mapGrid.realDimensions], Mouse.LISTENER_TYPES.LEAVE, ()=>this.#mouseLeaveSimulation())
        ]
    }

    /* RENDERING */
    /**
     * The main display and physics loop
     * @param {Number} deltaTime The deltaTime
     */
    #main(deltaTime) {
        const mouse = this.mouse, settings = this._userSettings

        if (this._loopExtra) this._loopExtra(deltaTime)

        if (mouse.clicked && !this.keyboard.isDown(TypingDevice.KEYS.CONTROL)) this.#placePixelFromMouse(mouse)
        
        if (settings.showGrid) this.#drawMapGrid()
        if (settings.showBorder) this.#drawBorder()

        if (settings.visualEffectsEnabled) this.#drawVisualEffects()
        if (this._isRunning && this.useLocalPhysics) this.step()
    }

    #drawVisualEffects() {// OPTIMIZE / TODO
        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.#drawVisualEffects())
            return
        }

        const pixels = this._pixels, p_ll = pixels.length, pxStates = this._pxStates, map = this._mapGrid, M = Simulation.MATERIALS, G = Simulation.MATERIAL_GROUPS, SG = Simulation.MATERIAL_STATES_GROUPS,
        w = map.mapWidth, pxSize = map.pixelSize, pxSize2 = pxSize/4, random = 1+Math.random()|0, batchStroke = this.render.batchStroke.bind(this.render), batchFill = this.render.batchFill.bind(this.render)

        for (let i=0;i<p_ll;i++) {
            const mat = pixels[i]
            if (!(mat&G.HAS_VISUAL_EFFECTS)) continue

            const py = (i/w)|0, x = (i-py*w)*pxSize, y = py*pxSize, state = pxStates[i]
            if (mat === M.ELECTRICITY) batchFill(Render.getPositionsRect([x-pxSize2,y-pxSize2], [x+pxSize+pxSize2,y+pxSize+pxSize2]), [255,235,0,0.45*random])
            else if (mat === M.COPPER && state === Simulation.MATERIAL_STATES.COPPER.LIT) batchFill(Render.getPositionsRect([x-pxSize2,y-pxSize2], [x+pxSize+pxSize2,y+pxSize+pxSize2]), [255,235,0,0.35*random])
            else if (mat === M.COPPER && state === Simulation.MATERIAL_STATES.COPPER.ORIGIN) batchFill(Render.getPositionsRect([x-pxSize2,y-pxSize2], [x+pxSize+pxSize2,y+pxSize+pxSize2]), [255,235,220,0.35*random])
            else if (mat === M.COPPER && state === Simulation.MATERIAL_STATES.COPPER.DISABLED) batchFill(Render.getPositionsRect([x-pxSize2,y-pxSize2], [x+pxSize+pxSize2,y+pxSize+pxSize2]), [0,0,220,0.35*random])

        }  
    }

    // Draws the imageMap on the canvas
    #simImgMapDraw() {
        this.ctx.putImageData(this._imgMap, 0, 0)
    }

    // Draws a border and line to show the map grid on the canvas
    #drawMapGrid() {
        const lines = Simulation.#CACHED_GRID_LINES, l_ll = lines.length, batchStroke = this.render.batchStroke.bind(this.render), styles = this._mapGridRenderStyles
        for (let i=0;i<l_ll;i++) batchStroke(lines[i], styles)
    }

    #drawBorder() {
        this.render.batchStroke(Simulation.#CACHED_GRID_BORDER)
    }

    /**
     * Updates the display image map according to the pixels array (renders a frame)
     */
    updateImgMapFromPixels() {
        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.updateImgMapFromPixels())
            return
        }

        const pixels = this._pixels, lastPixels = this._lastPixels, p_ll = pixels.length, map = this._mapGrid, enableOptimization = lastPixels.length===p_ll&&map.lastPixelSize===map.pixelSize, w = map.mapWidth
        for (let i=0;i<p_ll;i++) {
            const mat = pixels[i]
            if (enableOptimization && mat===lastPixels[i]) continue
            const y = (i/w)|0
            this.#updateMapPixel(i-y*w, y, mat) 
        } 
        if (!enableOptimization) map.lastPixelSize = map.pixelSize

        this._lastPixels = this.#getPixelsCopy()
    }
    
    /**
     * Updates a singular map pixels on the image map
     * @param {Number} rawX The X value of the pixel on the map
     * @param {Number} rawY The Y value of the pixel on the map
     * @param {Simulation.MATERIALS} material One of Simulation.MATERIALS
     */
    #updateMapPixel(rawX, rawY, material) {
        const data = this._imgMap.data, size = this._mapGrid.pixelSize, width = this._imgMap.width, x = rawX*size, y = rawY*size, matRow = Simulation.#CACHED_MATERIALS_ROWS[material]
        for (let i=0;i<size;i++) data.set(matRow, ((y+i)*width+x)*4)
    }
    /* RENDERING -end */

    /* SIMULATION CONTROL */
    /**
     * Runs and displays one physics step
     */
    step() {
        const T = Simulation.#WORKER_MESSAGE_TYPES, unit = this._physicsUnit
        if (this.useLocalPhysics && this.#simulationHasPixelsBuffer) {
            const stepExtra = this._stepExtra
            this.saveStep()
            if (stepExtra) stepExtra()
            unit.step(this._pixels, this._pxStepUpdated, this._pxStates, this._sidePriority, this._mapGrid.mapWidth, this._mapGrid.mapHeight)
            this.updateImgMapFromPixels()
        }
        else if (this.#simulationHasPixelsBuffer) this.#sendPixelsToWorker(T.STEP)
    }

    /**
     * Displays the previous physics step saved
     */
    backStep() {
        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.backStep())
            return
        }

        const saves = this._backStepSaves, b_ll = saves.length
        if (b_ll) {
            let lastSave = saves[b_ll-1]
            const lastSaveArray = lastSave[0], l_ll = lastSaveArray.length, currentSave = this.#getPixelsCopy()
            
            let hasChanges = l_ll !== currentSave.length
            for (let i=0;i<l_ll;i++) {
                if (lastSaveArray[i] !== currentSave[i]) {
                    hasChanges = true
                    break
                }
            }

            if (!hasChanges) lastSave = saves[b_ll-2]

            if (lastSave) this.load(lastSave[0], lastSave[1])
            saves.pop()
        }
    }

    /**
     * Saves a physics step
     */
    saveStep() {
        if (this.backStepSavingEnabled) {
            const saves = this._backStepSaves, b_ll = saves.length, lastSave = saves[b_ll-1]?.[0], l_ll = lastSave?.length, currentSave = this.#getPixelsCopy()

            if (lastSave) {
                let hasChanges = l_ll !== currentSave.length
                for (let i=0;i<l_ll;i++) {
                    if (lastSave[i] !== currentSave[i]) {
                        hasChanges = true
                        break
                    }
                }
                if (!hasChanges) return
            }
            
            saves.push([currentSave, this._mapGrid.dimensions])
            if ((b_ll+1) > this._backStepSavingMaxCount) saves.shift()
        }
    }
    
    /**
     * Sets the state of the simulation to be running
     */
    start(force) {
        if (!this._isRunning || force) {
            this._isRunning = true
            if (this.usesWebWorkers) this.#sendPixelsToWorker(Simulation.#WORKER_MESSAGE_TYPES.START_LOOP)
        }
    }

    /**
     * Sets the state of the simulation to be stopped
     */
    stop() {
        if (this._isRunning) {
            this._isRunning = false
            if (this.usesWebWorkers) this._physicsUnit.postMessage({type:Simulation.#WORKER_MESSAGE_TYPES.STOP_LOOP})
        }
    }
    /* SIMULATION CONTROL -end */
    

    /* USER CALL INTERFACE */
    updatePhysicsUnitType(usesWebWorkers) {
        const isWebWorker = usesWebWorkers&&!this.fileServed
        this._physicsUnit = isWebWorker ? new Worker(Simulation.#WORKER_RELATIVE_PATH) : new LocalPhysicsUnit()

        if (isWebWorker) {
            this.#simulationHasPixelsBuffer = true
            this._physicsUnit.onmessage=this.#physicsUnitMessage.bind(this)
            this._physicsUnit.postMessage({
                type:Simulation.#WORKER_MESSAGE_TYPES.INIT,
                pixels:this._pixels, pxStepUpdated:this._pxStepUpdated, pxStates:this._pxStates, sidePriority:this._sidePriority, 
                mapWidth:this._mapGrid.mapWidth, mapHeight:this._mapGrid.mapHeight,
                aimedFps:this._CVS.fpsLimit
            })
            if (this._isRunning) this.start(true)
        }
        else if (usesWebWorkers && this.fileServed) console.warn(SETTINGS.FILE_SERVED_WARN)
    }

    /**
     * Updates the map pixel size
     * @param {Number} size The new map pixel size
     */
    updateMapPixelSize(size) {
        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.updateMapPixelSize(size))
            return
        }

        const map = this._mapGrid
        map.pixelSize = size
        this._imgMap = CVS.ctx.createImageData(...map.realDimensions)
        this.#updateCachedMapPixelsRows()
        this.#updateCachedGridDisplays()
        this.updateImgMapFromPixels()

        this.#updateMouseListeners()
    }

    /**
     * Updates the map dimensions
     * @param {Number?} width The new width of the map
     * @param {Number?} height The new height of the map
     */
    updateMapSize(width, height) {
        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.updateMapSize(width, height))
            return
        }

        const map = this._mapGrid, oldWidth = map.mapWidth, oldHeight = map.mapHeight, oldPixels = this.#getPixelsCopy()
        height = map.mapHeight = height||map.mapHeight
        width = map.mapWidth = width||map.mapWidth
        this.#updatePixelsFromSize(oldWidth, oldHeight, width, height, oldPixels)
        this.#updateCachedGridDisplays()

        this._imgMap = CVS.ctx.createImageData(...map.realDimensions)
        this.updateImgMapFromPixels()

        this.#updateMouseListeners()
    }

    updateSidePriority(sidePriority) {
        if (this.usesWebWorkers) this._physicsUnit.postMessage({type:Simulation.#WORKER_MESSAGE_TYPES.SIDE_PRIORITY, sidePriority})
        return this._sidePriority = sidePriority
    }

    getPixelAtMapPos(mapPos) {
        const i = this._mapGrid.mapPosToIndex(mapPos)
        return this.usesWebWorkers ? this._lastPixels[i] : this._pixels[i]
    }

    /**
     * Offsets the pixel array to match the updated size 
     * @param {Number} oldWidth The previous/current width of the map
     * @param {Number} oldHeight The previous/current height of the map
     * @param {Number} newWidth The new/updated width of the map
     * @param {Number} newHeight The new/updated height of the map
     * @param {Uint16Array} oldPixels The previous/current pixel array
     */
    #updatePixelsFromSize(oldWidth, oldHeight, newWidth, newHeight, oldPixels) {
        const arraySize = this._mapGrid.arraySize, pixels = this._pixels = new Uint16Array(arraySize), skipOffset = newWidth-oldWidth, smallestWidth = oldWidth<newWidth?oldWidth:newWidth, smallestHeight = oldHeight<newHeight?oldHeight:newHeight
        this._pxStepUpdated = new Uint8Array(arraySize)
        this._pxStates = new Uint8Array(arraySize)
        if (this.usesWebWorkers) this._physicsUnit.postMessage({type:Simulation.#WORKER_MESSAGE_TYPES.MAP_SIZE, mapWidth:this._mapGrid.mapWidth, mapHeight:this._mapGrid.mapHeight, arraySize})
        
        for (let y=0,i=0,oi=0;y<smallestHeight;y++) {
            pixels.set(oldPixels.subarray(oi, oi+smallestWidth), i)
            oi += oldWidth
            i += oldWidth+skipOffset
        }
    }
    /* USER CALL INTERFACE -end */

    /* WEB WORKER CONTROL */
    #physicsUnitMessage(e) {
        const data = e.data, type = data.type, T = Simulation.#WORKER_MESSAGE_TYPES, stepExtra = this._stepExtra

        if (type & Simulation.#WORKER_MESSAGE_GROUPS.GIVES_PIXELS_TO_MAIN) {
            this._pixels = new Uint16Array(data.pixels)
            this._pxStates = new Uint16Array(data.pxStates)
            this.#simulationHasPixelsBuffer = true
        }

        if (type === T.STEP) {// RECEIVE STEP RESULTS (is step/sec bound)
            // DO BUFFER OPERATION
            this.updateImgMapFromPixels()
            this.#executeQueuedOperations()

            if (stepExtra) stepExtra()

            // PASS BACK PIXELS IF LOOP RUNNING
            if (this._isRunning) {
                this.#simulationHasPixelsBuffer = false
                this.#sendPixelsToWorker(T.PIXELS)
            }
        }
    }

    #sendPixelsToWorker(type) {
        const pixels = this._pixels, pxStates = this._pxStates
        this.saveStep()
        if (this.usesWebWorkers) this._physicsUnit.postMessage({type, pixels, pxStates}, [pixels.buffer, pxStates.buffer])
        else this.#simulationHasPixelsBuffer = true
    }

    #executeQueuedOperations() {
        const queued = this._queuedBufferOperations, q_ll = queued.length
        for (let i=0;i<q_ll;i++) {
            queued[0]()
            queued.shift()
        }
    }
    /* WEB WORKER CONTROL -end*/

    /* CACHE UPADTES */
    // Updates the cached pixels row used for drawing optimizations
    #updateCachedMapPixelsRows() {
        const C = Simulation.MATERIAL_COLORS, colors = Object.values(C), c_ll = colors.length, size = this._mapGrid.pixelSize*4, R = Simulation.#CACHED_MATERIALS_ROWS
        for (let i=0,ii=0;ii<c_ll;i=!i?1:i*2,ii++) {
            const pxRow = new Uint8ClampedArray(size), [r,g,b,a] = colors[ii], adjustedA = a*255
            for (let x=0;x<size;x++) {
                const xx = x*4
                pxRow[xx]   = r
                pxRow[xx+1] = g
                pxRow[xx+2] = b
                pxRow[xx+3] = adjustedA
            }
            R[i] = pxRow
        }
    }

    #updateCachedGridDisplays() {
        Simulation.#CACHED_GRID_LINES = this._mapGrid.getDrawableGridLines()
        Simulation.#CACHED_GRID_BORDER = Render.getRect([0,0], ...this._mapGrid.realDimensions)
    }

    #updateMouseListeners() {
        const mouse = this.mouse, dimensions = this._mapGrid.realDimensions
        mouse.updateListener(Mouse.LISTENER_TYPES.ENTER, this._mouseListenerIds[0], [[0,0], dimensions])
        mouse.updateListener(Mouse.LISTENER_TYPES.MOVE,  this._mouseListenerIds[1], [[0,0], dimensions])
        mouse.updateListener(Mouse.LISTENER_TYPES.LEAVE, this._mouseListenerIds[2], [[0,0], dimensions])
    }
    /* CACHE UPADTES -end */

    /* USER INPUT */
    #keyDown(keyboard, e) {// cleanup TODO
        const K = TypingDevice.KEYS, M = Simulation.MATERIALS, B = Simulation.BRUSH_TYPES, ctrlKey = keyboard.isDown(K.CONTROL)
        if (ctrlKey) {
            if (!keyboard.isDown([K.R, K.C, K.V, K.W, K.SHIFT, K.A])) e.preventDefault()
            
            if (keyboard.isDown([K.DIGIT_1, K.NUMPAD_1]))      this._brushType = B.PIXEL
            else if (keyboard.isDown([K.DIGIT_2, K.NUMPAD_2])) this._brushType = B.VERTICAL_CROSS
            else if (keyboard.isDown([K.DIGIT_3, K.NUMPAD_3])) this._brushType = B.X3
            else if (keyboard.isDown([K.DIGIT_4, K.NUMPAD_4])) this._brushType = B.BIG_DOT
            else if (keyboard.isDown([K.DIGIT_5, K.NUMPAD_5])) this._brushType = B.X5
            else if (keyboard.isDown([K.DIGIT_6, K.NUMPAD_6])) this._brushType = B.X15
            else if (keyboard.isDown([K.DIGIT_7, K.NUMPAD_7])) this._brushType = B.X25
            else if (keyboard.isDown([K.DIGIT_8, K.NUMPAD_8])) this._brushType = B.X99
            else if (keyboard.isDown([K.DIGIT_9, K.NUMPAD_9])) this._brushType = B.X99
            else if (keyboard.isDown([K.DIGIT_0, K.NUMPAD_0])) this._brushType = B.PIXEL
        } else {
            if (keyboard.isDown([K.DIGIT_1, K.NUMPAD_1]))      this._selectedMaterial = M.SAND 
            else if (keyboard.isDown([K.DIGIT_2, K.NUMPAD_2])) this._selectedMaterial = M.WATER
            else if (keyboard.isDown([K.DIGIT_3, K.NUMPAD_3])) this._selectedMaterial = M.STONE
            else if (keyboard.isDown([K.DIGIT_4, K.NUMPAD_4])) this._selectedMaterial = M.GRAVEL
            else if (keyboard.isDown([K.DIGIT_5, K.NUMPAD_5])) this._selectedMaterial = M.INVERTED_WATER
            else if (keyboard.isDown([K.DIGIT_6, K.NUMPAD_6])) this._selectedMaterial = M.CONTAMINANT
            else if (keyboard.isDown([K.DIGIT_7, K.NUMPAD_7])) this._selectedMaterial = M.LAVA
            else if (keyboard.isDown([K.DIGIT_8, K.NUMPAD_8, K.E])) this._selectedMaterial = M.ELECTRICITY
            else if (keyboard.isDown([K.DIGIT_9, K.NUMPAD_9])) this._selectedMaterial = M.COPPER
            else if (keyboard.isDown([K.DIGIT_0, K.NUMPAD_0])) this._selectedMaterial = M.AIR
        }

        // put in loop
        if (keyboard.isDown([K.ARROW_RIGHT])) this.step()
        else if (keyboard.isDown([K.ARROW_LEFT])) this.backStep()

        else if (keyboard.isDown([K.SPACE])) this.start()
        else if (keyboard.isDown([K.ESCAPE])) this.stop()

        if (ctrlKey && keyboard.isDown(K.BACKSPACE)) this.clear()
    }

    // mouseDown listener, allows the mouse to place pixels
    #mouseDown(mouse) {
        this.#placePixelFromMouse(mouse)
    }

    // mouseUp listener, disables smooth drawing when mouse is unpressed
    #mouseUp() {
        this.#lastPlacedPos = null
    }

    #mouseLeaveSimulation() {
        this.#lastPlacedPos = null
        this._isMouseWithinSimulation = false
    }

    /**
     * Places the selected material at the mouse position on the map, based on the selected brushType
     * @param {Mouse} mouse A CVS Mouse object
     */
    #placePixelFromMouse(mouse) {
        const mapPos = this._mapGrid.getLocalMapPixel(mouse.pos)
        if (this._isMouseWithinSimulation && mapPos) {
            const [x,y] = mapPos, [ix,iy] = this.#lastPlacedPos||mapPos, dx = x-ix, dy = y-iy, dMax = Math.max(Math.abs(dx), Math.abs(dy))

            if (this.smoothDrawingEnabled && dMax && !(this._brushType & Simulation.#BRUSH_GROUPS.DISABLES_SMOOTH_DRAWING)) for (let i=0;i<dMax;i++) {
                const prog = ((i+1)/dMax)
                this.#placePixelsWithBrush(ix+(dx*prog)|0, iy+(dy*prog)|0)
            } 
            else this.#placePixelsWithBrush(x, y)

            this.#lastPlacedPos = mapPos
            if (!this._isRunning) this.updateImgMapFromPixels()
        }
    }
    /* USER INPUT -end */

    /* PIXEL EDIT */
    /**
     * Places a pixel of a specified material at the specified position on the pixel map
     * @param {[x,y]} mapPos The map position of the pixel
     * @param {Simulation.MATERIALS} material The material used to draw the pixel
     */
    placePixel(mapPos, material=this._selectedMaterial) {
        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.placePixel(mapPos, material))
            return
        }

        const i = this._mapGrid.mapPosToIndex(mapPos)// TODO COULD OPTIMIZE CACHE THAT
        this._pixels[i] = material
        this._pxStates[i] = 0
    }

    /**
     * Places a pixel of a specified material at the specified position on the pixel map
     * @param {Number} x The X value of the pixel on the map
     * @param {Number} y The Y value of the pixel on the map
     * @param {Simulation.MATERIALS} material The material used to draw the pixel
     */
    placePixelCoords(x, y, material=this._selectedMaterial) {
        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.placePixelCoords(x, y, material))
            return
        }

        const i = this._mapGrid.mapPosToIndexCoords(x, y)
        this._pixels[i] = material
        this._pxStates[i] = 0
    }

    #placePixelsWithBrush(x, y, brush=this._brushType) {
        const B = Simulation.BRUSH_TYPES
        if (brush & Simulation.#BRUSH_GROUPS.SMALL_OPTIMIZED) {
            if (brush === B.LINE3 || brush === B.VERTICAL_CROSS) this.fillArea([x,y-1], [x,y+1])
            if (brush === B.ROW3 || brush === B.VERTICAL_CROSS) {
                if (x) this.placePixelCoords(x-1, y)
                if (x !== this._mapGrid.mapWidth-1) this.placePixelCoords(x+1, y)
            }
            this.placePixelCoords(x, y)
        } else if (brush === B.BIG_DOT) {
            if (x) this.placePixelCoords(x-2, y)
            if (x !== this._mapGrid.mapWidth-2) this.placePixelCoords(x+2, y)
                this.placePixelCoords(x, y-2)
                this.placePixelCoords(x, y+2)
                this.fillArea([x-1,y-1], [x+1,y+1])
        } else if (brush & Simulation.#BRUSH_GROUPS.X) {
            const offset = (Simulation.#BRUSHES_X_VALUES[brush]/2)|0
            this.fillArea([x-offset,y-offset], [x+offset,y+offset])
        }
    }

    /**
     * Fills the map with air
     */
    clear() {
        this.fill(Simulation.MATERIALS.AIR)
    }

    /**
     * Fills the entire map with a specific material
     * @param {Simulation.MATERIALS} material The material used
     */
    fill(material=Simulation.MATERIALS.AIR) {
        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.fill(material))
            return
        }

        const pixels = this._pixels, lastPixels = this._lastPixels, p_ll = pixels.length
        lastPixels.set(new Uint16Array(p_ll).subarray(0, lastPixels.length).fill(material+1))
        pixels.set(new Uint16Array(p_ll).fill(material))
        if (!this._isRunning) this.updateImgMapFromPixels()
    }

    /**
     * Fills the specified area of the map with a specific material
     * @param {[leftX, topY]} pos1 The top-left pos of the area
     * @param {[rightX, bottomY]} pos2 The bottom-right pos of the area
     * @param {Simulation.MATERIALS} material The material used
     */
    fillArea(pos1, pos2, material=this._selectedMaterial) {
        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.fillArea(pos1, pos2, material))
            return
        }

        const pixels = this._pixels, p_ll = pixels.length, map = this._mapGrid, w = map.mapWidth, [x1, y1] = pos1, [x2, y2] = pos2 
        for (let i=0;i<p_ll;i++) {
            const y = (i/w)|0, x = i-y*w
            if (x>=x1 && x<=x2 && y>=y1 && y<=y2) this.placePixelCoords(x, y, material)// TODO OPTIMIZE
        }            
        if (!this._isRunning) this.updateImgMapFromPixels()
    }
    /* PIXEL EDIT -end */

    
    /* SAVE / IMPORT / EXPORT */
    /**
     * Returns a copy of the current pixels array 
     * @returns A Uint16Array
     */
    #getPixelsCopy() {
        const arraySize = this._mapGrid.arraySize, pixelsCopy = new Uint16Array(arraySize)
        pixelsCopy.set(this._pixels.subarray(0, arraySize))
        return pixelsCopy
    }

    /**
     * Fills the map with saved data
     * @param {Uint16Array | String | Object} mapData The save data:
     * - Either a Uint16Array containing the material value for each index
     * - Or a string in the format created by the function exportAsText()
     * - Or an Object containing the material value for each index {"index": material}
     * @param {[width, height]} saveDimensions Specifies the save data dimensions when mapData is of Uint16Array type (leave undefined, used internally)
     */
    load(mapData, saveDimensions=null) {
        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.load(mapData, saveDimensions))
            return
        }

        if (mapData) {
            if (mapData instanceof Uint16Array) this.#updatePixelsFromSize(saveDimensions[0], saveDimensions[1], this._mapGrid.mapWidth, this._mapGrid.mapHeight, mapData)
            else if (typeof mapData === "string") {
                const [exportType, rawSize, rawData] = mapData.split(Simulation.EXPORT_SEPARATOR), data = rawData.split(","), [saveWidth, saveHeight] = rawSize.split(",").map(x=>+x)
                let savePixels = null
                if (exportType==Simulation.EXPORT_STATES.RAW) savePixels = new Uint16Array(data)
                else if (exportType==Simulation.EXPORT_STATES.COMPACTED) {
                    let m_ll = data.length, offset = 0 
                    savePixels = new Uint16Array(saveWidth*saveHeight)
                    for (let i=0;i<m_ll;i+=2) {
                        const count = data[i+1]
                        savePixels.set(new Uint16Array(count).fill(data[i]), offset)
                        offset += +count
                    }
                }
                this.#updatePixelsFromSize(saveWidth, saveHeight, this._mapGrid.mapWidth, this._mapGrid.mapHeight, savePixels)
            } else this._pixels = new Uint16Array(Object.values(mapData))
            this.updateImgMapFromPixels()
        }
    }

    /**
     * Exports/saves the current pixels array as text
     * @param {Boolean} disableCompacting Whether to disable the text compacting (not recommended for large maps)
     * @param {Function?} callback If using web workers, use this callback to retrieve the return value (stringValue)=>{...}
     * @returns A string representing the current map
     */
    exportAsText(disableCompacting, callback) {
        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>callback&&callback(this.exportAsText(disableCompacting)))
            return
        }

        let pixels = this._pixels, p_ll = pixels.length, state = Simulation.EXPORT_STATES.COMPACTED, textResult = ""
        if (disableCompacting) {
            state = Simulation.EXPORT_STATES.RAW
            textResult += pixels.toString()
        } else {
            let lastMaterial, atI = -1
            textResult = []
            for (let i=0;i<p_ll;i++) {
                const mat = pixels[i]
                if (lastMaterial === mat) textResult[atI][1]++
                else textResult[++atI] = [mat, 1]
                lastMaterial = mat
            }
            textResult = textResult.toString()
        }

        return state+Simulation.EXPORT_SEPARATOR+this._mapGrid.dimensions+","+this._mapGrid.pixelSize+Simulation.EXPORT_SEPARATOR+textResult
    }
    /* SAVE / IMPORT / EXPORT -end */

    /* TEMP PERFORMANCE BENCHES */
    PERF_TEST_FUN() {
        this.updateMapPixelSize(2)
        this.updateMapSize(400, 300)
        this.fill(Simulation.MATERIALS.AIR)
    }

    PERF_TEST_FULL_WATER_REG() {
        this._userSettings.showGrid = false
        this.updateMapPixelSize(1)
        this.updateMapSize(700, 600)
        this.fill(Simulation.MATERIALS.WATER)
    }

    PERF_TEST_FULL_WATER_HIGH() {
        this._userSettings.showGrid = false
        this.updateMapPixelSize(1)
        this.updateMapSize(1000, 1000)
        this.fill(Simulation.MATERIALS.WATER)
    }
    /* TEMP PERFORMANCE BENCHES -end */

    get CVS() {return this._CVS}
    get render() {return this._CVS._render}
    get ctx() {return this._CVS._ctx}
    get mouse() {return this._CVS.mouse}
    get keyboard() {return this._CVS.keyboard}
	get mapGrid() {return this._mapGrid}
	get loopExtra() {return this._loopExtra}
	get stepExtra() {return this._stepExtra}
	get lastPixels() {return this._lastPixels}
	get pixels() {return this._pixels}
	get mapGridRenderStyles() {return this._mapGridRenderStyles}
	get imgMap() {return this._imgMap}
    get isMouseWithinSimulation() {return this._isMouseWithinSimulation}
	get selectedMaterial() {return this._selectedMaterial}
    get sidePriority() {return this._sidePriority}
    get isRunning() {return this._isRunning}
	get backStepSavingMaxCount() {return this._backStepSavingMaxCount}
	get backStepSaves() {return this._backStepSaves}
    get brushType() {return this._brushType}
	get userSettings() {return this._userSettings}

    get backStepSavingEnabled() {return Boolean(this._backStepSavingMaxCount)}
    get useLocalPhysics() {return this._physicsUnit instanceof LocalPhysicsUnit}
    get usesWebWorkers() {return !(this._physicsUnit instanceof LocalPhysicsUnit)}
    get fileServed() {return location.href.startsWith("file")}
	get showGrid() {return this._userSettings.showGrid}
	get showBorder() {return this._userSettings.showBorder}
	get smoothDrawingEnabled() {return this._userSettings.smoothDrawingEnabled}
	get visualEffectsEnabled() {return this._userSettings.visualEffectsEnabled}
    
	set loopExtra(_loopExtra) {this._loopExtra = _loopExtra}
	set stepExtra(stepExtra) {this._stepExtra = stepExtra}
	set selectedMaterial(_selectedMaterial) {this._selectedMaterial = _selectedMaterial}
	set isRunning(isRunning) {this._isRunning = isRunning}
	set brushType(brushType) {this._brushType = brushType}
	set sidePriority(sidePriority) {return this.updateSidePriority(sidePriority)}
	set backStepSavingMaxCount(_backStepSavingMaxCount) {this._backStepSavingMaxCount = _backStepSavingMaxCount}
	set mapGridRenderStyles(_mapGridRenderStyles) {this._mapGridRenderStyles = _mapGridRenderStyles}
    set showGrid(showGrid) {this._userSettings.showGrid = showGrid}
    set showBorder(showBorder) {this._userSettings.showBorder = showBorder}
    set smoothDrawingEnabled(smoothDrawingEnabled) {this._userSettings.smoothDrawingEnabled = smoothDrawingEnabled}
    set visualEffectsEnabled(visualEffectsEnabled) {this._userSettings.visualEffectsEnabled = visualEffectsEnabled}
}