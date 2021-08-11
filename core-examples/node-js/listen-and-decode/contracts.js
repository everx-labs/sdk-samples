const fs = require("fs");
const path = require("path");

const read = name => fs.readFileSync(path.resolve(__dirname, name));
module.exports = {
    HelloEventsContract: {
        abi: JSON.parse(read("HelloEvents.abi.json").toString()),
        tvc: read("HelloEvents.tvc").toString("base64"),
    }
};

