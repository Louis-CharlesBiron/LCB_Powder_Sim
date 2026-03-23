const WARNINGS = {
    FILE_SERVED_WARN:`Web workers are disabled when serving with file:// protocol.\n  Serve this page over http(s):// to enable them.`,
    STANDALONE_KEYBIND_WARN:`The keybind pressed is not linked to any function.`,
    NOT_INITIALIZED_LOAD_WARN:`Tried loading with 'load()' while simulation is not yet initialized.\n Use the 'readyCB' callback to load a save on launch.`,
    NOT_INITIALIZED_MAP_SIZE_WARN:`Tried updating map size with 'updateMapSize()' while simulation is not yet initialized.\n Use the 'readyCB' callback to update map size on launch.`,
    NOT_INITIALIZED_PIXEL_SIZE_WARN:`Tried updating pixel size with 'updateMapPixelSize()' while simulation is not yet initialized.\n Use the 'readyCB' callback to update pixel size on launch.`,
    NOT_INITIALIZED_PHYSICS_TYPE_WARN:`Tried updating physics unit type with 'updatePhysicsUnitType()' while simulation is not yet initialized.\n Use the 'readyCB' callback to update physics unit type on launch.`,
    OUT_OF_MEMORY_WARN:mapGrid=>`The map size[${mapGrid.dimensions.join("x")}], or pixelSize[${mapGrid.pixelSize}], is too big. Try lowering the pixelSize, the width or height.`,
    ABSTRACT_INTANCIATION:cls=>`The class '${cls.constructor.name}' is abstract. It should not be instanciated on its own.`,

}