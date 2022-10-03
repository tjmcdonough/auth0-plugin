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
        if (!this.client) return;
        await this.checkRedirectCallback();
    },
    /*=============================================m_ÔÔ_m=============================================\
        Auth0 API
    \================================================================================================*/
    client: null,
    async createClient() {
        const { auth0_domain, auth0_clientId, auth0_audienceURL, afterSignInPageId } = this.settings.publicData;
        if (!auth0_domain || !auth0_clientId || !afterSignInPageId) return;

        /* wwEditor:start */
        const website = wwLib.wwWebsiteData.getInfo();
        const page = wwLib.wwWebsiteData.getPages().find(page => page.id === afterSignInPageId);
        const isHomePage = page && page.id === website.homePageId;
        const redirectUriEditor =
            page && !isHomePage
                ? `${window.location.origin}/${website.id}/${page.id}`
                : `${window.location.origin}/${website.id}/`;
        this.auth0_webClient = await auth0.WebAuth({
            audience: auth0_audienceURL,
            responseType: 'token',
            leeway: 60, // allow for clock skew between devices and server
            scope: 'openid profile email',
            domain: customDomain || domain,
            client_id: auth0_clientId,
            redirect_uri: redirectUriEditor,
        });
        /* wwEditor:end */

        /* wwFront:start */
        
        const defaultLang = wwLib.wwWebsiteData.getInfo().langs.find(lang => lang.default);
        const pagePath = wwLib.wwPageHelper.getPagePath(afterSignInPageId, defaultLang.lang);
        this.client = await createAuth0Client({
            domain: auth0_domain,
            client_id: auth0_clientId,
            redirect_uri: `${window.location.origin}${pagePath}`,
        });
        /* wwFront:end */
    },
    async checkRedirectCallback() {
        try {
            const router = wwLib.manager ? wwLib.getEditorRouter() : wwLib.getFrontRouter();
            await router.isReady();
            const { code, state } = router.currentRoute.value.query;
            if (code && state) {
                await this.client.handleRedirectCallback();
                await this.setCookieSession();
                this.redirectAfterSignIn();
            }
        } catch (err) {
            wwLib.wwLog.error(err);
        }
    },
    googleLoginWithRedirect() {
        /* wwFront:start */
        return this.client.authorize({
            connection: 'google-oauth2',
            connection_scope: '',
        });
        /* wwEditor:end */
    },
    async setCookieSession(token = null) {
        const sessionToken = token || (await this.client.getTokenSilently());
        window.vm.config.globalProperties.$cookie.setCookie(ACCESS_COOKIE_NAME, sessionToken);
        wwLib.wwVariable.updateValue(`${this.id}-accessToken`, sessionToken);
    },
    redirectAfterSignIn() {
        /* wwFront:start */
        const pagePath = wwLib.wwPageHelper.getPagePath(this.settings.publicData.afterSignInPageId);
        wwLib.goTo(pagePath);
        /* wwFront:end */
        /* wwEditor:start */
        wwLib.goTo(this.settings.publicData.afterSignInPageId);
        /* wwEditor:end */
    },
    logout() {
        this.removeCookieSession();
        /* wwEditor:start */
        const website = wwLib.wwWebsiteData.getInfo();
        const homePageId = website.homePageId;
        const page = wwLib.wwWebsiteData
            .getPages()
            .find(page => page.id === this.settings.publicData.afterLogoutPageId);

        this.client.logout({
            returnTo: `${window.location.origin}/${website.id}/${page.id === homePageId ? '' : page.id}`,
        });
        /* wwEditor:end */
        /* wwFront:start */
        const pagePath = wwLib.wwPageHelper.getPagePath(this.settings.publicData.afterLogoutPageId);
        return this.client.logout({ returnTo: `${window.location.origin}${pagePath}` });
        /* wwFront:end */
    },
    removeCookieSession() {
        window.vm.config.globalProperties.$cookie.removeCookie(ACCESS_COOKIE_NAME);
        wwLib.wwVariable.updateValue(`${this.id}-accessToken`, null);
    },
};
