class Simulation {
    static MATERIALS = {AIR:0, SAND:1<<0, WATER:1<<1, STONE:1<<2, GRAVEL:1<<3, INVERTED_WATER:1<<4}
    static MATERIAL_COLORS = {AIR:[0,0,0,0], SAND:[235,235,158,1], WATER:[0,15,242,.75], STONE:[100,100,100,1], GRAVEL:[188,188,188,1], INVERTED_WATER:[81,53,131,.75]}
    static MATERIAL_GROUPS = {TRANSPIERCEABLE:Simulation.MATERIALS.WATER+Simulation.MATERIALS.INVERTED_WATER+Simulation.MATERIALS.AIR, LIQUIDS:Simulation.MATERIALS.WATER+Simulation.MATERIALS.INVERTED_WATER}
    static MATERIAL_COLORS_INDEXED = []
    static MATERIAL_NAMES = []
    static #CACHED_MATERIALS_ROWS = []
    static DEFAULT_MATERIAL = this.MATERIALS.SAND
    static D = {t:1<<0, r:1<<1, b:1<<2, l:1<<3, tr:1<<4, br:1<<5, bl:1<<6, tl:1<<7}
    static SIDE_PRIORITIES = {RANDOM:0, LEFT:1, RIGHT:2, MAP_DEPENDANT:3}
    static SIDE_PRIORITY_NAMES = []
    static DEFAULT_BACK_STEP_SAVING_COUNT = 50
    static EXPORT_STATES = {RAW:0, COMPACTED:1}
    static EXPORT_SEPARATOR = "x"
    static BRUSH_TYPES = {PIXEL:1<<0, VERTICAL_CROSS:1<<1, LINE3:1<<2, ROW3:1<<3, BIG_DOT:1<<4, X3:1<<5, X5:1<<6, X15:1<<7, X25:1<<8, X55:1<<9, X99:1<<10}
    static #BRUSHES_X_VALUES = []
    static #BRUSH_GROUPS = {SMALL_OPTIMIZED:Simulation.BRUSH_TYPES.PIXEL+Simulation.BRUSH_TYPES.VERTICAL_CROSS+Simulation.BRUSH_TYPES.LINE3+Simulation.BRUSH_TYPES.ROW3, X:Simulation.BRUSH_TYPES.X3+Simulation.BRUSH_TYPES.X5+Simulation.BRUSH_TYPES.X15+Simulation.BRUSH_TYPES.X25+Simulation.BRUSH_TYPES.X55+Simulation.BRUSH_TYPES.X99}
    static #WORKER_RELATIVE_PATH = "./physics/RemotePhysicsUnit.js"
    static #WORKER_MESSAGE_TYPES = {INIT:0, STEP:1<<0}
    static DEFAULT_BRUSH_TYPE = Simulation.BRUSH_TYPES.PIXEL
    static {
        const M = Simulation.MATERIALS, materials = Object.keys(M), m_ll = materials.length
        for (let i=0,ii=0;ii<m_ll;i=!i?1:i*2,ii++) {
            Simulation.MATERIAL_NAMES[i] = materials[ii]
            Simulation.MATERIAL_COLORS_INDEXED[i] = Simulation.MATERIAL_COLORS[materials[ii]]
        }

        Simulation.SIDE_PRIORITY_NAMES = Object.keys(Simulation.SIDE_PRIORITIES)

        const brushesX = Object.keys(Simulation.BRUSH_TYPES).filter(b=>b.startsWith("X")), b_ll = brushesX.length
        for (let i=Simulation.BRUSH_TYPES[brushesX[0]],ii=0;ii<b_ll;i=!i?1:i*2,ii++) Simulation.#BRUSHES_X_VALUES[i] = +brushesX[ii].slice(1)
    }

