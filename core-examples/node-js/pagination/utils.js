function print(title, pageNum, results) {
    const header = `${title}, page ${pageNum}`
    console.log(header)
    console.log('-'.repeat(header.length))
    for (const x of results) {
        console.log(x)
    }
}

function sleep(ms = 0) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

module.exports = { print, sleep }
