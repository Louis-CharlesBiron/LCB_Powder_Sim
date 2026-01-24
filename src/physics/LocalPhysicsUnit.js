class LocalPhysicsUnit {

    constructor() {
        this._physicsCore = new PhysicsCore("LOCAL")
    }

    step(pixels, pxStepUpdated, pxStates, sidePriority, mapWidth) {
       return this._physicsCore.step(
        pixels,
        pxStepUpdated,
        pxStates,
        sidePriority,
        mapWidth,
        Simulation.MATERIALS,
        Simulation.MATERIAL_GROUPS, 
        Simulation.D,
        Simulation.MATERIAL_STATES,
        Simulation.MATERIAL_STATES_GROUPS,
        Simulation.SIDE_PRIORITIES
    )
    }

}