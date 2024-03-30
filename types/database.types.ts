import type { Database } from './supabase'

declare global {
	export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']

	interface CreateResponse {
		server_folder_id: string
		channel_folder_id: string
		ojn_list_file_id: string
	}
}
