const cfg = {
    // Maximum number of retries
    retriesCount: 8,
    // Pause between retries
    retriesPause: 5000, // 5s TODO: is it better to rely on SDK's retries ?
    // Time limit for one execution
    retryTimeout: 300000, // 5m
}

module.exports = cfg
