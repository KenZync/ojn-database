import { serverSupabaseClient } from '#supabase/server'
import { serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/supabase'

import jwt from 'jsonwebtoken'
import crypto from 'crypto'

export default defineEventHandler(async (event) => {
	// const clientSupabase = await serverSupabaseClient<Database>(event)
	const user = await serverSupabaseUser(event)

	if (user === null) {
		setResponseStatus(event, 401)
		return
	}
	const authenticationUrl = 'https://api.box.com/oauth2/token'

	let claims = {
		iss: process.env.NUXT_BOX_CLIENT_ID,
		sub: process.env.NUXT_BOX_ENTERPRISE_ID,
		box_sub_type: 'enterprise',
		aud: authenticationUrl,
		jti: crypto.randomBytes(64).toString('hex'),
		exp: Math.floor(Date.now() / 1000) + 45
	}

	let keyId = process.env.NUXT_BOX_JWT_KEY_ID

	let headers: jwt.SignOptions = {
		algorithm: 'RS512',
		keyid: keyId
	}

	let key: jwt.Secret = {
		key: process.env.NUXT_BOX_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
		passphrase: process.env.NUXT_BOX_PRIVATE_KEY_PASSPHRASE || ''
	}

	let assertion = jwt.sign(claims, key, headers)

	const response: { access_token: string } = await $fetch(authenticationUrl, {
		method: 'POST',
		body: {
			grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
			assertion: assertion,
			client_id: process.env.NUXT_BOX_CLIENT_ID,
			client_secret: process.env.NUXT_BOX_CLIENT_SECRET
		}
	})

	return response
})
