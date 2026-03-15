Neutralino.init()
const EXIT_KEY = "escape"

document.addEventListener("keydown", e=>{
    if (e.key.toLowerCase() === EXIT_KEY) {
        Neutralino.app.exit()
    }
})