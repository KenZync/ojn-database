import BoxSDK from 'box-node-sdk'

export const boxClient = () => {
	const sdk = new BoxSDK({
		clientID: process.env.NUXT_BOX_CLIENT_ID || '',
		clientSecret: process.env.NUXT_BOX_CLIENT_SCRET || '',
		appAuth: {
			keyID: process.env.NUXT_BOX_JWT_KEY_ID || '',
			privateKey: process.env.NUXT_BOX_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
			passphrase: process.env.NUXT_BOX_PRIVATE_KEY_PASSPHRASE || ''
		}
	})

	return sdk.getAppAuthClient('enterprise', process.env.NUXT_BOX_ENTERPRISE_ID)
}
