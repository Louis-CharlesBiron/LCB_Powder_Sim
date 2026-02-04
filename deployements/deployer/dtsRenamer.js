import { DTS, DTS_DELETE_FOLDERS, NAME_MAPPER, PROJECT_NAME, RENAME_TIME_LOG_NAME } from "./constants.js"
import {basename, join} from "path"
import {readdirSync, readFileSync, rm, writeFileSync} from "fs"

// START LOGS
console.log("CREATING D.TS COMPLETED -", PROJECT_NAME)
console.log("\nRENAMING D.TS - "+PROJECT_NAME)
console.time(RENAME_TIME_LOG_NAME)

// GET DTS RENAMED FILES 
const files = readdirSync(DTS, {recursive:true}).filter(path=>path.includes(".d.ts")).reduce((files, path)=>{
    const content = readFileSync(join(DTS, path), "utf8"), name = NAME_MAPPER[basename(path)]
    if (name) files[name] = content.slice(0, 10)
    return files
}, {})

// DELETE DEFAULT FOLDERS
DTS_DELETE_FOLDERS.forEach(path=>rm(path, {recursive: true, force: true}, ()=>{}))

// CREATE RENAMED FILES
Object.entries(files).forEach(([path, content])=>writeFileSync(join(DTS, path), content))

// END LOGS
console.timeEnd(RENAME_TIME_LOG_NAME)
console.log("RENAMING COMPLETED - "+PROJECT_NAME)
console.log("\nBUILD COMPLETED -", PROJECT_NAME)
