import { boxClient } from '~/server/utils/boxSDK'

export default defineEventHandler(async (event) => {
	const clientBox = boxClient()

	// const response = clientBox.metadata.deleteTemplate('enterprise', 'ojn')
	// return response

	// const response = clientBox.metadata.createTemplate('ojn', [
	// 	{
	// 		type: 'float',
	// 		key: 'id',
	// 		displayName: 'ID'
	// 	},
	// 	{
	// 		type: 'string',
	// 		key: 'title',
	// 		displayName: 'Title'
	// 	},
	// 	{
	// 		type: 'string',
	// 		key: 'artist',
	// 		displayName: 'Artist'
	// 	},
	// 	{
	// 		type: 'string',
	// 		key: 'noter',
	// 		displayName: 'Note Charter'
	// 	},
	// 	{
	// 		type: 'float',
	// 		key: 'genre',
	// 		displayName: 'Genre'
	// 	},
	// 	{
	// 		type: 'float',
	// 		key: 'bpm',
	// 		displayName: 'BPM'
	// 	},
	// 	{
	// 		type: 'float',
	// 		key: 'level_ex',
	// 		displayName: 'EX'
	// 	},
	// 	{
	// 		type: 'float',
	// 		key: 'level_nx',
	// 		displayName: 'NX'
	// 	},
	// 	{
	// 		type: 'float',
	// 		key: 'level_hx',
	// 		displayName: 'HX'
	// 	},
	// 	{
	// 		type: 'float',
	// 		key: 'note_ex',
	// 		displayName: 'Note Count EX'
	// 	},
	// 	{
	// 		type: 'float',
	// 		key: 'note_nx',
	// 		displayName: 'Note Count NX'
	// 	},
	// 	{
	// 		type: 'float',
	// 		key: 'note_hx',
	// 		displayName: 'Note Count HX'
	// 	},
	// 	{
	// 		type: 'float',
	// 		key: 'time_ex',
	// 		displayName: 'Time EX'
	// 	},
	// 	{
	// 		type: 'float',
	// 		key: 'time_nx',
	// 		displayName: 'Time NX'
	// 	},
	// 	{
	// 		type: 'float',
	// 		key: 'time_hx',
	// 		displayName: 'Time HX'
	// 	}
	// ])

	// return response
})
