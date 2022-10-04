/* wwEditor:start */
import './components/Redirections/SettingsEdit.vue';
import './components/Redirections/SettingsSummary.vue';
import './components/Configuration/SettingsEdit.vue';
import './components/Configuration/SettingsSummary.vue';
import './components/Functions/Login.vue';
/* wwEditor:end */

import auth0 from 'auth0-js';

const ACCESS_COOKIE_NAME = 'auth0_jwt';

export default {
    /*=============================================m_ÔÔ_m=============================================\
        Plugin API
    \================================================================================================*/
    async onLoad() {
        wwLib.wwLog.error('custom Auth0 plugin loading');
        this.createClient();
        if (!this.auth0_webClient) return;
    },
    /*=============================================m_ÔÔ_m=============================================\
        Auth0 API
    \================================================================================================*/
    auth0_webClient: null,

    async createClient() {
        const { auth0_domain, auth0_audienceURL, afterSignInPageId } = this.settings.publicData;
        // TODO - how can we access privateData in a published app?
        // const { auth0_clientId } = this.settings.privateData;
        const { auth0_clientId } = this.settings.publicData;
        if (!auth0_domain || !auth0_clientId || !afterSignInPageId) {
            wwLib.wwLog.error(`auth0 configuration is not complete - auth0_domain: ${Boolean(auth0_domain)}, auth0_clientId: ${Boolean(auth0_clientId)}, afterSignInPageId: ${Boolean(afterSignInPageId)}`);
            return;
        }
        const defaultLang = wwLib.wwWebsiteData.getInfo().langs.find(lang => lang.default);
        const pagePath = wwLib.wwPageHelper.getPagePath(afterSignInPageId, defaultLang.lang);

        const redirectURI = `${window.location.origin}${pagePath}`;
        wwLib.wwLog.error(`redirectURI path is: ${redirectURI}`)
        try {
            this.auth0_webClient = new auth0.WebAuth({
                audience: auth0_audienceURL,
                clientID: auth0_clientId,
                domain: auth0_domain,
                leeway: 60, // allow for clock skew between devices and server
                redirect_uri: redirectURI,
                responseType: 'token',
                scope: 'openid profile email',
            });
        } catch (err) {
            wwLib.wwLog.error(err);
        }
    },
    async googleLoginWithRedirect() {
        if (!this.auth0_webClient) {
            wwLib.wwLog.error('auth0 webclient is not initialised');
        }
        else return this.auth0_webClient.authorize({
            connection: 'google-oauth2',
            connection_scope: '',
        });
    },
};
