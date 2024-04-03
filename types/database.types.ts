import type { Database } from './supabase'

declare global {
	export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']

	interface CreateResponse {
		server_folder_id: string
		channel_folder_id: string
		ojn_list_file_id: string
	}

	interface RenameBodyRequest {
		type: string
		id: number
		name: string
		folder_id: string
	}

	interface Search {
		total_count: number
		entries: Entry[]
		limit: number
		offset: number
		type: string
	}

	interface Entry {
		type: string
		id: string
		etag: string
		parent: Parent
		metadata: Metadata
	}

	interface Metadata {
		enterprise: Enterprise
	}

	interface Enterprise {
		ojn: MetadataOJN
	}

	interface MetadataOJN {
		$id: string
		$version: number
		$type: string
		$parent: string
		$typeVersion: number
		$template: string
		$scope: string
		title: string
		time_nx: number
		bpm: number
		id: number
		level_ex: number
		noter: string
		note_nx: number
		note_ex: number
		level_nx: number
		time_hx: number
		time_ex: number
		genre: number
		note_hx: number
		artist: string
		level_hx: number
		$canEdit: boolean
	}

	interface Parent {
		type: string
		id: string
		sequence_id: string
		etag: string
		name: string
	}
}
