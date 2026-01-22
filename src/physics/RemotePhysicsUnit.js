importScripts("PhysicsCore.js")

const WORKER_MESSAGE_TYPES = {INIT:0, STEP:1, SIDE_PRIORITY:2, MAP_WIDTH:3},
      physicsCore = new PhysicsCore("WORKER")

// CONSTANTS
let MATERIALS, D, MATERIAL_GROUPS, SIDE_PRIORITIES
// ATTRIBUTES
let pixels, pxStepUpdated, sidePriority,
    mapWidth

self.onmessage=e=>{
    const data = e.data, type = data.type
    if (type == WORKER_MESSAGE_TYPES.STEP) {// STEP
        pixels = data.pixels
        step()
    }
    else if (type == WORKER_MESSAGE_TYPES.SIDE_PRIORITY) sidePriority = data.sidePriority
    else if (type === WORKER_MESSAGE_TYPES.MAP_WIDTH) {
        mapWidth = data.mapWidth
        pxStepUpdated = new Uint8Array(data.arraySize)
    }
    else if (type == WORKER_MESSAGE_TYPES.INIT) {//  INIT
        MATERIALS = data.MATERIALS
        D = data.D
        MATERIAL_GROUPS = data.MATERIAL_GROUPS
        SIDE_PRIORITIES = data.SIDE_PRIORITIES

        pixels = data.pixels
        pxStepUpdated = data.pxStepUpdated
        sidePriority = data.sidePriority

        mapWidth = data.mapWidth
    }
}

function step() {
    const newPixels = physicsCore.step(pixels, pxStepUpdated, sidePriority, mapWidth, MATERIALS, MATERIAL_GROUPS, D, SIDE_PRIORITIES)
    postMessage({type:WORKER_MESSAGE_TYPES.STEP, pixels:newPixels}, [newPixels.buffer])
}













// IMPLEMENT QUEUING
// DEPRECATED
// pixels + pxStepUpdated = PHYSICS ONLY
// pixels -> needed by -> Simulation (rendering + direct updates?) + PhysicsCore (step) -> solution: pass memory along between sim/core
// pxStepUpdated -> used in -> Simulation(#updatePixelsFromSize~) + PhysicsCore (step)  -> solution: store in core, update size when needed? NOPE

//    load(mapData, saveDimensions=null) {
//    #updatePixelsFromSize(oldWidth, oldHeight, newWidth, newHeight, oldPixels) {
//    fill(material=Simulation.MATERIALS.AIR) {
//    fillArea(pos1, pos2, material=self._selectedMaterial) {
//-    updateMapSize(width, height) {
//-    updateMapPixelSize(size) {
//-    placePixel(mapPos, material=self._selectedMaterial) {
//-    placePixelCoords(x, y, material=self._selectedMaterial) {
//?    getPixelsCopy() {
//-    exportAsText(disableCompacting) {

// DONES:
//    step()