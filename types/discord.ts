export interface Discord {
	id: string
	aud: string
	role: string
	email: string
	email_confirmed_at: Date
	phone: string
	confirmed_at: Date
	last_sign_in_at: Date
	app_metadata: AppMetadata
	user_metadata: IdentityData
	identities: Identity[]
	created_at: Date
	updated_at: Date
	is_anonymous: boolean
}

export interface AppMetadata {
	provider: string
	providers: string[]
}

export interface Identity {
	identity_id: string
	id: string
	user_id: string
	identity_data: IdentityData
	provider: string
	last_sign_in_at: Date
	created_at: Date
	updated_at: Date
	email: string
}

export interface IdentityData {
	avatar_url: string
	custom_claims: CustomClaims
	email: string
	email_verified: boolean
	full_name: string
	iss: string
	name: string
	phone_verified: boolean
	picture: string
	provider_id: string
	sub: string
}

export interface CustomClaims {
	global_name: string
}
