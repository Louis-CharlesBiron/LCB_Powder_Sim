class KeybindManager {
    #simulation = null
    constructor(simulation, keybinds) {
        this.#simulation = simulation 
        this.setKeyBinds(keybinds)
    }

    /**
     * Creates functional keybinds TODO IMPROVE
     * @param {Object} keybinds The keybinds to set
     */
    setKeyBinds(keybinds) {
        Object.entries(keybinds).filter(bind=>!bind[1].defaultSimulationFunction).forEach(([_, bindValue])=>{
            const {callback, keys, triggerType} = bindValue
            this.#simulation.keyboard.addListener(TypingDevice.LISTENER_TYPES.DOWN, keys, (keyboard, e)=>this.#keybindTryAction(keyboard, e, (CDEUtils.isFunction(callback)&&(()=>callback(this.#simulation))), bindValue), triggerType)

        })
    }

    // Utils function to check if keybind's conditions are met before executing the action
    #keybindTryAction(typingDevice, e, actionCB, bindValue) {
        const hasAction = CDEUtils.isFunction(actionCB), {requiredKeys, cancelKeys, preventDefault} = bindValue
        if (preventDefault && e.target.value === undefined) e.preventDefault()

        if (!hasAction) return void SimUtils.warn(SETTINGS.STANDALONE_KEYBIND_WARN, this.#simulation.userSettings)

        if ((!requiredKeys || typingDevice.isDown(requiredKeys)) && (!cancelKeys || !typingDevice.isDown(cancelKeys))) actionCB.bind(this)()
    }
}