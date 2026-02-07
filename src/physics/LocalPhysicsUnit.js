class LocalPhysicsUnit {

    constructor() {
        this._physicsCore = new PhysicsCore()
    }

    step(pixels, pxStepUpdated, pxStates, sidePriority, mapWidth, mapHeight) {
       this._physicsCore.step(
            pixels,
            pxStepUpdated,
            pxStates,
            sidePriority,
            mapWidth,
            mapHeight,
            Simulation.MATERIALS,
            Simulation.MATERIAL_GROUPS, 
            Simulation.D,
            Simulation.MATERIAL_STATES,
            Simulation.MATERIAL_STATES_GROUPS,
            Simulation.SIDE_PRIORITIES
        )
    }

}