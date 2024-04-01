import { boxClient } from '~/server/utils/boxSDK'

export default defineEventHandler(async (event) => {
	const body = await readBody(event)
	const clientBox = boxClient()

	const id = getRouterParam(event, 'id')
	const ojn_name = `o2ma${body.id}.ojn`
	const ojm_name = `o2ma${body.id}.ojm`

	const ojnSearch = await clientBox.search.query(ojn_name, {
		content_types: 'name',
		fields: 'id,name',
		ancestor_folder_ids: id!,
		limit: 1
	})

	const [ojnEntry] = ojnSearch.entries
	if (ojnEntry.name != ojn_name) {
		throw createError({ statusCode: 404, statusMessage: 'OJN Not Found' })
	}

	const ojmSearch = await clientBox.search.query(ojm_name, {
		content_types: 'name',
		fields: 'id,name',
		ancestor_folder_ids: id!,
		limit: 1
	})

	const [ojmEntry] = ojmSearch.entries
	if (ojmEntry.name != ojm_name) {
		throw createError({ statusCode: 404, statusMessage: 'OJN Not Found' })
	}

	let items = [
		{
			type: 'file',
			id: ojnEntry.id!
		},
		{
			type: 'file',
			id: ojmEntry.id!
		}
	]

	const zip = await clientBox.files.createZip(body.file_name, items)
	return zip
})
