<template>
	<ClientOnly>
		<UCard
			:ui="{
				body: {
					padding: ''
				}
			}"
		>
			<UCommandPalette
				:groups="searchResult"
				:autoselect="false"
				:autoclear="false"
				:close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'gray', variant: 'link', padded: false }"
				:ui="{ wrapper: ' divide-y-0' }"
			>
				<template #empty-state>
					<div></div>
				</template>
			</UCommandPalette>
		</UCard>
		<div class="flex justify-center pt-4">
			<UPagination
				:prev-button="{ icon: 'i-heroicons-arrow-small-left-20-solid', label: 'Prev', color: 'gray' }"
				:next-button="{ icon: 'i-heroicons-arrow-small-right-20-solid', trailing: true, label: 'Next', color: 'gray' }"
				v-model="page"
				:total="allCount"
				:page-count="limit"
				show-last
				show-first
				:disabled="searching"
			/>
		</div>

		<UTable
			class="pt-4"
			:rows="result"
			:columns="ojnColumns"
			:loading-state="{ icon: 'i-heroicons-arrow-path-20-solid', label: 'Loading...' }"
			:loading="searching"
			:ui="{ td: { base: '', color: 'text-black dark:text-gray-200' } }"
		>
			<template #view-data="{ row }">
				<UButton variant="ghost" icon="i-heroicons-eye-solid" @click="openOJNViewer(row)" />
			</template>
			<template #download-data="{ row }">
				<UButton variant="ghost" icon="i-heroicons-arrow-down-tray" @click="downloadChart(row)" />
			</template>
		</UTable>

		<div class="flex justify-center py-8">
			<UPagination
				:prev-button="{ icon: 'i-heroicons-arrow-small-left-20-solid', label: 'Prev', color: 'gray' }"
				:next-button="{ icon: 'i-heroicons-arrow-small-right-20-solid', trailing: true, label: 'Next', color: 'gray' }"
				v-model="page"
				:total="allCount"
				:page-count="limit"
				show-last
				show-first
				:disabled="searching"
			/>
		</div>
	</ClientOnly>
</template>

<script setup lang="ts">
import { FetchError } from 'ofetch'

useHead({
	title: `Search - OJN Database`,
	meta: [{ name: 'description', content: `Search and download .ojn/.ojm files` }]
})

const boxAPI = 'https://api.box.com/2.0'

const ojnColumns = [
	{
		key: 'parent.name',
		label: 'Server',
		sortable: true
	},
	{
		key: 'metadata.enterprise.ojn.title',
		label: 'Title',
		sortable: true
	},
	{
		key: 'metadata.enterprise.ojn.artist',
		label: 'Artist',
		sortable: true
	},
	{
		key: 'metadata.enterprise.ojn.noter',
		label: 'Note Charter',
		sortable: true
	},
	{
		key: 'metadata.enterprise.ojn.level_hx',
		label: 'Level',
		sortable: true
	},
	{
		key: 'metadata.enterprise.ojn.bpm',
		label: 'BPM',
		sortable: true
	},
	{
		label: 'View',
		key: 'view'
	},
	{
		label: 'DL',
		key: 'download'
	}
]

const searchResult = [
	{
		key: 'users',
		label: (q: any) => q && `Users matching “${q}”...`,
		search: async (q: any) => {
			searchOJN(q, true)
		}
	}
]

const toast = useToast()
const result = ref()
const page = ref(1)
const allCount = ref(0)
const limit = 30

const searching = ref(false)

const query = ref('')

const { data } = useFetch(`/api/token`, {
	retry: 3,
	retryStatusCodes: [400]
})

onMounted(() => {
	searchOJN('', true)
})

const searchOJN = async (q: string, reset: boolean) => {
	searching.value = true
	result.value = []
	query.value = q
	if (reset) {
		page.value = 1
	}
	try {
		const rawResult = await $fetch<Search>(`${boxAPI}/search`, {
			headers: {
				authorization: `Bearer ${data.value?.access_token}`
			},
			query: {
				query: q,
				ancestor_folder_ids: process.env.NUXT_BOX_PRIVATE_FOLDER_ID,
				mdfilters: [
					[
						{
							scope: 'enterprise',
							templateKey: 'ojn',
							filters: {}
						}
					]
				],
				fields:
					'parent,metadata.enterprise.ojn.id,metadata.enterprise.ojn.title,metadata.enterprise.ojn.artist,metadata.enterprise.ojn.noter,metadata.enterprise.ojn.level_hx,metadata.enterprise.ojn.bpm',
				offset: (page.value - 1) * limit
			}
		})
		result.value = rawResult.entries
		allCount.value = rawResult.total_count
	} catch (err) {
		const error = err as FetchError
		toast.add({
			title: `${error}`,
			icon: 'i-heroicons-x-circle-16-solid',
			color: 'red',
			timeout: 0
		})
	}
	searching.value = false
}

watch(
	() => page.value,
	() => {
		searchOJN(query.value, false)
	}
)

const openOJNViewer = (e: Entry) => {
	navigateTo(`https://ojn.kenzync.dev/?id=${e.metadata.enterprise.ojn.id}&server=ojn&folder=${e.parent.id}`, {
		open: {
			target: '_blank'
		}
	})
}

const downloadChart = async (header: Entry) => {
	toast.add({
		title: `Downloading Lv.${header.metadata.enterprise.ojn.level_hx} ${header.metadata.enterprise.ojn.title}`,
		icon: 'i-heroicons-check-circle-solid',
		color: 'green'
	})

	try {
		const response = await $fetch(`/api/download/chart/${header.parent.id}`, {
			method: 'POST',
			body: {
				id: header.metadata.enterprise.ojn.id,
				file_name: `${header.parent.name}_${header.metadata.enterprise.ojn.level_hx}_${header.metadata.enterprise.ojn.title}_o2ma${header.metadata.enterprise.ojn.id}`
			}
		})

		if (response.download_url) {
			navigateTo(response.download_url, {
				open: {
					target: '_blank'
				}
			})
		}
	} catch (e) {
		toast.add({
			title: `Failed downloading ${header.metadata.enterprise.ojn.id} ${e}`,
			icon: 'i-heroicons-x-circle-16-solid',
			color: 'red',
			timeout: 0
		})
	}
}
</script>
