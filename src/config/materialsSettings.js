class MaterialSettings {
    static MATERIALS_SETTINGS = []
    static #DEFAULT_MATERIAL_SETTINGS = {
        flags: 0,

        posXOffsetMin: 0,
        posXOffsetMax: 0,
        posXOffsetDecimals:null,
        hasPosXOffset:null,

        posYOffsetMin: 0,
        posYOffsetMax: .85,
        posYOffsetDecimals:null,
        hasPosYOffset:null,

        velX:0,
        velXOffsetMin:-2,
        velXOffsetMax:2,
        velXOffsetDecimals:null,
        hasVelXOffset:null,

        velY:2,
        velYOffsetMin:1,
        velYOffsetMax:3,
        velYOffsetDecimals:null,
        hasVelYOffset:null,

        gravity:90,
        gravityOffsetMin:-10,
        gravityOffsetMax:20,
        gravityOffsetDecimals:null,
        hasGravityOffset:null,
    }

    // MATERIALS CONFIGS //
    static {
        MaterialSettings.MATERIALS_SETTINGS[SETTINGS.MATERIALS.SAND] = {}

        MaterialSettings.MATERIALS_SETTINGS[SETTINGS.MATERIALS.WATER] = {
            gravity: 60,
        }

        MaterialSettings.MATERIALS_SETTINGS[SETTINGS.MATERIALS.GRAVEL] = {
            gravity: 160,
        }
        
        MaterialSettings.MATERIALS_SETTINGS[SETTINGS.MATERIALS.INVERTED_WATER] = {
            gravity: -90,
            velY:-3,
            velYOffsetMin:-2,
            velYOffsetMax:-4,
        }



        Object.values(SETTINGS.MATERIALS).forEach(material=>MaterialSettings.MATERIALS_SETTINGS[material] ??= {})
        MaterialSettings.MATERIALS_SETTINGS.forEach((settings, material)=>MaterialSettings.updateMaterialSettings(material, settings))
    }
    
    static updateMaterialSettings(material, settings) {
        const adjustedSettings = SimUtils.getAdjustedSettings(settings, MaterialSettings.#DEFAULT_MATERIAL_SETTINGS)

        adjustedSettings.hasPosXOffset ??= Boolean(adjustedSettings.posXOffsetMin&&adjustedSettings.posXOffsetMax)
        if (adjustedSettings.hasPosXOffset) adjustedSettings.posXOffsetMin -= 1
        adjustedSettings.posXOffsetDecimals ??= SimUtils.getMaxDecimals(adjustedSettings.posXOffsetMin, adjustedSettings.posXOffsetMax)

        adjustedSettings.hasPosYOffset ??= Boolean(adjustedSettings.posYOffsetMin&&adjustedSettings.posYOffsetMax)
        if (adjustedSettings.hasPosYOffset) adjustedSettings.posYOffsetMin -= 1
        adjustedSettings.posYOffsetDecimals ??= SimUtils.getMaxDecimals(adjustedSettings.posYOffsetMin, adjustedSettings.posYOffsetMax)

        adjustedSettings.hasVelXOffset ??= Boolean(adjustedSettings.velXOffsetMin&&adjustedSettings.velXOffsetMax)
        if (adjustedSettings.hasVelXOffset) adjustedSettings.velXOffsetMin -= 1
        adjustedSettings.velXOffsetDecimals ??= SimUtils.getMaxDecimals(adjustedSettings.velXOffsetMin, adjustedSettings.velXOffsetMax)

        adjustedSettings.hasVelYOffset ??= Boolean(adjustedSettings.velYOffsetMin&&adjustedSettings.velYOffsetMax)
        if (adjustedSettings.hasVelYOffset) adjustedSettings.velYOffsetMin -= 1
        adjustedSettings.velYOffsetDecimals ??= SimUtils.getMaxDecimals(adjustedSettings.velYOffsetMin, adjustedSettings.velYOffsetMax)

        adjustedSettings.hasGravityOffset ??= Boolean(adjustedSettings.gravityOffsetMin&&adjustedSettings.gravityOffsetMax)
        if (adjustedSettings.hasGravityOffset) adjustedSettings.gravityOffsetMin -= 1
        adjustedSettings.gravityOffsetDecimals ??= SimUtils.getMaxDecimals(adjustedSettings.gravityOffsetMin, adjustedSettings.gravityOffsetMax)

        MaterialSettings.MATERIALS_SETTINGS[material] = adjustedSettings
    }
}