class Simulation {
    static MATERIALS = {AIR:0, TEST:1, SAND:2}
    static MATERIAL_COLORS = {AIR:[0,0,0,0], TEST:[200,0,0,1], SAND:[0,0,255,1]}

    constructor(CVS, mapGrid) {
        // SIM
        this._CVS = CVS
        this._mapGrid = mapGrid
        this._loopExtras = []
        this._pixels = new Uint8Array(mapGrid.arraySize)

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
    }

    main(deltaTime) {
        for (let i=0;i<this._loopExtras.length;i++) this._loopExtras[i](deltaTime)

        this.drawMapGrid()
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

    mouseDown(mouse) {
        const mapPos = this._mapGrid.getLocalMapPixel(mouse.pos)

        this._pixels[mapPos[1]*this._mapGrid.mapWidth+mapPos[0]] = Simulation.MATERIALS.TEST

        this.updateImgMapFromPixels()
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

    get CVS() {return this._CVS}
    get render() {return this._CVS._render}
    get ctx() {return this._CVS._ctx}
	get mapGrid() {return this._mapGrid}
	get loopExtras() {return this._loopExtras}
	get pixels() {return this._pixels}
	get mapGridRenderStyles() {return this._mapGridRenderStyles}
	get imgMap() {return this._imgMap}

	set loopExtras(_loopExtras) {return this._loopExtras = _loopExtras}
}