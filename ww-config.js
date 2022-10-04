export default {
    editor: {
        settings: [
            {
                label: 'Configuration',
                icon: 'advanced',
                edit: () => import('./src/components/Configuration/SettingsEdit.vue'),
                summary: () => import('./src/components/Configuration/SettingsSummary.vue'),
                getIsValid(settings) {
                    const { auth0_domain, auth0_audienceURL } = settings.publicData;
                    const { auth0_clientId } = settings.privateData;
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
        ],
        // unsure what this is required for
        // designSystemId: 'ec2eebfe-499b-43c4-b260-80ee5a4d9504',
    },
    // variables: [
    //     { name: 'auth0_user', value: 'auth0_user', type: 'object', defaultValue: null },
    //     { name: 'auth0_jwt', value: 'auth0_jwt', type: 'accessToken', defaultValue: null },
    //     { name: 'isAuthenticated', value: 'isAuthenticated', type: 'boolean', defaultValue: false },
    // ],
    actions: [
        {
            name: 'Google Login with Redirect',
            code: 'googleLoginWithRedirect',
        },
    ],
};
