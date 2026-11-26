
import { asyncBufferFromUrl, parquetMetadataAsync, parquetReadObjects } from 'hyparquet'
import { shiftDate } from '../utils/dateUtils.js'

const source = 'https://datasets-server.huggingface.co/parquet?dataset=attik%2FOnline-Retail-II-UCI'
const columns = ['Invoice', 'InvoiceDate', 'StockCode', 'Description', 'Quantity', 'Price', 'Customer ID', 'Country']
const decoder = new TextDecoder()
const chunkSize = 1024 * 1024
const fetchWithTimeout = (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(20000) })

// Share nearby byte reads so a date range does not make one HTTP request per row group.
function cacheByteRanges(remoteFile) {
  const { byteLength } = remoteFile
  const cache = new Map()

  function readChunk(index) {
    if (!cache.has(index)) {
      const start = index * chunkSize
      const pending = remoteFile.slice(start, Math.min(start + chunkSize, byteLength)).catch(error => {
        cache.delete(index)
        throw error
      })
      cache.set(index, pending)
    }
    return cache.get(index)
  }

  return {
    byteLength,
    async slice(start, end = byteLength) {
      if (start < 0) start += byteLength
      const first = Math.floor(start / chunkSize)
      const last = Math.floor((end - 1) / chunkSize)
      if (first === last) return (await readChunk(first)).slice(start % chunkSize, end - first * chunkSize)
      const result = new Uint8Array(end - start)
      const chunks = await Promise.all(Array.from({ length: last - first + 1 }, (_, index) => readChunk(first + index)))
      let offset = 0
      chunks.forEach((chunk, index) => {
        const bytes = new Uint8Array(chunk).subarray(index === 0 ? start % chunkSize : 0, index + first === last ? end - last * chunkSize : chunk.byteLength)
        result.set(bytes, offset)
        offset += bytes.length
      })
      return result.buffer
    },
  }
}

function dateFromStatistic(value) {
  return (typeof value === 'string' ? value : decoder.decode(value)).slice(0, 10)
}

async function openDataset() {
  const response = await fetchWithTimeout(source)
  if (!response.ok) throw new Error(`The retail data service returned HTTP ${response.status}.`)
  const payload = await response.json()
  const entry = payload.parquet_files?.[0]
  if (payload.partial || payload.parquet_files?.length !== 1 || !entry?.url?.startsWith('https://huggingface.co/datasets/attik/Online-Retail-II-UCI/') ||
      !Number.isSafeInteger(entry.size) || entry.size <= 0) {
    throw new Error('The retail data service returned an unexpected dataset.')
  }

  const file = cacheByteRanges(await asyncBufferFromUrl({ url: entry.url, byteLength: entry.size, fetch: fetchWithTimeout }))
  const metadata = await parquetMetadataAsync(file)
  if (!columns.every(name => metadata.schema.some(column => column.name === name))) {
    throw new Error('The retail dataset columns have changed.')
  }
  let row = 0
  const groups = metadata.row_groups.map(group => {
    const stats = group.columns.find(column => column.meta_data?.path_in_schema[0] === 'InvoiceDate')?.meta_data.statistics
    const start = dateFromStatistic(stats?.min_value ?? stats?.min)
    const end = dateFromStatistic(stats?.max_value ?? stats?.max)
    if (!start || !end) throw new Error('The retail data service did not provide date coverage.')
    const rowStart = row
    row += Number(group.num_rows)
    return { start, end, rowStart, rowEnd: row }
  })
  if (!groups.length) throw new Error('The retail dataset has no dated records.')
  const bounds = {
    start: groups.reduce((earliest, group) => group.start < earliest ? group.start : earliest, groups[0].start),
    end: groups.reduce((latest, group) => group.end > latest ? group.end : latest, groups[0].end),
  }
  return { bounds, file, metadata, groups }
}

let datasetRequest

export function getRetailDataset() {
  datasetRequest ??= openDataset().catch(error => {
    datasetRequest = undefined
    throw error
  })
  return datasetRequest
}

export async function getRetailRows(dataset, start, end) {
  const { file, metadata, groups, bounds } = dataset
  const span = Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1
  const previousStart = shiftDate(start, -span)
  const previousPeriod = previousStart >= bounds.start ? { start: previousStart, end: shiftDate(start, -1) } : null
  const scopeStart = previousPeriod?.start ?? start
  const matching = groups.filter(group => group.end >= scopeStart && group.start <= end)
  if (!matching.length) return { rows: [], previousPeriod }

  const rows = await parquetReadObjects({
    file, metadata, columns,
    rowStart: matching[0].rowStart,
    rowEnd: matching.at(-1).rowEnd,
  })
  return { rows, previousPeriod }
}
