const DEFAULT_PHYSICS_SETTINGS = {
    $randomTableSize: 1<<16,
    maxLogCount: 35,
    timerName: ".",
    timerEnabled: false,
    showSkips: false,

    // PHYSICS
    equivalentTranspierceChance: .025,

    vaporMovementChance: .855,
    lavaMovementChance: .855,

    contaminationChance: .2,
    lavaMeltChance: .0008,
    fireInflammationChance: .175,
    firePropagatesVaporCreationChance: .21,
    fireExtinguishesVaporCreationChance: .15,

    vaporDecayThreshold: 750,
    fireDecayThreshold: 150,

    baseFriction: 16,
    frictionCoefficient: .0525
}