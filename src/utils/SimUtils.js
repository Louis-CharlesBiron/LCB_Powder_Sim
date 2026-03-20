class SimUtils {
    /**
    * Merges a modification object and a base object
    * @param {Object} inputSettings The object with modifications
    * @param {Object} defaultSettings The object to update
    * @returns The merged object
    */
    static getAdjustedSettings(inputSettings, defaultSettings) {
        const newSettings = {...defaultSettings}
        if (inputSettings) Object.entries(inputSettings).forEach(([key, value])=>newSettings[key] = value)
        return newSettings
    }

    // DOC TODO
    static addGettersSetters(targetClass, attributes) {
        attributes.forEach(({exposedName, path})=>{
            path ??= "_"+exposedName
            const isPathArray = Array.isArray(path), overrides = Object.getOwnPropertyDescriptor(targetClass.prototype, exposedName)

            if (!overrides?.get) Object.defineProperty(targetClass.prototype, exposedName, {
                get() {return isPathArray ? path.reduce((a,b)=>a[b], this) : this[path]},
                configurable: true
            })

            if (!overrides?.set) Object.defineProperty(targetClass.prototype, exposedName, {
                set(value) {
                    if (isPathArray) {
                        const directPath = path[path.length-1], prop = path.slice(0, path.length-1).reduce((a,b)=>a[b], this)
                        prop[directPath] = value
                    }
                    else this[path] = value
                },
                configurable: true
            })
        })
    }

    // DOC TODO
    static getMaxDecimals(...nums) {
        return Math.max(...nums.map(num=>(num+"").split(".")?.[1]?.length||0))
    }

    /**
     * Returns a random number within the min and max range
     * @param {Number} min: the minimal possible value (included)
     * @param {Number} max: the maximal possible value (included)
     * @param {Number?} decimals: the decimal point. (Defaults to 0 (integers))
     * @returns the generated number
     */
    static random(min, max, decimals=0) {
        const precision = 10**decimals
        return Math.floor(Math.random()*((max-min)*precision+1))/precision+min
    }

    /**
     * Logs a warning messages if warnings are enabled
     * @param {String} warningMessage Warning message to log
     * @param {Object} userSettings The userSettings object
     */
    static warn(warningMessage, userSettings) {
        if (!userSettings?.warningsDisabled) console.warn(warningMessage)
    }
}