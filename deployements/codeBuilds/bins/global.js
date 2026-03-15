#!/usr/bin/env node
import {spawn} from "child_process"
import {createRequire} from "module"
import {dirname, join} from "path"
import {createInterface} from "readline"

// TO TEST, USE:
// npx ./ 'command'

const PACKAGE_JSON = createRequire(import.meta.url)("../package.json"), _MIN_="",
    PACKAGE_NAME = PACKAGE_JSON.name,
    VERSION = PACKAGE_JSON.version,
    LIST_SPACING = "  ",
    HELP_LIST_TEXT = `\nType 'npx ${PACKAGE_NAME} list' for a list of all commands.`,
    COMMANDS = {
        template: "createProjectTemplate"+_MIN_+".js",
        "browser-template": "createBrowserProjectTemplate"+_MIN_+".js",
        documentation: "openDocumentation"+_MIN_+".js",

        help: "help",
        list: "list",
        version: "version"
    },
    PARAMS = {
        SKIP_AUTOCOMPLETION_CONFIRM: ["-y", "-f"],
        YES: ["y", "yes", "ye", "ok", "for sure"]
    },
    ALIASES = {
        doc: "documentation",
        v: "version",
        ls: "list",
        t: "template",
        bt: "browser-template",
    },
    COMMANDS_DESC = {
        template:"Creates a simple ESM project template. Takes an optional folder path in parameter.",
        "browser-template":"Creates a simple UMD project template. Takes an optional folder path in parameter.",
        documentation: "Opens the documentation",

        help: "Shows commands syntax",
        list: "Shows all available commands and aliases",
        version: "Returns the installed version of the librairy",
    }

// GET COMMAND
const rawCommand = process.argv[2]?.toLowerCase().trim(), command = getCommand(rawCommand, process.argv.slice(3))

// TRY TO EXECUTE COMMAND
if (command) {
    if (command.wasAutoCompleted) {
        const cli = createInterface({input: process.stdin, output: process.stdout})

        cli.question(`The command was autocompleted to '${command.cmdName}', continue [Y/N]? `, value=>{
            const v = value?.toLowerCase()?.trim()
            if (!v || PARAMS.YES.includes(v)) executeCmd(command)
            cli.close()
        })
        
        process.stdin.on("keypress", (_, key) => {
            if (key.name.toLowerCase() === "escape") cli.close()
        })
    }
    else executeCmd(command)
}
// COMMAND NOT FOUND
else if (rawCommand == undefined) console.log(`\nNo command specified...${HELP_LIST_TEXT}\n`)
else console.log(`\n'${rawCommand}' is not part of any ${PACKAGE_NAME} command...${HELP_LIST_TEXT}\n`)


// UTILS FUNCTIONS

/**
 * 
 * @param {String} commandInput The user command from the terminal
 * @param {String[]} params The params of the command
 * @returns Either:
    -  a npx command object {cmdName: "someCommandOrShortcut", cmd: "binPath.js", wasAutoCompleted: Boolean} 
    -  or a custom command object {cmd: "someCustomCommand"} 
 */
function getCommand(commandInput, params) {
    if (ALIASES[commandInput]) commandInput = ALIASES[commandInput] 
    const isDirectFind = Boolean(COMMANDS[commandInput]), [cmd, cmdValue] = Object.entries(COMMANDS).find(([commandsKey])=>commandsKey.toLowerCase().includes(commandInput))||[]

    if (cmd && commandInput !== PACKAGE_NAME) return {
        wasAutoCompleted: !isDirectFind && !params.some(param=>PARAMS.SKIP_AUTOCOMPLETION_CONFIRM.includes(param)),
        cmdName: cmd,
        cmd: (cmd === cmdValue) ? cmd : join(dirname(process.argv[1]), cmdValue),
        params: params.filter(x=>!PARAMS.SKIP_AUTOCOMPLETION_CONFIRM.includes(x)),
    }
    else return null
}

/**
 * Executes a command
 * @param {Object} command Command object based on getCommand()'s return value
 */
function executeCmd(command) {
    const {cmd, params} = command

    // RUN CUSTOM COMMANDS
    if (cmd === COMMANDS.list) console.log(`\nList of available npx commands for ${PACKAGE_NAME}:\n\nCOMMANDS:\n${formatedCommandList()}\n\nALIASES:\n${formatAliasList()}\n`)
    else if (cmd === COMMANDS.help) console.log(`The syntax for ${PACKAGE_NAME} commands is:\n\nnpx ${PACKAGE_NAME} 'command' [-y | -f]?\n${HELP_LIST_TEXT}\n`)
    else if (cmd === COMMANDS.version) console.log(`v${VERSION}\n`)
    // RUN BIN FILE
    else spawn("node", [cmd, ...params], {stdio: "inherit"})
}

/**
 * Returns the formated the command list
 */
function formatedCommandList() {
    return Object.keys(COMMANDS).map(x=>{
        const command = x.toLowerCase()
        return `${LIST_SPACING}- ${command}:  ${COMMANDS_DESC[command]}`
    }).join("\n")
}

/**
 * Returns the formated the alias list
 */
function formatAliasList() {
    return Object.entries(ALIASES).map(([name, cmd])=>{
        const alias = name.toLowerCase()
        return `${LIST_SPACING}- ${alias}:  Alias for '${cmd}'`
    }).join("\n")
}