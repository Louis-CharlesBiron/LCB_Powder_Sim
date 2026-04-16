// Open/close drawer
drawerControl.onclick=()=>{
    const isClosed = bottom.dataset.closed === "true"
    drawerControl.textContent = isClosed ? "∨" : "∧" 
    bottom.dataset.closed = isClosed ? false : true
}

// TABS SWITCHING
const tabs = document.querySelectorAll(".tabs > span"), tabContents = document.querySelectorAll(".tabContent > div")
function selectTab(index) {
    const el = tabs[index], dataset = el.dataset

    tabs.forEach(el=>el.dataset.selected = false)
    tabContents.forEach(el=>el.dataset.displayed = false)

    dataset.selected = true
    REGULAR_STORAGE.set({[STORAGE_KEYS.selectedTab]: index})
    tabContents[index].dataset.displayed = true
}
tabs.forEach(el=>el.onclick=e=>selectTab(e.target.dataset.content))
REGULAR_STORAGE.get(res=>selectTab(res[STORAGE_KEYS.selectedTab]||0))

// HORIZONTAL TAB SCROLL
let isInputFocused = false
const scrollBlocking = document.querySelectorAll("input[type=number], select").forEach(el=>{
    el.onfocus=()=>isInputFocused = true
    el.onblur=()=>isInputFocused = false
})
document.querySelectorAll("[data-scrollable]").forEach(el=>{
    el.addEventListener("wheel", e=>{
        const nodeName = e.target.nodeName
        if (((isInputFocused && nodeName === "INPUT" && e.target.type === "number") || nodeName === "SELECT")) return
        e.preventDefault()
        el.scrollLeft += e.deltaY
    })
})

// CSS VARIABLES
const root = document.querySelector(":root").style
root.setProperty("--tabsCount", tabs.length)

let displayUpdateTimeoutId = null
displayUpdate = (text)=>{
    clearTimeout(displayUpdateTimeoutId)

    updatesStatus.style.opacity = "1"
    updatesStatus.textContent = text
    displayUpdateTimeoutId = setTimeout(()=>updatesStatus.style.opacity = "0", 1250)
}

// OVERLAY CONTROL
LOCAL_STORAGE.get(res=>{
    const overlayTabId = res[STORAGE_KEYS.overlayTabId]
    if (overlayTabId) {
        chrome.tabs.get(overlayTabId, tab=>{
            if (tab) toggleOverlayAppDisplay(true)
            else LOCAL_STORAGE.set({[STORAGE_KEYS.overlayTabId]:null})
        })
    }
})

function toggleOverlayAppDisplay(enable) {
    if (enable) {
        root.setProperty("--app-height", OVERLAY_ON_APP_HEIGHT)
        document.documentElement.style.height = OVERLAY_ON_APP_HEIGHT
    }
    else {
        root.setProperty("--app-height", OVERLAY_OFF_APP_HEIGHT)
        document.documentElement.style.height = null
    }
    toggleOverlayButton.textContent = enable ? STRINGS.OVERLAY_ON : STRINGS.OVERLAY_OFF
}
