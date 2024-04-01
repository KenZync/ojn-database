import { boxClient } from '~/server/utils/boxSDK'

export default defineEventHandler(async (event) => {
	const clientBox = boxClient()

	const id = getRouterParam(event, 'id')
	const body: any = await readMultipartFormData(event)
	let ojn = body[0].data
	let ojn_name = body[0].filename
	let existed = false

	try {
		await clientBox.files.preflightUploadFile(id!, { name: ojn_name })
	} catch (err: any) {
		if (err.statusCode === 409) {
			existed = true
		}
	}
	if (existed) {
		const search = await clientBox.search.query(ojn_name, {
			content_types: 'name',
			fields: 'id,name',
			ancestor_folder_ids: id!,
			limit: 1
		})

		if (search.total_count == 0) {
			throw createError({ statusCode: 404, statusMessage: 'Already Uploaded' })
		}

		const [firstEntry] = search.entries
		if (firstEntry.name != ojn_name || search.total_count == 0) {
			throw createError({ statusCode: 404, statusMessage: 'OJN Not Found' })
		}

		await clientBox.files.uploadNewFileVersion(firstEntry.id, ojn)
	} else {
		await clientBox.files.uploadFile(id!, ojn_name, ojn)
	}

	return { status: true }
})
