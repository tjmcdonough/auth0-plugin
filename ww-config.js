export default {
    editor: {
        settings: [
            {
                label: 'Auth0 Configuration',
                icon: 'advanced',
                edit: () => import('./src/components/Configuration/Auth0SettingsEdit.vue'),
                summary: () => import('./src/components/Configuration/Auth0SettingsSummary.vue'),
                getIsValid(settings) {
                    const { auth0_domain, auth0_audienceURL } = settings.publicData;
                    const { auth0_clientId } = settings.publicData;
                    return !!auth0_domain && !!auth0_clientId && !!auth0_audienceURL;
                },
            },
            {
                label: 'Define redirections (URLs)',
                icon: 'open-out',
                edit: () => import('./src/components/Redirections/SettingsEdit.vue'),
                summary: () => import('./src/components/Redirections/SettingsSummary.vue'),
                getIsValid(settings) {
                    const { afterSignInPageId, afterLogoutPageId } = settings.publicData;
                    return !!afterSignInPageId && !!afterLogoutPageId;
                },
            },
            {
                label: 'Web3 Configuration',
                icon: 'advanced',
                edit: () => import('./src/components/Configuration/Web3SettingsEdit.vue'),
                summary: () => import('./src/components/Configuration/Web3SettingsSummary.vue'),
                getIsValid(settings) {
                    const { web3_clientId } = settings.publicData;
                    return !!web3_clientId;
                },
            }
        ],,
    },
    variables: [
        { name: 'auth0_user', value: 'user', type: 'object', defaultValue: null },
        { name: 'auth0_jwt', value: 'token', type: 'accessToken', defaultValue: null },
        { name: 'isAuthenticated', value: 'isAuthenticated', type: 'boolean', defaultValue: false },
    ],
    actions: [
        {
            name: 'Google Login with Redirect',
            code: 'googleLoginWithRedirect',
            isAsync: true
        },
    ],
};
