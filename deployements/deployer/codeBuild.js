#!/usr/bin/env node
import {existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync} from "fs"
import {basename, join} from "path"
import { BUILD_TIME_LOG_NAME, CONFIG, DIST_ESM, DIST_ESM_RAW, DIST_UMD, DIST_UMD_RAW, ESM_MERGE_PATH, ESM_MIN_MERGE_PATH, getFileNameMinified, getMinified, NAME_UMD, PRE_WRAP_MERGE_PATH, PROJECT_NAME, SRC, UMD_MERGE_PATH, UMD_MIN_MERGE_PATH, VERSION } from "./constants.js"


const UMD_BANNER = "//"+PROJECT_NAME+" UMD - v"+VERSION+"\n", ESM_BANNER = UMD_BANNER.replace("UMD", "ESM"),
    TERSER_CONFIG = {
        compress: {
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
        INSERT_ESM_ONLY: `${esc(MODS.ESM_ONLY)}:[0-9]+`,
    }



// STARTS LOGS
console.log("BUILDING -", PROJECT_NAME)
console.time(BUILD_TIME_LOG_NAME)

// CREATE DIST DIRS
if (!existsSync(DIST_UMD)) mkdirSync(DIST_UMD)
if (!existsSync(DIST_UMD_RAW)) mkdirSync(DIST_UMD_RAW)
if (!existsSync(DIST_ESM)) mkdirSync(DIST_ESM)
if (!existsSync(DIST_ESM_RAW)) mkdirSync(DIST_ESM_RAW)

// GET ALL SRC FILES
const FULL_PATHS = readdirSync(SRC, {recursive:true}).filter(path=>path.includes(CONFIG.srcExtensions)).map(path=>join(SRC, path))

// CREATE MERGE VALUE
let mergeValue = CONFIG.mergeOrder.reduce((mergeText, fileNameExt)=>{
    let pathIndex = getPathInList(fileNameExt, true)
    
    if (fileNameExt.includes(MODS.UMD_ONLY)) return mergeText += formatCmd(`${MODS.UMD_ONLY}:${pathIndex}`)
    else if (fileNameExt.includes(MODS.ESM_ONLY)) return mergeText += formatCmd(`${MODS.ESM_ONLY}:${pathIndex}`)

    // MERGE CONTENT
    return mergeText += `${getFileContent(pathIndex).trim()}\n\n`
}, "").trim()

// CREATE UMD MERGE + WRAPPER + ADJUST WORKER PATH
const preWrapMergeValue = executeCmd(mergeValue, CMD_TYPES.INSERT_UMD_ONLY, fileIndex=>`\n${getFileContent(fileIndex)}\n`),
      umdMergeValue = UMDWrap(preWrapMergeValue, CONFIG.UMDExpose)

// CREATE UMD FILES
writeFileSync(PRE_WRAP_MERGE_PATH, preWrapMergeValue)
console.log("CREATED", UMD_MERGE_PATH)
writeFileSync(UMD_MERGE_PATH, UMD_BANNER+executeCmd(umdMergeValue, CMD_TYPES.RESOLVE_WORKER_PATH, match=>getResolvedWorkerPath(match)))
console.log("CREATED", UMD_MERGE_PATH)
writeFileSync(UMD_MIN_MERGE_PATH, UMD_BANNER+getMinified(executeCmd(umdMergeValue, CMD_TYPES.RESOLVE_WORKER_PATH, match=>getResolvedWorkerPath(match, true)), TERSER_CONFIG))
console.log("CREATED", UMD_MIN_MERGE_PATH)

// CREATE ESM FILES
const esmMergeValue = `${ESM_BANNER}if (typeof window === "undefined") {
    self["window"] = {}
    ;[${CONFIG.workerMocks.map(x=>`"${x}"`)}].forEach(x=>self[x] = class{constructor(){}})
}
${executeCmd(executeCmd(mergeValue, CMD_TYPES.INSERT_EXPORTS), CMD_TYPES.INSERT_ESM_ONLY, fileIndex=>`\n${getFileContent(fileIndex)}\n`)}
`.trim()

writeFileSync(ESM_MERGE_PATH, executeCmd(esmMergeValue, CMD_TYPES.RESOLVE_WORKER_PATH, match=>getResolvedWorkerPath(match, false, true)))
console.log("CREATED", ESM_MERGE_PATH)
writeFileSync(ESM_MIN_MERGE_PATH, ESM_BANNER+getMinified(executeCmd(esmMergeValue, CMD_TYPES.RESOLVE_WORKER_PATH, match=>getResolvedWorkerPath(match, true, true)), TERSER_CONFIG))
console.log("CREATED", ESM_MIN_MERGE_PATH)


// GET WORKERS + CORRECT IMPORTS
const WORKERS = []
CONFIG.workers.forEach(({file: fileNameExt, dependencyFile, importExpressions})=>{
    dependencyFile ||= MODS.AUTO
    const isAutoDep = dependencyFile===MODS.AUTO, content = getFileContent(getPathInList(fileNameExt)),
          files = {
            UMD: basename(isAutoDep ? UMD_MERGE_PATH : dependencyFile),
            ESM: basename(isAutoDep ? ESM_MERGE_PATH : dependencyFile),
        }

    Object.entries(files).forEach(([type, dep])=>{
        if (dep) {
            const MIN = "_MIN"
            if (type === "UMD") {
                let cleanContent = content.replaceAll(/importScripts(.+)/gi, "").trim(), safeImports = ""
                if (importExpressions?.length) safeImports = `\nif (self["${NAME_UMD}"]) {${importExpressions.map(expression=>`\n   self["${expression}"] = self["${NAME_UMD}"]["${expression}"]`)}\n}\n\n`
                files[type] = `"use strict"\nimportScripts("./${dep}")\n${safeImports}${cleanContent}`
                files[type+MIN] = `"use strict"\nimportScripts("./${getFileNameMinified(dep)}")\n${safeImports}${cleanContent}`
            } else {
                const cleanContent = content.replaceAll(/importScripts(.+)/gi, "").trim()
                files[type] = `"use strict"\nimport {${importExpressions}} from "./${dep}"\n\n${cleanContent}`
                files[type+MIN] = `"use strict"\nimport {${importExpressions}} from "./${getFileNameMinified(dep)}"\n\n${cleanContent}`
            }
        }
    })

    WORKERS.push({fileNameExt, files})
})

// CREATE WORKER FILES
WORKERS.forEach(({fileNameExt, files})=>{
    const minName = getFileNameMinified(fileNameExt),
          UMD_RAW = join(DIST_UMD_RAW, fileNameExt), UMD_MIN = join(DIST_UMD, minName),
          ESM_RAW = join(DIST_ESM_RAW, fileNameExt), ESM_MIN = join(DIST_ESM, minName)

    // UMD
    writeFileSync(UMD_RAW, UMD_BANNER+files.UMD)
    console.log("CREATED WORKER", UMD_RAW)
    writeFileSync(UMD_MIN, UMD_BANNER+getMinified(files.UMD_MIN, TERSER_CONFIG))
    console.log("CREATED WORKER", UMD_MIN)

    // ESM
    writeFileSync(ESM_RAW, ESM_BANNER+files.ESM)
    console.log("CREATED WORKER", ESM_RAW)
    writeFileSync(ESM_MIN, ESM_BANNER+getMinified(files.ESM_MIN, TERSER_CONFIG))
    console.log("CREATED WORKER", ESM_MIN)
})

// TRANSFER DEPENDENCIES
CONFIG.dependencies.forEach(fileNameExt=>{
    const fileName = getCleanfileName(fileNameExt), content = getFileContent(getPathInList(fileName))
    if (fileNameExt.includes(MODS.UMD_ONLY)) writeFileSync(join(DIST_UMD, fileName), content)
    else if (fileNameExt.includes(MODS.ESM_ONLY)) writeFileSync(join(DIST_ESM, fileName), content)
})
if (CONFIG?.dependencies?.length) console.log("DEPENDENCIES TRANSFERED")

// END LOGS
console.log("BUILD MERGED -", PROJECT_NAME)
console.timeEnd(BUILD_TIME_LOG_NAME)
console.log("\nCREATING D.TS -", PROJECT_NAME)


// UTILS FUNCTIONS

/**
 * Wraps the provided code in a UMD wrapper 
 * @param {String} code The code to wrap
 * @param {String[]} exposedExpressions The variables/classes/functions to expose globally 
 * @param {String?} workerMocks The classes/expressions to mock when using workers with this code
 * @param {String?} exposedName The name of the globally exposed root variable
 * @returns The UMD wrapped code
 */
function UMDWrap(code, exposedExpressions, workerMocks=CONFIG.workerMocks) {
    return `(function(factory) {
    if (typeof window === "undefined") {
        ;[${workerMocks.map(x=>`"${x}"`)}].forEach(x=>self[x] = class{constructor(){}})
        self["window"] = {}
    }
    if (typeof define === "function" && define.amd) define([], factory)
    else if (typeof module === "object" && module.exports) module.exports = factory()
    else if (typeof window !== "undefined") self["${NAME_UMD}"] = factory()
    else self["${NAME_UMD}"] = factory()
})(function() {
"use strict"
${code}
return {${exposedExpressions}}
})`
}

/**
 * Executes a command in the provided text
 * @param {String} text The text containing commands to execute
 * @param {CMD_TYPES} cmdType The command to execute
 * @param {Function?} callback A callback called to replace values with the RESOLVE_WORKER_PATH INSERT_[UMD/ESM]_ONLY and commands. (interessedMatchValue, match?)=>{return "replaceValue"}
 * @returns The text with the command executed
 */
function executeCmd(text, cmdType, callback) {
    let regex = new RegExp(`[\\s]*${esc(CMD_SYNTAX.LINE_START)}[\\s]*${esc(CMD_SYNTAX.PRE)}${cmdType}${esc(CMD_SYNTAX.SUF)}[\\s]*`, "gi"), hasCB = typeof callback === "function"
    if (cmdType === CMD_TYPES.INSERT_EXPORTS) {
        return text.replaceAll(regex, "\n export ")
        .replaceAll(/class[\s]+[a-z0-9_]+[\s]*{/gi, match=>"export "+match)
        .replaceAll(/type[\s]*:[\s]*"classic"/gi, 'type:"module"')
        .trim()
    }
    else if (cmdType === CMD_TYPES.RESOLVE_WORKER_PATH && hasCB) {
        regex = new RegExp(`${esc(CMD_SYNTAX.INLINE_BORDER)}[\\s]*${esc(CMD_SYNTAX.PRE)}${cmdType}${esc(CMD_SYNTAX.SUF)}[\\s]*${esc(CMD_SYNTAX.INLINE_BORDER)}.+${esc(CMD_SYNTAX.INLINE_BORDER)}[\\s]*${esc(CMD_SYNTAX.PRE)}${CMD_TYPES.END}${esc(CMD_SYNTAX.SUF)}[\\s]*${esc(CMD_SYNTAX.INLINE_BORDER)}`, "gi")
        return text.replaceAll(regex, match=>callback(match.split(CMD_SYNTAX.INLINE_BORDER)[2], match))
    }
    else if ((cmdType === CMD_TYPES.INSERT_UMD_ONLY || cmdType === CMD_TYPES.INSERT_ESM_ONLY) && hasCB) return text.replaceAll(regex, match=>callback(+match.match(/[0-9]+/g)[0], match))
}

/**
 * Replaces a hardcoded worker path string into a relative path
 * @param {String} fileName The name of the worker file (with extension)
 * @param {Boolean} isMinified Whether to return the minified file version of the path
 * @param {Boolean} isESM Whether to return the ESM version of the path
 * @returns The adjusted path
 */
function getResolvedWorkerPath(fileName, isMinified, isESM) {
    const base = isESM ? "import.meta.url" : `(document?.currentScript?.src||"err://-1")`, name = getCleanfileName(fileName)
    return `new URL("./${isMinified ? getFileNameMinified(name) : basename(name)}", ${base}).href`
}

/**
 * Returns the full path of the provided fileName
 * @param {String} fileName The name of the worker file
 * @param {Boolean} returnIndex If true, returns the index in FULL_PATHS instead of the actual path
 */
function getPathInList(fileName, returnIndex) {
    return FULL_PATHS[returnIndex ? "findIndex" : "find"](fullPath=>fullPath.includes(getCleanfileName(fileName)))
}

/**
 * Returns a cleaned valid filename
 * @param {String} fileName The name of the worker file
 */
function getCleanfileName(fileName) {
    return fileName.match(/[./a-z0-9_ -]+/gi)?.[0]
}

/**
 * Reads and returns a file's content
 * @param {String | Number} fileNameOrIndex A file path or FULL_PATHS index
 * @returns The file contents
 */
function getFileContent(fileNameOrIndex) {
    return readFileSync(typeof fileNameOrIndex === "number" ? FULL_PATHS[fileNameOrIndex] : fileNameOrIndex, "utf8")
}

/**
 * Formats a command
 * @param {CMD_TYPES} cmd The command
 * @returns The formated command
 */
function formatCmd(cmd) {
    return `\n///${CMD_SYNTAX.PRE}${cmd}${CMD_SYNTAX.SUF}\n`
}

/**
 * Escapes every character in the provided text
 * @param {String} text The text to escape
 * @returns an escaped version of the provided text
 */
function esc(text) {
    return [...text].map(x=>"\\"+x).join("")
}