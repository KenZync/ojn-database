<template>
	<div class="flex justify-center text-3xl space-x-0 md:space-x-4 space-y-4 md:space-y-0 flex-col md:flex-row">
		<div class="text-center">{{ server?.server_name }}</div>
		<UButton :loading="loading" @click="downloadAll" icon="i-heroicons-arrow-down-tray" v-if="server"
			>Download <span class="font-bold">ALL</span> Charts</UButton
		>
	</div>
	<UTabs
		class="pt-4"
		v-if="!loading && channels?.length! > 0"
		:items="channelTabs"
		v-model="selectedChannel"
		@change="onChannelChange"
	/>
	<ClientOnly>
		<div v-if="user?.id === server?.owner_uuid">
			<div class="flex flex-col md:flex-row justify-center space-x-0 md:space-x-6 space-y-4 md:space-y-0 py-4">
				<UButton @click="openUpdateOJNModal" icon="i-heroicons-cloud-arrow-up">Upload OJN/OJM</UButton>
				<UButton @click="selectOJNList" icon="i-heroicons-cloud-arrow-up" color="green">
					<span v-if="channels?.length! > 0">Update/Create OJN List</span>
					<span v-else>Create OJN List</span>
				</UButton>
				<UButton v-if="channels?.length! > 1" @click="openDeleteModal" color="red" icon="i-heroicons-trash"
					>Remove Channel</UButton
				>
				<UButton icon="i-heroicons-tag" color="yellow" @click="openRenameModal">Rename</UButton>
			</div>
		</div>
	</ClientOnly>
	<form ref="formOJNList">
		<input type="file" @change="onInputChange" hidden ref="fileOJNListInput" />
	</form>
	<div class="flex justify-between flex-col md:flex-row space-x-0 md:space-x-4 pt-4">
		<UInput
			v-model="search"
			icon="i-heroicons-magnifying-glass"
			placeholder="Search Name, Artist, Note Charter, Level, BPM"
			size="xl"
			autofocus
			class="grow"
		/>
		<div class="flex items-center space-x-2 justify-center pt-4 md:pt-0">
			<UBadge color="green">{{ ojnlist?.count || 0 }} Charts</UBadge>
			<UBadge>Updated: {{ new Date(channels![selectedChannel].updated_at).toLocaleString() }}</UBadge>
		</div>
	</div>
	<UTable
		class="pt-4"
		:rows="filteredRows"
		:columns="ojnColumns"
		:loading-state="{ icon: 'i-heroicons-arrow-path-20-solid', label: 'Loading...' }"
		:loading="pendingList"
		:ui="{ td: { base: '', color: 'text-black dark:text-gray-200' } }"
	>
		<template #view-data="{ row }">
			<UButton variant="ghost" icon="i-heroicons-eye-solid" @click="openOJNViewer(row)" />
		</template>
		<template #download-data="{ row }">
			<UButton variant="ghost" icon="i-heroicons-arrow-down-tray" @click="downloadChart(row)" />
		</template>
	</UTable>

	<UModal v-model="updateOJNListModal" :prevent-close="loading">
		<UForm :schema="schema" :state="state" @submit="createChannel">
			<UCard>
				<template #header>
					<div class="flex items-center justify-between">
						<h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
							Create and Update OJN List Channel
						</h3>
						<UButton
							color="gray"
							variant="ghost"
							icon="i-heroicons-x-mark-20-solid"
							class="-my-1"
							@click="closeOJNListModal"
						/>
					</div>
				</template>
				<UTabs :items="updateTabs" v-model="selectedTab">
					<template #default="{ item, selected }">
						<div class="flex items-center gap-2 relative truncate">
							<UIcon :name="item.icon" class="w-4 h-4 flex-shrink-0" />
							<span>{{ item.label }}</span>
							<span v-if="selected" class="absolute -right-4 w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400" />
						</div>
					</template>
					<template #item="{ item }">
						<div v-if="item.key === 'update'">
							<span v-if="channels?.length! < 0">Channel : {{ channels![selectedChannel].channel_name }}</span>
						</div>
						<div class="pb-4" v-else>
							<UFormGroup label="Channel Name" name="channel" required>
								<UInput
									class="mt-1"
									size="md"
									color="gray"
									variant="outline"
									placeholder="Channel Name"
									v-model="state.channel"
								/>
							</UFormGroup>
						</div>
					</template>
				</UTabs>
				<div class="flex flex-col">
					<span>File Name: {{ fileOJNList?.name }}</span>
					<span>Song Count: {{ updatingOJNList?.count }}</span>
					<UTable
						class="max-h-96"
						:rows="updatingOJNList?.ojnlists"
						:columns="ojnColumns"
						:loading-state="{ icon: 'i-heroicons-arrow-path-20-solid', label: 'Loading...' }"
						:loading="pendingList"
						:ui="{ td: { base: '', color: 'text-black dark:text-gray-200' } }"
					>
					</UTable>
				</div>

				<template #footer>
					<UButton
						v-if="selectedTab == 0"
						:disabled="loading"
						:loading="loading"
						size="xl"
						icon="i-heroicons-cloud-arrow-up"
						block
						@click="updateOJNList"
					>
						Update OJN List
					</UButton>
					<UButton
						v-else
						:disabled="loading"
						:loading="loading"
						size="xl"
						icon="i-heroicons-document-plus"
						block
						type="submit"
						color="green"
					>
						Create Channel
					</UButton>
				</template>
			</UCard>
		</UForm>
	</UModal>

	<UModal v-model="uploadOJNModal" :prevent-close="loading">
		<UCard>
			<template #header>
				<div class="flex items-center justify-between">
					<h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
						Upload OJN/OJM - {{ server?.server_name }}
					</h3>
					<UButton
						color="gray"
						variant="ghost"
						icon="i-heroicons-x-mark-20-solid"
						class="-my-1"
						@click="closeUploadOJNModal"
					/>
				</div>
			</template>
			<div v-if="!fileOJNInput">
				<DropZone class="drop-area text-center" @files-dropped="onInputOJNChange" #default="{ dropZoneActive }">
					<div class="flex items-center">
						<label for="file-input" class="border-dashed border-2 cursor-pointer py-32 px-2 w-full">
							<span v-if="dropZoneActive">
								<span>Drop Them Here </span>
								<span>to add them</span>
							</span>
							<span v-else>
								<div>Drag & Drop</div>
								<span>
									.ojn, .ojm files here or
									<span class="font-bold italic">click</span>
								</span>
							</span>

							<input
								class="hidden"
								type="file"
								id="file-input"
								@change="onInputOJNChange"
								multiple
								accept=".ojn,.ojm"
							/>
						</label>
					</div>
				</DropZone>
			</div>
			<div v-else>
				<div class="max-h-72 overflow-auto">
					<div v-for="ojn in fileOJNInput">
						{{ ojn.name }}
					</div>
				</div>
				<div class="pt-4">File Count : {{ fileOJNInput?.length }}</div>
				<div class="pt-4 flex items-center justify-center">
					<UIcon class="text-2xl text-yellow-400 pl-8" name="i-heroicons-exclamation-triangle-solid" />
					<p>You are uploading .OJN files for all channels.</p>
				</div>
			</div>
			<template #footer>
				<UButton
					:disabled="!fileOJNInput"
					:loading="loading"
					size="xl"
					icon="i-heroicons-cloud-arrow-up"
					block
					@click="updateOJN"
				>
					<span v-if="loading">{{ now }}/{{ fileOJNInput?.length }} Uploading</span>
					<span v-else>Upload</span> OJN
				</UButton>
				<UProgress v-if="loading" class="pt-4" :value="now" :max="fileOJNInput?.length" />
			</template>
		</UCard>
	</UModal>

	<UModal v-model="deleteModal" :prevent-close="loading">
		<UForm :schema="schema" :state="state" @submit="deleteChannel">
			<UCard>
				<template #header>
					<div class="flex items-center justify-between">
						<h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
							Delete Channel - {{ channels![selectedChannel].channel_name }}
						</h3>
						<UButton
							color="gray"
							variant="ghost"
							icon="i-heroicons-x-mark-20-solid"
							class="-my-1"
							@click="closeDeleteModal"
						/>
					</div>
				</template>
				<div>
					<UFormGroup
						:label="`To confirm, type '${server?.server_name}/${channels![selectedChannel].channel_name}' in the box below`"
						name="channel"
						required
					>
						<UInput class="mt-1" size="md" color="gray" variant="outline" v-model="state.channel" />
					</UFormGroup>
					<div class="pt-4">Song Count : {{ ojnlist?.count }}</div>
					<div class="pt-4 flex items-center justify-center">
						<UIcon class="text-2xl text-yellow-400 pl-8" name="i-heroicons-exclamation-triangle-solid" />
						<p>You are deleting Channel and OJN List</p>
					</div>
				</div>
				<template #footer>
					<UButton :loading="loading" size="xl" icon="i-heroicons-trash" block color="red" type="submit">
						<span v-if="loading">Deleting</span>
						<span v-else>Delete Channel</span>
					</UButton>
				</template>
			</UCard>
		</UForm>
	</UModal>

	<UModal v-model="renameModal" :prevent-close="loading">
		<UForm :schema="schema" :state="state" @submit="renameChannel">
			<UCard>
				<template #header>
					<div class="flex items-center justify-between">
						<h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
							Rename Server / Channel - {{ channels![selectedChannel].channel_name }}
						</h3>
						<UButton
							color="gray"
							variant="ghost"
							icon="i-heroicons-x-mark-20-solid"
							class="-my-1"
							@click="closeRenameModal"
						/>
					</div>
				</template>
				<UTabs :items="renameTabs" class="w-full" v-model="selectedTab" @change="onTabRenameChange">
					<template #default="{ item, index, selected }">
						<div class="flex items-center gap-2 relative truncate">
							<UIcon :name="item.icon" class="w-4 h-4 flex-shrink-0" />
							<span>{{ item.label }}</span>
							<span v-if="selected" class="absolute -right-4 w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400" />
						</div>
					</template>
				</UTabs>
				<div>
					<UFormGroup :label="`${renameTabs[selectedTab].label} Name`" name="channel" required>
						<UInput class="mt-1" size="md" color="gray" variant="outline" v-model="state.channel" />
					</UFormGroup>
				</div>
				<template #footer>
					<UButton :loading="loading" size="xl" icon="i-heroicons-tag-solid" block color="yellow" type="submit">
						<span v-if="loading">Renaming</span>
						<span v-else>Rename <span v-if="selectedTab === 0">Channel</span> <span v-else>Server</span></span>
					</UButton>
				</template>
			</UCard>
		</UForm>
	</UModal>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'
