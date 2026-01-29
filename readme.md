[![GitHub commit activity](https://img.shields.io/github/commit-activity/m/Louis-CharlesBiron/LCB_Powder_Sim?link=https%3A%2F%2Fgithub.com%2FLouis-CharlesBiron%2FLCB_Powder_Sim%2Fcommits%2Fmain%2F&label=Commit%20Activity)](https://github.com/Louis-CharlesBiron/LCB_Powder_Sim/commits/main/)
![GitHub Created At](https://img.shields.io/github/created-at/Louis-CharlesBiron/LCB_Powder_Sim?label=Since&color=orange)
[![NPM Version](https://img.shields.io/npm/v/lcbpowdersimidk?label=Version&color=%237761c0)](https://www.npmjs.com/package/lcbpowdersimidk)
[![NPM Downloads](https://img.shields.io/npm/d18m/lcbpowdersimidk?label=NPM%20Downloads&color=%231cc959)](https://www.npmjs.com/package/cdejs)
![NPM License](https://img.shields.io/npm/l/lcbpowdersimidk?label=License&color=cadetblue)

# LCB Powder Simulator
**<u>LCB Powder Simulator</u> is a efficient, fully native JS powder simulation that runs on the [Canvas 2d API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) and [CDEJS](https://github.com/Louis-CharlesBiron/canvasDotEffect).**

# Table of Contents
- [Web Interface](#web-interface) ([direct link here](https://louis-charlesbiron.github.io/LCB_Powder_Sim))
- [Other deployements: Desktop App / Chrome Extension / NPM](#other-deployements)
- [Documentation](#documentation)
    - [Simulation Class](#simulation-class)
    - [Simulation API](#simulation-api)
    - [Materials](#materials)
    - [Brushes](#brushes)
    - [Saves](#saves)
- [Visual Examples](#visual-examples)
- [Credits](#credits)

# [Web Interface](#table-of-contents)
- web interface


# [Other deployements](#table-of-contents)
- neutralinojs app
- chrome extension
- NPM

 
# [Documentation](#table-of-contents)

## [Simulation Class](#table-of-contents)
The Simulation Class
 
## [Simulation API](#table-of-contents)
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
Simulation.MATERIALS (and other useful enums)
- list of materials
- list of materials_groups
- list of materials_colors
- MATERIAL_STATES
- MATERIAL_STATES_GROUPS

### [Brushes](#table-of-contents)
Simulation.BRUSHES
- list brushes
- list brushes_groups

### [Saves](#table-of-contents)
- Importing and exporting custom saves
see #Persistence

# [Visual Examples](#table-of-contents)
- example images

## [Credits](#table-of-contents)

Made by [Louis-Charles Biron](https://github.com/Louis-CharlesBiron) !

Everything in this repository was writen by hand!