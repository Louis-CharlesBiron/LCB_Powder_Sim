#!/usr/bin/env node
import {copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync} from "fs"
import {basename, extname, join, resolve} from "path"
import {config, cwd} from "process"
import { minify_sync } from "terser"

console.clear()

const CONFIG = JSON.parse(readFileSync("config.json", "utf8")),
      CMD_START = "///", CMD_PRE = "[[@", CMD_SUF = "]]",
      RAW_BANNER = "//"+CONFIG.projectName+" RAW - v"+CONFIG.version+"\n",
      TERSER_CONFIG = {
          compress: { // TODO TOCHECK
              dead_code: true, drop_console: false,
              unsafe: false, unsafe_math: false, unsafe_arrows: false,
              reduce_vars: true, reduce_funcs: true,
              collapse_vars: true, sequences: true,
              booleans: true, conditionals: true, loops: true, evaluate: true, keep_infinity: true, hoist_funs: true,
              inline: 2, passes: 3,
          },
      }

const MODS = {
    RAW_ONLY: "[*]",
    MODULE_ONLY: "[%]",
    AUTO: "[-]",
}, 
CMD_TYPES = {
    INSERT_EXPORTS: "export",
    INSERT_RAW_ONLY: `${esc(MODS.RAW_ONLY)}:[0-9]+`,
    INSERT_MODULE_ONLY: 2,
}

const ROOT = CONFIG.projectRoot,
      SRC = join(ROOT, CONFIG.srcRoot),
      DIST = join(ROOT, CONFIG.distRoot),
      DIST_RAW = join(DIST, CONFIG.distRaw),
      DIST_MODULE = join(DIST, CONFIG.distModule),

      SRC_EXTENSION = CONFIG.srcExtensions,
      NAME_UMD = CONFIG.buildNameUMD,
      NAME_ESM = CONFIG.buildNameESM,
      
      RAW_MERGE_PATH = join(DIST_RAW, NAME_UMD+".js"),
      RAW_MIN_MERGE_PATH = join(DIST_RAW, NAME_UMD+".min.js"),
      MODULE_MERGE_PATH = join(DIST_MODULE, NAME_ESM+".js"),
      MODULE_MIN_MERGE_PATH = join(DIST_MODULE, NAME_ESM+".min.js")


// GET ALL SRC FILES
const FULL_PATHS = readdirSync(SRC, {recursive:true}).filter(path=>path.includes(SRC_EXTENSION)).map(path=>join(SRC, path))

// CREATE MERGE VALUE
let mergeValue = CONFIG.mergeOrder.reduce((mergeText, fileNameExt)=>{
    let pathIndex = getPathInList(fileNameExt, true)
    
    if (fileNameExt.includes(MODS.RAW_ONLY)) return mergeText += formatCmd(`${MODS.RAW_ONLY}:${pathIndex}`)
    else if (fileNameExt.includes(MODS.MODULE_ONLY)) return mergeText += formatCmd(`${MODS.MODULE_ONLY}:${pathIndex}`)

    
    // GET CONTENT + ADD EXPORTS
    const value = getFileContent(pathIndex).trim()

    return mergeText += `${value}\n\n`
}, "")

// GET WORKERS + CORRECT IMPORTS
const WORKERS = []
CONFIG.workers.forEach(({file: fileNameExt, dependencyFile})=>{
    const isAutoDep = dependencyFile===MODS.AUTO, content = getFileContent(getPathInList(fileNameExt)),
          files = {
            RAW: basename(isAutoDep ? RAW_MERGE_PATH : dependencyFile),
            EXPORT: basename(isAutoDep ? MODULE_MERGE_PATH : dependencyFile),
        }

    Object.entries(files).forEach(([type, dep])=>{
        if (dep) {
            if (type === "RAW") {
                let count = 0
                const cleanContent = content.replaceAll(/importScripts(.+)/gi, ()=>!(count++)?`importScripts("./${dep}")`:"").trim()
                files[type] = `"use strict"\nconsole.log('asdasd')\n${cleanContent}`
            } else {
                const cleanContent = content.replaceAll(/importScripts(.+)/gi, "").trim()
                files[type] = `"use strict"\nimport "./${dep}"\n\n${cleanContent}`
            }
        }
    })

    WORKERS.push({fileNameExt, files})
})

// CREATE WORKER RAW
WORKERS.forEach(({fileNameExt, files})=>{
    writeFileSync(join(DIST_RAW, fileNameExt), files.RAW)
    writeFileSync(join(DIST_RAW, basename(fileNameExt)+".min.js"), getMinified(files.RAW))

    // WORKER_RELATIVE_PATH: "./deployements/codeBuilds/raw/RemotePhysicsUnit.js",
    // importScripts("./lcb-powder-sim.js")
})

// CREATE RAW MERGE
let rawMergeValue = '"use strict";\n'+mergeValue.trim()
executeCmd(rawMergeValue, CMD_TYPES.INSERT_RAW_ONLY, (fileIndex, match)=>rawMergeValue = rawMergeValue.replace(match, `\n${getFileContent(fileIndex)}\n`))

// CREATE RAW MERGE FILE
if (!existsSync(DIST_RAW)) mkdirSync(DIST_RAW)
writeFileSync(RAW_MERGE_PATH, RAW_BANNER+rawMergeValue)

// CREATE RAW MINIFIED MERGE FILE
writeFileSync(RAW_MIN_MERGE_PATH, RAW_BANNER+getMinified(rawMergeValue))





//fileName = basename(fileNameExt).split(".")[0]
                  //.replaceAll(/[\s]*\/\/\/[\s]*\[\[@export\]\][\s]*/gi, "export ")
                  //.replaceAll("class "+fileName, "export class "+fileName)
                  //.replaceAll(/type[\s]*:[\s]*"classic"/gi, 'type:"module"')
                  //.trim()





// DOC TODO
function getMinified(content) {
    return minify_sync(content, TERSER_CONFIG).code
}

// DOC TODO
function getPathInList(fileName, returnIndex) {
    return FULL_PATHS[returnIndex ? "findIndex" : "find"](fullPath=>fullPath.includes(fileName.match(/[a-z.]+/gi)))
}

// TODO DOC
function getFileContent(fileNameOrIndex) {
    return readFileSync(typeof fileNameOrIndex === "number" ? FULL_PATHS[fileNameOrIndex] : fileNameOrIndex, "utf8")
}

// DOC TODO
function executeCmd(text, cmdType, callback) {
    const regex = new RegExp(`[\\s]*${esc(CMD_START)}[\\s]*${esc(CMD_PRE)}${cmdType}${esc(CMD_SUF)}[\\s]*`, "gi"), hasCB = typeof callback === "function"
    if (cmdType === CMD_TYPES.INSERT_EXPORTS) {
    }
    else if (cmdType === CMD_TYPES.INSERT_RAW_ONLY && hasCB) return text.replaceAll(regex, match=>{
        callback(+match.match(/[0-9]+/g)[0], match)
        return match
    })
    else if (cmdType === CMD_TYPES.INSERT_MODULE_ONLY) {
        
    }
}

// DOC TODO
function formatCmd(cmd) {
    return `\n///${CMD_PRE}${cmd}${CMD_SUF}\n`
}

// DOC TODO
function esc(text) {
    return [...text].map(x=>"\\"+x).join("")
}