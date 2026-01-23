class LocalPhysicsUnit {

    constructor() {
        this._physicsCore = new PhysicsCore("LOCAL")
    }

    step(pixels, pxStepUpdated, sidePriority, mapWidth) {
       return this._physicsCore.step(pixels, pxStepUpdated, sidePriority, mapWidth, Simulation.MATERIALS, Simulation.MATERIAL_GROUPS, Simulation.D, Simulation.SIDE_PRIORITIES)
    }

}