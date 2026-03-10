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
            if (!Object.getOwnPropertyDescriptor(targetClass.prototype, exposedName)) {
                path ??= "_"+exposedName
                const isPathArray = Array.isArray(path)
                Object.defineProperty(targetClass.prototype, exposedName, {
                    set(value) {
                        if (isPathArray) {
                            const directPath = path[path.length-1], prop = path.slice(0, path.length-1).reduce((a,b)=>a[b], this)
                            prop[directPath] = value
                        }
                        else this[path] = value
                    },
                    get() {
                        return isPathArray ? path.reduce((a,b)=>a[b], this) : this[path]
                    },
                    configurable: true
                })
            }
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
        max+=(decimals?0:1)
        if (decimals) {
            const precision = 10**decimals
            return Math.round((Math.random()*(max-min)+min)*precision)/precision
        } else return (Math.random()*(max-min)+min)>>0
    }
}