const DEFAULT_COLOR_SETTINGS = {
        grid: [240,248,255,.2],
        border: [240,248,255,1],

        materials: [
            {}
        ],

        VOID:[0,0,0,0],
        AIR:[0,0,0,0],
        SAND:[235,235,158,1],
        WATER:[0,15,242,.7],
        STONE:[100,100,100,1],
        GRAVEL:[188,188,188,1], 
        INVERTED_WATER:[55,75,180,.75],
        CONTAMINANT:[30,95,65,.75],
        LAVA:[255,132,0,.88],
        ELECTRICITY:[255,235,0,.9],
        COPPER:[121,65,52,1],
        GAS:[255,255,228,.5],
}

;(()=>{
    const DEFAULT_COLOR_CONFIG = {
        base: [0,0,0,0],

        redOffsetMin: 0,
        redOffsetMax: 0,
        redOffsetDecimals:null,
        hasRedOffset:null,

        greenOffsetMin: 0,
        greenOffsetMax: 0,
        greenOffsetDecimals:null,
        hasGreenOffset:null,

        blueOffsetMin: 0,
        blueOffsetMax: 0,
        blueOffsetDecimals:null,
        hasBlueOffset:null,
        
        alphaOffsetMin: 0,
        alphaOffsetMax: 0,
        alphaOffsetDecimals:null,
        hasAlphaOffset:null,
    }
    Object.values(SETTINGS.MATERIALS).forEach(mat=>DEFAULT_COLOR_SETTINGS.materials[mat] = {})


    DEFAULT_COLOR_SETTINGS.materials[SETTINGS.MATERIALS.AIR] = {}
    DEFAULT_COLOR_SETTINGS.materials[SETTINGS.MATERIALS.SAND] = {
        base: [128,0,0,1],//[235,235,158,1]
        redOffsetMin: -50,
        redOffsetMax: 50,
    }


    DEFAULT_COLOR_SETTINGS.materials.forEach((config, i)=>{
        const adjustedConfig = SimUtils.getAdjustedSettings(config, DEFAULT_COLOR_CONFIG)

        adjustedConfig.hasRedOffset ??= Boolean(adjustedConfig.redOffsetMin&&adjustedConfig.redOffsetMax)
        adjustedConfig.redOffsetMin -= 1
        adjustedConfig.redOffsetDecimals ??= SimUtils.getMaxDecimals(adjustedConfig.redOffsetMin, adjustedConfig.redOffsetMax)

        adjustedConfig.hasGreenOffset ??= Boolean(adjustedConfig.greenOffsetMin&&adjustedConfig.greenOffsetMax)
        adjustedConfig.greenOffsetMin -= 1
        adjustedConfig.greenOffsetDecimals ??= SimUtils.getMaxDecimals(adjustedConfig.greenOffsetMin, adjustedConfig.greenOffsetMax)
        
        adjustedConfig.hasBlueOffset ??= Boolean(adjustedConfig.blueOffsetMin&&adjustedConfig.blueOffsetMax)
        adjustedConfig.blueOffsetMin -= 1
        adjustedConfig.blueOffsetDecimals ??= SimUtils.getMaxDecimals(adjustedConfig.blueOffsetMin, adjustedConfig.blueOffsetMax)

        adjustedConfig.hasAlphaOffset ??= Boolean(adjustedConfig.alphaOffsetMin&&adjustedConfig.alphaOffsetMax)
        adjustedConfig.alphaOffsetMin -= 1
        adjustedConfig.alphaOffsetDecimals ??= SimUtils.getMaxDecimals(adjustedConfig.alphaOffsetMin, adjustedConfig.alphaOffsetMax)

        DEFAULT_COLOR_SETTINGS.materials[i] = adjustedConfig
    })
})()