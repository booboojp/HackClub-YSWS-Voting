const parseANSI = (text) => {
	let styles = {
		color: '#ffffff',
		fontWeight: 'normal',
		fontStyle: 'normal',
		textDecoration: 'none',
		backgroundColor: 'transparent'
	}

	const parts = text.split(/(\x1b\[[0-9;]*[mK])/g)

	return parts.map((part, index) => {
		if (!part.match(/^\x1b\[[0-9;]*[mK]/)) {
			return <span key={index} style={{...styles}}>{part}</span>
		}

		const codes = part.match(/\[([0-9;]+)m/)?.[1].split(';') || []

		for (const code of codes) {
			switch (code) {
				case '0':
					styles = {
						color: '#ffffff',
						fontWeight: 'normal',
						fontStyle: 'normal',
						textDecoration: 'none',
						backgroundColor: 'transparent'
					}
					break
				// Special Case for Arch Themed text
				case '00':
					styles = {
						color: '#B8C0E0',
						fontWeight: 'normal',
						fontStyle: 'normal',
						textDecoration: 'none',
						backgroundColor: 'transparent'
					}
					break
				case '1': styles.fontWeight = 'bold'; break
				case '2': styles.opacity = '0.5'; break
				case '3': styles.fontStyle = 'italic'; break
				case '4': styles.textDecoration = 'underline'; break
				//Invert
				case '7':
					[styles.color, styles.backgroundColor] = [styles.backgroundColor, styles.color]
					break
				case '9': styles.textDecoration = 'line-through'; break

				//Normal
				case '30': styles.color = '#000000'; break
				case '31': styles.color = '#ff0000'; break
				case '32': styles.color = '#00ff00'; break
				case '33': styles.color = '#ffff00'; break
				case '34': styles.color = '#1793D1'; break
				case '35': styles.color = '#ff00ff'; break
				case '36': styles.color = '#00ffff'; break
				case '37': styles.color = '#ffffff'; break

				//BackGround
				case '40': styles.backgroundColor = '#000000'; break
				case '41': styles.backgroundColor = '#ff0000'; break
				case '42': styles.backgroundColor = '#00ff00'; break
				case '43': styles.backgroundColor = '#ffff00'; break
				case '44': styles.backgroundColor = '#0000ff'; break
				case '45': styles.backgroundColor = '#ff00ff'; break
				case '46': styles.backgroundColor = '#00ffff'; break
				case '47': styles.backgroundColor = '#ffffff'; break

				//Bright
				case '90': styles.color = '#808080'; break
				case '91': styles.color = '#ff4444'; break
				case '92': styles.color = '#44ff44'; break
				case '93': styles.color = '#ffff44'; break
				case '94': styles.color = '#4444ff'; break
				case '95': styles.color = '#ff44ff'; break
				case '96': styles.color = '#44ffff'; break
				case '97': styles.color = '#ffffff'; break

				//BrightBackGround
				case '100': styles.backgroundColor = '#808080'; break
				case '101': styles.backgroundColor = '#ff4444'; break
				case '102': styles.backgroundColor = '#44ff44'; break
				case '103': styles.backgroundColor = '#ffff44'; break
				case '104': styles.backgroundColor = '#4444ff'; break
				case '105': styles.backgroundColor = '#ff44ff'; break
				case '106': styles.backgroundColor = '#44ffff'; break
				case '107': styles.backgroundColor = '#ffffff'; break
				default: break
			}
		}
		return null
	}).filter(Boolean)
}
export default parseANSI
