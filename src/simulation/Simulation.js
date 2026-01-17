class Simulation {
    static MATERIALS = {AIR:0, SAND:1<<0, WATER:1<<1, STONE:1<<2, GRAVEL:1<<3, INVERTED_WATER:1<<4}
    static MATERIAL_COLORS = {AIR:[0,0,0,0], SAND:[235,235,158,1], WATER:[0,15,242,.75], STONE:[100,100,100,1], GRAVEL:[188,188,188,1], INVERTED_WATER:[81,53,131,.75]}
    static MATERIAL_COLORS_INDEXED = []
    static MATERIAL_NAMES = []
    static DEFAULT_MATERIAL = this.MATERIALS.SAND
    static D = {t:0, r:1, b:2, l:3, tr:4, br:5, bl:6, tl:7}
    static SIDE_PRIORITY = {RANDOM:0, LEFT:1, RIGHT:2}
    static SIDE_PRIORITY_NAMES = []
    static DEFAULT_BACK_STEP_SAVING_COUNT = 20
    static EXPORT_STATES = {RAW:0, COMPACTED:1}
    static BRUSH_TYPES = {PIXEL:0, VERTICAL_CROSS:1, HOLLOW_VERTICAL_CROSS:2, LINE3:3, ROW3:4}
    static DEFAULT_BRUSH_TYPE = Simulation.BRUSH_TYPES.PIXEL
    static {
        const materials = Object.keys(Simulation.MATERIALS), m_ll = materials.length
        for (let i=0,ii=0;ii<m_ll;i=!i?1:i*2,ii++) {
            Simulation.MATERIAL_NAMES[i] = materials[ii]
            Simulation.MATERIAL_COLORS_INDEXED[i] = Simulation.MATERIAL_COLORS[materials[ii]]
        }
        Simulation.SIDE_PRIORITY_NAMES = Object.keys(Simulation.SIDE_PRIORITY)
    }

    constructor(CVS, mapGrid) {
        // SIM
        this._CVS = CVS
        this._mapGrid = mapGrid
        this._loopExtras = []
        this._pixels = new Uint16Array(mapGrid.arraySize)
        this._isMouseWithinSimulation = true
        this._selectedMaterial = Simulation.MATERIALS.SAND
        this._sidePriority = Simulation.SIDE_PRIORITY.RIGHT
        this._isRunning = true
        this._backStepSavingMaxCount = Simulation.DEFAULT_BACK_STEP_SAVING_COUNT
        this._backStepSaves = []

        // DISPLAY
        this._mapGridRenderStyles = CVS.render.profile1.update(MapGrid.GRID_DISPLAY_COLOR, null, null, null, 1)
        this._imgMap = CVS.ctx.createImageData(...mapGrid.realDimensions)
        this._simImgMapDrawLoop = CanvasUtils.createEmptyObj(CVS, null, this.#simImgMapDraw.bind(this))
        this._brushType = Simulation.BRUSH_TYPES.PIXEL

        // CANVAS
        CVS.loopingCB = this.main.bind(this)
        CVS.setMouseMove()
        CVS.setMouseLeave()
        CVS.setMouseDown(this.#mouseDown.bind(this))
        CVS.setMouseUp()
        CVS.setKeyUp(null, true)
        CVS.setKeyDown(this.#keyDown.bind(this), true)
        CVS.start()

        CVS.mouse.addListener([[0,0],mapGrid.realDimensions], Mouse.LISTENER_TYPES.ENTER, ()=>this._isMouseWithinSimulation = true)
        CVS.mouse.addListener([[0,0],mapGrid.realDimensions], Mouse.LISTENER_TYPES.LEAVE, ()=>this._isMouseWithinSimulation = false)
    }

    main(deltaTime) {
        for (let i=0;i<this._loopExtras.length;i++) this._loopExtras[i](deltaTime)

        const mouse = this.mouse
        if (mouse.clicked && !this.keyboard.isDown(TypingDevice.KEYS.CONTROL)) this.#placePixelFromMouse(mouse)
        
        this.#drawMapGrid()
        if (this._isRunning) this.step()
    }

    load(mapData) {
        if (mapData) {
            if (mapData instanceof Uint16Array) this._pixels.set(mapData)
            else if (typeof mapData == "string") {
                const exportType = mapData[0]
                mapData = mapData.slice(2).split(",")
                if (exportType==Simulation.EXPORT_STATES.RAW) this._pixels = new Uint16Array(mapData)
                else if (exportType==Simulation.EXPORT_STATES.COMPACTED) {
                    let m_ll = mapData.length, offset = 0
                    for (let i=0;i<m_ll;i+=2) {
                        const count = mapData[i+1]
                        this._pixels.set(new Uint16Array(count).fill(mapData[i]), offset)
                        offset += +count
                    }
                }
            }
            else this._pixels = new Uint16Array(Object.values(mapData))
            this.updateImgMapFromPixels()
        }
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
        const updated = [], pixels = this._pixels, p_ll = pixels.length, M = Simulation.MATERIALS, D = Simulation.D, checkAdjacency = this.checkAdjacency.bind(this), moveAdjacency = this._mapGrid.moveAdjacency.bind(this._mapGrid)
        this.saveStep()

        for (let i=0;i<p_ll;i++) {
            const mat = pixels[i]
            if (updated.includes(i) || mat == M.AIR) continue
            let newMaterial = mat, newIndex = -1, replaceMaterial = M.AIR, lockUpdates = true

            // SAND
            if (mat == M.SAND) {
                const transpiercedMaterial = checkAdjacency(i, D.b)
                // check if can go down or sides
                if (transpiercedMaterial == M.AIR || transpiercedMaterial == M.WATER) newIndex = moveAdjacency(i, D.b)
                else if (transpiercedMaterial == mat) {
                    const sideSelection = this.#getSideSelectionPriority()
                    if      (sideSelection[0] && checkAdjacency(i, D.bl) == M.AIR) newIndex = moveAdjacency(i, D.bl)
                    else if (sideSelection[1] && checkAdjacency(i, D.br) == M.AIR) newIndex = moveAdjacency(i, D.br)
                    else if (sideSelection[2] && checkAdjacency(i, D.bl) == M.AIR) newIndex = moveAdjacency(i, D.bl)
                }
                // check what to replace prev pos with
                if (transpiercedMaterial == M.WATER && (checkAdjacency(i, D.l) == M.WATER || checkAdjacency(i, D.r) == M.WATER)) replaceMaterial = M.WATER
            }
            // WATER
            else if (mat == M.WATER) {
                const transpiercedMaterial = checkAdjacency(i, D.b)
                // check if can go down or sides
                if (transpiercedMaterial == M.AIR) newIndex = moveAdjacency(i, D.b)
                else {
                    const sideSelection = this.#getSideSelectionPriority(), leftIsAir = checkAdjacency(i, D.l) == M.AIR
                    if      (sideSelection[0] && checkAdjacency(i, D.bl) == M.AIR && leftIsAir) newIndex = moveAdjacency(i, D.bl)
                    else if (sideSelection[1] && checkAdjacency(i, D.br) == M.AIR && checkAdjacency(i, D.r) == M.AIR) newIndex = moveAdjacency(i, D.br)
                    else if (sideSelection[2] && checkAdjacency(i, D.bl) == M.AIR && leftIsAir) newIndex = moveAdjacency(i, D.bl)
                    else if (sideSelection[0] && leftIsAir) newIndex = moveAdjacency(i, D.l)
                    else if (sideSelection[1] && checkAdjacency(i, D.r) == M.AIR) newIndex = moveAdjacency(i, D.r)
                    else if (sideSelection[2] && leftIsAir) newIndex = moveAdjacency(i, D.l)
                }
            }
            // GRAVEL
            else if (mat == M.GRAVEL) {
                const transpiercedMaterial = checkAdjacency(i, D.b)
                // check if can go down
                if (transpiercedMaterial == M.AIR || transpiercedMaterial == M.WATER) newIndex = moveAdjacency(i, D.b)
                // check what to replace prev pos with
                if (transpiercedMaterial == M.WATER && checkAdjacency(i, D.l) == M.WATER && checkAdjacency(i, D.r) == M.WATER) replaceMaterial = M.WATER
            }
            // INVERTED WATER
            else if (mat == M.INVERTED_WATER) {
                const transpiercedMaterial = checkAdjacency(i, D.t)
                // check if can go down or sides
                if (transpiercedMaterial == M.AIR) newIndex = moveAdjacency(i, D.t)
                else {
                    const sideSelection = this.#getSideSelectionPriority(), leftIsAir = checkAdjacency(i, D.l) == M.AIR
                    if      (sideSelection[0] && checkAdjacency(i, D.tl) == M.AIR && leftIsAir) newIndex = moveAdjacency(i, D.tl)
                    else if (sideSelection[1] && checkAdjacency(i, D.tr) == M.AIR && checkAdjacency(i, D.r) == M.AIR) newIndex = moveAdjacency(i, D.tr)
                    else if (sideSelection[2] && checkAdjacency(i, D.tl) == M.AIR && leftIsAir) newIndex = moveAdjacency(i, D.tl)
                    else if (sideSelection[0] && leftIsAir) newIndex = moveAdjacency(i, D.l)
                    else if (sideSelection[1] && checkAdjacency(i, D.r) == M.AIR) newIndex = moveAdjacency(i, D.r)
                    else if (sideSelection[2] && leftIsAir) newIndex = moveAdjacency(i, D.l)
                }
            }

            // UPDATE
            if (newIndex != -1) {
                if (lockUpdates) updated.push(newIndex)
                pixels[newIndex] = newMaterial
                pixels[i] = replaceMaterial
            }
        }

        this.updateImgMapFromPixels()
    }

    backStep() {
        const b_ll = this._backStepSaves.length
        if (b_ll) {
            this.load(this._backStepSaves[b_ll-1])
            this._backStepSaves.pop()
        }
    }

    saveStep() {
        if (this.backStepSavingEnabled) this._backStepSaves.push(this.getPixelsCopy())
        if (this._backStepSaves.length > this._backStepSavingMaxCount) this._backStepSaves.shift()
    }

    clear(material=Simulation.MATERIALS.AIR) {
        this._pixels.fill(material)
        if (!this._isRunning) this.updateImgMapFromPixels()
    }

    #getSideSelectionPriority() {
        const sidePriority = this._sidePriority, S = Simulation.SIDE_PRIORITY, isRandom = sidePriority==S.RANDOM, isRight = sidePriority==S.RIGHT
        let resLeft = true, resRight = true
        if (isRandom) resLeft = !(resRight=Math.random()<0.5)
        else if (isRight) resLeft = false
        return [resLeft, resRight, (!isRandom)||isRight]
    }

    checkAdjacency(i, direction) {
        return this._pixels[this._mapGrid.moveAdjacency(i, direction)]
    }

    updateImgMapFromPixels() {
        const pixels = this._pixels, p_ll = pixels.length, map = this._mapGrid, w = map.mapWidth, C = Simulation.MATERIAL_COLORS_INDEXED
        for (let i=0,x=0,y=0;i<p_ll;i++) {
            x = i%w
            if (i&&!x) y++
            this.#updateMapPixel([x,y], C[pixels[i]]) // can be optimized
        }
    }

    #updateMapPixel(mapPos, rgba) {
        const data = this._imgMap.data, width = this._imgMap.width,
            r = rgba[0]??255, g = rgba[1]??0, b = rgba[2]??0, a = (rgba[3]??1)*255,
            size = this._mapGrid.pixelSize, x = mapPos[0]*size, y = mapPos[1]*size,
            pxRow = new Uint8ClampedArray(size*4) // could be cached OPTIMIZATION

        for (let i=0;i<size;i++) {
            const ii = i*4
            pxRow[ii]   = r
            pxRow[ii+1] = g
            pxRow[ii+2] = b
            pxRow[ii+3] = a
        }

        for (let i=0;i<size;i++) {
            const offset = ((y+i)*width+x)*4
            data.set(pxRow, offset)
        }
    }

    placePixel(mapPos) {
        this._pixels[this._mapGrid.mapPosToIndex(mapPos)] = this._selectedMaterial
    }

    #placePixelFromMouse(mouse) {
        const mapPos = this._mapGrid.getLocalMapPixel(mouse.pos)
        if (this._isMouseWithinSimulation && mapPos) {
            const B = Simulation.BRUSH_TYPES, [x,y] = mapPos
            if (this._brushType == B.LINE3 || this._brushType == B.VERTICAL_CROSS || this._brushType == B.HOLLOW_VERTICAL_CROSS) {
                this.placePixel([x,y-1])
                this.placePixel([x,y+1])
            }
            if (this._brushType == B.ROW3 || this._brushType == B.VERTICAL_CROSS || this._brushType == B.HOLLOW_VERTICAL_CROSS) {
                if (x) this.placePixel([x-1,y])
                if (x != this._mapGrid.mapWidth-1) this.placePixel([x+1,y])
            }
            if (this._brushType != B.HOLLOW_VERTICAL_CROSS) this.placePixel(mapPos)

            if (!this._isRunning) this.updateImgMapFromPixels()
        }
    }

    #keyDown(keyboard) {
        const K = TypingDevice.KEYS, M = Simulation.MATERIALS
        if (keyboard.isDown([K.DIGIT_1, K.NUMPAD_1])) this._selectedMaterial = M.SAND 
        else if (keyboard.isDown([K.DIGIT_2, K.NUMPAD_2])) this._selectedMaterial = M.WATER
        else if (keyboard.isDown([K.DIGIT_3, K.NUMPAD_3])) this._selectedMaterial = M.STONE
        else if (keyboard.isDown([K.DIGIT_4, K.NUMPAD_4])) this._selectedMaterial = M.GRAVEL
        else if (keyboard.isDown([K.DIGIT_5, K.NUMPAD_5])) this._selectedMaterial = M.INVERTED_WATER
        else if (keyboard.isDown([K.DIGIT_0, K.NUMPAD_0])) this._selectedMaterial = M.AIR

        else if (keyboard.isDown([K.ARROW_RIGHT])) this.step()
        else if (keyboard.isDown([K.ARROW_LEFT])) this.backStep()

        else if (keyboard.isDown([K.SPACE])) this.start()
        else if (keyboard.isDown([K.ESCAPE])) this.stop()


        if (keyboard.isDown(K.CONTROL) && keyboard.isDown(K.BACKSPACE)) this.clear()
    }

    #mouseDown(mouse) {
        this.#placePixelFromMouse(mouse)
    }

    getPixelsCopy() {
        const pixelsCopy = new Uint16Array(this._mapGrid.arraySize)
        pixelsCopy.set(this._pixels)
        return pixelsCopy
    }

    exportAsText(disableCompacting) {
        let pixels = this._pixels, p_ll = pixels.length, prefix = Simulation.EXPORT_STATES.COMPACTED+"x", textResult = ""
        
        if (disableCompacting) {
            prefix = Simulation.EXPORT_STATES.RAW+"x"
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

        return prefix+textResult
    }

    start() {
        this._isRunning = true
    }

    stop() {
        this._isRunning = false
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