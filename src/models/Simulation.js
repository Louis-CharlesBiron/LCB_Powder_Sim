class Simulation {
    static MATERIALS = SETTINGS.MATERIALS
    static MATERIAL_GROUPS = SETTINGS.MATERIAL_GROUPS
    static MATERIAL_NAMES = SETTINGS.MATERIAL_NAMES
    static MATERIAL_STATES = SETTINGS.MATERIAL_STATES
    static MATERIAL_STATES_GROUPS = SETTINGS.MATERIAL_STATES_GROUPS
    static D = SETTINGS.D
    static SIDE_PRIORITIES = SETTINGS.SIDE_PRIORITIES
    static SIDE_PRIORITY_NAMES = SETTINGS.SIDE_PRIORITY_NAMES
    static EXPORT_STATES = SETTINGS.EXPORT_STATES
    static EXPORT_SEPARATOR = SETTINGS.EXPORT_SEPARATOR
    static BRUSH_TYPES = SETTINGS.BRUSH_TYPES
    static BRUSH_TYPE_NAMES = SETTINGS.BRUSH_TYPE_NAMES
    static #BRUSHES_X_VALUES = SETTINGS.BRUSHES_X_VALUES
    static #BRUSH_GROUPS = SETTINGS.BRUSH_GROUPS
    static #WORKER_RELATIVE_PATH = SETTINGS.WORKER_RELATIVE_PATH
    static #WORKER_MESSAGE_TYPES = SETTINGS.WORKER_MESSAGE_TYPES
    static #WORKER_MESSAGE_GROUPS = SETTINGS.WORKER_MESSAGE_GROUPS
    static PHYSICS_UNIT_TYPE = SETTINGS.PHYSICS_UNIT_TYPE
    static #INIT_STATES = SETTINGS.INITIALIZED_STATES
    // CACHES
    static #CACHED_MATERIALS_ROWS = []
    static #CACHED_GRID_LINES = null
    static #CACHED_GRID_BORDER = null
    // DEFAULTS
    static DEFAULT_PHYSICS_UNIT_TYPE = Simulation.PHYSICS_UNIT_TYPE.WORKER
    static DEFAULT_MATERIAL = Simulation.MATERIALS.SAND
    static DEFAULT_BRUSH_TYPE = Simulation.BRUSH_TYPES.PIXEL
    static DEFAULT_BACK_STEP_SAVING_COUNT = SETTINGS.DEFAULT_BACK_STEP_SAVING_COUNT
    static DEFAULT_USER_SETTINGS = SETTINGS.DEFAULT_USER_SETTINGS
    static DEFAULT_COLOR_SETTINGS = SETTINGS.DEFAULT_COLOR_SETTINGS
    static DEFAULT_AUTO_START_VALUE = true
    static MIN_ZOOM_THRESHOLD = .1
    static MAX_ZOOM_THRESHOLD = Infinity
    static ZOOM_IN_INCREMENT = .25
    static ZOOM_OUT_INCREMENT = -.2
    static DEFAULT_KEYBINDS = DEFAULT_KEYBINDS

    #simulationHasPixelsBuffer = true
    #lastPlacedPos = null

    /**
     * The core of the simulation and manages all rendering and world manipulation. (except for physics)
     * @param {Canvas} CVS A CDEJS Canvas instance
     * @param {Function?} readyCB A callback ran once the simulation is started. (simulation)=>{}
     * @param {Boolean?} autoStart Whether the simulation automatically starts once instanciated. (Defaults to true)
     * @param {Boolean?} usesWebWorkers Whether the physics calculations are offloaded to a worker thread. (Defaults to true)
     * @param {Object?} userSettings An object defining the user settings
     * @param {Object?} colorSettings An object defining the color settings
     */
    constructor(CVS, readyCB, autoStart, usesWebWorkers, userSettings, colorSettings) {// TODO GET/SET
        autoStart??=Simulation.DEFAULT_AUTO_START_VALUE
        usesWebWorkers??=Simulation.DEFAULT_PHYSICS_UNIT_TYPE

        // SIMULATION
        this._initialized = autoStart ? Simulation.#INIT_STATES.NOT_INITIALIZED : Simulation.#INIT_STATES.INITIALIZED
        this._CVS = CVS
        this._mapGrid = new MapGrid()
        this._pixels = new Uint16Array(this._mapGrid.arraySize)
        this._lastPixels = new Uint16Array(this._mapGrid.arraySize)
        this._pxStepUpdated = new Uint8Array(this._mapGrid.arraySize)
        this._pxStates = new Uint8Array(this._mapGrid.arraySize)
        this._backStepSavingMaxCount = Simulation.DEFAULT_BACK_STEP_SAVING_COUNT
        this._backStepSaves = []
        this._isMouseWithinSimulation = true
        this._isRunning = false
        this._selectedMaterial = Simulation.MATERIALS.SAND
        this._sidePriority = Simulation.SIDE_PRIORITIES.RANDOM
        this._lastStepTime = null
        this._queuedBufferOperations = []
        this.updatePhysicsUnitType(usesWebWorkers)

        // DISPLAY
        this._userSettings = this.getAdjustedSettings(userSettings, Simulation.DEFAULT_USER_SETTINGS)
        this._colorSettings = this.getAdjustedSettings(colorSettings, Simulation.DEFAULT_COLOR_SETTINGS)
        this._brushType = Simulation.BRUSH_TYPES.PIXEL
        this._mapGridRenderStyles = CVS.render.profile1.update(this._colorSettings.grid, null, null, null, 1)
        this._mapBorderRenderStyles = CVS.render.profile2.update(this._colorSettings.border, null, null, null, 2)
        this._imgMap = CVS.ctx.createImageData(...this._mapGrid.realDimensions)
        this._offscreenCanvas = new OffscreenCanvas(...this._mapGrid.realDimensions)
        this._offscreenCtx = this._offscreenCanvas.getContext("2d")
        this._loopExtra = null
        this._stepExtra = null
        this.#updateCachedGridDisplays()
        this.#updateCachedMapPixelsRows()
        this.#setCanvasZoomAndDrag()
        this.setKeyBinds()
        
        // CANVAS
        CVS.loopingCB = this.#main.bind(this)
        CVS.setMouseMove()
        CVS.setMouseLeave()
        CVS.setMouseDown(this.#mouseDown.bind(this))
        CVS.setMouseUp(this.#mouseUp.bind(this))
        CVS.setKeyUp(null, true)
        CVS.setKeyDown(null, true)
        CVS.start()
        this._mouseListenerIds = [
            CVS.mouse.addListener([[0,0], this._mapGrid.realDimensions], Mouse.LISTENER_TYPES.ENTER, ()=>this._isMouseWithinSimulation = true),
            CVS.mouse.addListener([[0,0], this._mapGrid.realDimensions], Mouse.LISTENER_TYPES.MOVE, ()=>this._isMouseWithinSimulation = true),
            CVS.mouse.addListener([[0,0], this._mapGrid.realDimensions], Mouse.LISTENER_TYPES.LEAVE, ()=>this.#mouseLeaveSimulation())
        ]

        if (typeof readyCB === "function") {
            this._initialized = Simulation.#INIT_STATES.READY
            readyCB(this)
            this._initialized = Simulation.#INIT_STATES.NOT_INITIALIZED
        }
        if (autoStart) this.start()
    }

    /* RENDERING */
    /**
     * The main display and physics loop
     * @param {Number} deltaTime The deltaTime
     */
    #main(deltaTime) {
        const mouse = this.mouse, settings = this._userSettings, loopExtra = this._loopExtra

        if (loopExtra) loopExtra(deltaTime)

        if (mouse.clicked && !this.keyboard.isDown(TypingDevice.KEYS.SHIFT)) this.#placePixelFromMouse(mouse)
        
        if (settings.showGrid) this.#drawMapGrid()
        if (settings.showBorder) this.#drawBorder()

        if (this._isRunning && this.useLocalPhysics) this.step()

        this._offscreenCtx.putImageData(this._imgMap, 0, 0)
        this.ctx.drawImage(this._offscreenCanvas, 0, 0)
        if (settings.visualEffectsEnabled) this.#drawVisualEffects()
    }

    /**
     * Draws visual effects on certain materials if visualEffects are enabled 
     */
    #drawVisualEffects() {// OPTIMIZE / TODO
        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.#drawVisualEffects())
            return
        }

        const pixels = this._pixels, p_ll = pixels.length, pxStates = this._pxStates, map = this._mapGrid, M = Simulation.MATERIALS, G = Simulation.MATERIAL_GROUPS, SG = Simulation.MATERIAL_STATES_GROUPS, D = Simulation.D,
              w = map.mapWidth, pxSize = map.pixelSize, pxSize2 = pxSize/4, random = Math.random(), batchStroke = this.render.batchStroke.bind(this.render), batchFill = this.render.batchFill.bind(this.render)

        for (let i=0;i<p_ll;i++) {
            const mat = pixels[i]
            if ((mat&G.HAS_VISUAL_EFFECTS) === 0) continue

            const py = (i/w)|0, x = (i-py*w)*pxSize, y = py*pxSize, state = pxStates[i]

            // ELECTRICITY
            if (mat === M.ELECTRICITY) batchFill(Render.getPositionsRect([x-pxSize2,y-pxSize2], [x+pxSize+pxSize2,y+pxSize+pxSize2]), [255,235,0,0.45*random])
            // COPPER
            else if (mat === M.COPPER && state === Simulation.MATERIAL_STATES.COPPER.LIT) batchFill(Render.getPositionsRect([x-pxSize2,y-pxSize2], [x+pxSize+pxSize2,y+pxSize+pxSize2]), [255,235,0,0.35*random])
            else if (mat === M.COPPER && state === Simulation.MATERIAL_STATES.COPPER.ORIGIN) batchFill(Render.getPositionsRect([x-pxSize2,y-pxSize2], [x+pxSize+pxSize2,y+pxSize+pxSize2]), [255,235,220,0.4])
            else if (mat === M.COPPER && state === Simulation.MATERIAL_STATES.COPPER.DISABLED) batchFill(Render.getPositionsRect([x-pxSize2,y-pxSize2], [x+pxSize+pxSize2,y+pxSize+pxSize2]), [0,0,220,0.3])
        }  
    }

    // Draws lines to show the map grid on the canvas
    #drawMapGrid() {
        const lines = Simulation.#CACHED_GRID_LINES, l_ll = lines.length, batchStroke = this.render.batchStroke.bind(this.render), styles = this._mapGridRenderStyles
        for (let i=0;i<l_ll;i++) batchStroke(lines[i], styles)
    }

    // Draws a border to show the map bounding box on the canvas
    #drawBorder() {
        this.render.batchStroke(Simulation.#CACHED_GRID_BORDER, this._mapBorderRenderStyles)
    }

    /**
     * Updates the display image map according to the pixels array (renders a frame)
     * @param {Boolean?} force If true, disables optimization and forces every pixel to get redrawn
     */
    updateImgMapFromPixels(force) {
        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.updateImgMapFromPixels(force))
            return
        }

        const pixels = this._pixels, lastPixels = this._lastPixels, p_ll = pixels.length, map = this._mapGrid, enableOptimization = force ? false : lastPixels.length===p_ll&&map.lastPixelSize===map.pixelSize, w = map.mapWidth
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
     * @param {Boolean} force If true, forces the start even if simulation is already running
     */
    start(force) {
        if (this._initialized !== Simulation.#INIT_STATES.INITIALIZED) setTimeout(()=>this._initialized = Simulation.#INIT_STATES.INITIALIZED)
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
    

    /* SIMULATION API */
    /**
     * Updates whether the physics calculations are offloaded to a worker thread 
     * @param {Boolean} usesWebWorkers Whether an other thread is used. (Defaults to true)
     */
    updatePhysicsUnitType(usesWebWorkers=true) {
        if (this.#checkInitializationState(SETTINGS.NOT_INITIALIZED_PHYSICS_TYPE_WARN)) return

        const isWebWorker = usesWebWorkers&&!this.isFileServed
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
        else if (usesWebWorkers && this.isFileServed) this.#warn(SETTINGS.FILE_SERVED_WARN)
    }

    /**
     * Updates the map pixel size
     * @param {Number?} pixelSize The new map pixel size
     */
    updateMapPixelSize(pixelSize=MapGrid.DEFAULT_PIXEL_SIZE) {
        if (this.#checkInitializationState(SETTINGS.NOT_INITIALIZED_PIXEL_SIZE_WARN)) return

        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.updateMapPixelSize(pixelSize))
            return
        }

        const map = this._mapGrid
        if (pixelSize !== map.pixelSize) {
            map.pixelSize = pixelSize
            this._imgMap = CVS.ctx.createImageData(...map.realDimensions)
            this._offscreenCanvas.width = map.realDimensions[0]
            this._offscreenCanvas.height = map.realDimensions[1]
            this.#updateCachedMapPixelsRows()
            this.#updateCachedGridDisplays()
            this.updateImgMapFromPixels()

            this.#updateMouseListeners()
        }
    }

    /**
     * Updates the map dimensions
     * @param {Number?} width The new width of the map, in local pixels
     * @param {Number?} height The new height of the map, in local pixels
     */
    updateMapSize(width, height) {
        if (this.#checkInitializationState(SETTINGS.NOT_INITIALIZED_MAP_SIZE_WARN)) return

        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.updateMapSize(width, height))
            return
        }

        const map = this._mapGrid, oldWidth = map.mapWidth, oldHeight = map.mapHeight
            if ((width && width !== oldWidth) || (height && height !== oldHeight)) {
            const oldPixels = this.#getPixelsCopy()
            height = map.mapHeight = height||map.mapHeight
            width = map.mapWidth = width||map.mapWidth
            this.#updatePixelsFromSize(oldWidth, oldHeight, width, height, oldPixels)
            this.#updateCachedGridDisplays()

            this._imgMap = CVS.ctx.createImageData(...map.realDimensions)
            this._offscreenCanvas.width = map.realDimensions[0]
            this._offscreenCanvas.height = map.realDimensions[1]
            this.updateImgMapFromPixels()

            this.#updateMouseListeners()
        }
    }

    /**
     * Updates the side prioritised first by the physics.
     * @param {Simulation.SIDE_PRIORITIES} sidePriority The side priority value
     * @returns The new priority
     */
    updateSidePriority(sidePriority) {
        if (this.usesWebWorkers) this._physicsUnit.postMessage({type:Simulation.#WORKER_MESSAGE_TYPES.SIDE_PRIORITY, sidePriority})
        return this._sidePriority = sidePriority
    }

    /**
     * Returns the material at the provided local pos
     * @param {[x,y]} mapPos The map pos
     * @returns The material location at the map pos
     */
    getPixelAtMapPos(mapPos) {
        const i = this._mapGrid.mapPosToIndex(mapPos)
        return this.usesWebWorkers ? this._lastPixels[i] : this._pixels[i]
    }

    /**
     * Updates the material used by default for world manipulations.
     * @param {Simulation.MATERIALS} material The materials to select
     */
    updateSelectedMaterial(material) {
        material = +material
        if (Simulation.MATERIAL_NAMES[material]) return this._selectedMaterial = material
        return this._selectedMaterial
    }

    /**
     * Updates the shape used to draw materials on the simulation with mouse.
     * @param {Simulation.BRUSH_TYPES} brushType The brush type to use 
     */
    updateBrushType(brushType) {
        brushType = +brushType
        if (Object.values(Simulation.BRUSH_TYPES).includes(brushType)) return this._brushType = brushType
        return this._brushType
    }

    /**
     * Updates the colors used for the grid and/or the materials.
     * @param {Object} colorSettings The colors to update. (Materials keys need to be in UPPERCASE)
     */
    updateColors(colorSettings) {
        this._colorSettings = this.getAdjustedSettings(colorSettings, this._colorSettings)

        if (colorSettings.grid) this._mapGridRenderStyles.update(this._colorSettings.grid)
        if (colorSettings.border) this._mapBorderRenderStyles.update(this._colorSettings.border)

        this.#updateCachedMapPixelsRows()
        this.updateImgMapFromPixels(true)
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

    /**
     * Merges a modification object and a base object
     * @param {Object} inputSettings The object with modifications
     * @param {Object} defaultSettings The object to update
     * @returns The merged object
     */
    getAdjustedSettings(inputSettings, defaultSettings) {
        const newSettings = {...defaultSettings}
        if (inputSettings) Object.entries(inputSettings).forEach(([key, value])=>newSettings[key] = value)
        return newSettings
    }

    /**
     * Check whether the simulation is initialized
     * @param {String} warningMessage Warning message to log if no initialized
     * @returns True if the simulation is NOT initialized
     */
    #checkInitializationState(warningMessage) {
        if (this._userSettings && this._initialized === Simulation.#INIT_STATES.NOT_INITIALIZED) {
            this.#warn(warningMessage)
            return true
        }
    }

    /**
     * Logs a warning messages if warnings are enabled
     * @param {String} warningMessage Warning message to log
     */
    #warn(warningMessage) {
        if (!this.warningsDisabled) console.warn(warningMessage)
    }
    /* SIMULATION API -end */

    /* WEB WORKER CONTROL */
    // Listener for web worker messages
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

    /**
     * Sends a command of a certain type to the worker, needing pixels 
     * @param {Simulation.#WORKER_MESSAGE_TYPES} type The worker message type
     */
    #sendPixelsToWorker(type) {
        const pixels = this._pixels, pxStates = this._pxStates
        this.saveStep()
        if (this.usesWebWorkers) this._physicsUnit.postMessage({type, pixels, pxStates}, [pixels.buffer, pxStates.buffer])
        else this.#simulationHasPixelsBuffer = true
    }

    // Executes queued operations
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
        const colors = Object.entries(this._colorSettings).filter(x=>x[0].toUpperCase()===x[0]).map(x=>x[1]), c_ll = colors.length, size = this._mapGrid.pixelSize*4, R = Simulation.#CACHED_MATERIALS_ROWS
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

    // Updates cached lines / borders paths
    #updateCachedGridDisplays() {
        Simulation.#CACHED_GRID_LINES = this._mapGrid.getDrawableGridLines()
        Simulation.#CACHED_GRID_BORDER = Render.getRect([0,0], ...this._mapGrid.realDimensions)
    }

    // Updates current mouse listeners area
    #updateMouseListeners() {
        const mouse = this.mouse, dimensions = this._mapGrid.realDimensions
        mouse.updateListener(Mouse.LISTENER_TYPES.ENTER, this._mouseListenerIds[0], [[0,0], dimensions])
        mouse.updateListener(Mouse.LISTENER_TYPES.MOVE,  this._mouseListenerIds[1], [[0,0], dimensions])
        mouse.updateListener(Mouse.LISTENER_TYPES.LEAVE, this._mouseListenerIds[2], [[0,0], dimensions])
    }
    /* CACHE UPADTES -end */

    /* USER INPUT */
    /**
     * Creates functional keybinds
     * @param {Object} keybinds The keybinds to set (Defaults to Simulation.DEFAULT_KEYBINDS)
     */
    setKeyBinds(keybinds=Simulation.DEFAULT_KEYBINDS) {
        const keyboard = this._CVS.typingDevice, DOWN = TypingDevice.LISTENER_TYPES.DOWN

        // SET DEFAULTS
        Object.entries(keybinds).filter(bind=>bind[1].defaultFunction).forEach(([bindName, bindValue])=>{
            const {defaultFunction, defaultParams, keys, triggerType} = bindValue
            keyboard.addListener(DOWN, keys, (keyboard, e)=>this.#keybindTryAction(keyboard, e, ()=>this[defaultFunction](...(defaultParams||[])), bindValue), triggerType)
        })

        if (keybinds.MY_CUSTOM_SIZE_KEYBIND) keyboard.addListener(DOWN, keybinds.MY_CUSTOM_SIZE_KEYBIND.keys, (keyboard, e)=>this.#keybindTryAction(keyboard, e, ()=>{
            this.updateMapSize(48, 38)
            this.updateMapPixelSize(18)
        }, keybinds.MY_CUSTOM_SIZE_KEYBIND), keybinds.MY_CUSTOM_SIZE_KEYBIND.triggerType)
    }

    // Utils function to check if keybind's conditions are met before executing the action
    #keybindTryAction(typingDevice, e, actionCB, bindValue) {
        const hasAction = CDEUtils.isFunction(actionCB), {requiredKeys, cancelKeys, preventDefault} = bindValue
        if (preventDefault && e.target.value === undefined) e.preventDefault()
        if (!hasAction) {
            this.#warn(SETTINGS.STANDALONE_KEYBIND_WARN)
            return
        }
        if ((!requiredKeys || typingDevice.isDown(requiredKeys)) && (!cancelKeys || !typingDevice.isDown(cancelKeys))) actionCB.bind(this)()
    }

    // mouseDown listener, allows the mouse to place pixels
    #mouseDown(mouse) {
        if (!mouse.rightClicked) this.#placePixelFromMouse(mouse)
    }

    // mouseUp listener, disables smooth drawing when mouse is unpressed
    #mouseUp() {
        this.#lastPlacedPos = null
    }

    // Runs when the mouse leaves the simulation's bounding box
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

            if (this.smoothDrawingEnabled && dMax) for (let i=0;i<dMax;i++) {
                const prog = ((i+1)/dMax)
                this.placePixelsWithBrush(ix+(dx*prog)|0, iy+(dy*prog)|0)
            } 
            else this.placePixelsWithBrush(x, y)

            this.#lastPlacedPos = mapPos
            if (!this._isRunning) this.updateImgMapFromPixels()
        }
    }

    #zoomTowardsPos(pos,  zoomDirection) {
        const newZoom = this._CVS.zoom + (zoomDirection<0 ? Simulation.ZOOM_IN_INCREMENT : Simulation.ZOOM_OUT_INCREMENT)
        if (newZoom > Simulation.MIN_ZOOM_THRESHOLD && newZoom < Simulation.MAX_ZOOM_THRESHOLD) {
            this._CVS.zoomAtPos(pos, newZoom)
            return pos
        }  else return false
    }

    // Adds the ability do zoom/move around the canvas (if dragAndZoomCanvasEnabled)
    #setCanvasZoomAndDrag() {
        const CVS = this._CVS

        Canvas.preventNativeZoom((dir, isMouse)=>{
            if (this.dragAndZoomCanvasEnabled && !isMouse) this.#zoomTowardsPos(CVS.getCenter(), dir)
        })

        if (this.dragAndZoomCanvasEnabled) {
            const frame = CVS.frame, mouse = CVS.mouse
            let isCameraMoving = false, lastDragPos = [0,0]

            frame.addEventListener("wheel", e=>{
                if (this.dragAndZoomCanvasEnabled) {
                    if (this.#zoomTowardsPos(mouse.rawPos, e.deltaY)) lastDragPos = [...mouse.rawPos]
                }
            })

            frame.addEventListener("mousedown", e=>{
                if (this.dragAndZoomCanvasEnabled) {
                    if (e.button === Mouse.BUTTON_TYPES.RIGHT) {
                        isCameraMoving = true
                        lastDragPos = [e.clientX, e.clientY]
                    }
                    else if (e.button === Mouse.BUTTON_TYPES.MIDDLE) CVS.resetTransformations(true)
                }
            })

            frame.addEventListener("mousemove", e=>{
                if (this.dragAndZoomCanvasEnabled && isCameraMoving) {
                    const {clientX, clientY} = e, [vx, vy] = CVS.viewPos, dx = clientX-lastDragPos[0], dy = clientY-lastDragPos[1]
                    CVS.moveViewAt([vx+dx, vy+dy])
                    lastDragPos = [clientX, clientY]
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
    /* USER INPUT -end */

    /* PIXEL EDIT */
    /**
     * Places a pixel of a specified material at the specified position on the pixel map.
     * @param {[x,y]} mapPos The map position of the pixel
     * @param {Simulation.MATERIALS} material The material used to draw the pixel
     */
    placePixel(mapPos, material=this._selectedMaterial) {
        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.placePixel(mapPos, material))
            return
        }

        const i = this._mapGrid.mapPosToIndex(mapPos)
        this._pixels[i] = material
        this._pxStates[i] = 0
    }

    /**
     * Places a pixel of a specified material at the specified position on the pixel map.
     * @param {Number} x The X value of the pixel on the map
     * @param {Number} y The Y value of the pixel on the map
     * @param {Simulation.MATERIALS} material The material used to draw the pixel
     */
    placePixelAtCoords(x, y, material=this._selectedMaterial) {
        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.placePixelAtCoords(x, y, material))
            return
        }

        const i = this._mapGrid.mapPosToIndexCoords(x, y)
        this._pixels[i] = material
        this._pxStates[i] = 0
    }

    /**
     * Places a pixel of a specified material at the specified index on the pixel map.
     * @param {Number} i The index value of the pixel on the map
     * @param {Simulation.MATERIALS} material The material used to draw the pixel
     */
    placePixelAtIndex(i, material=this._selectedMaterial) {
        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.placePixelAtIndex(i, material))
            return
        }

        this._pixels[i] = material
        this._pxStates[i] = 0
    }

    /**
     * Places pixels at the specified coordinates, according to the provided brush pattern
     * @param {Number} x The X value of the center positions
     * @param {Number} y The Y value of the center positions
     * @param {Simulation.BRUSH_TYPES?} brushType The brush type used (Defaults to the current brush type)
     */
    placePixelsWithBrush(x, y, brushType=this._brushType) {
        const B = Simulation.BRUSH_TYPES
        if (brushType & Simulation.#BRUSH_GROUPS.SMALL_OPTIMIZED) {
            if (brushType === B.LINE3 || brushType === B.VERTICAL_CROSS) this.fillArea([x,y-1], [x,y+1])
            if (brushType === B.ROW3 || brushType === B.VERTICAL_CROSS) {
                if (x) this.placePixelAtCoords(x-1, y)
                if (x !== this._mapGrid.mapWidth-1) this.placePixelAtCoords(x+1, y)
            }
            this.placePixelAtCoords(x, y)
        } else if (brushType === B.BIG_DOT) {
            if (x-2 >= 0) this.placePixelAtCoords(x-2, y)
            if (x+2 < this._mapGrid.mapWidth) this.placePixelAtCoords(x+2, y)
                this.placePixelAtCoords(x, y-2)
                this.placePixelAtCoords(x, y+2)
                this.fillArea([x-1,y-1], [x+1,y+1])
        } else if (brushType & Simulation.#BRUSH_GROUPS.X) {
            const offset = (Simulation.#BRUSHES_X_VALUES[brushType]/2)|0
            this.fillArea([x-offset,y-offset], [x+offset,y+offset])
        }
    }

    /**
     * Fills the map with air.
     */
    clear() {
        this.fill(Simulation.MATERIALS.AIR)
    }

    /**
     * Fills the entire map with a specific material.
     * @param {Simulation.MATERIALS} material The material used
     */
    fill(material=this._selectedMaterial) {
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
     * Fills the specified area of the map with a specific material.
     * @param {[leftX, topY]} pos1 The top-left pos of the area
     * @param {[rightX, bottomY]} pos2 The bottom-right pos of the area
     * @param {Simulation.MATERIALS} material The material used
     */
    fillArea(pos1, pos2, material=this._selectedMaterial) {
        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.fillArea(pos1, pos2, material))
            return
        }

        const pixels = this._pixels, p_ll = pixels.length, map = this._mapGrid, w = map.mapWidth, x1 = pos1[0]<0?0:pos1[0], y1 = pos1[1]<0?0:pos1[1], x2 = pos2[0]<0?0:pos2[0], y2 = pos2[1]<0?0:pos2[1]
        for (let i=map.mapPosToIndex([x1, y1]);i<p_ll;i++) {
            let y = (i/w)|0, x = i-y*w, isXPassed = x>x2, isYPassed = y>y2, isXLooping = x<x1, isYLooping = y<y1
            if (isXPassed && !isYPassed) {
                i += w-(x2-x1+2)+1
                y = (i/w)|0
                x = i-y*w
                isXPassed = x>x2
                isYPassed = y>y2
                isXLooping = x<x1
                isYLooping = y<y1
            }
            if (isXLooping) {
                i += x1
                x = i-y*w
                isXPassed = x>x2
                isXLooping = x<x1
            }
            if (isYPassed) break
            this.placePixelAtIndex(i, material)
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
     * Fills the map with saved data.
     * @param {Uint16Array | String | Object} mapData The save data:
     * - Either a Uint16Array containing the material value for each index
     * - Or a string in the format created by the function exportAsText()
     * - Or an Object containing the material value for each index {"index": material}
     * @param {Boolean? | [width, height]?} useSaveSizes Whether to resize the map size and pixel size to the save's values (Also used internally to specify the save data dimensions when mapData is of Uint16Array type)
     */
    load(mapData, useSaveSizes=null) {
        if (this.#checkInitializationState(SETTINGS.NOT_INITIALIZED_LOAD_WARN)) return

        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.load(mapData, useSaveSizes))
            return
        }

        if (mapData) {
            if (mapData instanceof Uint16Array) this.#updatePixelsFromSize(useSaveSizes[0], useSaveSizes[1], this._mapGrid.mapWidth, this._mapGrid.mapHeight, mapData)
            else if (typeof mapData === "string") {
                const [exportType, rawSize, rawData] = mapData.split(Simulation.EXPORT_SEPARATOR), data = rawData.split(","), [saveWidth, saveHeight, pixelSize] = rawSize.split(",").map(x=>+x)
                let savePixels = null

                if (useSaveSizes) {
                    this.updateMapSize(saveWidth, saveHeight)
                    this.updateMapPixelSize(pixelSize)
                }

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
    get isFileServed() {return location.href.startsWith("file")}
	get showGrid() {return this._userSettings.showGrid}
	get showBorder() {return this._userSettings.showBorder}
	get smoothDrawingEnabled() {return this._userSettings.smoothDrawingEnabled}
	get visualEffectsEnabled() {return this._userSettings.visualEffectsEnabled}
	get warningsDisabled() {return this._userSettings.warningsDisabled}
	get dragAndZoomCanvasEnabled() {return this._userSettings.dragAndZoomCanvasEnabled}
    
	set loopExtra(_loopExtra) {this._loopExtra = _loopExtra}
	set stepExtra(stepExtra) {this._stepExtra = stepExtra}
	set selectedMaterial(_selectedMaterial) {return this.updateSelectedMaterial(_selectedMaterial)}
	set isRunning(isRunning) {this._isRunning = isRunning}
	set brushType(brushType) {return this.updateBrushType(brushType)}
	set sidePriority(sidePriority) {return this.updateSidePriority(sidePriority)}
	set backStepSavingMaxCount(_backStepSavingMaxCount) {this._backStepSavingMaxCount = _backStepSavingMaxCount}
	set mapGridRenderStyles(_mapGridRenderStyles) {this._mapGridRenderStyles = _mapGridRenderStyles}
    set showGrid(showGrid) {this._userSettings.showGrid = showGrid}
    set showBorder(showBorder) {this._userSettings.showBorder = showBorder}
    set smoothDrawingEnabled(smoothDrawingEnabled) {this._userSettings.smoothDrawingEnabled = smoothDrawingEnabled}
    set visualEffectsEnabled(visualEffectsEnabled) {this._userSettings.visualEffectsEnabled = visualEffectsEnabled}
    set warningsDisabled(warningsDisabled) {this._userSettings.warningsDisabled = warningsDisabled}
    set dragAndZoomCanvasEnabled(dragAndZoomCanvasEnabled) {
        this._userSettings.dragAndZoomCanvasEnabled = dragAndZoomCanvasEnabled
        if (!dragAndZoomCanvasEnabled) CVS.resetTransformations(true)
    }
}