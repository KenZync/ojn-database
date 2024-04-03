export const calculateKey = (key: string) => {
	const lowerKey = key.toLowerCase()
	switch (lowerKey) {
		case 'level':
		case 'lvl':
		case 'lvl.':
		case 'lv':
		case 'lv.':
		case 'hx':
		case 'hd':
		case 'hard':
			return 'level_hx'
		case 'nx':
		case 'nm':
		case 'normal':
			return 'level_nx'
		case 'ez':
		case 'ex':
		case 'easy':
			return 'level_ex'
		case 'name':
		case 'song':
		case 'music':
			return 'title'
		case 'singer':
			return 'artist'
		case 'note':
		case 'charter':
		case 'notecharter':
			return 'noter'
		case 'speed':
			return 'bpm'
		default:
			return key
	}
}
