class RemotePhysicsUnit extends _PhysicsUnit {
    static WORKER_MESSAGE_TYPES = SETTINGS.WORKER_MESSAGE_TYPES
    static WORKER_MESSAGE_GROUPS = SETTINGS.WORKER_MESSAGE_GROUPS
    static DEFAULT_THREAD_COUNT = 4
    static WORKER_RELATIVE_PATH = SETTINGS.WORKER_RELATIVE_PATH
    static #LAUNCH_YEILD = 0
    static #_SI_I = 0
    static SIGNALS_INDEXES = {
        SLEEP_STATUS: this.#_SI_I++,
        COMPLETION_STATUS: this.#_SI_I++,
        DATA: {
            SIDE_PRIORITY: this.#_SI_I++,
            MAP_WIDTH: this.#_SI_I++,
            DELTATIME: this.#_SI_I++,
            ARRAY_SIZE: this.#_SI_I++,
        }
    }
    static SIGNALS = {
        SLEEP_STATUS: {
            DEAD: 0,
            WAKE: 1,
        },
        COMPLETION_STATUS: {
            RESET: 0,
            COMPLETED: 1
        }
    }

    /**
     * A physics unit uses workers to compute the physics steps of using the main thread
     * @param {*} threadCount 
     * @param {*} SABDeps 
     * @param {*} workerDependencies 
     * @param {*} initUpdatables 
     */
    constructor(threadCount, SABDeps, workerDependencies, initUpdatables) {
        if (_PhysicsUnit.REMOTE_PHYSICS_UNIT_INSTANCE) return _PhysicsUnit.REMOTE_PHYSICS_UNIT_INSTANCE

        super(null)
        this._signals = null
        this._initialized = false
        this._threadCount = threadCount||RemotePhysicsUnit.DEFAULT_THREAD_COUNT
        this._queuedBufferOperations = []
        this._workers = []

        this._initUpdatables = initUpdatables
        this._workerDependencies = workerDependencies
        this._SABDependencies = SABDeps
    }

    /**
     * Initializes the physics unit
     */
    initialize() {
        this._initialized = true
        this.#createWorkers()
    }

    /**
     * Updates the number of worker used
     * @param {Number} threadCount The number of workers to use
     */
    updateThreadCount(threadCount) {
        this._threadCount = threadCount
        this.#createWorkers()
    }

    /**
     * Updates the sharedArrayBuffer and updates workers
     * @param {Object} SABDependencies Object containing the new SharedArrayBuffer, the offsets and array sizes
     */
    updateSAB(SABDependencies) {
        ///const oldSignals = this._signals

        this._SABDependencies = SABDependencies
        this._signals = new Simulation.CONTAINERS.C_SIGNALS(SABDependencies.SAB, SABDependencies.offsets[0], Simulation.SIGNAL_COUNT)

        if (this._initialized) {
            this.#createWorkers()// TODO OPTIMIZE
           //this.sendAll(RemotePhysicsUnit.WORKER_MESSAGE_TYPES.UPDATE_SAB, {SABDependencies: this._SABDependencies})

           //Atomics.store(oldSignals, RemotePhysicsUnit.SIGNALS_INDEXES.SLEEP_STATUS, RemotePhysicsUnit.SIGNALS.SLEEP_STATUS.WAKE)
           //Atomics.notify(oldSignals, RemotePhysicsUnit.SIGNALS_INDEXES.SLEEP_STATUS, this._threadCount)
        }
    }

    /**
     * Runs a physics step on the workers
     * @param {Function} onStepComplete 
     */
    async step(onStepComplete, sidePriority, mapWidth, deltaTime, arraySize) {
        super.step()

        const SI = RemotePhysicsUnit.SIGNALS_INDEXES, S = RemotePhysicsUnit.SIGNALS,
            signals = this._signals, threadCount = this._threadCount

        // RESET COMPLETED COUNT
        Atomics.store(signals, SI.COMPLETION_STATUS, S.COMPLETION_STATUS.RESET)

        // UPDATABLE
        if (sidePriority != null) Atomics.store(signals, SI.DATA.SIDE_PRIORITY, sidePriority)
        if (mapWidth != null) Atomics.store(signals, SI.DATA.MAP_WIDTH, mapWidth)
        if (deltaTime != null) Atomics.store(signals, SI.DATA.DELTATIME, (deltaTime*1000)|0)
        if (arraySize != null) Atomics.store(signals, SI.DATA.ARRAY_SIZE, arraySize)

        // WAKE WORKERS
        this._blocked = true
        Atomics.store(signals, SI.SLEEP_STATUS, S.SLEEP_STATUS.WAKE)
        Atomics.notify(signals, SI.SLEEP_STATUS, threadCount)

        // BARRIER
        let iterations = 0// CLEANUP
        const MAX_ITERATIONS = 8000000

        while (Atomics.load(signals, SI.COMPLETION_STATUS) < threadCount) {// MAYBE IN OTHER THREAD
            if (iterations++ > MAX_ITERATIONS) break
            if (RemotePhysicsUnit.#LAUNCH_YEILD < 200) {// TODO TOCHECK
                RemotePhysicsUnit.#LAUNCH_YEILD++
                await new Promise(resolve=>setTimeout(resolve, 0))
            }
        }
        Atomics.store(signals, SI.SLEEP_STATUS, S.SLEEP_STATUS.DEAD)

        this._blocked = false
        if (iterations > MAX_ITERATIONS) console.log("DONE (TIMED OUT)")
        onStepComplete()
        this.executeQueuedOperations()
    }

    /**
     * Sends a message to all workers
     * @param {WORKER_MESSAGE_TYPES} type The type of the message
     * @param {Object} data The data to send
     */
    sendAll(type, data) {// TODO TOFIX
        const threadCount = this._threadCount, workers = this._workers
        for (let i=0;i<threadCount;i++) workers[i].postMessage({type, ...data})
    }

    /**
     * Creates and initializes workers
     */
    #createWorkers() {
        this.killWorkers()
        if (this._initialized) {
            const threadCount = this._threadCount, {physicsConfig, MATERIALS_SETTINGS, definitionHolder} = this._workerDependencies
            
            for (let i=0;i<threadCount;i++) {
                const worker = new Worker(RemotePhysicsUnit.WORKER_RELATIVE_PATH, {type:"classic"})
                this._workers[i] = worker

                worker.postMessage({
                    type: RemotePhysicsUnit.WORKER_MESSAGE_TYPES.INIT,
                    id: i,
                    threadCount,
                    initUpdatables: this._initUpdatables,
                    workerDependencies: {
                        physicsConfig,
                        SIGNALS_INDEXES: RemotePhysicsUnit.SIGNALS_INDEXES,
                        SIGNALS: RemotePhysicsUnit.SIGNALS,
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

    /**
     *  Terminates all workers
     */
    killWorkers() {
        const w_ll = this._workers.length
        if (w_ll) {
            for (let i=0;i<w_ll;i++) {
                const oldWorker = this._workers[i]
                if (oldWorker) oldWorker.terminate()
            }
            this._workers = []
        }
    }

    /**
     * Executes queued operations
     */
    executeQueuedOperations() {
        const queued = this._queuedBufferOperations, q_ll = queued.length
        for (let i=0;i<q_ll;i++) {
            queued[0]()
            queued.shift()
        }
    }

    /**
     * Adds an operation to the queue
     * @param {Function} callback 
     */
    addToQueue(callback) {
        this._queuedBufferOperations.push(callback)
    }

    get queuedBufferOperations() {return this._queuedBufferOperations}
    get threadCount() {return this._threadCount}
}