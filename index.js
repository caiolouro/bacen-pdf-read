const pdfreader = require('pdfreader')

function main() {
	try {
		let cursor = null
		let currentBank = null
		let banks = []

		new pdfreader.PdfReader().parseFileItems('Tabela.pdf', function (err, item) {
			if (err) throw err

			if (!item) { // EOF
				console.log('banks', JSON.stringify(banks, null, 4))
				console.log('Finished!')
				process.exit(0)
			} else if (item.page) { // Page start
				cursor = null
				currentBank = null
			} else if (item.text) { // Some page content
				if (item.text === 'SEGMENTO') { // Next item will be the first bank code for this page
					cursor = 'code'
					currentBank = null
				} else if (cursor)  {
					switch (cursor) {
						case 'code':
							// Invalid bank code. Some bank segment rows are split into two items or the table is over
							if (!Number.isInteger(parseInt(item.text))) {
								if (currentBank && item.text !== 'FONTE UNICAD.') currentBank.segment += item.text
								return
							}

							// Adds latest bank object to array and start building a new one
							if (currentBank) banks.push(currentBank)

							currentBank = {}
							currentBank[cursor] = item.text
							cursor = 'cnpj'
							break
						case 'cnpj':
							currentBank[cursor] = item.text
							cursor = 'name'
							break
						case 'name':
							currentBank[cursor] = item.text
							cursor = 'segment'
							break
						case 'segment':
							// Some bank names are split into two items. If it is all uppercase, that's probably the bank name remainings
							if (item.text === item.text.toUpperCase()) {
								currentBank.name += item.text
								return
							}

							currentBank[cursor] = item.text
							cursor = 'code'
							break
						default:
							return
					}
				}

			}
		})
	} catch (err) {
		console.log('err:', err)
	}
}

main()