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
        MaterialSettings.MATERIALS_SETTINGS[SETTINGS.MATERIALS.SAND] = {
            //velXOffsetMin:-200,
            //velXOffsetMax:200,
            //velYOffsetMin:-200,
            //velYOffsetMax:200,
        }

        MaterialSettings.MATERIALS_SETTINGS[SETTINGS.MATERIALS.WATER] = {
            gravity: 60,

            //velXOffsetMin:-200,
            //velXOffsetMax:200,
            //velYOffsetMin:-200,
            //velYOffsetMax:200,
        }
        


        Object.values(SETTINGS.MATERIALS).forEach(material=>MaterialSettings.MATERIALS_SETTINGS[material] = {})
        MaterialSettings.MATERIALS_SETTINGS.forEach((settings, material)=>MaterialSettings.updateMaterialSettings(material, settings))
    }
    
    static updateMaterialSettings(material, settings) {
        const adjustedSettings = SimUtils.getAdjustedSettings(settings, MaterialSettings.#DEFAULT_MATERIAL_SETTINGS)

        adjustedSettings.hasPosXOffset ??= adjustedSettings.posXOffsetMin&&adjustedSettings.posXOffsetMax
        adjustedSettings.posXOffsetMin -= 1
        adjustedSettings.posXOffsetDecimals ??= SimUtils.getMaxDecimals(adjustedSettings.posXOffsetMin, adjustedSettings.posXOffsetMax)

        adjustedSettings.hasPosYOffset ??= adjustedSettings.posYOffsetMin&&adjustedSettings.posYOffsetMax
        adjustedSettings.posYOffsetMin -= 1
        adjustedSettings.posYOffsetDecimals ??= SimUtils.getMaxDecimals(adjustedSettings.posYOffsetMin, adjustedSettings.posYOffsetMax)

        adjustedSettings.hasVelXOffset ??= adjustedSettings.velXOffsetMin&&adjustedSettings.velXOffsetMax
        adjustedSettings.velXOffsetMin -= 1
        adjustedSettings.velXOffsetDecimals ??= SimUtils.getMaxDecimals(adjustedSettings.velXOffsetMin, adjustedSettings.velXOffsetMax)

        adjustedSettings.hasVelYOffset ??= adjustedSettings.velYOffsetMin&&adjustedSettings.velYOffsetMax
        adjustedSettings.velYOffsetMin -= 1
        adjustedSettings.velYOffsetDecimals ??= SimUtils.getMaxDecimals(adjustedSettings.velYOffsetMin, adjustedSettings.velYOffsetMax)

        adjustedSettings.hasGravityOffset ??= adjustedSettings.gravityOffsetMin&&adjustedSettings.gravityOffsetMax
        adjustedSettings.gravityOffsetMin -= 1
        adjustedSettings.gravityOffsetDecimals ??= SimUtils.getMaxDecimals(adjustedSettings.gravityOffsetMin, adjustedSettings.gravityOffsetMax)

        MaterialSettings.MATERIALS_SETTINGS[material] = adjustedSettings
    }
}