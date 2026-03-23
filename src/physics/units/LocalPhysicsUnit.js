class LocalPhysicsUnit extends _PhysicsUnit {

    // DOC TODO
    constructor(physicsConfig, MATERIALS_SETTINGS, definitionHolder) {
        super(null)
        this._physicsCore = createPhysicsCore(
            physicsConfig,
            MATERIALS_SETTINGS,
            definitionHolder.MATERIALS,
            definitionHolder.MATERIAL_GROUPS,
            definitionHolder.MATERIAL_NAMES,
            definitionHolder.SIDE_PRIORITIES,
            definitionHolder.PHYSICS_DATA_ATTRIBUTES
        )
    }

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