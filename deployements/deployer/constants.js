import {readFileSync} from "fs"
import {basename, join} from "path"
import {minify_sync} from "terser"

export const CONFIG_PATH_FROM_DEPLOYER = "../codeBuilds/buildConfig.json",
      CONFIG = JSON.parse(readFileSync(CONFIG_PATH_FROM_DEPLOYER, "utf8")),
      PACKAGE_JSON = JSON.parse(readFileSync(CONFIG.packageJsonPath, "utf8")),
      VERSION = PACKAGE_JSON?.version||"verison_undefined",
      PROJECT_NAME = CONFIG.projectName||PACKAGE_JSON?.name||"?",
      ROOT = CONFIG.projectRoot,
      SRC = join(ROOT, CONFIG.srcRoot),
      DIST = join(ROOT, CONFIG.distRoot),

      BINS = join(DIST, CONFIG.binsFolderName),
      DTS = join(DIST, CONFIG.dtsFolderName),

      README = join(ROOT, CONFIG.readmePath),
      LICENSE = join(ROOT, CONFIG.licensePath),

      BUILD_TIME_LOG_NAME = "Merging",
      RENAME_TIME_LOG_NAME = "Renaming",
      NPM_TIME_LOG_NAME = "Building npm",

      NAME_UMD = CONFIG.buildNameUMD,
      DIST_UMD = join(DIST, CONFIG.UMDFolderName),
      DIST_UMD_RAW = join(DIST_UMD, CONFIG.unminifiedFolderName),
      UMD_MERGE_PATH = join(DIST_UMD_RAW, NAME_UMD+".js"),
      PRE_WRAP_MERGE_PATH = join(DIST_UMD_RAW, NAME_UMD+".pre.js"),
      UMD_MIN_MERGE_PATH = join(DIST_UMD, NAME_UMD+".min.js"),

      NAME_ESM = CONFIG.buildNameESM,
      DIST_ESM = join(DIST, CONFIG.ESMFolderName),
      DIST_ESM_RAW = join(DIST_ESM, CONFIG.unminifiedFolderName),
      ESM_MERGE_PATH = join(DIST_ESM_RAW, NAME_ESM+".js"),
      ESM_MIN_MERGE_PATH = join(DIST_ESM, NAME_ESM+".min.js"),

      NAME_MAPPER = {
      "lcb-ps.d.ts": "lcb-ps.esm.d.ts",
      "lcbPS.pre.d.ts": "lcbPS.umd.d.ts",
      },
      DTS_DELETE_FOLDERS = [
            join(DTS, CONFIG.UMDFolderName),
            join(DTS, CONFIG.ESMFolderName),
      ]

/**
 * Minifies the provided content based on the provided terserConfig
 * @param {String} content The code/content to minify
 * @param {Object} terserConfig The terser config object
 * @returns The minified code
 */
export function getMinified(content, terserConfig) {
    return minify_sync(content, terserConfig).code
}

/**
 * Returns the .min in a fileName
 * @param {String} fileName The name of the worker file 
 */
export function getFileNameMinified(fileName) {
    const [name, extension] = stem(fileName, true)
    return name+".min."+extension
}

/**
 * Returns the extensionless basename of a file
 * @param {String} fileName The name of the worker file (with extension)
 * @param {Boolean} returnExtension If true, returns both the basename and the extension 
 */
export function stem(fileName, returnExtension) {
    const fileNameInfo = basename(fileName).match(/[./a-z0-9_ -]+/gi)[0].split(".")
    return returnExtension ? fileNameInfo : fileNameInfo[0]
}