class Simulation {
    static MATERIALS = SETTINGS.MATERIALS
    static MATERIAL_GROUPS = SETTINGS.MATERIAL_GROUPS
    static MATERIAL_NAMES = SETTINGS.MATERIAL_NAMES
    static MATERIAL_STATES = SETTINGS.MATERIAL_STATES
    static MATERIAL_STATES_GROUPS = SETTINGS.MATERIAL_STATES_GROUPS
    static REPLACE_MODES = SETTINGS.REPLACE_MODES
    static D = SETTINGS.D
    static SIDE_PRIORITIES = SETTINGS.SIDE_PRIORITIES
    static SIDE_PRIORITY_NAMES = SETTINGS.SIDE_PRIORITY_NAMES
    static EXPORT_STATES = SETTINGS.EXPORT_STATES
    static EXPORT_SEPARATOR = SETTINGS.EXPORT_SEPARATOR
    static BRUSH_TYPES = SETTINGS.BRUSH_TYPES
    static BRUSH_TYPE_NAMES = SETTINGS.BRUSH_TYPE_NAMES
    static #BRUSHES_X_VALUES = SETTINGS.BRUSHES_X_VALUES
    static #BRUSH_GROUPS = SETTINGS.BRUSH_GROUPS
    static WORKER_RELATIVE_PATH = SETTINGS.WORKER_RELATIVE_PATH
    static #WORKER_MESSAGE_TYPES = SETTINGS.WORKER_MESSAGE_TYPES
    static #WORKER_MESSAGE_GROUPS = SETTINGS.WORKER_MESSAGE_GROUPS
    static PHYSICS_UNIT_TYPE = SETTINGS.PHYSICS_UNIT_TYPE
    static #INIT_STATES = SETTINGS.INITIALIZED_STATES
    // CACHES
    static #CACHED_MATERIALS_ROWS = []
    static #CACHED_GRID_LINES = null
    static #CACHED_GRID_BORDER = null
    static #PHYSICS_UNIT_INSTANCES = [null, null]
    static #C_GRID_INDEXES = Int32Array
    static #C_GRID_MATERIALS = Uint16Array
    static #C_FLAGS_SMALL = Uint8Array
    static #C_PHYSICS_REGULAR = Float32Array
    static #C_PHYSICS_SMALL = (typeof Float16Array === "undefined" ? Float32Array : Float16Array)
    // DEFAULTS
    static DEFAULT_WORLD_START_SETTINGS = SETTINGS.DEFAULT_WORLD_START_SETTINGS
    static DEFAULT_USER_SETTINGS = SETTINGS.DEFAULT_USER_SETTINGS
    static DEFAULT_PHYSICS_CONFIG = SETTINGS.DEFAULT_PHYSICS_CONFIG
    static DEFAULT_COLOR_SETTINGS = SETTINGS.DEFAULT_COLOR_SETTINGS
    static DEFAULT_MATERIAL = Simulation.MATERIALS.SAND
    static DEFAULT_BRUSH_TYPE = Simulation.BRUSH_TYPES.PIXEL
    static DEFAULT_BACK_STEP_SAVING_COUNT = SETTINGS.DEFAULT_BACK_STEP_SAVING_COUNT
    static DEFAULT_MAP_RESOLUTIONS = SETTINGS.DEFAULT_MAP_RESOLUTIONS
    static DEFAULT_KEYBINDS = DEFAULT_KEYBINDS
    static DEFAULT_PRECISE_PLACE_KEY = TypingDevice.KEYS.SHIFT

    #simulationHasPixelsBuffer = true // Whether the main thread has the pixel buffer when using webworkers
    #lastPlacedPos = null

