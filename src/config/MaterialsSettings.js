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
        velXOffsetMin:-1.5,
        velXOffsetMax:1.5,
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

        stepsAlive:0,
        stepsAliveOffsetMin:0,
        stepsAliveOffsetMax:0,
        hasStepsAliveOffset:null,
    }

    // MATERIALS CONFIGS //
    static {
        const {SAND, WATER, GRAVEL, INVERTED_WATER, CONTAMINANT, LAVA, VAPOR, FIRE} = SETTINGS.MATERIALS

        MaterialSettings.MATERIALS_SETTINGS[SAND] = {}

        MaterialSettings.MATERIALS_SETTINGS[WATER] = {
            gravity: 60,
        }

        MaterialSettings.MATERIALS_SETTINGS[GRAVEL] = {
            gravity: 160,
        }
        
        MaterialSettings.MATERIALS_SETTINGS[INVERTED_WATER] = {
            gravity: -90,
            velY:-3,
            velYOffsetMin:-2,
            velYOffsetMax:-4,
        }

        MaterialSettings.MATERIALS_SETTINGS[CONTAMINANT] = {
            gravity: 30,
            hasGravityOffset: false
        }

        MaterialSettings.MATERIALS_SETTINGS[LAVA] = {
            gravity: 20,
            hasGravityOffset: false
        }

        MaterialSettings.MATERIALS_SETTINGS[VAPOR] = {
            gravity: -1,
            gravityOffsetMin:-1.5,
            gravityOffsetMax:0,

            velY:0,
            velYOffsetMin:-4,
            velYOffsetMax:-.5,
            velXOffsetMin:-2,
            velXOffsetMax:2,

            stepsAliveOffsetMax:DEFAULT_PHYSICS_SETTINGS.vaporDecayThreshold-5,
        }

        MaterialSettings.MATERIALS_SETTINGS[FIRE] = {
            gravity: -12,
            gravityOffsetMin:-6,
            gravityOffsetMax:5,

            velY:0,
            velYOffsetMin:-8,
            velYOffsetMax:-2,
            velXOffsetMin:-25,
            velXOffsetMax:25,

            stepsAliveOffsetMax:DEFAULT_PHYSICS_SETTINGS.fireDecayThreshold-5,
        }


        Object.values(SETTINGS.MATERIALS).forEach(material=>MaterialSettings.MATERIALS_SETTINGS[material] ??= {})
        MaterialSettings.MATERIALS_SETTINGS.forEach((settings, material)=>MaterialSettings.updateMaterialSettings(material, settings))
    }

    static getMaterialSettings(material) {
        return MaterialSettings.MATERIALS_SETTINGS[material]
    }
    
    static updateMaterialSettings(material, settings) {
        const adjustedSettings = SimUtils.getAdjustedSettings(settings, MaterialSettings.#DEFAULT_MATERIAL_SETTINGS)

        adjustedSettings.hasPosXOffset ??= Boolean(adjustedSettings.posXOffsetMin||adjustedSettings.posXOffsetMax)
        adjustedSettings.posXOffsetDecimals ??= SimUtils.getMaxDecimals(adjustedSettings.posXOffsetMin, adjustedSettings.posXOffsetMax)

        adjustedSettings.hasPosYOffset ??= Boolean(adjustedSettings.posYOffsetMin||adjustedSettings.posYOffsetMax)
        adjustedSettings.posYOffsetDecimals ??= SimUtils.getMaxDecimals(adjustedSettings.posYOffsetMin, adjustedSettings.posYOffsetMax)

        adjustedSettings.hasVelXOffset ??= Boolean(adjustedSettings.velXOffsetMin||adjustedSettings.velXOffsetMax)
        adjustedSettings.velXOffsetDecimals ??= SimUtils.getMaxDecimals(adjustedSettings.velXOffsetMin, adjustedSettings.velXOffsetMax)

        adjustedSettings.hasVelYOffset ??= Boolean(adjustedSettings.velYOffsetMin||adjustedSettings.velYOffsetMax)
        adjustedSettings.velYOffsetDecimals ??= SimUtils.getMaxDecimals(adjustedSettings.velYOffsetMin, adjustedSettings.velYOffsetMax)

        adjustedSettings.hasGravityOffset ??= Boolean(adjustedSettings.gravityOffsetMin||adjustedSettings.gravityOffsetMax)
        adjustedSettings.gravityOffsetDecimals ??= SimUtils.getMaxDecimals(adjustedSettings.gravityOffsetMin, adjustedSettings.gravityOffsetMax)

        adjustedSettings.hasStepsAliveOffset ??= Boolean(adjustedSettings.stepsAliveOffsetMin||adjustedSettings.stepsAliveOffsetMax)

        MaterialSettings.MATERIALS_SETTINGS[material] = adjustedSettings
    }
}
