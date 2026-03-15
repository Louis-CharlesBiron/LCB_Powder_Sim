class LocalPhysicsUnit {

    // DOC TODO
    constructor(physicsConfig, definitionHolder) {
        this._physicsCore = createPhysicsCore(
            physicsConfig,
            definitionHolder.MATERIALS,
            definitionHolder.MATERIAL_GROUPS,
            definitionHolder.MATERIAL_STATES,
            definitionHolder.MATERIAL_STATES_GROUPS,
            definitionHolder.SIDE_PRIORITIES,
            definitionHolder.D
        )
    }

    step(
        gridIndexes, gridMaterials,
        indexCount, indexFlags, indexPosX, indexPosY, indexVelX, indexVelY, indexGravity, indexStepsAlive,
        sidePriority, mapWidth,
        deltaTime
    ) {
        this._physicsCore(
            gridIndexes, gridMaterials,
            indexCount, indexFlags, indexPosX, indexPosY, indexVelX, indexVelY, indexGravity, indexStepsAlive,
            sidePriority, mapWidth,
            deltaTime
        )
    }

}