    constructor(CVS, mapGrid, useWebWorkers=true) {
        // SIMULATION
        this._CVS = CVS
        this._mapGrid = mapGrid
        this._pixels = new Uint16Array(mapGrid.arraySize)
        this._lastPixels = new Uint16Array(mapGrid.arraySize)
        this._pxStepUpdated = new Uint8Array(mapGrid.arraySize)
        this._backStepSavingMaxCount = Simulation.DEFAULT_BACK_STEP_SAVING_COUNT
        this._backStepSaves = []
        this._isMouseWithinSimulation = true
        this._isRunning = true
        this._selectedMaterial = Simulation.MATERIALS.SAND
        this._sidePriority = Simulation.SIDE_PRIORITIES.RANDOM
        this.updatePhysicsUnitType(useWebWorkers)
        this.#updatedCachedMapPixelsRows()

        // DISPLAY
        this._showMapGrid = true
        this._mapGridRenderStyles = CVS.render.profile1.update(MapGrid.GRID_DISPLAY_COLOR, null, null, null, 1)
        this._imgMap = CVS.ctx.createImageData(...mapGrid.realDimensions)
        this._simImgMapDrawLoop = CanvasUtils.createEmptyObj(CVS, null, this.#simImgMapDraw.bind(this))
        this._brushType = Simulation.BRUSH_TYPES.PIXEL
        this._loopExtra = null
        this._stepExtra = null

        // CANVAS
        CVS.loopingCB = this.#main.bind(this)
        CVS.setMouseMove()
        CVS.setMouseLeave()
        CVS.setMouseDown(this.#mouseDown.bind(this))
        CVS.setMouseUp()
        CVS.setKeyUp(null, true)
        CVS.setKeyDown(this.#keyDown.bind(this), true)
        CVS.start()
        this._mouseListenerIds = [
            CVS.mouse.addListener([[0,0],mapGrid.realDimensions], Mouse.LISTENER_TYPES.ENTER, ()=>this._isMouseWithinSimulation = true),
            CVS.mouse.addListener([[0,0],mapGrid.realDimensions], Mouse.LISTENER_TYPES.MOVE, ()=>this._isMouseWithinSimulation = true),
            CVS.mouse.addListener([[0,0],mapGrid.realDimensions], Mouse.LISTENER_TYPES.LEAVE, ()=>this._isMouseWithinSimulation = false)
        ]
    }

    updatePhysicsUnitType(useWebWorkers) {
        const initObject = {
            MATERIALS:Simulation.MATERIALS, D:Simulation.D, MATERIAL_GROUPS:Simulation.MATERIAL_GROUPS, SIDE_PRIORITIES:Simulation.SIDE_PRIORITIES,
            pixels:this._pixels, pxStepUpdated:this._pxStepUpdated, sidePriority:this._sidePriority, 
            mapWidth:this._mapGrid.mapWidth
        }
        this._physicsUnit = useWebWorkers ? new Worker(Simulation.#WORKER_RELATIVE_PATH) : new LocalPhysicsUnit()

        if (useWebWorkers) {
            this._awaitingPhysicsUnit = 0
            this._physicsUnit.onmessage=this.#physicsUnitMessage.bind(this)
            initObject.type = Simulation.#WORKER_MESSAGE_TYPES.INIT
            this._physicsUnit.postMessage(initObject)
        } else {
            //this._physicsUnit.init(initObject) TODO CHECK
        }
    }

    /**
     * The main display and physics loop
     * @param {Number} deltaTime The deltaTime
     */
    #main(deltaTime) {
        if (this._loopExtra) this._loopExtra(deltaTime)

        const mouse = this.mouse
        if (mouse.clicked && !this.keyboard.isDown(TypingDevice.KEYS.CONTROL)) this.#placePixelFromMouse(mouse)
        
        if (this._showMapGrid) this.#drawMapGrid()
        if (this._isRunning) this.step()
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
        if (!this._pixels.buffer.byteLength) console.log("load", "CORE GOT BUFFER")
        if (mapData) {
            if (mapData instanceof Uint16Array) this.#updatePixelsFromSize(saveDimensions[0], saveDimensions[1], this._mapGrid.mapWidth, this._mapGrid.mapHeight, mapData)
            else if (typeof mapData == "string") {
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
     * Offsets the pixel array to match the updated size 
     * @param {Number} oldWidth The previous/current width of the map
     * @param {Number} oldHeight The previous/current height of the map
     * @param {Number} newWidth The new/updated width of the map
     * @param {Number} newHeight The new/updated height of the map
     * @param {Uint16Array} oldPixels The previous/current pixel array
     */
    #updatePixelsFromSize(oldWidth, oldHeight, newWidth, newHeight, oldPixels) {
        if (!this._pixels.buffer.byteLength) console.log("updatePixelsFromSize", "CORE GOT BUFFER")
        const pixels = this._pixels = new Uint16Array(this._mapGrid.arraySize), skipOffset = newWidth-oldWidth, smallestWidth = oldWidth<newWidth?oldWidth:newWidth, smallestHeight = oldHeight<newHeight?oldHeight:newHeight
        this._pxStepUpdated = new Uint8Array(this._mapGrid.arraySize)
        for (let y=0,i=0,oi=0;y<smallestHeight;y++) {
            pixels.set(oldPixels.subarray(oi, oi+smallestWidth), i)
            oi += oldWidth
            i += oldWidth+skipOffset
        }
    }

    /**
     * Updates the map dimensions
     * @param {Number?} width The new width of the map
     * @param {Number?} height The new height of the map
     */
    updateMapSize(width, height) {
        const map = this._mapGrid, oldWidth = map.mapWidth, oldHeight = map.mapHeight, oldPixels = this.getPixelsCopy()
        height = map.mapHeight = height||map.mapHeight
        width = map.mapWidth = width||map.mapWidth
        this.#updatePixelsFromSize(oldWidth, oldHeight, width, height, oldPixels)

        this._imgMap = CVS.ctx.createImageData(...map.realDimensions)
        this.updateImgMapFromPixels()

        this.mouse.updateListener(Mouse.LISTENER_TYPES.ENTER, this._mouseListenerIds[0], [[0,0], map.realDimensions])
        this.mouse.updateListener(Mouse.LISTENER_TYPES.MOVE,  this._mouseListenerIds[1], [[0,0], map.realDimensions])
        this.mouse.updateListener(Mouse.LISTENER_TYPES.LEAVE, this._mouseListenerIds[2], [[0,0], map.realDimensions])
    }

    /**
     * Updates the map pixel size
     * @param {Number} size The new map pixel size
     */
    updateMapPixelSize(size) {
        const map = this._mapGrid
        map.pixelSize = size
        this._imgMap = CVS.ctx.createImageData(...map.realDimensions)
        this.#updatedCachedMapPixelsRows()
        this.updateImgMapFromPixels()
    }

    // Draws the imageMap on the canvas
    #simImgMapDraw() {
        this.ctx.putImageData(this._imgMap, 0, 0)
    }

    // Draws a border and line to show the map grid on the canvas
    #drawMapGrid() {
        const lines = this._mapGrid.getDrawableGridPositions(), l_ll = lines.length, render = this.render
        for (let i=0;i<l_ll;i++) render.batchStroke(Render.getLine(lines[i][0], lines[i][1]), this._mapGridRenderStyles)
        render.batchStroke(Render.getRect([0,0], ...this._mapGrid.realDimensions))
    }

    #physicsUnitMessage(e) {
        const data = e.data, type = data.type, T = Simulation.#WORKER_MESSAGE_TYPES
        if (type==T.STEP) {// STEP
            this._awaitingPhysicsUnit &= ~T.STEP
            this._pixels = new Uint16Array(data.pixels)
            this.updateImgMapFromPixels()
        }
    }

    /**
     * Runs and displays one physics step
     */
    step() {
        //this.saveStep() CHECK
        const pixels = this._pixels, T = Simulation.#WORKER_MESSAGE_TYPES, unit = this._physicsUnit, stepExtra = this._stepExtra
        if (this.useLocalPhysics) {
            if (stepExtra) stepExtra()
            this._pixels = unit.step(this._pixels, this._pxStepUpdated, this._sidePriority, this._mapGrid.mapWidth)
            this.updateImgMapFromPixels()
        }
        else if (!(this._awaitingPhysicsUnit&T.STEP)) {
            if (stepExtra) stepExtra()
            this._awaitingPhysicsUnit |= T.STEP
            unit.postMessage({type:T.STEP, pixels}, [pixels.buffer])
        }
    }

    /**
     * Displays the previous physics step saved
     */
    backStep() {
        const b_ll = this._backStepSaves.length
        if (b_ll) {
            const backSave = this._backStepSaves[b_ll-1]
            this.load(backSave[0], backSave[1])
            this._backStepSaves.pop()
        }
    }

    /**
     * Saves a physics step
     */
    saveStep() {
        if (this.backStepSavingEnabled) this._backStepSaves.push([this.getPixelsCopy(), this._mapGrid.dimensions])
        if (this._backStepSaves.length > this._backStepSavingMaxCount) this._backStepSaves.shift()
    }

    /**
     * Fills the map with air
     */
    clear() {
        this.fill(Simulation.MATERIALS.AIR)
    }

    /**
     * Updates the display image map according to the pixels array
     */
    updateImgMapFromPixels() {
        if (!this._pixels.buffer.byteLength) console.log("updateImgMapFromPixels", "CORE GOT BUFFER")
        const pixels = this._pixels, lastPixels = this._lastPixels, p_ll = pixels.length, map = this._mapGrid, enableOptimization = lastPixels.length==p_ll&&map.lastPixelSize==map.pixelSize, w = map.mapWidth
        for (let i=0;i<p_ll;i++) {
            const y = (i/w)|0, mat = pixels[i]
            if (enableOptimization && mat==lastPixels[i]) continue
            this.#updateMapPixel(i-y*w, y, mat) 
        }  
        if (!enableOptimization) map.lastPixelSize = map.pixelSize
        this._lastPixels = this.getPixelsCopy()
    }
    
    /**
     * Updates a singular map pixels on the image map
     * @param {Number} rawX The X value of the pixel on the map
     * @param {Number} rawY The Y value of the pixel on the map
     * @param {Simulation.MATERIALS} material One of Simulation.MATERIALS
     */
    #updateMapPixel(rawX, rawY, material) {
        const data = this._imgMap.data, size = this._mapGrid.pixelSize, width = this._imgMap.width, x = rawX*size, y = rawY*size, R = Simulation.#CACHED_MATERIALS_ROWS
        for (let i=0;i<size;i++) data.set(R[material], ((y+i)*width+x)*4)
    }

    // Updates the cached pixels row used for drawing optimizations
    #updatedCachedMapPixelsRows() {
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

    /**
     * Places a pixel of a specified material at the specified position on the pixel map
     * @param {[x,y]} mapPos The map position of the pixel
     * @param {Simulation.MATERIALS} material The material used to draw the pixel
     */
    placePixel(mapPos, material=this._selectedMaterial) {
        if (!this._pixels.buffer.byteLength) console.log("placePixel", "CORE GOT BUFFER")
        this._pixels[this._mapGrid.mapPosToIndex(mapPos)] = material
    }

    /**
     * Places a pixel of a specified material at the specified position on the pixel map
     * @param {Number} x The X value of the pixel on the map
     * @param {Number} y The Y value of the pixel on the map
     * @param {Simulation.MATERIALS} material The material used to draw the pixel
     */
    placePixelCoords(x, y, material=this._selectedMaterial) {
        if (!this._pixels.buffer.byteLength) console.log("placePixelCoords", "CORE GOT BUFFER")
        this._pixels[this._mapGrid.mapPosToIndexCoords(x, y)] = material
    }

    /**
     * Places the selected material at the mouse position on the map, based on the selected brushType
     * @param {Mouse} mouse A CVS Mouse object
     */
    #placePixelFromMouse(mouse) {
        const mapPos = this._mapGrid.getLocalMapPixel(mouse.pos)
        if (this._isMouseWithinSimulation && mapPos) {
            const B = Simulation.BRUSH_TYPES, [x,y] = mapPos, brush = this._brushType

            if (brush&Simulation.#BRUSH_GROUPS.SMALL_OPTIMIZED) {
                if (brush == B.LINE3 || brush == B.VERTICAL_CROSS) this.fillArea([x,y-1], [x,y+1])
                if (brush == B.ROW3 || brush == B.VERTICAL_CROSS) {
                    if (x) this.placePixelCoords(x-1, y)
                    if (x != this._mapGrid.mapWidth-1) this.placePixelCoords(x+1, y)
                }
                this.placePixel(mapPos)
            } else if (brush == B.BIG_DOT) {
                if (x) this.placePixelCoords(x-2, y)
                if (x != this._mapGrid.mapWidth-2) this.placePixelCoords(x+2, y)
                    this.placePixelCoords(x, y-2)
                    this.placePixelCoords(x, y+2)
                    this.fillArea([x-1,y-1], [x+1,y+1])
            } else if (brush&Simulation.#BRUSH_GROUPS.X) {
                const offset = (Simulation.#BRUSHES_X_VALUES[brush]/2)|0
                this.fillArea([x-offset,y-offset], [x+offset,y+offset])
            }

            if (!this._isRunning) this.updateImgMapFromPixels()
        }
    }

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
            else if (keyboard.isDown([K.DIGIT_0, K.NUMPAD_0])) this._selectedMaterial = M.AIR
        }

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

