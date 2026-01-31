[![GitHub commit activity](https://img.shields.io/github/commit-activity/m/Louis-CharlesBiron/LCB_Powder_Sim?link=https%3A%2F%2Fgithub.com%2FLouis-CharlesBiron%2FLCB_Powder_Sim%2Fcommits%2Fmain%2F&label=Commit%20Activity)](https://github.com/Louis-CharlesBiron/LCB_Powder_Sim/commits/main/)
![GitHub Created At](https://img.shields.io/github/created-at/Louis-CharlesBiron/LCB_Powder_Sim?label=Since&color=orange)
[![NPM Version](https://img.shields.io/npm/v/lcbpowdersimTODO?label=Version&color=%237761c0)](https://www.npmjs.com/package/lcbpowdersimTODO)
[![NPM Downloads](https://img.shields.io/npm/d18m/lcbpowdersimTODO?label=NPM%20Downloads&color=%231cc959)](https://www.npmjs.com/package/cdejs)
![NPM License](https://img.shields.io/npm/l/lcbpowdersimTODO?label=License&color=cadetblue)

# LCB Powder Simulator
**<u>LCB Powder Simulator</u> is a efficient, fully native JS powder simulation that runs on the [Canvas 2d API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) and [CDEJS](https://github.com/Louis-CharlesBiron/canvasDotEffect).**

# Table of Contents
- **[Web Interface](#web-interface) ([direct link here](https://louis-charlesbiron.github.io/LCB_Powder_Sim))**

- **[Other deployements: App / NPM](#other-deployements)**
- **[Documentation](#documentation)**
    - [Simulation Class](#simulation-class)
    - [MapGrid Class](#mapgrid-class)
    - [Simulation API](#simulation-api)
    - [Materials](#materials)
    - [Brushes](#brushes)
    - [Saves](#saves)
- [Visual Examples](#visual-examples)
- [Credits](#credits)

# [Web Interface](#table-of-contents)
A quick and simple Web page to play around with the simulation without installing anything!

Link: [https://louis-charlesbiron.github.io/LCB_Powder_Sim](https://louis-charlesbiron.github.io/LCB_Powder_Sim)


# [Other deployements](#table-of-contents)

## Applications:

### **Desktop App**:
### - Download Instructions
- Coming soon!

### - Informations
- Toggleable transparent app background for cool effect :) 
- Allows for a fullscreen experience
- More accessible UI (because bigger)
- Runs on [NeutralinoJS](https://github.com/neutralinojs/neutralinojs)

----

### **Chrome Extension**:
### - Download Instructions
- Coming soon!

### - Informations
- A Nice little distraction in the top right of your browser
- More compact UI


## Modules / Packages:

For those who know how to code a bit and want have more control over the simulation, here are the **NPM** and **native browser build** releases as well as [Documentation](#documentation) bellow!

### **NPM**:
- Coming soon!
### **Broswer Build**:
- Coming soon!
 
# [Documentation](#table-of-contents)
This section explains what are the available functions and types to control certain aspect of the simulation.

## [Simulation Class](#table-of-contents)
The `Simulation` class is the core of the simulation and manages all rendering and world manipulation (except for physics).
#### **The Simulation constructor takes the following parameters:**
###### - `new Simulation(CVS, readyCB?, autoStart?, usesWebWorkers?, userSettings?)`
- **CVS** -> A [CDEJS `Canvas`](https://github.com/Louis-CharlesBiron/canvasDotEffect?tab=readme-ov-file#canvas) instance.
- **readyCB**? -> A callback ran once the simulation is started. `(simulation)=>{}`
- **autoStart**? -> Whether the simulation automatically starts once instanciated. (Defaults to true)
- **usesWebWorkers**? -> Whether the physics calculations are offloaded to a worker thread. (RECOMMENDED) (Defaults to true)
- **userSettings**? -> An object defining the user settings. (Uses default settings by default)

#### **Noteworthy attributes**
- `pixels` -> The array containing all materials (might not be directly available when using workers)
- `backStepSavingMaxCount` -> The amount of back step saved (defaults to `DEFAULT_BACK_STEP_SAVING_COUNT`)
- `isMouseWithinSimulation` -> Whether the mouse is inside the simulation bounding box
- `isRunning` -> Whether the simulation is currently running
- `selectedMaterial` -> The material used by default for world manipulation (defaults to `MATERIALS.SAND`)
- `brushType` -> The shape used to draw materials on the simulation with mouse (defaults to `BRUSH_TYPES.PIXEL`)
- `sidePriority` -> The side prioritised first by the physics (defaults to `SIDE_PRIORITIES.RANDOM`)
- `loopExtra` -> A callback called on each rendered frame (defaults to `null`)
- `stepExtra` -> A callback called on each physics step (defaults to `null`)


**UserSettings**:
- `dragAndZoomCanvasEnabled` -> Whether the user can use left click to move around and wheel to zoom (Defaults to true)
- `warningsDisabled` -> Hides warning messages from console (Defaults to false)
- `showBorder` -> If true, displays the bounding box of the simulation (Defaults to true)
- `showGrid` -> If true, displays a grid over the simulation to delimit pixels (Defaults to true)
- `smoothDrawingEnabled` -> Whether to fill gaps between mouse event for smoother drawing (Defaults to true)
- `visualEffectsEnabled` -> Whether to display some visual effect (Defaults to true) [MAYBE AFFECT PERFORMANCE]

## [MapGrid Class](#table-of-contents)
The `MapGrid` class **is mostly used internally** to handle the simulation world space / dimensions.

It still provides useful world functions such as `getLocalMapPixel`, `getAdjacency`, `indexToMapPos`, `mapPosToIndex`.
 
## [Simulation API](#table-of-contents)
TODO SECTION
The simulation application programming interface
- available functions:
Simulation setup
- readyCB

Simulation config
- updateMapSize
- updateMapPixelSize
- updateSidePriority (SIDE_PRIORITIES desc)
- updatePhysicsUnitType

Simulation Control
- start
- stop
- step
- backstep

User Control
- updateSelectedMaterial
- updateBrushType
- updateColors
- userSettings {...}

World Interation
- placePixel / placePixelAtCoords / placePixelAtIndex
- clear
- fill
- fillArea

Persistence
- load
- exportAsText

Others
- saveStep
- getPixelAtMapPos
- updateImgMapFromPixels

### [Materials](#table-of-contents)
TODO SECTION
Simulation.MATERIALS (and other useful enums)
- list of materials
- list of materials_groups
- list of materials_colors
- MATERIAL_STATES
- MATERIAL_STATES_GROUPS

### [Brushes](#table-of-contents)
TODO SECTION
Simulation.BRUSHES
- list brushes
- list brushes_groups

### [Saves](#table-of-contents)
TODO SECTION
- Importing and exporting custom saves
see #Persistence

# [Visual Examples](#table-of-contents)
TODO SECTION
- example images

## [Credits](#table-of-contents)

Made by [Louis-Charles Biron](https://github.com/Louis-CharlesBiron) !

Every line of code in this repository was written by hand with passion!