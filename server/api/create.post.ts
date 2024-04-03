import { boxClient } from '~/server/utils/boxSDK'
import { getTimestampInSeconds } from '~/utils/time'

export default defineEventHandler(async (event) => {
	const body: any = await readMultipartFormData(event)
	let server_name = body[0].data.toString()
	let channel_name = body[1].data.toString()
	let ojn_list = body[2].data
	let ojn_list_name = body[2].filename
	let server_id = body[3].data.toString()

	const clientBox = boxClient()

	const create_server = await clientBox.folders.create(process.env.NUXT_BOX_PRIVATE_FOLDER_ID || '', `${server_name}`)
	const create_channel = await clientBox.folders.create(
		create_server.id,
		`${channel_name} || ${getTimestampInSeconds()}`
	)
	const create_ojn_list = await clientBox.files.uploadFile(create_channel.id, ojn_list_name, ojn_list)

	return {
		server_folder_id: create_server.id,
		channel_folder_id: create_channel.id,
		ojn_list_file_id: create_ojn_list.entries[0].id
	}
})
