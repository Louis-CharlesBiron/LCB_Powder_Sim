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
        gridIndexes, gridMaterials, lastGridMaterials,
        indexCount, indexFlags, indexPosX, indexPosY, indexVelX, indexVelY, indexGravity,
        sidePriority, mapWidth, mapHeight,
        deltaTime
    ) {
        this._physicsCore(
            gridIndexes, gridMaterials, lastGridMaterials,
            indexCount, indexFlags, indexPosX, indexPosY, indexVelX, indexVelY, indexGravity,
            sidePriority, mapWidth, mapHeight,
            deltaTime
        )
    }

}