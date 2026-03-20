const DEFAULT_USER_SETTINGS = {
    maxDynamicMaterialCount: Infinity,

    backStepSavingCount: 100,
    backStepSaveOnPlacement: true,
    backStepSavingIsExact: false,

    autoSimulationSizing: null,

    dragAndZoomCanvasEnabled: true,
    minZoomThreshold: .1,
    maxZoomThreshold: Infinity,
    zoomInIncrement: .25,
    zoomOutIncrement: -.2,

    warningsDisabled: false,

    showBorder: true,
    showGrid: true,
    showBrush: true,
    showCursor: true,

    visualEffectsEnabled: true,

    smoothDrawingEnabled: true,
    drawingDisabled: false,
    useMouseVelocityForCreation: false,
    mouseVelocityCoefficient: .09,
}

;(()=>{
    // SET DEFAULT autoSimulationSizing
    if (DEFAULT_USER_SETTINGS.autoSimulationSizing === null) DEFAULT_USER_SETTINGS.autoSimulationSizing = SETTINGS.DEFAULT_MAP_RESOLUTIONS.DEFAULT
})()