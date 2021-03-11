/*
 * Helpers for DOM manipulation
 */
const $ = document.getElementById.bind(document)
const $val = (x) => $(x).value
const log = async (tag, msg) => {
    $('log').innerHTML += `${Math.round(Date.now() / 1000)} ${tag}: ${msg}\n`
}

const exec = (tag, fn) =>
    Promise.resolve()
        .then(() => log(tag, 'start'))
        .then(() =>
            fn()
                .then((x) => {
                    log(tag, 'done')
                    return x
                })
                .catch((e) => log(tag, `error: ${e.message}`)),
        )

const clickHandler = (tag, fn) => {
    const btn = event.currentTarget
    btn.disabled = true
    exec(tag, fn).finally(() => {
        btn.disabled = false
    })
}

module.exports = { exec, $, $val, clickHandler, log }
