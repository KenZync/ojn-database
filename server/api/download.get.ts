import { boxClient } from '~/server/utils/boxSDK'

export default defineEventHandler(async (event) => {
	const query = getQuery(event)
	const file_id = query.file_id
	const clientBox = boxClient()

	const file = clientBox.files.getReadStream(String(file_id))
	return file
})
