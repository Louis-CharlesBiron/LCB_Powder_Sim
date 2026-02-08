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
}