import pLimit from 'p-limit'
import * as yup from 'yup'
import { FetchError } from 'ofetch'

const boxAPI = 'https://api.box.com/2.0'
const boxUploadAPI = 'https://upload.box.com/api/2.0'

const client = useSupabaseClient<Database>()
const user = useSupabaseUser()
const route = useRoute()
const router = useRouter()

const loading = ref(false)
const fileOJNList = ref<File>()
const ojnlist = ref<OJNList>()
const fileOJNListInput = ref<HTMLInputElement>()
const formOJNList = ref<HTMLFormElement>()

const ojnlistID = computed(() => {
	if (channels.value?.length! > 0) {
		return channels.value![selectedChannel.value].ojn_list_file_id
	}
})
const selectedChannel = ref(Number(route.query.channel) || 0)

const updateOJNListModal = ref(false)
const updatingOJNList = ref<OJNList>()

const uploadOJNModal = ref(false)
const fileOJNInput = ref<File[]>()

const deleteModal = ref(false)
const renameModal = ref(false)

const state = reactive({
	channel: ''
})

const now = ref(0)
const toast = useToast()
const selectedTab = ref(0)

const ojnColumns = [
	{
		key: 'song_id',
		label: 'ID',
		sortable: true
	},
	{
		key: 'title',
		label: 'Title',
		sortable: true
	},
	{
		key: 'artist',
		label: 'Artist',
		sortable: true
	},
	{
		key: 'noter',
		label: 'Note Charter',
		sortable: true
	},
	{
		key: 'difficulty.hard.level',
		label: 'Level',
		sortable: true
	},
	{
		key: 'bpm',
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

const schema = yup.object({
	channel: yup.string().required('Required')
})

const { data: server } = await client.from('ojn_servers').select().eq('id', route.params.id).single()

const { data: channels, refresh: refreshChannel } = await useAsyncData('ojn_channels', async () => {
	const { data } = await client.from('ojn_channels').select().eq('server_id', route.params.id)

	return data
})

const updateTabs = [
	{
		key: 'update',
		label: 'Update',
		icon: 'i-heroicons-cloud-arrow-up-solid',
		disabled: channels?.value!.length === 0
	},
	{
		key: 'create',
		label: 'Create',
		icon: 'i-heroicons-document-plus-solid'
	}
]

const renameTabs = computed(() => {
	return [
		{
			key: 'channel',
			label: 'Channel',
			icon: 'i-heroicons-at-symbol',
			disabled: loading.value
		},
		{
			key: 'server',
			label: 'Server',
			icon: 'i-heroicons-server-solid',
			disabled: loading.value
		}
	]
})

useHead({
	title: `${server?.server_name} - OJN Database`,
	meta: [
		{
			name: 'description',
			content: `Channel: ${channels.value?.length! > 0 ? channels.value?.[selectedChannel.value].channel_name : '-'}`
		}
	]
})

const channelTabs = computed(() => {
	if (channels.value?.length! > 0) {
		return channels.value?.map((chan) => ({
			key: chan.id,
			label: chan.channel_name
		}))
	}
})

const search = ref('')

const filteredRows = computed(() => {
	if (!search.value) {
		return ojnlist.value?.ojnlists
	}

	return ojnlist.value?.ojnlists.filter((ojn) => {
		return Object.values(ojn).some((value) => {
			return String(value).toLowerCase().includes(search.value.toLowerCase())
		})
	})
})

const {
	pending: pendingList,
	data: list,
	refresh: refreshOJNList,
	clear: clearOJNList
} = await useLazyFetch(`/api/download/`, {
	query: {
		file_id: ojnlistID
	},
	method: 'GET',
	headers: {
		'Content-Type': 'application/octet-stream'
	},
	responseType: 'arrayBuffer',
	server: false,
	watch: [ojnlistID]
})

watch(list, (newList) => {
	ojnlist.value = convert(newList, false)
})

const selectOJNList = () => {
	fileOJNListInput.value?.click()
}

const onInputChange = async (e: any) => {
	const input = e.target as HTMLInputElement

	if (!input.files?.length) {
		return
	}

	let list = input.files[0]
	if (list.size > 500000) {
		alert(list.name + ' too big')
		return
	}

	try {
		let arrayBuffer: ArrayBuffer = await readFileAsArrayBuffer(list)
		let converted = convert(arrayBuffer, false)
		if (converted.count === converted.ojnlists.length && converted.count > 0) {
			fileOJNList.value = list
			updatingOJNList.value = converted
			updateOJNListModal.value = true
			state.channel = ''
			if (channels?.value!.length === 0) {
				selectedTab.value = 1
			}
		} else {
			throw new Error('count mismatch')
		}
	} catch (error) {
		alert(error)
	}
	formOJNList.value?.reset()
}

const onInputOJNChange = async (e: any) => {
	let originalFiles
	let drop = false
	if (e.target.files) {
		originalFiles = e.target.files
	} else {
		originalFiles = e.dataTransfer.items
		drop = true
	}

	try {
		let files = []
		if (drop) {
			for (let item of originalFiles) {
				if (item != null && item.kind == 'file') files.push(item.webkitGetAsEntry())
			}
		} else {
			files = originalFiles
		}
		fileOJNInput.value = await parseFiles(files, drop)
	} catch (err) {
		alert('err' + err)
	} finally {
	}
}

const closeOJNListModal = () => {
	if (!loading.value) {
		updateOJNListModal.value = false
	}
}

const closeUploadOJNModal = () => {
	if (!loading.value) {
		uploadOJNModal.value = false
	}
}

const updateOJNList = async () => {
	loading.value = true

	const formData = new FormData()
	formData.append('file', fileOJNList.value!)
	if (channels.value) {
		await $fetch<CreateResponse>(`/api/ojnlist/${channels.value[selectedChannel.value].ojn_list_file_id}`, {
			method: 'PATCH',
			body: formData
		})
	}

	await refreshOJNList()
	await refreshChannel()
	loading.value = false
	updateOJNListModal.value = false
	toast.add({ title: 'OJN List Updated!', icon: 'i-heroicons-check-circle-solid', color: 'green' })
}

const updateOJN = async () => {
	now.value = 0
	loading.value = true
	const limit = pLimit(10)
	const response = await $fetch(`/api/token`, { retry: 10 })

	const asyncOperation = (ojn: File) => {
		return new Promise<void>(async (resolve) => {
			const formData = new FormData()
			let uploaded = false
			let upload_error: FetchError | null = null
			let file_id = ''
			let upload_url = '/files/content'
			let checked = false
			let put_file = false
			let metadata_updated = false
			let is_ojn = ojn.name.match(/\.ojn$/i) !== null
			let upload_passed = false

			let bodyCheck = JSON.stringify({
				name: ojn.name,
				parent: {
					id: server?.folder_id
				}
			})

			formData.append('attributes', bodyCheck)
			formData.append('file', ojn)

			try {
				await $fetch(`${boxAPI}${upload_url}`, {
					method: 'OPTIONS',
					headers: {
						authorization: `Bearer ${response.access_token}`
					},
					body: bodyCheck,
					retry: 3,
					retryStatusCodes: [408, 425, 429, 500, 502, 503, 504],
					retryDelay: 500
				})
				checked = true
			} catch (err) {
				const error = err as FetchError
				if (error.statusCode === 409) {
					checked = true
					uploaded = true
					file_id = error.data.context_info.conflicts.id
				}
			}

			if (uploaded) {
				put_file = true
				upload_url = `/files/${file_id}/content`
			}

			if (checked) {
				try {
					const uploadResponse: any = await $fetch(`${boxUploadAPI}${upload_url}`, {
						method: 'POST',
						headers: {
							authorization: `Bearer ${response.access_token}`
						},
						body: formData,
						retry: 3,
						retryDelay: 1000
					})
					const [firstEntry] = uploadResponse.entries
					file_id = firstEntry.id

					uploaded = true
					upload_passed = true
				} catch (err) {
					upload_error = err as FetchError
				}
			}

			if (is_ojn) {
				let arrayBuffer: ArrayBuffer = await readFileAsArrayBuffer(ojn)
				let rawHeader = convert(arrayBuffer, true).ojnlists
				let [header] = rawHeader
				let bodyMetadata = {
					id: header.song_id,
					title: header.title,
					artist: header.artist,
					noter: header.noter,
					genre: header.genre,
					bpm: header.bpm,
					level_ex: header.difficulty.easy.level,
					level_nx: header.difficulty.normal.level,
					level_hx: header.difficulty.hard.level,
					note_ex: header.difficulty.easy.note_count,
					note_nx: header.difficulty.normal.note_count,
					note_hx: header.difficulty.hard.note_count,
					time_ex: header.difficulty.easy.duration,
					time_nx: header.difficulty.normal.duration,
					time_hx: header.difficulty.hard.duration
				}
				if (!put_file) {
					try {
						await $fetch(`${boxAPI}/files/${file_id}/metadata/enterprise/ojn`, {
							method: 'POST',
							headers: {
								authorization: `Bearer ${response.access_token}`
							},
							body: JSON.stringify(bodyMetadata)
						})
						metadata_updated = true
					} catch (err) {
						upload_error = err as FetchError
					}
				} else {
					let output = []
					let key: keyof typeof bodyMetadata

					for (key in bodyMetadata) {
						let path = '/' + key
						let value = bodyMetadata[key]
						output.push({ op: 'replace', path: path, value: value })
					}
					try {
						await $fetch(`${boxAPI}/files/${file_id}/metadata/enterprise/ojn`, {
							method: 'PUT',
							headers: {
								authorization: `Bearer ${response.access_token}`,
								'Content-Type': 'application/json-patch+json'
							},
							body: JSON.stringify(output)
						})
						metadata_updated = true
					} catch (err) {
						upload_error = err as FetchError
					}
				}
			}

			if ((is_ojn && upload_passed && metadata_updated) || (upload_passed && !is_ojn)) {
				now.value++
				resolve()
			} else {
				toast.add({
					title: `Uploading ${ojn.name} failed. ${upload_error}`,
					icon: 'i-heroicons-x-circle-16-solid',
					color: 'red',
					timeout: 0
				})
			}
		})
	}

	const fileArray = Array.from(fileOJNInput.value!)

	const promises = fileArray.map((ojn) => limit(() => asyncOperation(ojn)))

	await Promise.all(promises)

	loading.value = false
	uploadOJNModal.value = false
	if (now.value > 0) {
		toast.add({ title: `${now.value} OJNs Updated`, icon: 'i-heroicons-check-circle-16-solid', color: 'green' })
	}
}

const openUpdateOJNModal = () => {
	uploadOJNModal.value = true
	fileOJNInput.value = undefined
}

const createChannel = async () => {
	loading.value = true
	const formData = new FormData()
	formData.append('server_id', String(server?.id))
	formData.append('server__folder_id', String(server?.folder_id))
	formData.append('channel_name', state.channel)
	formData.append('file', fileOJNList.value!)
	try {
		await $fetch<CreateResponse>('/api/channel', {
			method: 'POST',
			body: formData
		})
		updateOJNListModal.value = false
		toast.add({ title: `${state.channel} Channel Created`, icon: 'i-heroicons-check-circle-solid', color: 'green' })
		await refreshChannel()
	} catch (e: any) {
		toast.add({ title: e, icon: 'i-heroicons-x-circle-solid', color: 'red' })
	}
	loading.value = false
}

const onChannelChange = (index: number) => {
	router.push({ query: { channel: index } })
	ojnlist.value = undefined
}

const openOJNViewer = (e: OJNHeader) => {
	navigateTo(`https://ojn.kenzync.dev/?id=${e.song_id}&server=ojn&folder=${server?.folder_id}`, {
		open: {
			target: '_blank'
		}
	})
}

const openDeleteModal = () => {
	deleteModal.value = true
	state.channel = ''
}

const closeDeleteModal = () => {
	if (!loading.value) {
		deleteModal.value = false
	}
}

const openRenameModal = () => {
	selectedTab.value = 0
	renameModal.value = true
	state.channel = channels.value![selectedChannel.value].channel_name
}

const closeRenameModal = () => {
	if (!loading.value) {
		renameModal.value = false
	}
}

const deleteChannel = async () => {
	if (state.channel === `${server?.server_name}/${channels.value![selectedChannel.value].channel_name}`) {
		loading.value = true
		await $fetch(`/api/channel/${channels.value![selectedChannel.value].id}`, {
			method: 'DELETE',
			query: {
				channel_folder_id: channels.value![selectedChannel.value].folder_id
			}
		})
		toast.add({
			title: `${channels.value![selectedChannel.value].channel_name} Channel Removed`,
			icon: 'i-heroicons-check-circle-solid',
			color: 'green'
		})
		deleteModal.value = false
		router.push({ query: { channel: 0 } })
		selectedChannel.value = 0
		refreshChannel()
		refreshOJNList()
	} else {
		alert('NOT CORRECT')
	}
	loading.value = false
}

const onTabRenameChange = (index: number) => {
	if (renameTabs.value[index].key === 'channel') {
		state.channel = channels.value![selectedChannel.value].channel_name
	} else {
		state.channel = server?.server_name!
	}
}

const renameChannel = async () => {
	loading.value = true
	let tab = renameTabs.value[selectedTab.value]
	let body: RenameBodyRequest = {
		type: tab.key,
		id: tab.key === 'channel' ? channels.value![selectedChannel.value].id! : server?.id!,
		name: state.channel,
		folder_id: tab.key === 'channel' ? channels.value![selectedChannel.value].folder_id! : server?.folder_id!
	}

	try {
		await $fetch<CreateResponse>('/api/rename', {
			method: 'POST',
			body: body
		})
		renameModal.value = false
		toast.add({
			title: `${tab.label} renamed`,
			icon: 'i-heroicons-check-circle-solid',
			color: 'green'
		})
		await refreshChannel()
	} catch (e: any) {
		toast.add({ title: e, icon: 'i-heroicons-x-circle-solid', color: 'red' })
	}
	loading.value = false
}

const downloadAll = async () => {
	loading.value = true
	let body = {
		name: server?.server_name
	}
	const response = await $fetch(`/api/download/${server?.folder_id}`, {
		method: 'POST',
		body: body
	})

	navigateTo(response.download_url, {
		open: {
			target: '_blank'
		}
	})
	loading.value = false
}

const downloadChart = async (header: OJNHeader) => {
	toast.add({
		title: `Downloading Lv.${header.difficulty.hard.level} ${header.title}`,
		icon: 'i-heroicons-check-circle-solid',
		color: 'green'
	})

	try {
		const response = await $fetch(`/api/download/chart/${server?.folder_id}`, {
			method: 'POST',
			body: {
				id: header.song_id,
				file_name: `${server?.server_name}_${header.difficulty.hard.level}_${header.title}_o2ma${header.song_id}`
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
			title: `Failed downloading ${header.song_id} ${e}`,
			icon: 'i-heroicons-x-circle-16-solid',
			color: 'red',
			timeout: 0
		})
	}
}
</script>
