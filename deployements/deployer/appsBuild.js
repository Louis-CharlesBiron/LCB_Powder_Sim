#!/usr/bin/env node
import {copyFileSync} from "fs"
import {basename, join, resolve} from "path"
import { APP_BROWSER_MIN_LIB_DIST, APP_BROWSER_ROOT, APP_DESKTOP_MIN_LIB_DIST, APP_DESKTOP_ROOT, APPS_TIME_LOG_NAME, DIST_UMD, LICENSE, PROJECT_NAME, README, shallowCopyFolder } from "./constants.js"

console.log("BUILDING APPS -", PROJECT_NAME)
console.time(APPS_TIME_LOG_NAME)

// COPY LIB FILES
shallowCopyFolder(resolve(DIST_UMD), resolve(APP_DESKTOP_MIN_LIB_DIST))

shallowCopyFolder(resolve(DIST_UMD), resolve(APP_BROWSER_MIN_LIB_DIST))

// COPY README + LICENSE
copyFileSync(README, join(APP_DESKTOP_ROOT, basename(README)))
copyFileSync(LICENSE, join(APP_DESKTOP_ROOT, basename(LICENSE)))

copyFileSync(README, join(APP_BROWSER_ROOT, basename(README)))
copyFileSync(LICENSE, join(APP_BROWSER_ROOT, basename(LICENSE)))


console.log("BUILDING APPS COMPLETED -", PROJECT_NAME)
console.timeEnd(APPS_TIME_LOG_NAME)