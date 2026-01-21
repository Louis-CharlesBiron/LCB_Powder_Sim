class LocalPhysicsUnit {

    constructor() {
        this._physicsCore = new PhysicsCore("LOCAL")
        this._pixels
        this._pxStepUpdated
        this._sidePriority
        this._mapWidth
    }

   //init({sidePriority, mapWidth}) {
   //    this._sidePriority = sidePriority
   //    this._mapWidth = mapWidth
   //}

    step(pixels, pxStepUpdated, sidePriority, mapWidth) {
       return this._physicsCore.step(pixels, pxStepUpdated, sidePriority, mapWidth, Simulation.MATERIALS, Simulation.MATERIAL_GROUPS, Simulation.D, Simulation.SIDE_PRIORITIES)
    }

}