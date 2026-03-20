class RemotePhysicsUnit extends _PhysicsUnit {
    static WORKER_MESSAGE_TYPES = SETTINGS.WORKER_MESSAGE_TYPES
    static WORKER_MESSAGE_GROUPS = SETTINGS.WORKER_MESSAGE_GROUPS

    constructor() {
        super(null)
        this._queuedBufferOperations = []
    }

    step() {
        super.step()
        this.sendToWorkers()
    }

    // Listener for web worker messages DOC TODO
    #physicsUnitMessage(e) {// TODO TOFIX
        const data = e.data, type = data.type, T = RemotePhysicsUnit.WORKER_MESSAGE_TYPES, stepExtra = this._stepExtra

        if (type & RemotePhysicsUnit.WORKER_MESSAGE_GROUPS.GIVES_PIXELS_TO_MAIN) {
            //this._gridMaterials = new Uint16Array(data.pixels) TODO
            //this._indexStates = new Uint16Array(data.pxStates)
            this._isBlocked = false
        }

        if (type === T.STEP) {// RECEIVE STEP RESULTS (is step/sec bound)
            // DO BUFFER OPERATION
            this.renderPixels()
            this.executeQueuedOperations()

            if (stepExtra) stepExtra()

            // PASS BACK PIXELS IF LOOP RUNNING
            if (this._isRunning) {
                this._isBlocked = true
                this.sendToWorkers(T.PIXELS)
            }
        }
    }

    /** DOC TODO
     * Sends a command of a certain type to the worker, needing pixels (R?)
     * @param {Simulation.#WORKER_MESSAGE_TYPES} type The worker message type
     */
    sendToWorkers(type) {// TODO TOFIX
        const pixels = this._gridMaterials //TODO
        this.saveStep()
        if (this.usingWebWorkers) this._physicsUnit.postMessage({type, pixels, pxStates}, [pixels.buffer, pxStates.buffer])
        else this._isBlocked = false
    }

    /**DOC TODO
     * Updates whether the physics calculations are offloaded to a worker thread 
     * @param {Boolean} usesWebWorkers Whether an other thread is used. (Defaults to true)
     */
    updatePhysicsUnitType(usesWebWorkers=true) {// TODO TOFIX TOCHECK
        const isWebWorker = +(usesWebWorkers&&!this.isFileServed)
        if ((isWebWorker && this.usingWebWorkers) || (!isWebWorker && this.useLocalPhysics)) return

        if (isWebWorker) {
            this._isBlocked = false
            this._physicsUnit.onmessage=this.#physicsUnitMessage.bind(this)
            this._physicsUnit.postMessage({
                type:RemotePhysicsUnit.WORKER_MESSAGE_TYPES.INIT,
                pixels:this._gridIndexes, pxStepUpdated:this._indexUpdated, pxStates:this._indexStates, sidePriority:this._sidePriority, 
                mapWidth:this._mapGrid.mapWidth, mapHeight:this._mapGrid.mapHeight,
                aimedFps:this._CVS.fpsLimit
            })
            if (this._isRunning) this.start(true)
        }
        else if (usesWebWorkers && this.isFileServed) SimUtils.warn(SETTINGS.FILE_SERVED_WARN, this._userSettings)
    }

    // Executes queued operations DOC TODO
    executeQueuedOperations() {
        const queued = this._queuedBufferOperations, q_ll = queued.length
        for (let i=0;i<q_ll;i++) {
            queued[0]()
            queued.shift()
        }
    }

    // DOC TODO
    addToQueue(callback) {
        this._queuedBufferOperations.push(callback)
    }

    get queuedBufferOperations() {return this._queuedBufferOperations}
}