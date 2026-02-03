#!/usr/bin/env node
import {existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync} from "fs"
import {basename, join} from "path"
import { minify_sync } from "terser"

console.clear()
console.log("TODO COOL BUILD TEXT")

const CONFIG = JSON.parse(readFileSync("config.json", "utf8")),
      UMD_BANNER = "//"+CONFIG.projectName+" UMD - v"+CONFIG.version+"\n",
      TERSER_CONFIG = {
          compress: { // TODO TOCHECK
              dead_code: true, drop_console: false,
              unsafe: false, unsafe_math: false, unsafe_arrows: false,
              reduce_vars: true, reduce_funcs: true,
              collapse_vars: true, sequences: true,
              booleans: true, conditionals: true, loops: true, evaluate: true, keep_infinity: true, hoist_funs: true,
              inline: 2, passes: 3,
          },
      }, 
      MODS = {
          UMD_ONLY: "[*]",
          ESM_ONLY: "[%]",
          AUTO: "[-]",
      },
      CMD_SYNTAX = {
          LINE_START: "///", 
          INLINE_BORDER: "/*/", 
          PRE: "[[@",
          SUF: "]]",
      },
      CMD_TYPES = {
          INSERT_EXPORTS: "export",
          RESOLVE_WORKER_PATH: "workerPath",
          END: "end",
          INSERT_UMD_ONLY: `${esc(MODS.UMD_ONLY)}:[0-9]+`,
          INSERT_ESM_ONLY: 2,
      }

const ROOT = CONFIG.projectRoot,
      SRC = join(ROOT, CONFIG.srcRoot),
      DIST = join(ROOT, CONFIG.distRoot),
      DIST_UMD = join(DIST, CONFIG.UMDFolderName),
      DIST_UMD_RAW = join(DIST_UMD, CONFIG.unminifiedFolderName),
      DIST_ESM = join(DIST, CONFIG.ESMFolderName),
      DIST_ESM_RAW = join(DIST_ESM, CONFIG.unminifiedFolderName),

      SRC_EXTENSION = CONFIG.srcExtensions,
      NAME_UMD = CONFIG.buildNameUMD,
      NAME_ESM = CONFIG.buildNameESM,
      
      UMD_MERGE_PATH = join(DIST_UMD_RAW, NAME_UMD+".js"),
      UMD_MIN_MERGE_PATH = join(DIST_UMD, NAME_UMD+".min.js"),
      ESM_MERGE_PATH = join(DIST_ESM_RAW, NAME_ESM+".js"),
      ESM_MIN_MERGE_PATH = join(DIST_ESM, NAME_ESM+".min.js")

// CREATE DIST DIRS
if (!existsSync(DIST_UMD)) mkdirSync(DIST_UMD)
if (!existsSync(DIST_UMD_RAW)) mkdirSync(DIST_UMD_RAW)
if (!existsSync(DIST_ESM)) mkdirSync(DIST_ESM)
if (!existsSync(DIST_ESM_RAW)) mkdirSync(DIST_ESM_RAW)

// GET ALL SRC FILES
const FULL_PATHS = readdirSync(SRC, {recursive:true}).filter(path=>path.includes(SRC_EXTENSION)).map(path=>join(SRC, path))


// CREATE MERGE VALUE
let mergeValue = CONFIG.mergeOrder.reduce((mergeText, fileNameExt)=>{//'"use strict";\n'+
    let pathIndex = getPathInList(fileNameExt, true)
    
    if (fileNameExt.includes(MODS.UMD_ONLY)) return mergeText += formatCmd(`${MODS.UMD_ONLY}:${pathIndex}`)
    else if (fileNameExt.includes(MODS.ESM_ONLY)) return mergeText += formatCmd(`${MODS.ESM_ONLY}:${pathIndex}`)

    // GET CONTENT
    let value = getFileContent(pathIndex).trim()

    return mergeText += `${value}\n\n`
}, "").trim()

// CREATE UMD MERGE + WRAPPER + ADJUST WORKER PATH
let umdMergeValue = UMDWrap(
    executeCmd(mergeValue, CMD_TYPES.INSERT_UMD_ONLY, fileIndex=>`\n${getFileContent(fileIndex)}\n`),
    CONFIG.UMDExpose
)

// CREATE UMD MERGE FILE
writeFileSync(UMD_MERGE_PATH, UMD_BANNER+executeCmd(umdMergeValue, CMD_TYPES.RESOLVE_WORKER_PATH, match=>getUMDWorkerPath(match)))

// CREATE UMD MINIFIED MERGE FILE
writeFileSync(UMD_MIN_MERGE_PATH, UMD_BANNER+getMinified(executeCmd(umdMergeValue, CMD_TYPES.RESOLVE_WORKER_PATH, match=>getUMDWorkerPath(match, true))))


// GET WORKERS + CORRECT IMPORTS
const WORKERS = []
CONFIG.workers.forEach(({file: fileNameExt, dependencyFile})=>{
    const isAutoDep = dependencyFile===MODS.AUTO, content = getFileContent(getPathInList(fileNameExt)),
          files = {
            UMD: basename(isAutoDep ? UMD_MERGE_PATH : dependencyFile),
            EXPORT: basename(isAutoDep ? ESM_MERGE_PATH : dependencyFile),
        }

    Object.entries(files).forEach(([type, dep])=>{
        if (dep) {
            if (type === "UMD") {
                let count = 0
                const cleanContent = content.replaceAll(/importScripts(.+)/gi, ()=>!(count++)?`importScripts("./${dep}")`:"").trim()
                files[type] = `"use strict"\n${cleanContent}`
            } else {
                const cleanContent = content.replaceAll(/importScripts(.+)/gi, "").trim()
                files[type] = `"use strict"\nimport "./${dep}"\n\n${cleanContent}`
            }
        }
    })

    WORKERS.push({fileNameExt, files})
})

