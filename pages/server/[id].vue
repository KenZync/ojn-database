<template>
	<!-- <ULink to="/">
		<UButton icon="i-heroicons-arrow-left" variant="link" color="white">Back</UButton>
	</ULink> -->
	<div class="flex justify-center text-3xl">{{ server?.server_name }}</div>
	<UTabs
		class="pt-4"
		v-if="!loading && channels?.length! > 0"
		:items="channelTabs"
		v-model="selectedChannel"
		@change="onChannelChange"
	/>
	<ClientOnly>
		<div v-if="user?.id === server?.owner_uuid">
			<div class="flex justify-center space-x-6 py-4">
				<UButton @click="openUpdateOJNModal" icon="i-heroicons-cloud-arrow-up">Upload OJN</UButton>
				<UButton @click="selectOJNList" icon="i-heroicons-cloud-arrow-up" color="green">
					<span v-if="channels?.length! > 0">Update/Create OJN List</span>
					<span v-else>Create OJN List</span>
				</UButton>
				<UButton v-if="channels?.length! > 1" @click="openDeleteModal" color="red" icon="i-heroicons-trash"
					>Remove Channel</UButton
				>
				<UButton icon="i-heroicons-tag" color="yellow" @click="openRenameModal">Rename</UButton>>
			</div>
		</div>
	</ClientOnly>
	<form ref="formOJNList">
		<input type="file" @change="onInputChange" hidden ref="fileOJNListInput" />
	</form>
	<div class="flex justify-between flex-col md:flex-row space-x-0 md:space-x-4">
		<UInput
			v-model="search"
			icon="i-heroicons-magnifying-glass"
			placeholder="Search Name, Artist, Note Charter, Level, BPM"
			size="xl"
			autofocus
			class="grow"
		/>
		<div class="flex items-center space-x-4 justify-center pt-4 md:pt-0">
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
		@select="openOJNViewer"
	>
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
						Upload OJN - {{ server?.server_name }}
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
									.ojn files here or
									<span class="font-bold italic">click</span>
								</span>
							</span>

							<input class="hidden" type="file" id="file-input" @change="onInputOJNChange" multiple accept=".ojn" />
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
				<div class="pt-4">Song Count : {{ fileOJNInput?.length }}</div>
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
		label: 'Name',
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
	ojnlist.value = convert(newList)
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
		let converted = convert(arrayBuffer)
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

	const asyncOperation = (ojn: File) => {
		return new Promise<void>(async (resolve) => {
			const formData = new FormData()
			formData.append('file', ojn)
			try {
				await $fetch(`/api/ojn/${server?.folder_id}`, {
					method: 'POST',
					body: formData
				})
				now.value++
				resolve()
			} catch (e) {
				toast.add({
					title: `Uploading ${ojn.name} failed.`,
					icon: 'i-heroicons-x-circle-16-solid',
					color: 'red'
				})
				alert(e)
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
	} else {
		alert('NOT CORRECT')
	}
	loading.value = false
	router.push({ query: { channel: 0 } })
	selectedChannel.value = 0
	ojnlist.value = undefined
	refreshChannel()
	refreshOJNList()
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
</script>