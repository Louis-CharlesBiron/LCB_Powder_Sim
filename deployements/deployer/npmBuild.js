#!/usr/bin/env node
import {copyFileSync, readdirSync, readFileSync, writeFileSync} from "fs"
import {basename, join} from "path"
import { BINS, CONFIG, DIST, getFileNameMinified, getMinified, LICENSE, NPM_TIME_LOG_NAME, PROJECT_NAME, README, ROOT, VERSION } from "./constants.js"

console.log("BUILDING NPM -", PROJECT_NAME)
console.time(NPM_TIME_LOG_NAME)

const TERSER_CONFIG = {
        module: true,
        compress: {
            drop_console: false,
            unsafe: false,
            passes: 2,
        },
        mangle: false,
        format: {
            comments: "some",
            "shebang": true
        }
    }

// CREATE MINIFIED BINS FILES
readdirSync(BINS, {recursive:true}).filter(path=>!path.includes(".min")).forEach(fileName=>{
    const minPath = join(BINS, getFileNameMinified(fileName)), content = readFileSync(join(BINS, fileName), "utf8").replaceAll(/_MIN_[\s]*=[\s]*""/gi, `_MIN_=".min"`)
    writeFileSync(minPath, getMinified(content, TERSER_CONFIG))
    console.log("CREATED "+minPath)
})

// UPDATE VERSIONED FILES TODO
CONFIG.npmVersionedFilePaths.forEach(path=>{
    const versionedFilePath = join(ROOT, path)
    writeFileSync(versionedFilePath, readFileSync(versionedFilePath, "utf8").replaceAll(/"lcb-js"[\s]*:[\s]*"\^[0-9]+.[0-9]+.[0-9]+"/gi, `"lcb-js": "^${VERSION}"`))
})

// COPY README + LICENSE
copyFileSync(README, join(DIST, basename(CONFIG.readmePath)))
copyFileSync(LICENSE, join(DIST, basename(CONFIG.licensePath)))


console.log("BUILDING NPM COMPLETED -", PROJECT_NAME)
console.timeEnd(NPM_TIME_LOG_NAME)