//MATERIALS: {// 0-15
//    AIR: 1<<0,
//    SAND: 1<<1,
//    WATER: 1<<2,
//    STONE: 1<<3,
//    GRAVEL: 1<<4,
//    INVERTED_WATER: 1<<5,
//    CONTAMINANT: 1<<6,
//    LAVA: 1<<7,
//    ELECTRICITY: 1<<8,
//    COPPER: 1<<9,
//    GAS: 1<<10,
//},

//this._indexFlags[i] = 0
//this._indexPosX[i] = x
//this._indexPosY[i] = y+CDEUtils.random(0, .85, 3)
//this._indexVelX[i] = 0//2*(CDEUtils.random(-2, 1)||1)
//this._indexVelY[i] = 2+CDEUtils.random(0, 1, 3)
//this._indexGravity[i] = 90+CDEUtils.random(-10, 20)


const MATERIALS_CONFIG = []

;(()=>{
    const DEFAULTS_MATERIAL_CONFIG = {
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
    Object.values(SETTINGS.MATERIALS).forEach(mat=>MATERIALS_CONFIG[mat] = {})
    

    // MATERIALS CONFIGS
    MATERIALS_CONFIG[SETTINGS.MATERIALS.SAND] = {
        //hasVelXOffset: false,
        velX: 0,
        velXOffsetMin:-100,
        velXOffsetMax:100,
    }

    MATERIALS_CONFIG[SETTINGS.MATERIALS.WATER] = {
        //hasVelXOffset: false,
        gravity: 60,

        //velX: 0,
        //velXOffsetMin:-100,
        //velXOffsetMax:100,
    }
    





    const getDecimals = (...nums)=>Math.max(...nums.map(num=>(num+"").split(".")?.[1]?.length||0))
    MATERIALS_CONFIG.forEach((config, i)=>{
        const adjustedConfig = SimUtils.getAdjustedSettings(config, DEFAULTS_MATERIAL_CONFIG)

        adjustedConfig.hasPosXOffset ??= adjustedConfig.posXOffsetMin&&adjustedConfig.posXOffsetMax
        adjustedConfig.posXOffsetMin -= 1
        adjustedConfig.posXOffsetDecimals ??= getDecimals(adjustedConfig.posXOffsetMin, adjustedConfig.posXOffsetMax)

        adjustedConfig.hasPosYOffset ??= adjustedConfig.posYOffsetMin&&adjustedConfig.posYOffsetMax
        adjustedConfig.posYOffsetMin -= 1
        adjustedConfig.posYOffsetDecimals ??= getDecimals(adjustedConfig.posYOffsetMin, adjustedConfig.posYOffsetMax)

        adjustedConfig.hasVelXOffset ??= adjustedConfig.velXOffsetMin&&adjustedConfig.velXOffsetMax
        adjustedConfig.velXOffsetMin -= 1
        adjustedConfig.velXOffsetDecimals ??= getDecimals(adjustedConfig.velXOffsetMin, adjustedConfig.velXOffsetMax)

        adjustedConfig.hasVelYOffset ??= adjustedConfig.velYOffsetMin&&adjustedConfig.velYOffsetMax
        adjustedConfig.velYOffsetMin -= 1
        adjustedConfig.velYOffsetDecimals ??= getDecimals(adjustedConfig.velYOffsetMin, adjustedConfig.velYOffsetMax)

        adjustedConfig.hasGravityOffset ??= adjustedConfig.gravityOffsetMin&&adjustedConfig.gravityOffsetMax
        adjustedConfig.gravityOffsetMin -= 1
        adjustedConfig.gravityOffsetDecimals ??= getDecimals(adjustedConfig.gravityOffsetMin, adjustedConfig.gravityOffsetMax)

        MATERIALS_CONFIG[i] = adjustedConfig
    })
})()