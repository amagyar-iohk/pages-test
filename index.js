const fs = require('fs')
const cp = require('child_process')

// starts
console.log("Starting")


const baseDir = cp.execSync('ls -la ./').toString().trim()
console.log("Base dir", baseDir)

try {
    const lsPublic = cp.execSync('ls -la ./public').toString().trim()
    console.log("Public", lsPublic)
} catch (e) {
    console.log("public folder not available")
}

// checks if exists
const publicDirExists = fs.existsSync('./public')
if (!publicDirExists) {
    fs.mkdirSync('./public')
}

const reportDirExists = fs.existsSync('./public/reports')
if (!reportDirExists) {
    fs.mkdirSync('./public/reports')
}

const historyDirExists = fs.existsSync('./history')
if (!historyDirExists) {
    fs.mkdirSync('./history')
}

// each execution "adds" to history data
const date = new Date()
fs.appendFileSync('./history/history-data.txt', `${date}\n`)

// add readme
fs.cpSync('./readme.html', './public/readme.html')

// generate "report"
const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<body>
    %CONTENT%
</body>
</html>`

const page = htmlTemplate.replace("%CONTENT%", `Report: ${date}`)

// find next
function getSubfolders(dir) {
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        return entries.filter((dirent) => dirent.isDirectory()).map((dirent) => dirent.name)
    } catch (error) {
        console.error(`Error reading directory ${dir}:`, error)
        return [];
    }
}

const historyDirs = getSubfolders('./public/reports')
    .filter((subfolder) => !isNaN(Number(subfolder)))
    .map((subfolder => parseInt(subfolder)))
    .sort((a, b) => a - b)
const keepInHistory = 10
const extraReportsToDelete = historyDirs.length - (keepInHistory - 1)
for (let n = 0; n < extraReportsToDelete; n++) {
    fs.rmSync(`./public/reports/${historyDirs[n]}`, { recursive: true })
}
const nextReportId = historyDirs[historyDirs.length - 1] + 1 || 1
fs.mkdirSync(`./public/reports/${nextReportId}`)
fs.copyFileSync('./history/history-data.txt', `./public/reports/${nextReportId}/history-data.txt`)
fs.writeFileSync(`./public/reports/${nextReportId}/index.html`, page)

// build index
const base = fs.readFileSync('./base/index.html').toString().trim() + "<br>"
const history = fs.readFileSync('./history/history-data.txt').toString().trim().replaceAll("\n", "<br>")

let links = ""
getSubfolders('./public/reports')
    .filter((subfolder) => !isNaN(Number(subfolder)))
    .map((subfolder => parseInt(subfolder)))
    .sort((a, b) => a - b)
    .forEach((n) => {
        links += `<a href="./reports/${n}">Report ${n}</a><br>`
    })

const index = base.replace("%HISTORY%", history).replace("%LINKS%", links)
fs.writeFileSync('./public/index.html', index)