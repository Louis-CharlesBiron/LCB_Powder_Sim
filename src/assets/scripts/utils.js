function readFile(file, callback) {// callback(file, content)
    const fileReader = new FileReader()
    fileReader.onload=e=>callback(file, e.target.result)
    fileReader.readAsText(file)
}