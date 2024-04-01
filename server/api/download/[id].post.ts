import { boxClient } from '~/server/utils/boxSDK'

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	const body = await readBody(event)
	const clientBox = boxClient()

	let items = [
		{
			type: 'folder',
			id: id!
		}
	]

	const file = clientBox.files.createZip(body.name, items)
	return file
})
