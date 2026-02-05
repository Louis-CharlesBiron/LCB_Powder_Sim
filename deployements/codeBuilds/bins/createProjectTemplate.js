#!/usr/bin/env node
import {exec} from "child_process"
import {mkdirSync, writeFileSync} from "fs"
import {createRequire} from "module"
import {join} from "path"
import {createInterface} from "readline"

const PARAM = process.argv[2] ? (process.argv[2].startsWith("-") ? process.argv[2].replace("-","") : process.argv[2]) : "",  
    DEST = join(process.cwd(), PARAM),
    PACKAGE_JSON = createRequire(import.meta.url)("../package.json"),
    PACKAGE_NAME = PACKAGE_JSON.name,
    VERSION = PACKAGE_JSON.version

// Create folders
try {
    mkdirSync(DEST, {recursive:true})
} catch {}

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

    <script type="module" src="index.js"></script>
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
import { Simulation } from "${PACKAGE_NAME}"

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

// Create .gitignore
writeFileSync(join(DEST, ".gitignore"), `
node_modules
.vscode/*
.idea
.DS_Store
`.trim())

// Create package.json
writeFileSync(join(DEST, "package.json"), `
{
    "name": "project_template",
    "version": "1.0.0",
    "main": "index.js",
    "type": "module",
    "scripts": {
      "dev": "vite"
    },
    "dependencies": {
      "${PACKAGE_NAME}": "^${VERSION}"
    },
    "devDependencies": {
      "vite": "^7.3.1"
    }
}`.trim())

console.log("\nLCB Powder Simulator: ESM project template successfully created at '"+DEST+"'!")
console.log("Don't forget to run 'npm install'.\n")

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