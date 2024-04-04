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
				:debounce="500"
				placeholder="Search Database... example: lv>100 nx<20 bpm=200"
			>
				<template #empty-state>
					<div></div>
				</template>
			</UCommandPalette>
		</UCard>
		<div class="flex justify-between pt-4">
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
			<div class="flex items-center">
				<p class="pr-4">Per page</p>
				<USelect size="sm" v-model="limit" :options="['30', '50', '100', '200']" />
			</div>
		</div>

		<UTable
			class="pt-4"
			:rows="result"
			:columns="ojnColumns"
			:loading-state="{ icon: 'i-heroicons-arrow-path-20-solid', label: 'Loading...' }"
			:loading="searching"
			:ui="{ td: { base: '', color: 'text-black dark:text-gray-200' } }"
		>
			<template #img-data="{ row }">
				<UPopover mode="hover" :popper="{ placement: 'right' }">
					<img
						loading="lazy"
						class="h-20 w-auto min-w-20"
						alt=""
						:src="getImage(row.metadata.enterprise.ojn.img, row.metadata.enterprise.ojn.bmp)"
						@error="test"
					/>
					<template #panel>
						<div class="p-4">
							<img :src="imageList.get(row.metadata.enterprise.ojn.img)" />
						</div>
					</template>
				</UPopover>
			</template>
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
		key: 'img',
		label: 'IMG'
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
		key: 'view',
		label: 'View'
	},
	{
		key: 'download',
		label: 'DL'
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
const limit = ref(30)

const searching = ref(true)

const query = ref('')
const token = ref('')
const imageList = ref(new Map<string, string>())

onMounted(async () => {
	const response = await $fetch(`/api/token`, {
		retry: 3,
		retryStatusCodes: [400]
	})
	token.value = response.access_token
	searchOJN('', true)
})

const searchOJN = async (q: string, reset: boolean) => {
	searching.value = true
	result.value = []
	query.value = q
	if (reset) {
		page.value = 1
	}
	const parts = q.split(' ')
	const filterPart: Filter = {}
	interface Filter {
		[key: string]: number | { gt?: number; lt?: number } | string
	}
	let justQ = null

	parts.forEach((part) => {
		if (part.includes('=')) {
			const [key, value] = part.split('=')
			const keyConverted = calculateKey(key)
			if (value.length && key.length > 1) {
				let theValue = parseFloat(value)
				if (isNaN(theValue)) {
					filterPart[keyConverted] = value
				} else {
					filterPart[keyConverted] = { gt: theValue, lt: theValue }
				}
			}
		} else if (part.includes('>')) {
			const [key, value] = part.split('>')
			const keyConverted = calculateKey(key)
			if (value.length && key.length > 1) {
				if (filterPart[keyConverted] === undefined) {
					filterPart[keyConverted] = { gt: parseFloat(value) }
				} else {
					filterPart[keyConverted] = {
						...(filterPart[keyConverted] as { lt: number }),
						gt: parseFloat(value)
					}
				}
			}
		} else if (part.includes('<')) {
			const [key, value] = part.split('<')
			const keyConverted = calculateKey(key)
			if (value.length && key.length > 1) {
				if (filterPart[keyConverted] === undefined) {
					filterPart[keyConverted] = { lt: parseFloat(value) }
				} else {
					filterPart[keyConverted] = {
						...(filterPart[keyConverted] as { gt: number }),
						lt: parseFloat(value)
					}
				}
			}
		} else {
			justQ = part
		}
	})

	try {
		const rawResult = await $fetch<Search>(`${boxAPI}/search`, {
			headers: {
				authorization: `Bearer ${token.value}`
			},
			query: {
				...(justQ ? { query: justQ } : {}),
				ancestor_folder_ids: process.env.NUXT_BOX_PRIVATE_FOLDER_ID,
				mdfilters: [
					[
						{
							scope: 'enterprise',
							templateKey: 'ojn',
							filters: filterPart
						}
					]
				],
				fields:
					'parent,metadata.enterprise.ojn.id,metadata.enterprise.ojn.title,metadata.enterprise.ojn.artist,metadata.enterprise.ojn.noter,metadata.enterprise.ojn.level_hx,metadata.enterprise.ojn.bpm,metadata.enterprise.ojn.bmp,metadata.enterprise.ojn.img',
				offset: (page.value - 1) * limit.value,
				limit: limit.value
			}
		})
		result.value = rawResult.entries
		allCount.value = rawResult.total_count
	} catch (err) {
		const error = err as FetchError
		if (error.statusCode === 401) {
			toast.add({
				title: `Please Login`,
				icon: 'i-heroicons-x-circle-16-solid',
				color: 'red'
			})
		}
		result.value = []
	}
	searching.value = false
}

watch(
	() => page.value,
	() => {
		searchOJN(query.value, false)
	}
)

watch(
	() => limit.value,
	() => {
		searchOJN(query.value, true)
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

const test = (e: Event) => {
	// console.log(e)
}

const getImage = (img_id: string, bmp_id: string) => {
	if (imageList.value.get(img_id)) return imageList.value.get(img_id)
	let base64data = ''
	try {
		$fetch(`${boxAPI}/files/${img_id}/content`, {
			headers: {
				authorization: `Bearer ${token.value}`
			}
		}).then((response) => {
			var reader = new FileReader()

			reader.readAsDataURL(response as Blob)
			reader.onloadend = function () {
				base64data = reader.result as string
				imageList.value.set(img_id, base64data as string)
			}
		})

		if (base64data === 'data:image/png;base64,') {
			$fetch(`${boxAPI}/files/${bmp_id}/content`, {
				headers: {
					authorization: `Bearer ${token.value}`
				}
			}).then((response) => {
				var reader = new FileReader()

				reader.readAsDataURL(response as Blob)
				reader.onloadend = function () {
					var base64data = reader.result
					imageList.value.set(img_id, base64data as string)
				}
			})
		}
	} catch (err) {}
	return imageList.value.get(img_id)
}
</script>
