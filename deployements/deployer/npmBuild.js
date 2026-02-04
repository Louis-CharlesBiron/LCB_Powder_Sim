#!/usr/bin/env node
import {copyFileSync} from "fs"
import {basename, join} from "path"
import { CONFIG, DIST, LICENSE, NPM_TIME_LOG_NAME, PROJECT_NAME, README } from "./constants.js"

console.log("\nBUILDING NPM -", PROJECT_NAME)
console.time(NPM_TIME_LOG_NAME)

// UPDATE VERSIONED FILES (?)

// COPY README + LICENSE
copyFileSync(README, join(DIST, basename(CONFIG.readmePath)))
copyFileSync(LICENSE, join(DIST, basename(CONFIG.licensePath)))

// MINIFY BINS FILES (?)

console.log("\nBUILDING NPM COMPLETED -", PROJECT_NAME)
console.timeEnd(NPM_TIME_LOG_NAME)