    /**
     * The core of the simulation and manages all rendering and world manipulation. (except for physics)
     * @param {HTMLCanvasElement | Canvas} canvas A HTML canvas reference or a CDEJS Canvas instance to display the simulation on
     * @param {Function?} readyCB A callback ran once the simulation is started. (simulation)=>{}
     * @param {Object?} worldStartSettings An object defining the simulation settings
     * @param {Object?} userSettings An object defining the user settings
     * @param {Object?} colorSettings An object defining the color settings
     */
    constructor(canvas, readyCB, worldStartSettings, userSettings, physicsConfig, colorSettings) {
        // SIMULATION
        this._CVS = canvas instanceof Canvas ? canvas : new Canvas(canvas)
        this._worldStartSettings = SimUtils.getAdjustedSettings(worldStartSettings, Simulation.DEFAULT_WORLD_START_SETTINGS)
        this._CVS.fpsLimit = this._worldStartSettings.aimedFPS
        this._initialized = this._worldStartSettings.autoStart ? Simulation.#INIT_STATES.NOT_INITIALIZED : Simulation.#INIT_STATES.INITIALIZED
        this._mapGrid = new MapGrid(this._worldStartSettings.mapPixelSize, this._worldStartSettings.mapWidth, this._worldStartSettings.mapHeight)

        //

        /**
         * ADD pixelToAdd
         * i = ++this._indexCount
         * states[i] = pixelToAdd
         * index[pixelToAdd] = i
         */

        /**
         * REMOVE pixelToDel
         * last_i = --this._indexCount
         * states[pixelToDel_i] = states[last_i] 
         * this._indexes[last_i] = pixelToDel_i
         */

        /**
         * CHECK pixel
         * i = this._indexes[pixel]
         * states[i]
         */

        const arrSize = this._mapGrid.arraySize
        this._gridIndexes = new Simulation.#C_GRID_INDEXES(arrSize).fill(-1)// index represents map pos, value! represents _indexStates index (static AND dynamic, but static is -1)

        this._gridMaterials = new Simulation.#C_GRID_MATERIALS(arrSize).fill(Simulation.MATERIALS.AIR)// index represents map pos, value! represents materials (static AND dynamic) | (like old _pixels) 
        this._lastGridMaterials = new Simulation.#C_GRID_MATERIALS(arrSize)// index represents last map pos, value! represents last materials (static AND dynamic) (like old _lastPixels)
       
        this._indexCount = [0] // represents the contiguous number of indexes

        // index represents NOTHING, value represents phycics attribute (ONLY dynamic)
        this._indexFlags = new Simulation.#C_FLAGS_SMALL(arrSize) // (Whether already updated in the current step, ...)
        this._indexPosX = new Simulation.#C_PHYSICS_REGULAR(arrSize)
        this._indexPosY = new Simulation.#C_PHYSICS_REGULAR(arrSize)
        this._indexVelX = new Simulation.#C_PHYSICS_REGULAR(arrSize)
        this._indexVelY = new Simulation.#C_PHYSICS_REGULAR(arrSize)
        this._indexGravity = new Simulation.#C_PHYSICS_SMALL(arrSize)
        this._physicsConfig = SimUtils.getAdjustedSettings(physicsConfig, Simulation.DEFAULT_PHYSICS_CONFIG)

        this._backStepSavingMaxCount = Simulation.DEFAULT_BACK_STEP_SAVING_COUNT
        this._backStepSaves = []
        this._isMouseWithinSimulation = true
        this._isRunning = false
        this._sidePriority = Simulation.SIDE_PRIORITIES.RANDOM
        this._lastStepTime = null
        this._queuedBufferOperations = []
        this.updatePhysicsUnitType(this._worldStartSettings.usesWebWorkers)

        // DISPLAY
        this._userSettings = SimUtils.getAdjustedSettings(userSettings, Simulation.DEFAULT_USER_SETTINGS)
        this._colorSettings = SimUtils.getAdjustedSettings(colorSettings, Simulation.DEFAULT_COLOR_SETTINGS)
        this._selectedMaterial = Simulation.MATERIALS.SAND
        this._brushType = Simulation.BRUSH_TYPES.PIXEL
        this._replaceMode = Simulation.REPLACE_MODES.ALL

        this._mapGridRenderStyles = this._CVS.render.profile1.update(this._colorSettings.grid, null, null, null, 1)
        this._mapBorderRenderStyles = this._CVS.render.profile2.update(this._colorSettings.border, null, null, null, 2)
        this._imgMap = this._CVS.ctx.createImageData(...this._mapGrid.globalDimensions)
        this._offscreenCanvas = new OffscreenCanvas(...this._mapGrid.globalDimensions)
        this._offscreenCtx = this._offscreenCanvas.getContext("2d")
        this._loopExtra = null
        this._stepExtra = null
        this.#updateCachedGridDisplays()
        this.#updateCachedMapPixelsRows()
        this.#setCanvasZoomAndDrag()
        this.setKeyBinds()

        const cameraCenterPos = this._worldStartSettings.cameraCenterPos
        if (cameraCenterPos !== undefined) this._CVS.centerViewAt(cameraCenterPos||this._mapGrid.getCenter(true))
        if (this._worldStartSettings.zoom) this._CVS.zoomAtPos(this._CVS.getCenter(), this._worldStartSettings.zoom)
        
        // CANVAS
        this._CVS.loopingCB = this.#main.bind(this)
        this._CVS.setMouseMove()
        this._CVS.setMouseLeave()
        this._CVS.setMouseDown(this.#mouseDown.bind(this))
        this._CVS.setMouseUp(this.#mouseUp.bind(this))
        this._CVS.setKeyUp(null, true)
        this._CVS.setKeyDown(null, true)
        this._CVS.onResizeCB=()=>{
            const pixelSize = this.autoSimulationSizing
            if (pixelSize) this.autoFitSize(pixelSize)
        }
        this._CVS.start()
        this._mouseListenerIds = [
            this._CVS.mouse.addListener([[0,0], this._mapGrid.globalDimensions], Mouse.LISTENER_TYPES.ENTER, ()=>this._isMouseWithinSimulation = true),
            this._CVS.mouse.addListener([[0,0], this._mapGrid.globalDimensions], Mouse.LISTENER_TYPES.MOVE, ()=>this._isMouseWithinSimulation = true),
            this._CVS.mouse.addListener([[0,0], this._mapGrid.globalDimensions], Mouse.LISTENER_TYPES.LEAVE, ()=>this.#mouseLeaveSimulation())
        ]


        // INTERNAL LOAD CALLS
        this._initialized = Simulation.#INIT_STATES.READY

        if (this.autoSimulationSizing) this.autoFitSize(this.autoSimulationSizing)
        if (CDEUtils.isFunction(readyCB)) readyCB(this)

        this._initialized = Simulation.#INIT_STATES.NOT_INITIALIZED

        if (this._worldStartSettings.autoStart) this.start()
    }

    /* RENDERING */
    /**
     * The main display and physics loop
     * @param {Number} deltaTime The deltaTime
     */
    #main(deltaTime) {
        const mouse = this.mouse, settings = this._userSettings, loopExtra = this._loopExtra

        if (loopExtra) loopExtra(deltaTime)

        if (!this.drawingDisabled && mouse.clicked && !this.keyboard.isDown(Simulation.DEFAULT_PRECISE_PLACE_KEY)) this.#placePixelFromMouse(mouse)

        if (settings.showGrid) this.#drawMapGrid()
        if (settings.showBorder) this.#drawBorder()

        if (this._isRunning && this.useLocalPhysics) this.step(deltaTime)

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

        const pixels = this._gridMaterials, p_ll = pixels.length, map = this._mapGrid, M = Simulation.MATERIALS, G = Simulation.MATERIAL_GROUPS, SG = Simulation.MATERIAL_STATES_GROUPS, D = Simulation.D,
              w = map.mapWidth, pxSize = map.pixelSize, pxSize2 = pxSize/4, random = Math.random(), batchStroke = this.render.batchStroke.bind(this.render), batchFill = this.render.batchFill.bind(this.render)

        for (let i=0;i<p_ll;i++) {
            const mat = pixels[i]
            if ((mat&G.HAS_VISUAL_EFFECTS) === 0) continue

            const py = (i/w)|0, x = (i-py*w)*pxSize, y = py*pxSize

            // ELECTRICITY
            if (mat === M.ELECTRICITY) batchFill(Render.getPositionsRect([x-pxSize2,y-pxSize2], [x+pxSize+pxSize2,y+pxSize+pxSize2]), [255,235,0,0.45*random])
            // COPPER
            //else if (mat === M.COPPER && state === Simulation.MATERIAL_STATES.COPPER.LIT) batchFill(Render.getPositionsRect([x-pxSize2,y-pxSize2], [x+pxSize+pxSize2,y+pxSize+pxSize2]), [255,235,0,0.35*random])
            //else if (mat === M.COPPER && state === Simulation.MATERIAL_STATES.COPPER.ORIGIN) batchFill(Render.getPositionsRect([x-pxSize2,y-pxSize2], [x+pxSize+pxSize2,y+pxSize+pxSize2]), [255,235,220,0.4])
            //else if (mat === M.COPPER && state === Simulation.MATERIAL_STATES.COPPER.DISABLED) batchFill(Render.getPositionsRect([x-pxSize2,y-pxSize2], [x+pxSize+pxSize2,y+pxSize+pxSize2]), [0,0,220,0.3])
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
    renderPixels(force) {
        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.renderPixels(force))
            return
        }

        const pixels = this._gridMaterials, lastPixels = this._lastGridMaterials, p_ll = pixels.length, map = this._mapGrid, enableOptimization = force ? false : lastPixels.length===p_ll&&map.lastPixelSize===map.pixelSize, w = map.mapWidth
        for (let i=0;i<p_ll;i++) {
            const mat = pixels[i]
            if (enableOptimization && mat===lastPixels[i]) continue
            const y = (i/w)|0
            this.#updateMapPixel(i-y*w, y, mat) 
        } 
        if (!enableOptimization) map.lastPixelSize = map.pixelSize

        this._lastGridMaterials = this.#getGridMaterialsCopy()
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
     * Runs and displays one physics step (R?)
     */
    step(deltaTime=this.CVS.deltaTime) {
        const T = Simulation.#WORKER_MESSAGE_TYPES, unit = this._physicsUnit
        if (this.useLocalPhysics && this.#simulationHasPixelsBuffer) {
            const stepExtra = this._stepExtra
            this.saveStep()
            if (stepExtra) stepExtra()
            unit.step(
                this._gridIndexes, this._gridMaterials, this._lastGridMaterials,
                this._indexCount, this._indexFlags, this._indexPosX, this._indexPosY, this._indexVelX, this._indexVelY, this._indexGravity,
                this._sidePriority, this._mapGrid.mapWidth, this._mapGrid.mapHeight,
                deltaTime
            )
            this.renderPixels()
        }
        else if (this.#simulationHasPixelsBuffer) this.#sendPixelsToWorker(T.STEP)
    }

    /**
     * Displays the previous physics step saved (R?)
     */
    backStep() {
        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.backStep())
            return
        }

        const saves = this._backStepSaves, b_ll = saves.length
        if (b_ll) {
            let lastSave = saves[b_ll-1]
            const lastSaveArray = lastSave[0], l_ll = lastSaveArray.length, currentSave = this.#getGridMaterialsCopy()
            
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
     * Saves a physics step (R?)
     */
    saveStep() {
        if (this.backStepSavingEnabled) {
            const saves = this._backStepSaves, b_ll = saves.length, lastSave = saves[b_ll-1]?.[0], l_ll = lastSave?.length, currentSave = this.#getGridMaterialsCopy()

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
     * Updates whether the physics calculations are offloaded to a worker thread (R?)
     * @param {Boolean} usesWebWorkers Whether an other thread is used. (Defaults to true)
     */
    updatePhysicsUnitType(usesWebWorkers=true) {
        if (this.#checkInitializationState(SETTINGS.NOT_INITIALIZED_PHYSICS_TYPE_WARN)) return

        const isWebWorker = +(usesWebWorkers&&!this.isFileServed)
        if ((isWebWorker && this.usesWebWorkers) || (!isWebWorker && this.useLocalPhysics)) return


        let instance = Simulation.#PHYSICS_UNIT_INSTANCES[isWebWorker]
        if (!instance) instance = Simulation.#PHYSICS_UNIT_INSTANCES[isWebWorker] = isWebWorker ? new Worker(Simulation.WORKER_RELATIVE_PATH, {type:"classic"}) : new LocalPhysicsUnit(this._physicsConfig, Simulation)
        this._physicsUnit = instance

        if (isWebWorker) {
            this.#simulationHasPixelsBuffer = true
            this._physicsUnit.onmessage=this.#physicsUnitMessage.bind(this)
            this._physicsUnit.postMessage({
                type:Simulation.#WORKER_MESSAGE_TYPES.INIT,
                pixels:this._gridIndexes, pxStepUpdated:this._indexUpdated, pxStates:this._indexStates, sidePriority:this._sidePriority, 
                mapWidth:this._mapGrid.mapWidth, mapHeight:this._mapGrid.mapHeight,
                aimedFps:this._CVS.fpsLimit
            })
            if (this._isRunning) this.start(true)
        }
        else if (usesWebWorkers && this.isFileServed) this.#warn(SETTINGS.FILE_SERVED_WARN)
    }

    /**
     * Updates map size automatically based on the optimal fit for the provided sizes
     * @param {Number?} pixelSize The desired pixel size
     * @param {Number?} globalWidth The width to cover in px
     * @param {Number?} globalHeight The height to cover in px
     * @returns The calculated width/height in local pixels
     */
    autoFitSize(pixelSize=Simulation.DEFAULT_MAP_RESOLUTIONS.DEFAULT, globalWidth=this._CVS.width, globalHeight=this._CVS.height) {
        if (pixelSize === true || pixelSize === null) pixelSize = Simulation.DEFAULT_MAP_RESOLUTIONS.DEFAULT
        const width = (globalWidth/pixelSize)|0, height = (globalHeight/pixelSize)|0
        this.updateMapPixelSize(pixelSize)
        this.updateMapSize(width, height)
        return [width, height]
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
            this._imgMap = this.ctx.createImageData(...map.globalDimensions)
            this._offscreenCanvas.width = map.globalDimensions[0]
            this._offscreenCanvas.height = map.globalDimensions[1]
            this.#updateCachedMapPixelsRows()
            this.#updateCachedGridDisplays()
            this.renderPixels()

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
            const oldGridIndexes = this.#getGridIndexesCopy(), oldGridMaterials = this.#getGridMaterialsCopy(), oldIndexArrays = this.#getIndexArraysCopy()
            height = map.mapHeight = height||map.mapHeight
            width = map.mapWidth = width||map.mapWidth
            this.#updatePixelsFromSize(oldWidth, oldHeight, width, height, oldGridIndexes, oldGridMaterials, oldIndexArrays)
            this.#updateCachedGridDisplays()

            this._imgMap = this.ctx.createImageData(...map.globalDimensions)
            this._offscreenCanvas.width = map.globalDimensions[0]
            this._offscreenCanvas.height = map.globalDimensions[1]
            this.renderPixels()

            this.#updateMouseListeners()
        }
    }

    /**
     * Updates the side prioritised first by the physics. (R?)
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
        return this.usesWebWorkers ? this._lastGridMaterials[i] : this._gridMaterials[i]
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
     * Updates the shape used to draw materials on the simulation with mouse.
     * @param {Simulation.BRUSH_TYPES} brushType The brush type to use  TODO DOC
     */
    updateReplaceMode(replaceMode) {
        replaceMode = +replaceMode
        if (!isNaN(replaceMode)) return this._replaceMode = replaceMode
        return this._replaceMode
    }

    /**
     * Updates the colors used for the grid and/or the materials.
     * @param {Object} colorSettings The colors to update. (Materials keys need to be in UPPERCASE)
     */
    updateColors(colorSettings) {
        this._colorSettings = SimUtils.getAdjustedSettings(colorSettings, this._colorSettings)

        if (colorSettings.grid) this._mapGridRenderStyles.update(this._colorSettings.grid)
        if (colorSettings.border) this._mapBorderRenderStyles.update(this._colorSettings.border)

        this.#updateCachedMapPixelsRows()
        this.renderPixels(true)
    }

    /**
     * Offsets the pixel array to match the updated size 
     * @param {Number} oldWidth The previous/current width of the map
     * @param {Number} oldHeight The previous/current height of the map
     * @param {Number} newWidth The new/updated width of the map
     * @param {Number} newHeight The new/updated height of the map
     * @param {Uint16Array} // DOC TODO
     */
    #updatePixelsFromSize(oldWidth, oldHeight, newWidth, newHeight, oldGridIndexes, oldGridMaterials, oldIndexArrays) {
        const arraySize = this._mapGrid.arraySize, skipOffset = newWidth-oldWidth, smallestWidth = oldWidth<newWidth?oldWidth:newWidth, smallestHeight = oldHeight<newHeight?oldHeight:newHeight,
            gridIndexes = this._gridIndexes = new Simulation.#C_GRID_INDEXES(arraySize).fill(-1),
            gridMaterials = this._gridMaterials = new Simulation.#C_GRID_MATERIALS(arraySize).fill(Simulation.MATERIALS.AIR),    
            newArrays = [
                this._indexFlags = new Simulation.#C_FLAGS_SMALL(arraySize),
                this._indexPosX = new Simulation.#C_PHYSICS_REGULAR(arraySize),
                this._indexPosY = new Simulation.#C_PHYSICS_REGULAR(arraySize),
                this._indexVelX = new Simulation.#C_PHYSICS_REGULAR(arraySize),
                this._indexVelY = new Simulation.#C_PHYSICS_REGULAR(arraySize),
                this._indexGravity = new Simulation.#C_PHYSICS_SMALL(arraySize)
            ]

        const a_ll = newArrays.length
        for (let i=0;i<a_ll;i++) newArrays[i].set(oldIndexArrays[i].subarray(0, newWidth))
        
        for (let y=0,offset=0,oi=0;y<smallestHeight;y++) {
            gridIndexes.set(oldGridIndexes.subarray(oi, oi+smallestWidth), offset)
            gridMaterials.set(oldGridMaterials.subarray(oi, oi+smallestWidth), offset)

            oi += oldWidth
            offset += oldWidth+skipOffset
        }

        if (this.usesWebWorkers) this._physicsUnit.postMessage({type:Simulation.#WORKER_MESSAGE_TYPES.MAP_SIZE, mapWidth:this._mapGrid.mapWidth, mapHeight:this._mapGrid.mapHeight, arraySize})

        this._indexCount[0] = this._gridIndexes.filter(x=>x !== -1).length
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
    // Listener for web worker messages (R?)
    #physicsUnitMessage(e) {
        const data = e.data, type = data.type, T = Simulation.#WORKER_MESSAGE_TYPES, stepExtra = this._stepExtra

        if (type & Simulation.#WORKER_MESSAGE_GROUPS.GIVES_PIXELS_TO_MAIN) {
            //this._gridMaterials = new Uint16Array(data.pixels) TODO
            //this._indexStates = new Uint16Array(data.pxStates)
            this.#simulationHasPixelsBuffer = true
        }

        if (type === T.STEP) {// RECEIVE STEP RESULTS (is step/sec bound)
            // DO BUFFER OPERATION
            this.renderPixels()
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
     * Sends a command of a certain type to the worker, needing pixels (R?)
     * @param {Simulation.#WORKER_MESSAGE_TYPES} type The worker message type
     */
    #sendPixelsToWorker(type) {
        const pixels = this._gridMaterials//, pxStates = this._indexStates TODO
        this.saveStep()
        if (this.usesWebWorkers) this._physicsUnit.postMessage({type, pixels, pxStates}, [pixels.buffer, pxStates.buffer])
        else this.#simulationHasPixelsBuffer = true
    }

    // Executes queued operations (R??)
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
        for (let i=0,ii=0;ii<c_ll;i?i*=2:i=1,ii++) {
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
        Simulation.#CACHED_GRID_BORDER = Render.getRect([0,0], ...this._mapGrid.globalDimensions)
    }

    // Updates current mouse listeners area
    #updateMouseListeners() {
        const mouse = this.mouse, dimensions = this._mapGrid.globalDimensions
        mouse.updateListener(Mouse.LISTENER_TYPES.ENTER, this._mouseListenerIds[0], [[0,0], dimensions])
        mouse.updateListener(Mouse.LISTENER_TYPES.MOVE,  this._mouseListenerIds[1], [[0,0], dimensions])
        mouse.updateListener(Mouse.LISTENER_TYPES.LEAVE, this._mouseListenerIds[2], [[0,0], dimensions])
    }
    /* CACHE UPADTES -end */

    /* USER INPUT */
    /**
     * Creates functional keybinds (R?)
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
            this.updateMapSize(231, 149)
            this.updateMapPixelSize(4)
        }, keybinds.MY_CUSTOM_SIZE_KEYBIND), keybinds.MY_CUSTOM_SIZE_KEYBIND.triggerType)
    }

    // Utils function to check if keybind's conditions are met before executing the action (R?)
    #keybindTryAction(typingDevice, e, actionCB, bindValue) {
        const hasAction = CDEUtils.isFunction(actionCB), {requiredKeys, cancelKeys, preventDefault} = bindValue
        if (preventDefault && e.target.value === undefined) e.preventDefault()
        if (!hasAction) {
            this.#warn(SETTINGS.STANDALONE_KEYBIND_WARN)
            return
        }
        if ((!requiredKeys || typingDevice.isDown(requiredKeys)) && (!cancelKeys || !typingDevice.isDown(cancelKeys))) actionCB.bind(this)()
    }

    // mouseUp listener, disables smooth drawing when mouse is unpressed
    #mouseUp() {
        this.#lastPlacedPos = null
    }

    // mouseDown listener, allows the mouse to place pixels
    #mouseDown(mouse) {
        if (!mouse.rightClicked) this.#placePixelFromMouse(mouse)
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
            const isRunning = this._isRunning, [x,y] = mapPos, [ix,iy] = this.#lastPlacedPos||mapPos, dx = x-ix, dy = y-iy, dMax = Math.max(Math.abs(dx), Math.abs(dy))

            if (this.smoothDrawingEnabled && dMax) for (let i=0;i<dMax;i++) {
                const prog = ((i+1)/dMax)
                this.placePixelsWithBrush(ix+(dx*prog)|0, iy+(dy*prog)|0)
            } 
            else this.placePixelsWithBrush(x, y)

            this.#lastPlacedPos = mapPos
            if (!isRunning) this.renderPixels()
        }
    }

    // Zooms in/out towards the provided pos
    #zoomTowardsPos(pos,  zoomDirection) {
        const newZoom = this._CVS.zoom + (zoomDirection<0 ? this.zoomInIncrement : this.zoomOutIncrement)
        if (newZoom > this.minZoomThreshold && newZoom < this.maxZoomThreshold) {
            this._CVS.zoomAtPos(pos, newZoom)
            return pos
        }  else return false
    }

    // Adds the ability do zoom/move around the canvas (if dragAndZoomCanvasEnabled) (R?)
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
     * @param {Simulation.MATERIALS?} material The material used to draw the pixel (Defaults to the selected material)
     * @param {Simulation.REPLACE_MODES?} replaceMode The material(s) allowed to be replaced (Defaults to the current replace mode)
     */
    placePixel(mapPos, material=this._selectedMaterial, replaceMode=this._replaceMode) {
        const i = this._mapGrid.mapPosToIndex(mapPos)
        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.placePixelAtIndex(i, material, replaceMode))
            return
        }

        this.placePixelAtIndex(i, material, replaceMode)
    }

    /**
     * Places a pixel of a specified material at the specified position on the pixel map.
     * @param {Number} x The X value of the pixel on the map
     * @param {Number} y The Y value of the pixel on the map
     * @param {Simulation.MATERIALS?} material The material used to draw the pixel (Defaults to the selected material)
     * @param {Simulation.REPLACE_MODES?} replaceMode The material(s) allowed to be replaced (Defaults to the current replace mode)
     */
    placePixelAtCoords(x, y, material=this._selectedMaterial, replaceMode=this._replaceMode) {
        const i = this._mapGrid.mapPosToIndexCoords(x, y)
        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.placePixelAtIndex(i, material, replaceMode))
            return
        }

        this.placePixelAtIndex(i, material, replaceMode)
    }

    /**
     * Places a pixel of a specified material at the specified index on the pixel map.
     * @param {Number} gridIndex The index value of the pixel on the map
     * @param {Simulation.MATERIALS?} material The material used to draw the pixel (Defaults to the selected material)
     * @param {Simulation.REPLACE_MODES?} replaceMode The material(s) allowed to be replaced (Defaults to the current replace mode)
     */
    placePixelAtIndex(gridIndex, material=this._selectedMaterial, replaceMode=this._replaceMode) {
        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.placePixelAtIndex(gridIndex, material, replaceMode))
            return
        }

        const gridMaterials = this._gridMaterials, oldMat = gridMaterials[gridIndex]
        if (material === oldMat || gridIndex < 0) return


        if (replaceMode !== Simulation.REPLACE_MODES.ALL && !(gridMaterials[gridIndex] & replaceMode)) return

        const isStatic = (material & Simulation.MATERIAL_GROUPS.STATIC), gridIndexes = this._gridIndexes, oldIndex = gridIndexes[gridIndex]
        gridMaterials[gridIndex] = material

        //0console.log("PLACED", !!isStatic, gridIndex, material, oldIndex)

        // DELETE IF DYNAMIC 
        if (oldIndex !== -1) {
            const i = --this._indexCount[0]
            if (oldIndex !== i) {
                this._indexFlags[oldIndex] = this._indexFlags[i]
                this._indexPosX[oldIndex] = this._indexPosX[i]
                this._indexPosY[oldIndex] = this._indexPosY[i]
                this._indexVelX[oldIndex] = this._indexVelX[i]
                this._indexVelY[oldIndex] = this._indexVelY[i]
                this._indexGravity[oldIndex] = this._indexGravity[i]
                const newGridIndex = (this._indexPosY[oldIndex]|0)*this._mapGrid.mapWidth+(this._indexPosX[oldIndex]|0)
                gridIndexes[newGridIndex] = oldIndex
            }
            gridIndexes[gridIndex] = -1
        }

        // INIT IF DYNAMIC
        if (!isStatic) {
            const mapWidth = this._mapGrid.mapWidth,
                i = this._indexCount[0]++,
                y = (gridIndex/mapWidth)|0,
                x = gridIndex-y*mapWidth
            
            this._indexFlags[i] = 0
            this._indexPosX[i] = x
            this._indexPosY[i] = y+CDEUtils.random(0, .85, 3)
            this._indexVelX[i] = 90//*(CDEUtils.random(-2, 1)||1)//5
            this._indexVelY[i] = 2+CDEUtils.random(0, 1, 3)
            this._indexGravity[i] = 90+CDEUtils.random(-10, 20)
            gridIndexes[gridIndex] = i
        }
    }

    /**
     * Places pixels at the specified coordinates, according to the provided brush pattern
     * @param {Number} x The X value of the center position
     * @param {Number} y The Y value of the center position
     * @param {Simulation.BRUSH_TYPES?} brushType The brush type used (Defaults to the current brush type)
     * @param {Simulation.MATERIALS?} material The material used to draw the pixel (Defaults to the selected material)
     * @param {Simulation.REPLACE_MODES?} replaceMode The material(s) allowed to be replaced (Defaults to the current replace mode)
     */
    placePixelsWithBrush(x, y, brushType=this._brushType, material=this._selectedMaterial, replaceMode=this._replaceMode) {
        const B = Simulation.BRUSH_TYPES
        if (brushType & Simulation.#BRUSH_GROUPS.SMALL_OPTIMIZED) {
            if (brushType === B.LINE3 || brushType === B.VERTICAL_CROSS) this.fillArea([x,y-1], [x,y+1], material, replaceMode)
            if (brushType === B.ROW3 || brushType === B.VERTICAL_CROSS) {
                if (x) this.placePixelAtCoords(x-1, y, material, replaceMode)
                if (x !== this._mapGrid.mapWidth-1) this.placePixelAtCoords(x+1, y, material, replaceMode)
            }
            this.placePixelAtCoords(x, y, material, replaceMode)
        } else if (brushType === B.BIG_DOT) {
            if (x-2 >= 0) this.placePixelAtCoords(x-2, y, material, replaceMode)
            if (x+2 < this._mapGrid.mapWidth) this.placePixelAtCoords(x+2, y, material, replaceMode)
                this.placePixelAtCoords(x, y-2, material, replaceMode)
                this.placePixelAtCoords(x, y+2, material, replaceMode)
                this.fillArea([x-1,y-1], [x+1,y+1], material, replaceMode)
        } else if (brushType & Simulation.#BRUSH_GROUPS.X) {
            const offset = (Simulation.#BRUSHES_X_VALUES[brushType]/2)|0
            this.fillArea([x-offset,y-offset], [x+offset,y+offset], material, replaceMode)
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
     * @param {Simulation.MATERIALS?} material The material used (Defaults to the selected material)
     */
    fill(material=this._selectedMaterial) {// TODO FIX
        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.fill(material))
            return
        }

        const pixels = this._gridMaterials, lastPixels = this._lastGridMaterials, p_ll = pixels.length
        //lastPixels.set(new Uint16Array(p_ll).subarray(0, lastPixels.length).fill(material+1))
        //pixels.set(new Uint16Array(p_ll).fill(material))
        if (!this._isRunning) this.renderPixels()
    }

    /**
     * Fills the specified area of the map with a specific material.
     * @param {[leftX, topY]} pos1 The top-left pos of the area
     * @param {[rightX, bottomY]} pos2 The bottom-right pos of the area
     * @param {Simulation.MATERIALS?} material The material used (Defaults to the selected material)
     * @param {Simulation.REPLACE_MODES?} replaceMode The material(s) allowed to be replaced (Defaults to the current replace mode)
     */
    fillArea(pos1, pos2, material=this._selectedMaterial, replaceMode=this._replaceMode) {
        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.fillArea(pos1, pos2, material))
            return
        }

        const pixels = this._gridMaterials, p_ll = pixels.length, map = this._mapGrid, w = map.mapWidth, x1 = pos1[0]<0?0:pos1[0], y1 = pos1[1]<0?0:pos1[1], x2 = pos2[0]<0?0:pos2[0], y2 = pos2[1]<0?0:pos2[1]
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
            this.placePixelAtIndex(i, material, replaceMode)
        }

        if (!this._isRunning) this.renderPixels()
    }
    /* PIXEL EDIT -end */

    
    /* SAVE / IMPORT / EXPORT */
    /**
     * Returns a copy of the current pixels array 
     * @returns TODO DOC
     */
    #getGridMaterialsCopy() {
        const arraySize = this._mapGrid.arraySize, gridMaterialsCopy = new Simulation.#C_GRID_MATERIALS(arraySize)
        gridMaterialsCopy.set(this._gridMaterials.subarray(0, arraySize))
        return gridMaterialsCopy
    }

    #getGridIndexesCopy() {
        const arraySize = this._mapGrid.arraySize, gridIndexesCopy = new Simulation.#C_GRID_INDEXES(arraySize)
        gridIndexesCopy.set(this._gridIndexes.subarray(0, arraySize))
        return gridIndexesCopy
    }

    // TODO DOC
    #getIndexArraysCopy() {
        const arraySize = this._mapGrid.arraySize, 
            indexFlags = new Simulation.#C_FLAGS_SMALL(arraySize),
            indexPosX = new Simulation.#C_PHYSICS_REGULAR(arraySize),
            indexPosY = new Simulation.#C_PHYSICS_REGULAR(arraySize),
            indexVelX = new Simulation.#C_PHYSICS_REGULAR(arraySize),
            indexVelY = new Simulation.#C_PHYSICS_REGULAR(arraySize),
            indexGravity = new Simulation.#C_PHYSICS_SMALL(arraySize)

        indexFlags.set(this._indexFlags.subarray(0, arraySize))
        indexPosX.set(this._indexPosX.subarray(0, arraySize))
        indexPosY.set(this._indexPosY.subarray(0, arraySize))
        indexVelX.set(this._indexVelX.subarray(0, arraySize))
        indexVelY.set(this._indexVelY.subarray(0, arraySize))
        indexGravity.set(this._indexGravity.subarray(0, arraySize))

        return [
            indexFlags,
            indexPosX,
            indexPosY,
            indexVelX,
            indexPosY,
            indexGravity,
        ]
    }

    /**
     * Fills the map with saved data.
     * @param {Uint16Array | String} mapData The save data:
     * - Either a Uint16Array containing the material value for each index
     * - Or a string in the format created by the function exportAsText()
     * @param {Boolean? | [width, height]?} useSaveSizes Whether to resize the map size and pixel size to the save's values (Also used internally to specify the save data dimensions when mapData is of Uint16Array type)
     */
    load(mapData, useSaveSizes=null) {
        if (this.#checkInitializationState(SETTINGS.NOT_INITIALIZED_LOAD_WARN)) return

        if (!this.#simulationHasPixelsBuffer) {
            this._queuedBufferOperations.push(()=>this.load(mapData, useSaveSizes))
            return
        }

        if (mapData) {
            const gridMaterialsContainer = Simulation.#C_GRID_MATERIALS

            if (mapData instanceof gridMaterialsContainer) this.#updatePixelsFromSize(useSaveSizes[0], useSaveSizes[1], this._mapGrid.mapWidth, this._mapGrid.mapHeight, mapData)
            else if (typeof mapData === "string") {
                const [exportType, rawSize, rawData] = mapData.split(Simulation.EXPORT_SEPARATOR), data = rawData.split(","), [saveWidth, saveHeight, pixelSize] = rawSize.split(",").map(x=>+x)
                let savePixels = null

                if (useSaveSizes) {
                    this.updateMapSize(saveWidth, saveHeight)
                    this.updateMapPixelSize(pixelSize)
                }

                if (exportType == Simulation.EXPORT_STATES.RAW) savePixels = new gridMaterialsContainer(data.map(x=>+x||Simulation.MATERIALS.AIR))
                else if (exportType == Simulation.EXPORT_STATES.COMPACTED) {
                    let m_ll = data.length, offset = 0 
                    savePixels = new gridMaterialsContainer(saveWidth*saveHeight)
                    for (let i=0;i<m_ll;i+=2) {
                        const count = data[i+1], mat = +data[i]||Simulation.MATERIALS.AIR
                        savePixels.set(new gridMaterialsContainer(count).fill(mat), offset)
                        offset += +count
                    }
                }
                this.#updatePixelsFromSize(saveWidth, saveHeight, this._mapGrid.mapWidth, this._mapGrid.mapHeight, savePixels)
            }
            this.renderPixels()
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

        let pixels = this._gridMaterials, p_ll = pixels.length, state = Simulation.EXPORT_STATES.COMPACTED, textResult = ""
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
    PERF_REGULAR_SIZE() {
        this.updateMapPixelSize(2)
        this.updateMapSize(700, 600)
        //this.load("1x400,300,2x0,120000", true)
    }

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
	//get pxStepUpdated() {return this._indexUpdated} TODO
	//get pxStates() {return this._indexStates}
	//get lastPixels() {return this._lastGridMaterials}
	get lastStepTime() {return this._lastStepTime}
	//get pixels() {return this._gridIndexes}
	get mapGridRenderStyles() {return this._mapGridRenderStyles}
	get mapBorderRenderStyles() {return this._mapBorderRenderStyles}
	get offscreenCanvas() {return this._offscreenCanvas}
	get imgMap() {return this._imgMap}
    get isMouseWithinSimulation() {return this._isMouseWithinSimulation}
    get sidePriority() {return this._sidePriority}
    get isRunning() {return this._isRunning}
	get backStepSavingMaxCount() {return this._backStepSavingMaxCount}
	get backStepSaves() {return this._backStepSaves}
	get selectedMaterial() {return this._selectedMaterial}
    get brushType() {return this._brushType}
    get replaceMode() {return this._replaceMode}
    get hasReplaceMode() {return this._replaceMode !== Simulation.REPLACE_MODES.ALL}
	get worldStartSettings() {return this._worldStartSettings}
	get userSettings() {return this._userSettings}
	get colorSettings() {return this._colorSettings}
    get initialized() {return this._initialized}
	get queuedBufferOperations() {return this._queuedBufferOperations}

    get aimedFPS() {return this._CVS.fpsLimit}
    get backStepSavingEnabled() {return Boolean(this._backStepSavingMaxCount)}
    get useLocalPhysics() {return this._physicsUnit instanceof LocalPhysicsUnit}
    get usesWebWorkers() {return (Boolean(this._physicsUnit) && !(this._physicsUnit instanceof LocalPhysicsUnit))}
    get isFileServed() {return location.href.startsWith("file")}
	get showGrid() {return this._userSettings?.showGrid}
	get showBorder() {return this._userSettings?.showBorder}
	get smoothDrawingEnabled() {return this._userSettings?.smoothDrawingEnabled}
	get visualEffectsEnabled() {return this._userSettings?.visualEffectsEnabled}
	get warningsDisabled() {return this._userSettings?.warningsDisabled}
	get dragAndZoomCanvasEnabled() {return this._userSettings?.dragAndZoomCanvasEnabled}
	get autoSimulationSizing() {return this._userSettings?.autoSimulationSizing}
	get zoomInIncrement() {return this._userSettings?.zoomInIncrement}
	get zoomOutIncrement() {return this._userSettings?.zoomOutIncrement}
	get minZoomThreshold() {return this._userSettings?.minZoomThreshold}
	get maxZoomThreshold() {return this._userSettings?.maxZoomThreshold}
	get drawingDisabled() {return this._userSettings?.drawingDisabled}
	get timerEnabled() {return this._physicsConfig?.timerEnabled}
    
	set loopExtra(_loopExtra) {this._loopExtra = _loopExtra}
	set stepExtra(stepExtra) {this._stepExtra = stepExtra}
	set isRunning(isRunning) {this._isRunning = isRunning}
	set selectedMaterial(_selectedMaterial) {return this.updateSelectedMaterial(_selectedMaterial)}
	set brushType(brushType) {return this.updateBrushType(brushType)}
	set sidePriority(sidePriority) {return this.updateSidePriority(sidePriority)}
	set replaceMode(replaceMode) {return this.updateReplaceMode(replaceMode)}
	set backStepSavingMaxCount(_backStepSavingMaxCount) {this._backStepSavingMaxCount = _backStepSavingMaxCount}
	set mapGridRenderStyles(_mapGridRenderStyles) {this._mapGridRenderStyles = _mapGridRenderStyles}
	set mapBorderRenderStyles(_mapBorderRenderStyles) {return this._mapBorderRenderStyles = _mapBorderRenderStyles}
    set showGrid(showGrid) {this._userSettings.showGrid = showGrid}
    set showBorder(showBorder) {this._userSettings.showBorder = showBorder}
    set smoothDrawingEnabled(smoothDrawingEnabled) {this._userSettings.smoothDrawingEnabled = smoothDrawingEnabled}
    set visualEffectsEnabled(visualEffectsEnabled) {this._userSettings.visualEffectsEnabled = visualEffectsEnabled}
    set warningsDisabled(warningsDisabled) {this._userSettings.warningsDisabled = warningsDisabled}
    set aimedFPS(aimedFPS) {this._CVS.fpsLimit = aimedFPS}
    set autoSimulationSizing(autoSimulationSizing) {
        this._userSettings.autoSimulationSizing = autoSimulationSizing
        if (autoSimulationSizing) this.autoFitSize(autoSimulationSizing)
    }
    set dragAndZoomCanvasEnabled(dragAndZoomCanvasEnabled) {
        this._userSettings.dragAndZoomCanvasEnabled = dragAndZoomCanvasEnabled
        if (!dragAndZoomCanvasEnabled) CVS.resetTransformations(true)
    }
    set minZoomThreshold(minZoomThreshold) {this._userSettings.minZoomThreshold = minZoomThreshold}
    set maxZoomThreshold(maxZoomThreshold) {this._userSettings.maxZoomThreshold = maxZoomThreshold}
    set zoomInIncrement(zoomInIncrement) {this._userSettings.zoomInIncrement = zoomInIncrement}
    set zoomOutIncrement(zoomOutIncrement) {this._userSettings.zoomOutIncrement = zoomOutIncrement}
    set drawingDisabled(drawingDisabled) {this._userSettings.drawingDisabled = drawingDisabled}
    set timerEnabled(timerEnabled) {this._physicsConfig.timerEnabled = timerEnabled}
}