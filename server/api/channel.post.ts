import { boxClient } from '~/server/utils/boxSDK'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
	const body: any = await readMultipartFormData(event)
	const clientSupabase = await serverSupabaseClient<Database>(event)
	let server_id = body[0].data.toString()
	let server_folder_id = body[1].data.toString()
	let channel_name = body[2].data.toString()
	let ojn_list = body[3].data
	let ojn_list_name = body[3].filename
	const clientBox = boxClient()

	const create_channel = await clientBox.folders.create(server_folder_id, channel_name)
	const create_ojn_list = await clientBox.files.uploadFile(create_channel.id, ojn_list_name, ojn_list)
	await clientSupabase.from('ojn_channels').insert({
		server_id: server_id,
		channel_name: channel_name,
		folder_id: create_channel.id,
		ojn_list_file_id: create_ojn_list.entries[0].id
	})

	return {
		channel_folder_id: create_channel.id,
		ojn_list_file_id: create_ojn_list.entries[0].id
	}
})