// CREATE WORKER UMD
WORKERS.forEach(({fileNameExt, files})=>{
    writeFileSync(join(DIST_UMD_RAW, fileNameExt), UMD_BANNER+files.UMD)
    writeFileSync(join(DIST_UMD, stem(fileNameExt)+".min."+stem(fileNameExt, true)[1]), UMD_BANNER+getMinified(files.UMD))

    // new URL("./worker.js", import.meta.url)
})

// TRANSFER DEPENDENCIES
CONFIG.dependencies.forEach(fileNameExt=>{
    const fileName = getCleanfileName(fileNameExt), content = getFileContent(getPathInList(fileName))
    if (fileNameExt.includes(MODS.UMD_ONLY)) writeFileSync(join(DIST_UMD, fileName), content)
    else if (fileNameExt.includes(MODS.ESM_ONLY)) writeFileSync(join(DIST_ESM, fileName), content)
})







//fileName = basename(fileNameExt).split(".")[0]
                  //.replaceAll(/[\s]*\/\/\/[\s]*\[\[@export\]\][\s]*/gi, "export ")
                  //.replaceAll("class "+fileName, "export class "+fileName)
                  //.replaceAll(/type[\s]*:[\s]*"classic"/gi, 'type:"module"')
                  //.trim()



// TODO DOC
function UMDWrap(code, exposedExpressions, workerMocks=CONFIG.workerMocks, exposedName=NAME_UMD) {
    return `(function(factory) {
    if (typeof window === "undefined") {
        window = self
        ;[${workerMocks.map(x=>`"${x}"`)}].forEach(x=>window[x] = class{constructor(){}})
    }
    if (typeof define === "function" && define.amd) define([], factory)
    else if (typeof module === "object" && module.exports) module.exports = factory()
    else if (typeof window !== "undefined") window.${exposedName} = factory()
    else this.${exposedName} = factory()
})(function() {
"use strict"
${code}
return {${exposedExpressions}}
})`
}

// DOC TODO
function executeCmd(text, cmdType, callback) {
    let regex = new RegExp(`[\\s]*${esc(CMD_SYNTAX.LINE_START)}[\\s]*${esc(CMD_SYNTAX.PRE)}${cmdType}${esc(CMD_SYNTAX.SUF)}[\\s]*`, "gi"), hasCB = typeof callback === "function"
    if (cmdType === CMD_TYPES.INSERT_EXPORTS) {

    }
    else if (cmdType === CMD_TYPES.RESOLVE_WORKER_PATH) {
        regex = new RegExp(`${esc(CMD_SYNTAX.INLINE_BORDER)}[\\s]*${esc(CMD_SYNTAX.PRE)}${cmdType}${esc(CMD_SYNTAX.SUF)}[\\s]*${esc(CMD_SYNTAX.INLINE_BORDER)}.+${esc(CMD_SYNTAX.INLINE_BORDER)}[\\s]*${esc(CMD_SYNTAX.PRE)}${CMD_TYPES.END}${esc(CMD_SYNTAX.SUF)}[\\s]*${esc(CMD_SYNTAX.INLINE_BORDER)}`, "gi")
        return text.replaceAll(regex, match=>callback(match.split(CMD_SYNTAX.INLINE_BORDER)[2], match))
    }
    else if (cmdType === CMD_TYPES.INSERT_UMD_ONLY && hasCB) return text.replaceAll(regex, match=>callback(+match.match(/[0-9]+/g)[0], match))
    else if (cmdType === CMD_TYPES.INSERT_ESM_ONLY) {
        
    }
}


// DOC TODO
function getUMDWorkerPath(fileName, isMinified) {
    const [name, extension] = stem(fileName, true), minifiedExtension = isMinified?".min":""
    return `new URL("./${name+minifiedExtension+"."+extension}", (document?.currentScript?.src||"err://-1")).href`
}

// DOC TODO
function stem(fileNameExt, returnExtension) {
    const fileNameInfo = basename(fileNameExt).match(/[./a-z0-9_ -]+/gi)[0].split(".")
    return returnExtension ? fileNameInfo : fileNameInfo[0]
}

// DOC TODO
function getMinified(content) {
    return minify_sync(content, TERSER_CONFIG).code
}

// DOC TODO
function getPathInList(fileName, returnIndex) {
    return FULL_PATHS[returnIndex ? "findIndex" : "find"](fullPath=>fullPath.includes(getCleanfileName(fileName)))
}

// DOC TODO
function getCleanfileName(fileName) {
    return fileName.match(/[a-z.]+/gi)?.[0]
}

// TODO DOC
function getFileContent(fileNameOrIndex) {
    return readFileSync(typeof fileNameOrIndex === "number" ? FULL_PATHS[fileNameOrIndex] : fileNameOrIndex, "utf8")
}

// DOC TODO
function formatCmd(cmd) {
    return `\n///${CMD_SYNTAX.PRE}${cmd}${CMD_SYNTAX.SUF}\n`
}

// DOC TODO
function esc(text) {
    return [...text].map(x=>"\\"+x).join("")
}