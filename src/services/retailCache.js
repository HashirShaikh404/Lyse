const prefix = 'lyse-retail-v1-'

export async function openRetailCache() {
  if (!globalThis.caches) return null

  // The historical source is stable, but check for a new version each UTC day.
  const day = Math.floor(Date.now() / 86400000)
  const name = prefix + day
  try {
    const cache = await caches.open(name)
    void caches.keys().then(keys => Promise.all(keys
      .filter(key => key.startsWith(prefix) && Number(key.slice(prefix.length)) < day)
      .map(key => caches.delete(key)))).catch(() => {})
    return cache
  } catch {
    return null
  }
}

export async function readCached(cache, key, format) {
  try {
    const hit = await cache?.match(key)
    return hit ? await hit[format]() : null
  } catch {
    return null
  }
}

export async function writeCached(cache, key, response) {
  try {
    await cache?.put(key, response)
  } catch {
    // Reporting still works with disabled storage or a full browser cache.
  }
}
