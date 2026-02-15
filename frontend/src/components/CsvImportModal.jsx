import { useState, useMemo } from 'react'

/**
 * Modal for importing user stories from CSV.
 * Step 1: choose columns to form the story name (joined by " - ").
 * Step 2: choose which rows to import.
 * @param {{ open: boolean, onClose: () => void, csvData: { headers: string[], rows: string[][] } | null, onImport: (titles: string[]) => void }} props
 */
export default function CsvImportModal({ open, onClose, csvData, onImport }) {
  const [step, setStep] = useState(1)
  const [selectedColumns, setSelectedColumns] = useState([]) // indices in header order
  const [selectedRows, setSelectedRows] = useState(() => new Set()) // row indices

  const toggleColumn = (colIndex) => {
    setSelectedColumns((prev) =>
      prev.includes(colIndex)
        ? prev.filter((i) => i !== colIndex)
        : [...prev, colIndex].sort((a, b) => a - b)
    )
  }

  const toggleRow = (rowIndex) => {
    setSelectedRows((prev) => {
      const next = new Set(prev)
      if (next.has(rowIndex)) next.delete(rowIndex)
      else next.add(rowIndex)
      return next
    })
  }

  const selectAllRows = () => {
    if (!csvData?.rows?.length) return
    setSelectedRows(new Set(csvData.rows.map((_, i) => i)))
  }
  const deselectAllRows = () => setSelectedRows(new Set())

  const getRowTitle = (row) => {
    if (selectedColumns.length === 0) return ''
    return selectedColumns
      .map((colIndex) => (row[colIndex] ?? '').trim())
      .filter(Boolean)
      .join(' - ') || '(vide)'
  }

  const previewTitles = useMemo(() => {
    if (!csvData?.rows || selectedColumns.length === 0) return []
    return csvData.rows.map((row) => getRowTitle(row))
  }, [csvData?.rows, selectedColumns])

  const handleNext = () => {
    if (selectedColumns.length === 0) return
    setSelectedRows(new Set(csvData.rows.map((_, i) => i)))
    setStep(2)
  }

  const handleImport = () => {
    const titles = Array.from(selectedRows)
      .sort((a, b) => a - b)
      .map((rowIndex) => getRowTitle(csvData.rows[rowIndex]))
      .filter(Boolean)
    if (titles.length > 0) {
      onImport(titles)
    }
    handleClose()
  }

  const handleClose = () => {
    onClose()
    setStep(1)
    setSelectedColumns([])
    setSelectedRows(new Set())
  }

  if (!open) return null

  const { headers = [], rows = [] } = csvData || {}

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="csv-import-title"
    >
      <div
        className="bg-white rounded-2xl border border-[#95afc0]/60 shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#95afc0]/40">
          <h2 id="csv-import-title" className="text-lg font-semibold text-[#130f40]">
            Importer des user stories depuis un CSV
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-[#535c68] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#f9ca24]"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="p-4 overflow-auto flex-1 min-h-0">
          {step === 1 && (
            <>
              <p className="text-sm text-[#535c68] mb-3">
                Choisissez les colonnes qui formeront le titre de chaque user story (séparées par un tiret).
              </p>
              <div className="flex flex-wrap gap-2">
                {headers.map((name, index) => (
                  <label
                    key={index}
                    className="flex items-center gap-2 rounded-lg border border-[#95afc0]/60 bg-gray-50 px-3 py-2 cursor-pointer hover:border-[#686de0]/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(index)}
                      onChange={() => toggleColumn(index)}
                      className="rounded border-[#95afc0] text-[#686de0] focus:ring-[#f9ca24]"
                    />
                    <span className="text-sm font-medium text-[#30336b] truncate max-w-[200px]" title={name}>
                      {name || `Colonne ${index + 1}`}
                    </span>
                  </label>
                ))}
              </div>
              {selectedColumns.length === 0 && (
                <p className="mt-2 text-sm text-[#c0392b]">Sélectionnez au moins une colonne.</p>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-[#535c68] mb-3">
                Choisissez les lignes à importer ({selectedRows.size} sélectionnée
                {selectedRows.size !== 1 ? 's' : ''}).
              </p>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={selectAllRows}
                  className="rounded-lg border border-[#95afc0]/70 bg-white px-3 py-1.5 text-sm text-[#535c68] hover:bg-[#686de0]/10 hover:border-[#686de0]/50 focus:outline-none focus:ring-1 focus:ring-[#f9ca24]"
                >
                  Tout sélectionner
                </button>
                <button
                  type="button"
                  onClick={deselectAllRows}
                  className="rounded-lg border border-[#95afc0]/70 bg-white px-3 py-1.5 text-sm text-[#535c68] hover:bg-[#686de0]/10 hover:border-[#686de0]/50 focus:outline-none focus:ring-1 focus:ring-[#f9ca24]"
                >
                  Tout désélectionner
                </button>
              </div>
              <div className="border border-[#95afc0]/50 rounded-xl overflow-hidden">
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="w-10 px-2 py-2 text-left font-semibold text-[#535c68]">Import</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#535c68]">Aperçu du titre</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className={`border-t border-[#95afc0]/30 ${
                            selectedRows.has(rowIndex) ? 'bg-[#f9ca24]/10' : 'bg-white hover:bg-gray-50/80'
                          }`}
                        >
                          <td className="w-10 px-2 py-2">
                            <input
                              type="checkbox"
                              checked={selectedRows.has(rowIndex)}
                              onChange={() => toggleRow(rowIndex)}
                              className="rounded border-[#95afc0] text-[#686de0] focus:ring-[#f9ca24]"
                            />
                          </td>
                          <td className="px-3 py-2 text-[#30336b] truncate max-w-md" title={previewTitles[rowIndex]}>
                            {previewTitles[rowIndex] || '(vide)'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-[#95afc0]/40">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-[#95afc0]/70 bg-white px-4 py-2 text-[#535c68] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#f9ca24]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={selectedColumns.length === 0}
                className="rounded-lg bg-[#f9ca24] px-4 py-2 font-medium text-[#130f40] hover:bg-[#f6e58d] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-[#f9ca24]"
              >
                Suivant
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-lg border border-[#95afc0]/70 bg-white px-4 py-2 text-[#535c68] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#f9ca24]"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={selectedRows.size === 0}
                className="rounded-lg bg-[#f9ca24] px-4 py-2 font-medium text-[#130f40] hover:bg-[#f6e58d] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-[#f9ca24]"
              >
                Importer {selectedRows.size} story{selectedRows.size !== 1 ? 's' : ''}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
