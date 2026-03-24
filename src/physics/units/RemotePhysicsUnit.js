class RemotePhysicsUnit extends _PhysicsUnit {
    static WORKER_MESSAGE_TYPES = SETTINGS.WORKER_MESSAGE_TYPES
    static WORKER_MESSAGE_GROUPS = SETTINGS.WORKER_MESSAGE_GROUPS
    static DEFAULT_THREAD_COUNT = 4
    static WORKER_RELATIVE_PATH = SETTINGS.WORKER_RELATIVE_PATH

    constructor(threadCount, SABDeps, physicsConfig, MATERIALS_SETTINGS, definitionHolder) {
        const instance = _PhysicsUnit.REMOTE_PHYSICS_UNIT_INSTANCE
        if (instance) return instance

        super(null)
        this._initialized = false
        this._threadCount = threadCount||RemotePhysicsUnit.DEFAULT_THREAD_COUNT
        this._queuedBufferOperations = []
        this._workers = []
        this._workerDependencies = [
            physicsConfig,
            MATERIALS_SETTINGS,
            definitionHolder
        ]
        this._SABDependencies = SABDeps
    }

    initialize() {
        this._initialized = true
        this.#createWorkers()
    }

    updateThreadCount(threadCount) {
        this._threadCount = threadCount
        this.#createWorkers()
    }

    updateSAB(SABDependencies) {
        this._SABDependencies = SABDependencies
        this.#createWorkers()
    }

    step(deltaTime) {
        super.step()
        this.sendToWorkers()
    }

    /** DOC TODO
     * Sends a command of a certain type to the worker, needing pixels
     * @param {Simulation.#WORKER_MESSAGE_TYPES} type The worker message type
     */
    sendToWorkers(type) {// TODO TOFIX

        // FOR EACH WORKER, SEND STEP

        this.saveStep()
        if (this.usingWebWorkers) this._physicsUnit.postMessage({type, pixels, pxStates}, [pixels.buffer, pxStates.buffer])
        else this._isBlocked = false
    }

    #createWorkers() {
        if (this._initialized) {
            const threadCount = this._threadCount, [physicsConfig, MATERIALS_SETTINGS, definitionHolder] = this._workerDependencies
            
            for (let i=0;i<threadCount;i++) {
                const worker = new Worker(RemotePhysicsUnit.WORKER_RELATIVE_PATH, {type:"classic"})
                this._workers[i] = worker

                worker.postMessage({
                    type: RemotePhysicsUnit.WORKER_MESSAGE_TYPES.INIT,
                    id: i,
                    threadCount,
                    workerDependencies: {
                        physicsConfig,
                        WORKER_MESSAGE_TYPES: RemotePhysicsUnit.WORKER_MESSAGE_TYPES,
                        WORKER_MESSAGE_GROUPS: RemotePhysicsUnit.WORKER_MESSAGE_GROUPS,
                        MATERIALS_SETTINGS,
                        MATERIALS: definitionHolder.MATERIALS,
                        MATERIAL_GROUPS: definitionHolder.MATERIAL_GROUPS,
                        MATERIAL_NAMES: definitionHolder.MATERIAL_NAMES,
                        SIDE_PRIORITIES: definitionHolder.SIDE_PRIORITIES,
                        PHYSICS_DATA_ATTRIBUTES: definitionHolder.PHYSICS_DATA_ATTRIBUTES,
                        CONTAINER_NAMES: definitionHolder.CONTAINER_NAMES
                    },
                    SABDependencies: this._SABDependencies,
                })
            }
        }
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