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
document.querySelectorAll("[data-scrollable]").forEach(el=>{
    el.addEventListener("wheel", e=>{
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
