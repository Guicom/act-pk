/**
 * Parse a CSV string (RFC 4180 style: quoted fields, "" = escaped quote).
 * @param {string} text - Raw CSV file content
 * @returns {{ headers: string[], rows: string[][] } | { error: string }}
 */
export function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0)
  if (lines.length === 0) {
    return { error: 'Fichier vide' }
  }
  const headers = parseCsvLine(lines[0])
  if (!headers || headers.length === 0) {
    return { error: 'En-tête CSV invalide' }
  }
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i])
    if (fields) {
      // Pad with empty strings if row has fewer columns than header
      while (fields.length < headers.length) fields.push('')
      rows.push(fields.slice(0, headers.length))
    }
  }
  return { headers, rows }
}

/**
 * Parse a single CSV line respecting quoted fields.
 * @param {string} line
 * @returns {string[] | null}
 */
function parseCsvLine(line) {
  const fields = []
  let i = 0
  while (i < line.length) {
    if (line[i] === '"') {
      let value = ''
      i += 1
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            value += '"'
            i += 2
          } else {
            i += 1
            break
          }
        } else {
          value += line[i]
          i += 1
        }
      }
      fields.push(value.trim())
    } else {
      let value = ''
      while (i < line.length && line[i] !== ',') {
        value += line[i]
        i += 1
      }
      fields.push(value.trim())
      if (line[i] === ',') i += 1
    }
  }
  return fields
}
