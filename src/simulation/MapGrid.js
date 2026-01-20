class MapGrid {
    static DEFAULT_PIXEL_SIZE = 25
    static DEFAULT_MAP_WIDTH = 30
    static DEFAULT_MAP_HEIGHT = 25
    static GRID_DISPLAY_COLOR = [240, 248, 255, 0.2]

    //static DEFAULT_PIXEL_SIZE = 15
    //static DEFAULT_MAP_WIDTH = 60
    //static DEFAULT_MAP_HEIGHT = 45

    //static DEFAULT_PIXEL_SIZE = 5
    //static DEFAULT_MAP_WIDTH = 235
    //static DEFAULT_MAP_HEIGHT = 160

    //static DEFAULT_PIXEL_SIZE = 3
    //static DEFAULT_MAP_WIDTH = 400
    //static DEFAULT_MAP_HEIGHT = 260

    //static DEFAULT_PIXEL_SIZE = 1
    //static DEFAULT_MAP_WIDTH = 800
    //static DEFAULT_MAP_HEIGHT = 600

    #lastPixelSize = null

    constructor(pixelSize, mapWidth, mapHeight) {
        this._pixelSize = this.#lastPixelSize = pixelSize||MapGrid.DEFAULT_PIXEL_SIZE
        this._mapWidth = mapWidth||MapGrid.DEFAULT_MAP_WIDTH
        this._mapHeight = mapHeight||MapGrid.DEFAULT_MAP_HEIGHT
    }

    getLocalMapPixel(pos) {
        const size = this._pixelSize, [w,h] = this.realDimensions, [posX,posY] = pos
        for (let y=0;y<h;y+=size) {
            for (let x=0;x<w;x+=size) {
                if ((posX>=x && posX<(x+size)) && (posY>=y && posY<y+size)) return [x/size, y/size]
            }
        }
    }

    getDrawableGridPositions() {
        const size = this._pixelSize, [w,h] = this.realDimensions, lines = []
        for (let x=0;x<w;x+=size) lines.push([[x,0],[x,h]])
        for (let y=0;y<h;y+=size) lines.push([[0,y],[w,y]])
        return lines
    }

    moveAdjacency(i, direction, distance=1) { // OPTIMIZATION, TODO
        const D = Simulation.D, w = this._mapWidth, dWidth = w*distance
        if (direction == D.t)       return i-dWidth
        else if (direction == D.b)  return i+dWidth
        else if (direction == D.r)  return (i+1)%w ? i+distance : i
        else if (direction == D.l)  return i%w     ? i-distance : i
        else if (direction == D.tr) return (i-dWidth+1)%w ? i-dWidth+distance : i
        else if (direction == D.br) return (i+dWidth+1)%w ? i+dWidth+distance : i
        else if (direction == D.tl) return (i-dWidth)%w   ? i-dWidth-distance : i
        else if (direction == D.bl) return (i+dWidth)%w   ? i+dWidth-distance : i
    }

    indexToMapPos(i) {
        const w = this._mapWidth
        return [i%w, (i/w)|0]
    }

    mapPosToIndex(mapPos) {
        return mapPos[1]*this._mapWidth+mapPos[0]
    } 

    mapPosToIndexCoords(x, y) {
        return y*this._mapWidth+x
    } 

    get realWidth() {return this._mapWidth*this._pixelSize}
    get realHeight() {return this._mapHeight*this._pixelSize}
    get realDimensions() {return [this.realWidth, this.realHeight]}
    get arraySize() {return this._mapWidth*this._mapHeight}
    get displayDimensions() {return this._mapWidth+"x"+this._mapHeight}
    get lastPixelSize() {return this.#lastPixelSize}

    get pixelSize() {return this._pixelSize}
	get mapWidth() {return this._mapWidth}
	get mapHeight() {return this._mapHeight}
	get dimensions() {return [this._mapWidth, this._mapHeight]}

	set pixelSize(_pixelSize) {return this._pixelSize = _pixelSize}
	set mapWidth(_mapWidth) {return this._mapWidth = _mapWidth}
	set mapHeight(_mapHeight) {return this._mapHeight = _mapHeight}
	set lastPixelSize(lps) {return this.#lastPixelSize = lps}
}