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
                    const { redirectPageId, afterLoginPageId, afterLogoutPageId } = settings.publicData;
                    return !!redirectPageId && !!afterLoginPageId && !!afterLogoutPageId;
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
            },
        ],
    },
    variables: [
        { name: 'auth0_user', value: 'user', type: 'object', defaultValue: null },
        { name: 'auth0_jwt', value: 'token', type: 'accessToken', defaultValue: null },
        { name: 'isAuthenticated', value: 'isAuthenticated', type: 'boolean', defaultValue: false },
    ],
    actions: [
        /**
         * Auth0 actions
         */
        {
            name: 'Google Login with Redirect',
            code: 'googleLoginWithRedirect',
            isAsync: true,
        },
        {
            name: 'Logout',
            code: 'logout',
            isAsync: true,
        },
        /**
         * web3 actions
         */
        {
            name: 'Web3 - Get Web3 User Info',
            code: 'web3_getUserInfo',
            isAsync: true,
        },
        {
            name: 'Web3 - Get Balance',
            code: 'web3_getBalance',
            isAsync: true,
        },
        {
            name: 'Web3 - Sign Eth Message',
            code: 'web3_signEthMessage',
            isAsync: true,
        },
        {
            name: 'Web3 - Send Eth',
            code: 'web3_sendEth',
            isAsync: true,
        },
    ],
};
