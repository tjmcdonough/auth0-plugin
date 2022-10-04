import auth0 from 'auth0-js';

/* wwEditor:start */
import './components/Redirections/SettingsEdit.vue';
import './components/Redirections/SettingsSummary.vue';
import './components/Configuration/SettingsEdit.vue';
import './components/Configuration/SettingsSummary.vue';
import './components/Functions/Login.vue';
/* wwEditor:end */

const ACCESS_COOKIE_NAME = 'auth0_jwt';

export default {
    /*=============================================m_ÔÔ_m=============================================\
        Plugin API
    \================================================================================================*/
    async onLoad() {
        await this.createClient();
        if (!this.auth0_webClient) return;
    },
    /*=============================================m_ÔÔ_m=============================================\
        Auth0 API
    \================================================================================================*/
    auth0_webClient: null,

    async createClient() {
        const { auth0_domain, auth0_clientId, auth0_audienceURL, afterSignInPageId } = this.settings.publicData;
        if (!auth0_domain || !auth0_clientId || !afterSignInPageId) return;
        this.auth0_webClient = await auth0.WebAuth({
            audience: auth0_audienceURL,
            responseType: 'token',
            leeway: 60, // allow for clock skew between devices and server
            scope: 'openid profile email',
            domain: auth0_domain,
            client_id: auth0_clientId,
            redirect_uri: `${window.location.origin}${pagePath}`,
        });
        const defaultLang = wwLib.wwWebsiteData.getInfo().langs.find(lang => lang.default);
        const pagePath = wwLib.wwPageHelper.getPagePath(afterSignInPageId, defaultLang.lang);
        this.client = await createAuth0Client({
            domain: auth0_domain,
            client_id: auth0_clientId,
            redirect_uri: `${window.location.origin}${pagePath}`,
        });
    },
    googleLoginWithRedirect() {
        return this.auth0_webClient.authorize({
            connection: 'google-oauth2',
            connection_scope: '',
        });
    },
};
