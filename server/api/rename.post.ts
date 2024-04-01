import { boxClient } from '~/server/utils/boxSDK'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/supabase'
import { getTimestampInSeconds } from '~/utils/time'

export default defineEventHandler(async (event) => {
	const clientBox = boxClient()
	const clientSupabase = await serverSupabaseClient<Database>(event)

	const body: RenameBodyRequest = await readBody(event)

	if (body.type === 'channel') {
		await clientSupabase.from('ojn_channels').update({ channel_name: body.name }).eq('id', body.id)
	}

	if (body.type === 'server') {
		await clientSupabase.from('ojn_servers').update({ server_name: body.name }).eq('id', body.id)
	}

	await clientBox.folders.update(body.folder_id, { name: `${body.name} - ${getTimestampInSeconds()}` })

	return { status: true }
})
