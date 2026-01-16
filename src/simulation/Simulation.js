class Simulation {
    static MATERIALS = {DEFAULT:2, AIR:0, TEST:1, SAND:2, WATER:3}
    static MATERIAL_COLORS = {AIR:[0,0,0,0], TEST:[200,0,0,1], SAND:[235,235,158,1], WATER:[0,0,255,1]}
    static MATERIALS_NAME = ["AIR", "TEST", "SAND", "WATER"]
    static D = {t:0, r:1, b:2, l:3, tr:4, br:5, bl:6, tl:7}

    constructor(CVS, mapGrid) {
        // SIM
        this._CVS = CVS
        this._mapGrid = mapGrid
        this._loopExtras = []
        this._pixels = new Uint8Array(mapGrid.arraySize)
        this._selectedMaterial = Simulation.MATERIALS.DEFAULT
        this._isMouseWithinSimulation = true

        // DISPLAY
        this._mapGridRenderStyles = CVS.render.profile1.update(MapGrid.GRID_DISPLAY_COLOR, null, null, null, 1)
        this._imgMap = CVS.ctx.createImageData(...mapGrid.realDimensions)
        this._simImgMapDrawLoop = CanvasUtils.createEmptyObj(CVS, null, this.simImgMapDraw.bind(this))
        this._materialColorsIndexes = Object.values(Simulation.MATERIAL_COLORS)

        // CANVAS
        CVS.loopingCB = this.main.bind(this)
        CVS.setMouseMove()
        CVS.setMouseLeave()
        CVS.setMouseDown()
        CVS.setMouseUp()
        CVS.start()
        CVS.mouse.addListener([[0,0],mapGrid.realDimensions], Mouse.LISTENER_TYPES.ENTER, ()=>this._isMouseWithinSimulation = true)
        CVS.mouse.addListener([[0,0],mapGrid.realDimensions], Mouse.LISTENER_TYPES.LEAVE, ()=>this._isMouseWithinSimulation = false)
    }

    main(deltaTime) {
        for (let i=0;i<this._loopExtras.length;i++) this._loopExtras[i](deltaTime)

        const mouse = this._CVS.mouse
        if (mouse.clicked) this.#placePixelFromMouse(mouse)
        
        this.drawMapGrid()
        this.step()
        //this.updateImgMapFromPixels()
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
        const updated = [], pixels = this._pixels, p_ll = pixels.length, materials = Simulation.MATERIALS, D = Simulation.D, checkAdjacency = this.checkAdjacency.bind(this)
        for (let i=0;i<p_ll;i++) {
            const mat = pixels[i]
            if (updated.includes(i) || mat == materials.AIR) continue

            // TEST
            if (mat == materials.TEST) {
                if (checkAdjacency(i, D.b) == materials.AIR) {
                    const newIndex = this.moveAdjacency(i, D.b)
                    updated.push(newIndex)
                    pixels[i] = materials.AIR
                    pixels[newIndex] = mat
                }
            }
            // SAND
            else if (mat == materials.SAND) {
                if (checkAdjacency(i, D.b) == materials.AIR) {
                    const newIndex = this.moveAdjacency(i, D.b)
                    updated.push(newIndex)
                    pixels[i] = materials.AIR
                    pixels[newIndex] = mat
                } else if (checkAdjacency(i, D.b) == mat)  {
                    if (checkAdjacency(i, D.br) == materials.AIR) {
                        const newIndex = this.moveAdjacency(i, D.br)
                        updated.push(newIndex)
                        pixels[i] = materials.AIR
                        pixels[newIndex] = mat
                    } else if (checkAdjacency(i, D.bl) == materials.AIR) {
                        const newIndex = this.moveAdjacency(i, D.bl)
                        updated.push(newIndex)
                        pixels[i] = materials.AIR
                        pixels[newIndex] = mat
                    }
                }
            }
            // WATER
            else if (mat == materials.WATER) {
                if (checkAdjacency(i, D.b) == materials.AIR) {
                    const newIndex = this.moveAdjacency(i, D.b)
                    updated.push(newIndex)
                    pixels[i] = materials.AIR
                    pixels[newIndex] = mat
                } else if (checkAdjacency(i, D.b) == mat)  {
                    if (checkAdjacency(i, D.r) == materials.AIR) {
                        const newIndex = this.moveAdjacency(i, D.r)
                        updated.push(newIndex)
                        pixels[i] = materials.AIR
                        pixels[newIndex] = mat
                    } else if (checkAdjacency(i, D.l) == materials.AIR) {
                        const newIndex = this.moveAdjacency(i, D.l)
                        updated.push(newIndex)
                        pixels[i] = materials.AIR
                        pixels[newIndex] = mat
                    }
                }
            }

        }
        this.updateImgMapFromPixels()
    }

    checkAdjacency(i, direction) {
        return this._pixels[this.moveAdjacency(i, direction)]
    }

    moveAdjacency(i, direction) {
        const D = Simulation.D, w = this._mapGrid.mapWidth
        if (direction == D.t)       return i-w
        else if (direction == D.b)  return i+w
        else if (direction == D.r)  return !((i+1)%w) ? i : i+1
        else if (direction == D.l)  return !((i-1)%w) ? i : i-1
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
        if (this._isMouseWithinSimulation) this.placePixel(this._mapGrid.getLocalMapPixel(mouse.pos))
    }

    get CVS() {return this._CVS}
    get render() {return this._CVS._render}
    get ctx() {return this._CVS._ctx}
	get mapGrid() {return this._mapGrid}
	get loopExtras() {return this._loopExtras}
	get pixels() {return this._pixels}
	get mapGridRenderStyles() {return this._mapGridRenderStyles}
	get imgMap() {return this._imgMap}
    get isMouseWithinSimulation() {return this._isMouseWithinSimulation}

	set loopExtras(_loopExtras) {return this._loopExtras = _loopExtras}
}