<template>
	<div class="flex flex-col space-y-6">
		<div v-if="user">
			<UButton @click="openCreateServerModal" block color="green" icon="i-heroicons-plus" size="xl">
				Create Server
			</UButton>
		</div>
		<ULink v-if="serverList" v-for="server in serverList" :to="`server/${server.id}`">
			<UCard :ui="{ background: 'bg-blue-500' }">
				<div class="flex justify-center space-x-4">
					<div class="">{{ server.server_name }}</div>
					<UBadge v-if="user?.id === server.owner_uuid">Owner</UBadge>
				</div>
			</UCard>
		</ULink>

		<div v-else class="flex flex-col space-y-6">
			<USkeleton class="h-20 w-full" />
			<USkeleton class="h-20 w-full" />
			<USkeleton class="h-20 w-full" />
			<USkeleton class="h-20 w-full" />
			<USkeleton class="h-20 w-full" />
			<USkeleton class="h-20 w-full" />
			<USkeleton class="h-20 w-full" />
		</div>
	</div>
	<UModal v-model="createServerModal" :prevent-close="loading">
		<UForm :schema="schema" :state="state" @submit="onSubmit">
			<UCard>
				<template #header>
					<div class="flex items-center justify-between">
						<h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">Create Server</h3>
						<UButton
							color="gray"
							variant="ghost"
							icon="i-heroicons-x-mark-20-solid"
							class="-my-1"
							@click="createServerModal = false"
						/>
					</div>
				</template>
				<div class="space-y-6">
					<UFormGroup label="Server Name" name="server" required>
						<UInput
							class="mt-1"
							size="md"
							color="gray"
							variant="outline"
							placeholder="Server Name"
							v-model="state.server"
						/>
					</UFormGroup>
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
					<UFormGroup label="OJN List" name="file" required>
						<input type="file" @change="onInputChange" />
						<!-- <UInput size="md" type="file"></UInput> -->
						Song Count : {{ state.count }}
						<!-- <input type="file" @change="onInputChange" /> -->
					</UFormGroup>
				</div>
				<template #footer>
					<UButton
						:disabled="disabled"
						:loading="loading"
						size="xl"
						icon="i-heroicons-pencil-square"
						block
						type="submit"
					>
						Create Server
					</UButton>
				</template>
			</UCard>
		</UForm>
	</UModal>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'
import * as yup from 'yup'

useHead({
	title: `OJN Database`,
	meta: [{ name: 'description', content: `Collection of OJN` }]
})

const client = useSupabaseClient<Database>()
const user = useSupabaseUser()

const loading = ref(false)
const createServerModal = ref(false)
const disabled = ref(true)

const serverList = ref()

onMounted(async () => {
	const { data: servers } = await client.from('ojn_servers').select().order('id', { ascending: true })
	serverList.value = servers
})

const state = reactive({
	server: '',
	channel: '',
	file: new ArrayBuffer(0),
	file_name: '',
	count: 0
})

const fileOJNList = ref<File>()

const schema = yup.object({
	server: yup.string().required('Required'),
	channel: yup.string().required('Required'),
	file: yup.mixed().required('File is required')
})

const openCreateServerModal = () => {
	state.server = ''
	state.channel = ''
	state.file = new ArrayBuffer(0)
	state.file_name = ''
	fileOJNList.value = new File([], '')
	state.count = 0
	createServerModal.value = true
	disabled.value = true
}

const onInputChange = async (e: any) => {
	const input = e.target as HTMLInputElement

	if (!input.files?.length) {
		return
	}

	let file = input.files[0]
	if (file.size > 500000) {
		alert(file.name + ' too big')
		return
	}

	try {
		let arrayBuffer: ArrayBuffer = await readFileAsArrayBuffer(file)
		let converted = convert(arrayBuffer)
		if (converted.count === converted.ojnlists.length && converted.count > 0) {
			state.count = converted.count
			state.file = arrayBuffer
			state.file_name = file.name
			fileOJNList.value = file
			disabled.value = false
		} else {
			throw new Error('count mismatch')
		}
	} catch (error) {
		disabled.value = true
		alert(error)
		state.count = 0
	}
}

const onSubmit = async () => {
	loading.value = true

	try {
		const { data: server, error: createError } = await client
			.from('ojn_servers')
			.insert({ server_name: state.server })
			.select()
			.single()
		if (createError) {
			alert(createError)
		}
		if (server) {
			const create = await createFolder(state.server, state.channel, fileOJNList.value!)
			await client.from('ojn_servers').update({ folder_id: create.server_folder_id }).eq('id', server.id)
			await client.from('ojn_channels').insert({
				server_id: server.id,
				channel_name: state.channel,
				folder_id: create.channel_folder_id,
				ojn_list_file_id: create.ojn_list_file_id
			})
			loading.value = false
			createServerModal.value = false
			navigateTo(`server/${server.id}`)
		}
	} catch (e) {
		alert(e)
	}
}

const createFolder = async (server_name: string, channel_name: string, file: File) => {
	const formData = new FormData()
	formData.append('server_name', server_name)
	formData.append('channel_name', channel_name)
	formData.append('file', file)
	return await $fetch<CreateResponse>('/api/create', {
		method: 'POST',
		body: formData
	})
}
</script>
