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
        )
    }

    step(
        gridIndexes, gridMaterials,
        indexCount, indexFlags, indexPosX, indexPosY, indexVelX, indexVelY, indexGravity, indexStepsAlive,
        sidePriority, mapWidth,
        deltaTime
    ) {
        super.step()
        this._physicsCore(
            gridIndexes, gridMaterials,
            indexCount, indexFlags, indexPosX, indexPosY, indexVelX, indexVelY, indexGravity, indexStepsAlive,
            sidePriority, mapWidth,
            deltaTime
        )
    }

}