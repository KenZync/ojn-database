<template>
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
			class="pb-4"
			:prev-button="{ icon: 'i-heroicons-arrow-small-left-20-solid', label: 'Prev', color: 'gray' }"
			:next-button="{ icon: 'i-heroicons-arrow-small-right-20-solid', trailing: true, label: 'Next', color: 'gray' }"
			v-model="page"
			:total="allCount"
			:page-count="limit"
			show-last
			show-first
			:disabled="searching"
		/>
		<div>
			<USelect size="sm" v-model="limit" :options="['30', '50', '100', '200']" icon="i-heroicons-list-bullet" />
		</div>
	</div>
	<div class="flex justify-center">
		<UButton v-if="searching" loading variant="ghost" color="white" size="xl" />
		<UButton v-if="!searching && !result.length" disabled variant="ghost" color="white" size="xl" label="No Data" />
	</div>

	<div class="grid lg:grid-cols-2 gap-3">
		<UCard class="group max-h-[140px]" v-for="chart in result" :ui="{ body: { padding: '' } }">
			<div class="flex relative">
				<img
					class="absolute rounded-l-md h-[140px] min-w-[186px]"
					:src="getImage(chart.metadata.enterprise.ojn.img, chart.metadata.enterprise.ojn.bmp)"
				/>
				<div class="h-[140px] min-w-[186px] z-10 flex flex-row-reverse">
					<div class="pt-2 pr-2">
						<UTooltip text="o2maID">
							<UBadge
								color="white"
								class="opacity-70 hover:opacity-100 transition"
								size="xs"
								:label="chart.metadata.enterprise.ojn.id"
							/>
						</UTooltip>
					</div>
				</div>

				<div class="flex relative w-full bg-gradient-to-r from-gray-900 rounded-md -ml-1">
					<img
						class="absolute object-cover w-full h-[140px] opacity-10 rounded-md"
						:src="imageList.get(chart.metadata.enterprise.ojn.img)"
					/>
					<div class="flex flex-col justify-between w-full relative p-2">
						<div class="z-10">
							<div class="font-bold">
								{{ chart.metadata.enterprise.ojn.title }}
							</div>
							<div class="font-bold text-sm">by {{ chart.metadata.enterprise.ojn.artist }}</div>
						</div>
						<div class="z-10">
							<div class="leading-none text-sm">
								<span class="text-gray-400">charted by </span>
								<span class="font-bold text-gray-200">{{ chart.metadata.enterprise.ojn.noter }}</span>
							</div>
							<div class="flex gap-4">
								<UTooltip text="Time / Duration" class="flex text-xs items-center">
									<UIcon name="i-heroicons-clock-solid" />
									<div class="">{{ fancyTimeFormat(chart.metadata.enterprise.ojn.time_hx) }}</div>
								</UTooltip>
								<UTooltip text="BPM" class="flex text-xs items-center">
									<UIcon name="i-heroicons-chevron-double-up-solid" />
									<div class="">{{ chart.metadata.enterprise.ojn.bpm }}</div>
								</UTooltip>
								<UTooltip text="Notes" class="flex text-xs items-center">
									<UIcon name="i-mdi-music-note" dynamic />
									<div class="">{{ chart.metadata.enterprise.ojn.note_hx }}</div>
								</UTooltip>
							</div>
							<div class="flex justify-between pt-1">
								<UTooltip text="Server">
									<UBadge :label="chart.parent.name" />
								</UTooltip>

								<div class="flex gap-1">
									<UTooltip text="Level Easy / EX">
										<UBadge color="green" :label="chart.metadata.enterprise.ojn.level_ex" />
									</UTooltip>
									<UTooltip text="Level Normal / HX">
										<UBadge color="yellow" :label="chart.metadata.enterprise.ojn.level_nx" />
									</UTooltip>
									<UTooltip text="Level Hard / HX">
										<UBadge color="red" :label="chart.metadata.enterprise.ojn.level_hx" />
									</UTooltip>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div
					class="flex-col justify-center items-center space-y-4 flex transition-all opacity-0 group-hover:opacity-100 group-hover:w-16 w-2"
				>
					<UTooltip text="Preview Notes">
						<UButton variant="ghost" icon="i-heroicons-eye-solid" @click="openOJNViewer(chart)" />
					</UTooltip>
					<UTooltip text="Download">
						<UButton variant="ghost" icon="i-heroicons-arrow-down-tray" @click="downloadChart(chart)" />
					</UTooltip>
				</div>
			</div>
		</UCard>
	</div>

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
</template>

<script setup lang="ts">
import { FetchError } from 'ofetch'
const user = useSupabaseUser()
const toast = useToast()
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

const result = ref()
const page = ref(1)
const allCount = ref(0)
const limit = ref(30)

const searching = ref(true)

const query = ref('')
const token = ref('')
const imageList = ref(new Map<string, string>())

onMounted(async () => {
	if (!user.value) {
		toast.add({
			title: `Please Login with Discord`,
			icon: 'i-heroicons-x-circle-16-solid',
			color: 'red'
		})
		await navigateTo('/')
		return
	}
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
				fields: 'parent,metadata.enterprise.ojn',
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
