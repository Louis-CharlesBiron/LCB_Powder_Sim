class MapGrid {
    static DEFAULT_PIXEL_SIZE = 25
    static DEFAULT_MAP_WIDTH = 30
    static DEFAULT_MAP_HEIGHT = 25
    static GRID_DISPLAY_COLOR = [240, 248, 255, 0.25]

    constructor(pixelSize, mapWidth, mapHeight) {
        this._pixelSize = pixelSize||MapGrid.DEFAULT_PIXEL_SIZE
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

    get realWidth() {return this._mapWidth*this._pixelSize}
    get realHeight() {return this._mapHeight*this._pixelSize}
    get realDimensions() {return [this.realWidth, this.realHeight]}
    get arraySize() {return this._mapWidth*this._mapHeight}

    get pixelSize() {return this._pixelSize}
	get mapWidth() {return this._mapWidth}
	get mapHeight() {return this._mapHeight}
	get dimensions() {return [this._mapWidth, this._mapHeight]}

	set pixelSize(_pixelSize) {return this._pixelSize = _pixelSize}
	set mapWidth(_mapWidth) {return this._mapWidth = _mapWidth}
	set mapHeight(_mapHeight) {return this._mapHeight = _mapHeight}


}