    /**
     * Returns a copy of the current pixels array 
     * @returns A Uint16Array
     */
    getPixelsCopy() {
        const arraySize = this._mapGrid.arraySize, pixelsCopy = new Uint16Array(arraySize)
        if (!this._pixels.buffer.byteLength) console.log("getPixelsCopy", "CORE GOT BUFFER")
        pixelsCopy.set(this._pixels.subarray(0, arraySize))
        return pixelsCopy
    }

    /**
     * Exports/saves the current pixels array as text
     * @param {Boolean} disableCompacting Whether to disable the text compacting (not recommended for large maps)
     * @returns A string representing the current map
     */
    exportAsText(disableCompacting) {
        if (!this._pixels.buffer.byteLength) console.log("exportAsText", "CORE GOT BUFFER")
        let pixels = this._pixels, p_ll = pixels.length, state = Simulation.EXPORT_STATES.COMPACTED, textResult = ""
        
        if (disableCompacting) {
            state = Simulation.EXPORT_STATES.RAW
            textResult += pixels.toString()
        } else {
            let lastMaterial, atI = -1
            textResult = []
            for (let i=0;i<p_ll;i++) {
                const mat = pixels[i]
                if (lastMaterial == mat) textResult[atI][1]++
                else textResult[++atI] = [mat, 1]
                lastMaterial = mat
            }
            textResult = textResult.toString()
        }

        return state+Simulation.EXPORT_SEPARATOR+this._mapGrid.dimensions+","+this._mapGrid.pixelSize+Simulation.EXPORT_SEPARATOR+textResult
    }

