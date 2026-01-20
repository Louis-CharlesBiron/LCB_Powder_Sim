class Simulation {
    static MATERIALS = {AIR:0, SAND:1<<0, WATER:1<<1, STONE:1<<2, GRAVEL:1<<3, INVERTED_WATER:1<<4}
    static MATERIAL_COLORS = {AIR:[0,0,0,0], SAND:[235,235,158,1], WATER:[0,15,242,.75], STONE:[100,100,100,1], GRAVEL:[188,188,188,1], INVERTED_WATER:[81,53,131,.75]}
    static MATERIAL_GROUPS = {LIQUIDS:Simulation.MATERIALS.WATER+Simulation.MATERIALS.INVERTED_WATER}
    static MATERIAL_COLORS_INDEXED = []
    static MATERIAL_NAMES = []
    static #CACHED_MATERIALS_ROWS = []
    static DEFAULT_MATERIAL = this.MATERIALS.SAND
    static D = {t:1<<0, r:1<<1, b:1<<2, l:1<<3, tr:1<<4, br:1<<5, bl:1<<6, tl:1<<7}
    static SIDE_PRIORITY = {RANDOM:0, LEFT:1, RIGHT:2, MAP_DEPENDANT:3}
    static SIDE_PRIORITY_NAMES = []
    static DEFAULT_BACK_STEP_SAVING_COUNT = 50
    static EXPORT_STATES = {RAW:0, COMPACTED:1}
    static EXPORT_SEPARATOR = "x"
    static BRUSH_TYPES = {PIXEL:1<<0, VERTICAL_CROSS:1<<1, LINE3:1<<2, ROW3:1<<3, BIG_DOT:1<<4, X3:1<<5, X5:1<<6, X15:1<<7, X25:1<<8, X55:1<<9, X99:1<<10}
    static #BRUSHES_X_VALUES = []
    static #BRUSH_GROUPS = {SMALL_OPTIMIZED:Simulation.BRUSH_TYPES.PIXEL+Simulation.BRUSH_TYPES.VERTICAL_CROSS+Simulation.BRUSH_TYPES.LINE3+Simulation.BRUSH_TYPES.ROW3, X:Simulation.BRUSH_TYPES.X3+Simulation.BRUSH_TYPES.X5+Simulation.BRUSH_TYPES.X15+Simulation.BRUSH_TYPES.X25+Simulation.BRUSH_TYPES.X55+Simulation.BRUSH_TYPES.X99}
    static DEFAULT_BRUSH_TYPE = Simulation.BRUSH_TYPES.PIXEL
    static {
        const M = Simulation.MATERIALS, materials = Object.keys(M), m_ll = materials.length
        for (let i=0,ii=0;ii<m_ll;i=!i?1:i*2,ii++) {
            Simulation.MATERIAL_NAMES[i] = materials[ii]
            Simulation.MATERIAL_COLORS_INDEXED[i] = Simulation.MATERIAL_COLORS[materials[ii]]
        }

        Simulation.SIDE_PRIORITY_NAMES = Object.keys(Simulation.SIDE_PRIORITY)

        const brushesX = Object.keys(Simulation.BRUSH_TYPES).filter(b=>b.startsWith("X")), b_ll = brushesX.length
        for (let i=Simulation.BRUSH_TYPES[brushesX[0]],ii=0;ii<b_ll;i=!i?1:i*2,ii++) Simulation.#BRUSHES_X_VALUES[i] = +brushesX[ii].slice(1)
    }

    constructor(CVS, mapGrid) {
        // SIM
        this._CVS = CVS
        this._mapGrid = mapGrid
        this._loopExtras = []
        this._pixels = new Uint16Array(mapGrid.arraySize)
        this._lastPixels = new Uint16Array(mapGrid.arraySize)
        this._isMouseWithinSimulation = true
        this._selectedMaterial = Simulation.MATERIALS.SAND
        this._sidePriority = Simulation.SIDE_PRIORITY.RIGHT
        this._isRunning = true
        this._backStepSavingMaxCount = Simulation.DEFAULT_BACK_STEP_SAVING_COUNT
        this._backStepSaves = []
        this.#updatedCachedMapPixelsRows()

        // DISPLAY
        this._showMapGrid = true
        this._mapGridRenderStyles = CVS.render.profile1.update(MapGrid.GRID_DISPLAY_COLOR, null, null, null, 1)
        this._imgMap = CVS.ctx.createImageData(...mapGrid.realDimensions)
        this._simImgMapDrawLoop = CanvasUtils.createEmptyObj(CVS, null, this.#simImgMapDraw.bind(this))
        this._brushType = Simulation.BRUSH_TYPES.PIXEL

        // CANVAS
        this._mouseListenerIds = []
        CVS.loopingCB = this.main.bind(this)
        CVS.setMouseMove()
        CVS.setMouseLeave()
        CVS.setMouseDown(this.#mouseDown.bind(this))
        CVS.setMouseUp()
        CVS.setKeyUp(null, true)
        CVS.setKeyDown(this.#keyDown.bind(this), true)
        CVS.start()

        this._mouseListenerIds.push(CVS.mouse.addListener([[0,0],mapGrid.realDimensions], Mouse.LISTENER_TYPES.ENTER, ()=>this._isMouseWithinSimulation = true))
        this._mouseListenerIds.push(CVS.mouse.addListener([[0,0],mapGrid.realDimensions], Mouse.LISTENER_TYPES.LEAVE, ()=>this._isMouseWithinSimulation = false))
    }

    main(deltaTime) {
        for (let i=0;i<this._loopExtras.length;i++) this._loopExtras[i](deltaTime)

        const mouse = this.mouse
        if (mouse.clicked && !this.keyboard.isDown(TypingDevice.KEYS.CONTROL)) this.#placePixelFromMouse(mouse)
        
        if (this._showMapGrid) this.#drawMapGrid()
        if (this._isRunning) this.step()
    }

    load(mapData, saveDimensions=null) {
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

    #updatePixelsFromSize(oldWidth, oldHeight, newWidth, newHeight, oldPixels) {
        const pixels = this._pixels = new Uint16Array(this._mapGrid.arraySize), skipOffset = newWidth-oldWidth, smallestWidth = oldWidth<newWidth?oldWidth:newWidth, smallestHeight = oldHeight<newHeight?oldHeight:newHeight
        for (let y=0,i=0,oi=0;y<smallestHeight;y++) {
            pixels.set(oldPixels.subarray(oi, oi+smallestWidth), i)
            oi += oldWidth
            i += oldWidth+skipOffset
        }
    }

    updateMapSize(width, height) {
        const map = this._mapGrid, oldWidth = map.mapWidth, oldHeight = map.mapHeight, oldPixels = this.getPixelsCopy()
        height = map.mapHeight = height||map.mapHeight
        width = map.mapWidth = width||map.mapWidth
        this.#updatePixelsFromSize(oldWidth, oldHeight, width, height, oldPixels)

        this._imgMap = CVS.ctx.createImageData(...map.realDimensions)
        this.updateImgMapFromPixels()

        this.mouse.updateListener(Mouse.LISTENER_TYPES.ENTER, this._mouseListenerIds[0], [[0,0], map.realDimensions])
        this.mouse.updateListener(Mouse.LISTENER_TYPES.LEAVE, this._mouseListenerIds[1], [[0,0], map.realDimensions])
    }

    updateMapPixelSize(size) {
        const map = this._mapGrid
        map.pixelSize = size
        this._imgMap = CVS.ctx.createImageData(...map.realDimensions)
        this.#updatedCachedMapPixelsRows()
        this.updateImgMapFromPixels()
    }

    #simImgMapDraw() {
        this.ctx.putImageData(this._imgMap, 0, 0)
    }

    #drawMapGrid() {
        const lines = this._mapGrid.getDrawableGridPositions(), l_ll = lines.length, render = this.render
        for (let i=0;i<l_ll;i++) render.batchStroke(Render.getLine(lines[i][0], lines[i][1]), this._mapGridRenderStyles)
        render.batchStroke(Render.getRect([0,0], ...this._mapGrid.realDimensions))
    }

    addLoopExtra(callback) {
        this._loopExtras.push(callback)
    }

    step() {
        const updated = new Set(), pixels = this._pixels, p_ll = pixels.length, M = Simulation.MATERIALS, AIR = M.AIR, G = Simulation.MATERIAL_GROUPS, D = Simulation.D, map = this._mapGrid, moveAdjacency = map.moveAdjacency.bind(map), w = map.mapWidth
        this.saveStep()

        for (let i=0;i<p_ll;i++) {
            const mat = pixels[i]
            if (mat == AIR || updated.has(i)) continue
            let newMaterial = mat, newIndex = -1, replaceMaterial = AIR, lockUpdates = true

            // SAND
            if (mat == M.SAND) {
                const transpiercedMaterialIndex = moveAdjacency(i, D.b), transpiercedMaterial = pixels[transpiercedMaterialIndex], transpiercedLiquid = transpiercedMaterial&G.LIQUIDS
                // check if can go down or sides
                if (transpiercedMaterial == AIR || transpiercedLiquid) newIndex = transpiercedMaterialIndex
                else if (transpiercedMaterial == mat) {
                    const sideSelection = this.#getSideSelectionPriority(), i_BL = moveAdjacency(i, D.bl), i_BR = moveAdjacency(i, D.br)
                    if      (sideSelection[0] && pixels[i_BL] == AIR) newIndex = i_BL
                    else if (sideSelection[1] && pixels[i_BR] == AIR) newIndex = i_BR
                    else if (sideSelection[2] && pixels[i_BL] == AIR) newIndex = i_BL
                }
                // check what to replace prev pos with
                if (transpiercedLiquid && (pixels[moveAdjacency(i, D.l)]&G.LIQUIDS || pixels[moveAdjacency(i, D.r)]&G.LIQUIDS)) replaceMaterial = transpiercedLiquid
            }
            // WATER
            else if (mat == M.WATER) {
                const transpiercedMaterialIndex = moveAdjacency(i, D.b), transpiercedMaterial = pixels[transpiercedMaterialIndex]
                // check if can go down or sides
                if (transpiercedMaterial == AIR) newIndex = transpiercedMaterialIndex
                else {
                    const sideSelection = this.#getSideSelectionPriority(i, w), i_L = moveAdjacency(i, D.l), leftIsAir = pixels[i_L] == AIR, i_BL = moveAdjacency(i, D.bl), i_BR = moveAdjacency(i, D.br), i_R = moveAdjacency(i, D.r)
                    if      (sideSelection[0] && pixels[i_BL] == AIR && leftIsAir) newIndex = i_BL
                    else if (sideSelection[1] && pixels[i_BR] == AIR && pixels[i_R] == AIR) newIndex = i_BR
                    else if (sideSelection[2] && pixels[i_BL] == AIR && leftIsAir) newIndex = i_BL
                    else if (sideSelection[0] && leftIsAir) newIndex = i_L
                    else if (sideSelection[1] && pixels[i_R] == AIR) newIndex = i_R
                    else if (sideSelection[2] && leftIsAir) newIndex = i_L
                }
            }
            // GRAVEL
            else if (mat == M.GRAVEL) {
                const transpiercedMaterialIndex = moveAdjacency(i, D.b), transpiercedMaterial = pixels[transpiercedMaterialIndex], transpiercedLiquid = transpiercedMaterial&G.LIQUIDS
                // check if can go down
                if (transpiercedMaterial == AIR || transpiercedLiquid) newIndex = transpiercedMaterialIndex
                // check what to replace prev pos with
                if (transpiercedLiquid && (pixels[moveAdjacency(i, D.l)]&G.LIQUIDS || pixels[moveAdjacency(i, D.r)]&G.LIQUIDS)) replaceMaterial = transpiercedLiquid
            }
            // INVERTED WATER
            else if (mat == M.INVERTED_WATER) {
                const transpiercedMaterialIndex = moveAdjacency(i, D.t), transpiercedMaterial = pixels[transpiercedMaterialIndex]
                // check if can go down or sides
                if (transpiercedMaterial == AIR) newIndex = transpiercedMaterialIndex
                else {
                    const sideSelection = this.#getSideSelectionPriority(), i_L = moveAdjacency(i, D.l), leftIsAir = pixels[i_L] == AIR, i_TL = moveAdjacency(i, D.tl), i_TR = moveAdjacency(i, D.tr), i_R = moveAdjacency(i, D.r)
                    if      (sideSelection[0] && pixels[i_TL] == AIR && leftIsAir) newIndex = i_TL
                    else if (sideSelection[1] && pixels[i_TR] == AIR && pixels[i_R] == AIR) newIndex = i_TR
                    else if (sideSelection[2] && pixels[i_TL] == AIR && leftIsAir) newIndex = i_TL
                    else if (sideSelection[0] && leftIsAir) newIndex = i_L
                    else if (sideSelection[1] && pixels[i_R] == AIR) newIndex = i_R
                    else if (sideSelection[2] && leftIsAir) newIndex = i_L
                }
            }

            // UPDATE
            if (newIndex != -1) {
                if (lockUpdates) updated.add(newIndex)
                pixels[newIndex] = newMaterial
                pixels[i] = replaceMaterial
            }
        }

        this.updateImgMapFromPixels()
    }

    backStep() {
        const b_ll = this._backStepSaves.length
        if (b_ll) {
            const backSave = this._backStepSaves[b_ll-1]
            this.load(backSave[0], backSave[1])
            this._backStepSaves.pop()
        }
    }

    saveStep() {
        if (this.backStepSavingEnabled) this._backStepSaves.push([this.getPixelsCopy(), this._mapGrid.dimensions])
        if (this._backStepSaves.length > this._backStepSavingMaxCount) this._backStepSaves.shift()
    }

    clear() {
        this.fill(Simulation.MATERIALS.AIR)
    }

    #getSideSelectionPriority(i, mapWidth) {
        const sidePriority = this._sidePriority, S = Simulation.SIDE_PRIORITY, isRandom = sidePriority==S.RANDOM, isRight = sidePriority==S.RIGHT
        let resLeft = true, resRight = true, backupLeft = (!isRandom)||isRight
        if (isRandom) resLeft = !(resRight=Math.random()<0.5)
        else if (isRight) resLeft = false
        else if (sidePriority==S.MAP_DEPENDANT) {// TODO FIX
            const isMoreLeft = (i%mapWidth)<(mapWidth/2)
            resLeft = isMoreLeft
            resRight = !isMoreLeft
            if (resRight) backupLeft = true
        }
        return [resLeft, resRight, backupLeft]
    }

    updateImgMapFromPixels() {
        const pixels = this._pixels, lastPixels = this._lastPixels, p_ll = pixels.length, map = this._mapGrid, enableOptimization = lastPixels.length==p_ll&&map.lastPixelSize==map.pixelSize, w = map.mapWidth
        for (let i=0;i<p_ll;i++) {
            const y = (i/w)|0, mat = pixels[i]
            if (enableOptimization && mat==lastPixels[i]) continue
            this.#updateMapPixel(i-y*w, y, mat) 
        }  
        if (!enableOptimization) map.lastPixelSize = map.pixelSize
        this._lastPixels = this.getPixelsCopy()
    }
    
    #updateMapPixel(rawX, rawY, material) {
        const data = this._imgMap.data, size = this._mapGrid.pixelSize, width = this._imgMap.width, x = rawX*size, y = rawY*size, R = Simulation.#CACHED_MATERIALS_ROWS
        for (let i=0;i<size;i++) data.set(R[material], ((y+i)*width+x)*4)
    }

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

    placePixel(mapPos, material=this._selectedMaterial) {
        this._pixels[this._mapGrid.mapPosToIndex(mapPos)] = material
    }

    placePixelCoords(x, y, material=this._selectedMaterial) {
        this._pixels[this._mapGrid.mapPosToIndexCoords(x, y)] = material
    }

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
            e.preventDefault()
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

    #mouseDown(mouse) {
        this.#placePixelFromMouse(mouse)
    }

    getPixelsCopy() {
        const arraySize = this._mapGrid.arraySize, pixelsCopy = new Uint16Array(arraySize)
        pixelsCopy.set(this._pixels.subarray(0, arraySize))
        return pixelsCopy
    }

    exportAsText(disableCompacting) {
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

    start() {
        this._isRunning = true
    }

    stop() {
        this._isRunning = false
    }

    fill(material=Simulation.MATERIALS.AIR) {
        const pixels = this._pixels, lastPixels = this._lastPixels, p_ll = pixels.length
        lastPixels.set(new Uint16Array(p_ll).subarray(0, lastPixels.length).fill(material+1))
        pixels.set(new Uint16Array(p_ll).fill(material))
        this.updateImgMapFromPixels()
    }

    fillArea(pos1, pos2, material=this._selectedMaterial) {
        const pixels = this._pixels, p_ll = pixels.length, map = this._mapGrid, w = map.mapWidth, [x1, y1] = pos1, [x2, y2] = pos2 
        for (let i=0;i<p_ll;i++) {
            const y = (i/w)|0, x = i-y*w
            if (x>=x1 && x<=x2 && y>=y1 && y<=y2) this.placePixelCoords(x, y, material)
        }            
        this.updateImgMapFromPixels()
    }

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
	get loopExtras() {return this._loopExtras}
	get pixels() {return this._pixels}
	get mapGridRenderStyles() {return this._mapGridRenderStyles}
	get imgMap() {return this._imgMap}
    get isMouseWithinSimulation() {return this._isMouseWithinSimulation}
	get selectedMaterial() {return this._selectedMaterial}
    get sidePriority() {return this._sidePriority}
    get isRunning() {return this._isRunning}
    get backStepSavingEnabled() {return this._backStepSavingMaxCount}
    get brushType() {return this._brushType}
    
	set loopExtras(_loopExtras) {this._loopExtras = _loopExtras}
	set selectedMaterial(_selectedMaterial) {this._selectedMaterial = _selectedMaterial}
	set isRunning(isRunning) {this._isRunning = isRunning}
	set brushType(brushType) {this._brushType = brushType}
	set sidePriority(sidePriority) {this._sidePriority = sidePriority}
}