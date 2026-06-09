import fs from 'fs'
import csv from 'csv-parser'

const games = []

fs.createReadStream('bgg.csv')
  .pipe(csv())
  .on('data', (row) => {
    const rank = Number(row.rank)

    if (!rank || Number.isNaN(rank)) return

    games.push({
      id: Number(row.id),
      name: row.name,
      year: Number(row.yearpublished),
      rank,
    })
  })
  .on('end', () => {
    games.sort((a, b) => a.rank - b.rank)

    const top10000 = games.slice(0, 10000)

    fs.writeFileSync('games.json', JSON.stringify(top10000))

    console.log(`Exportados ${top10000.length} juegos`)
  })
