import { boxClient } from '~/server/utils/boxSDK'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/supabase'

export default defineEventHandler(async (event) => {
	const clientBox = boxClient()
	const clientSupabase = await serverSupabaseClient<Database>(event)
	const id = getRouterParam(event, 'id')
	const query = getQuery(event)
	const channel_folder_id = String(query.channel_folder_id)

	await clientBox.folders.delete(channel_folder_id, { recursive: true })

	const { error } = await clientSupabase.from('ojn_channels').delete().eq('id', id!)

	return { status: true }
})
