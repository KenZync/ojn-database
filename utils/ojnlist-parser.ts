import { Buffer } from 'buffer'
import iconv from 'iconv-lite'

const dec = new TextDecoder('utf-8')

const genreMap = [
	'Ballad',
	'Rock',
	'Dance',
	'Techno',
	'Hip-hop',
	'Soul/R&B',
	'Jazz',
	'Funk',
	'Classical',
	'Traditional',
	'Etc'
]

export const convert = (ojnlist: ArrayBuffer) => {
	let dataview = new DataView(ojnlist)
	let cursor = 0
	let ojnlists: OJNHeader[] = []
	let count = dataview.getInt32(cursor, true)
	cursor += 4
	for (let i = 1; i <= count; i++) {
		let header: OJNHeader = {
			song_id: 0,
			signature: 0,
			encode_version: 0,
			genre: 0,
			bpm: 0,
			difficulty: {
				easy: {
					level: 0,
					note_count: 0,
					event_count: 0,
					measure_count: 0,
					package_count: 0,
					duration: 0,
					note_offset: 0
				},
				normal: {
					level: 0,
					note_count: 0,
					event_count: 0,
					measure_count: 0,
					package_count: 0,
					duration: 0,
					note_offset: 0
				},
				hard: {
					level: 0,
					note_count: 0,
					event_count: 0,
					measure_count: 0,
					package_count: 0,
					duration: 0,
					note_offset: 0
				}
			},
			old_encode_version: 0,
			old_song_id: 0,
			old_genre: '',
			bmp_size: 0,
			old_file_version: 0,
			title: '',
			artist: '',
			noter: '',
			ojm_file: '',
			cover_size: 0,
			cover_offset: 0
		}

		header.song_id = dataview.getInt32(cursor, true)
		cursor += 4
		header.signature = dataview.getInt32(cursor, true)
		cursor += 4

		//   if (header.signature != OJN_SIGNATURE) throw "OJN_SIGNATURE ERROR";

		header.encode_version = dataview.getFloat32(cursor, true)
		cursor += 4
		header.genre = dataview.getInt32(cursor, true)
		// header.genreString = genreMap[(header.genre < 0 || header.genre > 10) ? 10 : header.genre];
		cursor += 4
		header.bpm = dataview.getFloat32(cursor, true)
		cursor += 4

		header.difficulty.easy.level = dataview.getInt16(cursor, true)
		cursor += 2
		header.difficulty.normal.level = dataview.getInt16(cursor, true)
		cursor += 2
		header.difficulty.hard.level = dataview.getInt16(cursor, true)
		cursor += 2
		//ignore next short
		cursor += 2

		header.difficulty.easy.event_count = dataview.getInt32(cursor, true)
		cursor += 4
		header.difficulty.normal.event_count = dataview.getInt32(cursor, true)
		cursor += 4
		header.difficulty.hard.event_count = dataview.getInt32(cursor, true)
		cursor += 4

		header.difficulty.easy.note_count = dataview.getInt32(cursor, true)
		cursor += 4
		header.difficulty.normal.note_count = dataview.getInt32(cursor, true)
		cursor += 4
		header.difficulty.hard.note_count = dataview.getInt32(cursor, true)
		cursor += 4

		header.difficulty.easy.measure_count = dataview.getInt32(cursor, true)
		cursor += 4
		header.difficulty.normal.measure_count = dataview.getInt32(cursor, true)
		cursor += 4
		header.difficulty.hard.measure_count = dataview.getInt32(cursor, true)
		cursor += 4

		header.difficulty.easy.package_count = dataview.getInt32(cursor, true)
		cursor += 4
		header.difficulty.normal.package_count = dataview.getInt32(cursor, true)
		cursor += 4
		header.difficulty.hard.package_count = dataview.getInt32(cursor, true)
		cursor += 4

		header.old_encode_version = dataview.getInt16(cursor, true)
		cursor += 2
		header.old_song_id = dataview.getInt16(cursor, true)
		cursor += 2
		header.old_genre = dec.decode(ojnlist.slice(cursor, cursor + 20))
		cursor += 20
		header.bmp_size = dataview.getInt32(cursor, true)
		cursor += 4
		header.old_file_version = dataview.getInt32(cursor, true)
		cursor += 4

		//   console.log(cursor)

		const title_raw = Buffer.from(ojnlist, cursor, 64)
		header.title = iconv.decode(title_raw, 'CP949').replace(/\0/g, '')
		cursor += 64

		const artist_raw = Buffer.from(ojnlist, cursor, 32)
		header.artist = iconv.decode(artist_raw, 'CP949').replace(/\0/g, '')
		cursor += 32

		const noter_raw = Buffer.from(ojnlist, cursor, 32)
		header.noter = iconv.decode(noter_raw, 'CP949').replace(/\0/g, '')
		cursor += 32

		const ojm_file_raw = Buffer.from(ojnlist, cursor, 32)
		header.ojm_file = iconv.decode(ojm_file_raw, 'CP949').replace(/\0/g, '')
		cursor += 32
		header.cover_size = dataview.getInt32(cursor, true)
		cursor += 4

		header.difficulty.easy.duration = dataview.getInt32(cursor, true)
		cursor += 4
		header.difficulty.normal.duration = dataview.getInt32(cursor, true)
		cursor += 4
		header.difficulty.hard.duration = dataview.getInt32(cursor, true)
		cursor += 4

		header.difficulty.easy.note_offset = dataview.getInt32(cursor, true)
		cursor += 4
		header.difficulty.normal.note_offset = dataview.getInt32(cursor, true)
		cursor += 4
		header.difficulty.hard.note_offset = dataview.getInt32(cursor, true)
		cursor += 4

		header.cover_offset = dataview.getInt32(cursor, true)
		cursor += 4

		ojnlists.push(header)
	}

	return { count, ojnlists }
}