    /**
     * Sets the state of the simulation to be running
     */
    start() {
        this._isRunning = true
    }

    /**
     * Sets the state of the simulation to be stopped
     */
    stop() {
        this._isRunning = false
    }

    /**
     * Fills the entire map with a specific material
     * @param {Simulation.MATERIALS} material The material used
     */
    fill(material=Simulation.MATERIALS.AIR) {
        if (!this._pixels.buffer.byteLength) console.log("fill", "CORE GOT BUFFER")
        const pixels = this._pixels, lastPixels = this._lastPixels, p_ll = pixels.length
        lastPixels.set(new Uint16Array(p_ll).subarray(0, lastPixels.length).fill(material+1))
        pixels.set(new Uint16Array(p_ll).fill(material))
    }

    /**
     * Fills the specified area of the map with a specific material
     * @param {[leftX, topY]} pos1 The top-left pos of the area
     * @param {[rightX, bottomY]} pos2 The bottom-right pos of the area
     * @param {Simulation.MATERIALS} material The material used
     */
    fillArea(pos1, pos2, material=this._selectedMaterial) {
        if (!this._pixels.buffer.byteLength) console.log("fillArea", "CORE GOT BUFFER")
        const pixels = this._pixels, p_ll = pixels.length, map = this._mapGrid, w = map.mapWidth, [x1, y1] = pos1, [x2, y2] = pos2 
        for (let i=0;i<p_ll;i++) {
            const y = (i/w)|0, x = i-y*w
            if (x>=x1 && x<=x2 && y>=y1 && y<=y2) this.placePixelCoords(x, y, material)
        }            
    }


