class _PhysicsUnit {

    constructor(_stepExtra) {
        this._stepExtra = _stepExtra
        this._isBlocked = false // Whether the main thread has the pixel buffer when using webworkers
    }

    step() {
        const stepExtra = this._stepExtra
        if (stepExtra) stepExtra()
    }

    get stepExtra() {return this._stepExtra}
    get isBlocked() {return this._isBlocked}

    set stepExtra(stepExtra) {this._stepExtra = stepExtra}
}