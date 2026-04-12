// side priority
// replace mode

// open full page
// open as overlay
(()=>{
openFullPageButton.onclick=()=>{
    chrome.tabs.create({
        url: chrome.runtime.getURL(location.pathname),
        active: true
    })
}

openOverlayButton.onclick=()=>{
    chrome.tabs.query({active: true, currentWindow: true}, ([tab])=>{
        if (tab) {
            chrome.scripting.executeScript({
                target: {tabId: tab.id},
                files: [
                    "src/lcb-ps/lcbPS.min.js",
                    "src/overlay.js",
                ]
            })
            window.close()
        }
        else console.warn("NO TAB FOUND TODO ERROR")
    })
}


})()