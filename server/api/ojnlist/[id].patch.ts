import { boxClient } from '~/server/utils/boxSDK'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
	const clientBox = boxClient()
	const clientSupabase = await serverSupabaseClient<Database>(event)
	const id = getRouterParam(event, 'id')
	const body: any = await readMultipartFormData(event)
	let ojn_list = body[0].data
	const { error } = await clientSupabase
		.from('ojn_channels')
		.update({ updated_at: new Date().toISOString() })
		.eq('ojn_list_file_id', id!)
	if (error) {
		throw createError(error)
	}
	await clientBox.files.uploadNewFileVersion(id!, ojn_list)
	return { status: true }
})
