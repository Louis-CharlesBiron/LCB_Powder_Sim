#!/usr/bin/env node
import {mkdirSync, copyFileSync, writeFileSync} from "fs"
import {join, dirname} from "path"
import {fileURLToPath} from "url"
import {createInterface} from "readline"
import {exec} from "child_process"
import {createRequire} from "module"

const PARAM = process.argv[2] ? (process.argv[2].startsWith("-") ? process.argv[2].replace("-","") : process.argv[2]) : "",
    DEST = join(process.cwd(), PARAM),
    PACKAGE_NAME = createRequire(import.meta.url)("../package.json").name,
    LIB_FOLDER_DEST = join(DEST, PACKAGE_NAME),
    LIB_FILE_NAMES = ["lcbPS.min.js", "RemotePhysicsUnit.min.js"],
    BINS_SRC_FOLDER = dirname(fileURLToPath(import.meta.url)),
    LIB_SRC_PATH = join(BINS_SRC_FOLDER, `../umd/`)

// Create folders
try {
    mkdirSync(DEST, {recursive:true})
    mkdirSync(LIB_FOLDER_DEST, {recursive:true})
} catch {}

// Create lib files
copyFileSync(LIB_SRC_PATH+LIB_FILE_NAMES[0], join(LIB_FOLDER_DEST, LIB_FILE_NAMES[0]))
copyFileSync(LIB_SRC_PATH+LIB_FILE_NAMES[1], join(LIB_FOLDER_DEST, LIB_FILE_NAMES[1]))

// Create index.html
writeFileSync(join(DEST, "index.html"), `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LCB Powder Simulation | UMD Template</title>
  <link rel="stylesheet" href="index.css">
</head>
  <body>
    <canvas id="simulationCanvasId"></canvas>

    <script src="${join(PACKAGE_NAME, LIB_FILE_NAMES[0])}"></script>
    <script src="index.js"></script>
  </body>
</html>
`.trim())

// Create index.css
writeFileSync(join(DEST, "index.css"), `
html, body {
    width: 100%;
    height: 100%;
    background-color: black;
    color: aliceblue;
    overflow: hidden;
    margin: 0;
    padding: 0;
}`.trim())

// Create index.js
writeFileSync(join(DEST, "index.js"),`
const {Simulation} = lcbPS

// Creating the powder simulation
const simulation = new Simulation(
    document.getElementById("simulationCanvasId"),
    onSimulationReady,
    {
        usesWebWorkers: false,
        autoStart: true,
        aimedFPS: 60,
    },
    {
        autoSimulationSizing: true,
        showBorder: true,
        showGrid: true,
        visualEffectsEnabled: true,
    }
)

// Function that runs when the simulation is loaded
function onSimulationReady(simulation) {
    console.log("The simulation is ready!")
}
`.trim())

console.log("LCB Powder Simulator: Browser project template successfully created at '"+DEST+"'!\n")

const cli = createInterface({input:process.stdin, output:process.stdout})

cli.question("Open in explorer [Y/N]?  ", value=>{
    const v = value?.toLowerCase()?.trim()
    if (["code", "c"].includes(v)) exec("code --new-window "+DEST)
    else if (!v || ["y", "yes", "ye", "ok", "for sure"].includes(v)) exec("explorer "+DEST)
    cli.close()
})

process.stdin.on("keypress", (_, key) => {
    if (key.name == "escape") cli.close()
})