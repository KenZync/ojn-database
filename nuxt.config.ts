// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	devtools: { enabled: true },
	modules: ['@nuxt/ui', '@nuxtjs/supabase', '@vee-validate/nuxt'],
	supabase: {
		redirect: false
		// redirectOptions: {
		//   login: '/',
		//   callback: '/confirm'
		// }
	},
	tailwindcss: {
		exposeConfig: true
	},
	colorMode: {
		preference: 'dark'
	}
})