    // TEMP PERFORMANCE BENCHES
    PERF_TEST_FULL_WATER_REG() {
        simulation._showMapGrid = false
        simulation.updateMapPixelSize(1)
        simulation.updateMapSize(700, 600)
        this.fill(Simulation.MATERIALS.WATER)
    }

    PERF_TEST_FULL_WATER_HIGH() {
        simulation._showMapGrid = false
        simulation.updateMapPixelSize(1)
        simulation.updateMapSize(1000, 1000)
        this.fill(Simulation.MATERIALS.WATER)
    }

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
    get backStepSavingEnabled() {return Boolean(this._backStepSavingMaxCount)}
	get backStepSavingMaxCount() {return this._backStepSavingMaxCount}
	get backStepSaves() {return this._backStepSaves}
    get brushType() {return this._brushType}
	get showMapGrid() {return this._showMapGrid}
    get useLocalPhysics() {return this._physicsUnit instanceof LocalPhysicsUnit}
    get useWebWorkers() {return !(this._physicsUnit instanceof LocalPhysicsUnit)}
    
	set loopExtra(_loopExtra) {this._loopExtra = _loopExtra}
	set stepExtra(stepExtra) {this._stepExtra = stepExtra}
	set selectedMaterial(_selectedMaterial) {this._selectedMaterial = _selectedMaterial}
	set isRunning(isRunning) {this._isRunning = isRunning}
	set brushType(brushType) {this._brushType = brushType}
	set sidePriority(sidePriority) {this._sidePriority = sidePriority}
	set backStepSavingMaxCount(_backStepSavingMaxCount) {return this._backStepSavingMaxCount = _backStepSavingMaxCount}
	set showMapGrid(_showMapGrid) {return this._showMapGrid = _showMapGrid}
	set mapGridRenderStyles(_mapGridRenderStyles) {return this._mapGridRenderStyles = _mapGridRenderStyles}
}