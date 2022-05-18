const readline = require('readline');

readline.emitKeypressEvents(process.stdin);

process.stdin.setRawMode(true);

const keyPress = async () => {
    consoleWrite(`Press any key to continue...(Press Ctrl + C to exit)`);
    return new Promise((resolve, reject) => {
        process.stdin.once('keypress', (_, key) => {
            if (key.ctrl && key.name === 'c') {
                consoleClear();
                reject();
            } else {
                consoleClear();
                resolve();
            }
        });
    });
};

const sleep = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

const consoleClear = () => consoleWrite('');

// ESC[2K clears entire line
// ESC[#G moves cursor to left corner
const consoleWrite = msg => process.stdout.write(`\x1b[2K\x1b[0G${msg}`);


module.exports = {
    keyPress,
    consoleClear,
    consoleWrite,
    sleep,
}
