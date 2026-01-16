class Simulation {
    static MATERIALS = {DEFAULT:2, AIR:0, TEST:1, SAND:2, WATER:3, STONE:4, GRAVEL:5}
    static MATERIAL_COLORS = {AIR:[0,0,0,0], TEST:[200,0,0,1], SAND:[235,235,158,1], WATER:[0,0,255,1], STONE:[100,100,100,1], GRAVEL:[188,188,188,1]}
    static MATERIAL_NAMES = ["AIR", "TEST", "SAND", "WATER", "STONE", "GRAVEL"]
    static D = {t:0, r:1, b:2, l:3, tr:4, br:5, bl:6, tl:7}
    static SIDE_PRIORITY = {RANDOM:0, LEFT:1, RIGHT:2}

    constructor(CVS, mapGrid) {
        // SIM
        this._CVS = CVS
        this._mapGrid = mapGrid
        this._loopExtras = []
        this._pixels = new Uint8Array(mapGrid.arraySize)
        this._isMouseWithinSimulation = true
        this._selectedMaterial = Simulation.MATERIALS.DEFAULT
        this._sidePriority = Simulation.SIDE_PRIORITY.LEFT

        // DISPLAY
        this._mapGridRenderStyles = CVS.render.profile1.update(MapGrid.GRID_DISPLAY_COLOR, null, null, null, 1)
        this._imgMap = CVS.ctx.createImageData(...mapGrid.realDimensions)
        this._simImgMapDrawLoop = CanvasUtils.createEmptyObj(CVS, null, this.simImgMapDraw.bind(this))
        this._materialColorsIndexes = Object.values(Simulation.MATERIAL_COLORS)

        // CANVAS
        CVS.loopingCB = this.main.bind(this)
        CVS.setMouseMove()
        CVS.setMouseLeave()
        CVS.setMouseDown(this.mouseDown.bind(this))
        CVS.setMouseUp()
        CVS.setKeyUp(null, true)
        CVS.setKeyDown(this.keyDown.bind(this), true)
        CVS.start()
        CVS.mouse.addListener([[0,0],mapGrid.realDimensions], Mouse.LISTENER_TYPES.ENTER, ()=>this._isMouseWithinSimulation = true)
        CVS.mouse.addListener([[0,0],mapGrid.realDimensions], Mouse.LISTENER_TYPES.LEAVE, ()=>this._isMouseWithinSimulation = false)
    }

    main(deltaTime) {
        for (let i=0;i<this._loopExtras.length;i++) this._loopExtras[i](deltaTime)

        const mouse = this.mouse
        if (mouse.clicked && !this.keyboard.isDown(TypingDevice.KEYS.CONTROL)) this.#placePixelFromMouse(mouse)
        
        this.drawMapGrid()
        this.step()
        //this.updateImgMapFromPixels()
    }

    load(mapData) {
        if (typeof mapData == "object") this._pixels = new Uint8Array(Object.values(mapData))
        this.updateImgMapFromPixels()
    }

    simImgMapDraw() {
        this.ctx.putImageData(this._imgMap, 0, 0)
    }

    drawMapGrid() {
        const lines = this._mapGrid.getDrawableGridPositions(), l_ll = lines.length, render = this.render
        for (let i=0;i<l_ll;i++) render.batchStroke(Render.getLine(lines[i][0], lines[i][1]), this._mapGridRenderStyles)
        render.batchStroke(Render.getRect([0,0], ...this._mapGrid.realDimensions))
    }

    addLoopExtra(callback) {
        this._loopExtras.push(callback)
    }

    step() {
        const updated = [], pixels = this._pixels, p_ll = pixels.length, M = Simulation.MATERIALS, D = Simulation.D, checkAdjacency = this.checkAdjacency.bind(this)
        for (let i=0;i<p_ll;i++) {
            const mat = pixels[i]
            if (updated.includes(i) || mat == M.AIR) continue
            let newMaterial = mat, newIndex = -1, replaceMaterial = M.AIR, lockUpdates = true

            // SAND
            if (mat == M.SAND) {
                const transpiercedMaterial = checkAdjacency(i, D.b)
                // check if can go down or sides
                if (transpiercedMaterial == M.AIR || transpiercedMaterial == M.WATER) newIndex = this.moveAdjacency(i, D.b)
                else if (transpiercedMaterial == mat) {
                    const sideSelection = this.#getSideSelectionPriority()
                    if      (sideSelection[0] && checkAdjacency(i, D.bl) == M.AIR) newIndex = this.moveAdjacency(i, D.bl)
                    else if (sideSelection[1] && checkAdjacency(i, D.br) == M.AIR) newIndex = this.moveAdjacency(i, D.br)
                    else if (checkAdjacency(i, D.bl) == M.AIR) newIndex = this.moveAdjacency(i, D.bl)
                }
                // check what to replace prev pos with
                if (transpiercedMaterial == M.WATER) {
                    if (checkAdjacency(i, D.l) == M.WATER || checkAdjacency(i, D.r) == M.WATER) replaceMaterial = M.WATER
                    //else if (checkAdjacency(i, D.l) == mat && )
                } 
            }
            // WATER
            else if (mat == M.WATER) {
                const transpiercedMaterial = checkAdjacency(i, D.b)
                // check if can go down or sides
                if (transpiercedMaterial == M.AIR) newIndex = this.moveAdjacency(i, D.b)
                else {
                    const sideSelection = this.#getSideSelectionPriority(), leftIsAir = checkAdjacency(i, D.l) == M.AIR
                    if      (sideSelection[0] && checkAdjacency(i, D.bl) == M.AIR && leftIsAir) newIndex = this.moveAdjacency(i, D.bl)
                    else if (sideSelection[1] && checkAdjacency(i, D.br) == M.AIR && checkAdjacency(i, D.r) == M.AIR) newIndex = this.moveAdjacency(i, D.br)
                    else if (checkAdjacency(i, D.bl) == M.AIR && leftIsAir) newIndex = this.moveAdjacency(i, D.bl)
                    else if (sideSelection[0] && leftIsAir) newIndex = this.moveAdjacency(i, D.l)
                    else if (sideSelection[1] && checkAdjacency(i, D.r) == M.AIR) newIndex = this.moveAdjacency(i, D.r)
                    else if (leftIsAir) newIndex = this.moveAdjacency(i, D.l)
                }
            }
            // GRAVEL
            else if (mat == M.GRAVEL) {
                const transpiercedMaterial = checkAdjacency(i, D.b)
                // check if can go down
                if (transpiercedMaterial == M.AIR || transpiercedMaterial == M.WATER) newIndex = this.moveAdjacency(i, D.b)
                // check what to replace prev pos with
                if (transpiercedMaterial == M.WATER && checkAdjacency(i, D.l) == M.WATER && checkAdjacency(i, D.r) == M.WATER) replaceMaterial = M.WATER
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

    #getSideSelectionPriority() {
        const sidePriority = this._sidePriority, S = Simulation.SIDE_PRIORITY
        let resLeft = true, resRight = true
        if (sidePriority==S.RANDOM) resLeft = !(resRight=Math.random()<0.5)
        else if (sidePriority==S.RIGHT) resLeft = false
        return [resLeft, resRight]
    }

    checkAdjacency(i, direction) {
        return this._pixels[this.moveAdjacency(i, direction)]
    }

    moveAdjacency(i, direction) {
        const D = Simulation.D, w = this._mapGrid.mapWidth
        if (direction == D.t)       return i-w
        else if (direction == D.b)  return i+w
        else if (direction == D.r)  return !((i+1)%w) ? i : i+1
        else if (direction == D.l)  return !(i%w) ? i : i-1
        else if (direction == D.tr) return !((i-w+1)%w) ? i : i-w+1
        else if (direction == D.br) return !((i+w+1)%w) ? i : i+w+1
        else if (direction == D.tl) return !((i-w)%w) ? i : i-w-1
        else if (direction == D.bl) return !((i+w)%w) ? i : i+w-1
    }

    updateImgMapFromPixels() {
        const pixels = this._pixels, p_ll = pixels.length, map = this._mapGrid, w = map.mapWidth
        for (let i=0,x=0,y=0;i<p_ll;i++) {
            x = i%w
            if (i&&!x) y++
            this.updateMapPixel([x,y], this._materialColorsIndexes[pixels[i]]) // can be optimized
        }
    }

    updateMapPixel(mapPos, rgba) {
        const data = this._imgMap.data, map = this._mapGrid, width = map.realWidth,
            r = rgba[0]??255, g = rgba[1]??0, b = rgba[2]??0, a = (rgba[3]??1)*255,
            size = map.pixelSize, x = mapPos[0]*size, y = mapPos[1]*size,
            pxRow = new Uint8ClampedArray(size*4)

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

    indexToMapPos(i) {
        const w = this._mapGrid.mapWidth
        return [i%w, (i/w)|0]
    }

    mapPosToIndex(mapPos) {
        return mapPos[1]*this._mapGrid.mapWidth+mapPos[0]
    }  

    placePixel(mapPos) {
        this._pixels[this.mapPosToIndex(mapPos)] = this._selectedMaterial
    }

    #placePixelFromMouse(mouse) {
        const mapPos = this._mapGrid.getLocalMapPixel(mouse.pos)
        if (this._isMouseWithinSimulation && mapPos) this.placePixel(mapPos)
    }

    keyDown(keyboard) {
        const K = TypingDevice.KEYS, M = Simulation.MATERIALS
        if (keyboard.isDown([K.DIGIT_1, K.NUMPAD_1])) this._selectedMaterial = M.SAND 
        else if (keyboard.isDown([K.DIGIT_2, K.NUMPAD_2])) this._selectedMaterial = M.WATER
        else if (keyboard.isDown([K.DIGIT_3, K.NUMPAD_3])) this._selectedMaterial = M.STONE
        else if (keyboard.isDown([K.DIGIT_4, K.NUMPAD_4])) this._selectedMaterial = M.GRAVEL
        else if (keyboard.isDown([K.DIGIT_0, K.NUMPAD_0])) this._selectedMaterial = M.AIR

        if (keyboard.isDown(K.CONTROL) && keyboard.isDown(K.BACKSPACE)) this._pixels.fill(M.AIR)
    }

    mouseDown(mouse) {
        this.#placePixelFromMouse(mouse)
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
	get materialColorsIndexes() {return this._materialColorsIndexes}

	set loopExtras(_loopExtras) {return this._loopExtras = _loopExtras}
	set selectedMaterial(_selectedMaterial) {return this._selectedMaterial = _selectedMaterial}
}