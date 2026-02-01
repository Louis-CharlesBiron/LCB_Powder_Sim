#!/usr/bin/env node
import {copyFileSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync} from "fs"
import {extname, join} from "path"
import {cwd} from "process"

function copyFolder(src, dest, excludedExtensions) {
    const filepaths = readdirSync(src, {recursive:true}), f_ll = filepaths.length
    for (let i=0;i<f_ll;i++) {
        const filepath = join(src, filepaths[i]), destPath = join(dest, filepaths[i])
        if (statSync(filepath).isDirectory()) {
            mkdirSync(destPath, {recursive:true})
            copyFolder(filepath, destPath, excludedExtensions)
        } else if(!excludedExtensions.includes(extname(filepath).replace(".",""))) copyFileSync(filepath, destPath)
    }
}

const CONFIG = JSON.parse(readFileSync("config.json", "utf-8"))

const ROOT = CONFIG.projectRoot,
      SRC = join(ROOT, CONFIG.srcRoot),
      DIST = join(ROOT, CONFIG.distRoot),
      SRC_EXTENSION = CONFIG.srcExtensions,
      MERGE_ORDER = CONFIG.mergeOrder,
      WORKERS = CONFIG.workers,
      ALLOWED_FILES = MERGE_ORDER.concat(WORKERS)

console.log(CONFIG)

// CREATE MERGE FILE

const mergeValue = readdirSync(SRC, {recursive:true}).filter(path=>path.includes(SRC_EXTENSION)).reduce((merge, path)=>{
    const value = readFileSync(join(SRC, path), "utf8")
    merge += `"use strict";\n${value}\n`
}, "")

console.log(mergeValue)