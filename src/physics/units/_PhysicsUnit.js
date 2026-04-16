class _PhysicsUnit {
    static LOCAL_PHYSICS_UNIT_INSTANCE = null
    static REMOTE_PHYSICS_UNIT_INSTANCE = null

    constructor(_stepExtra) {
        const isLocal = this instanceof LocalPhysicsUnit, isRemote = this instanceof RemotePhysicsUnit
        if (isLocal && !_PhysicsUnit.LOCAL_PHYSICS_UNIT_INSTANCE) _PhysicsUnit.LOCAL_PHYSICS_UNIT_INSTANCE = this
        if (isRemote && !_PhysicsUnit.REMOTE_PHYSICS_UNIT_INSTANCE) _PhysicsUnit.REMOTE_PHYSICS_UNIT_INSTANCE = this
        else if (!isLocal && !isRemote) return void SimUtils.warn(WARNINGS.ABSTRACT_INTANCIATION(this))

        this._stepExtra = _stepExtra
        this._blocked = false // Whether the main thread has the pixel buffer when using webworkers
    }

    step() {
        const stepExtra = this._stepExtra
        if (stepExtra) stepExtra()
    }

    get stepExtra() {return this._stepExtra}
    get blocked() {return this._blocked}

    set stepExtra(stepExtra) {this._stepExtra = stepExtra}
}