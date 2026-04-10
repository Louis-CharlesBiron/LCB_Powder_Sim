class LocalPhysicsUnit extends _PhysicsUnit {

    /**
     * A physics unit that directly attaches to the main thread
     * @param {Object} physicsSettings A physics configuration object 
     * @param {Object} MATERIALS_SETTINGS A physics configuration object
     * @param {Simulation} definitionHolder The Simulation class, including its static members
     */
    constructor(physicsSettings, MATERIALS_SETTINGS, definitionHolder) {
        if (_PhysicsUnit.LOCAL_PHYSICS_UNIT_INSTANCE) return _PhysicsUnit.LOCAL_PHYSICS_UNIT_INSTANCE

        super(null)
        this._physicsCore = createPhysicsCore(
            physicsSettings,
            MATERIALS_SETTINGS,
            definitionHolder.MATERIALS,
            definitionHolder.MATERIAL_GROUPS,
            definitionHolder.MATERIAL_NAMES,
            definitionHolder.SIDE_PRIORITIES,
            definitionHolder.PHYSICS_DATA_ATTRIBUTES
        )
    }

    // Runs a physics step
    step(
        gridIndexes, gridMaterials, indexCount, indexFlags, indexPhysicsData, indexGravity, indexStepsAlive,
        sidePriority, mapWidth, deltaTime
    ) {
        super.step()
        this._physicsCore(
            gridIndexes, gridMaterials, indexCount, indexFlags, indexPhysicsData, indexGravity, indexStepsAlive,
            sidePriority, mapWidth, deltaTime
        )
    }

}