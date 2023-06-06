const fs = require("fs")
const path = require("path")

fs.copyFileSync(
    path.resolve(__dirname, "node_modules", "@eversdk", "lib-web", "eversdk.wasm"),
    path.resolve(__dirname, "public", "eversdk.wasm")
)
