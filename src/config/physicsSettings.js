const DEFAULT_PHYSICS_SETTINGS = {
    maxLogCount: 35,//18,
    timerEnabled: false,
    timerName: ".",
    showSkips: false,
    $randomTableSize: 1<<16,

    equivalentTranspierceChance: .025,

    vaporMovementChance: .855,
    lavaMovementChance: .855,

    contaminationChance: .2,
    lavaMeltChance: .0008,
    fireInflammationChance: .16,
    firePropagatesVaporCreationChance: .21,
    fireExtinguishesVaporCreationChance: .15,

    vaporDecayThreshold: 750,
    fireDecayThreshold: 150,
}