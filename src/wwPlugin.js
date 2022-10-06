/* wwEditor:start */
import './components/Redirections/SettingsEdit.vue';
import './components/Redirections/SettingsSummary.vue';
import './components/Configuration/Auth0SettingsEdit.vue';
import './components/Configuration/Auth0SettingsSummary.vue';
import './components/Configuration/Web3SettingsEdit.vue';
import './components/Configuration/Web3SettingsSummary.vue';
import './components/Functions/Login.vue';
/* wwEditor:end */

import auth0 from 'auth0-js';

import Web3 from 'web3';
import { Web3AuthCore } from '@web3auth/core';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { ADAPTER_STATUS, CHAIN_NAMESPACES } from '@web3auth/base';

const ACCESS_COOKIE_NAME = 'session';

export default {
    /*=============================================m_ÔÔ_m=============================================\
        Plugin API
    \================================================================================================*/
    async onLoad() {
        wwLib.wwLog.error('custom Auth0 plugin loading');
        this.createClient();
        if (!this.auth0_webClient) return;
        await this.checkRedirectHash();
        await this.createWeb3Instance();
    },
    /*=============================================m_ÔÔ_m=============================================\
        Auth0 API
    \================================================================================================*/
    auth0_webClient: null,

    async createClient() {
        const { auth0_domain, auth0_audienceURL, redirectPageId, afterLoginPageId } = this.settings.publicData;
        // TODO - how can we access privateData in a published app?
        // const { auth0_clientId } = this.settings.privateData;
        const { auth0_clientId } = this.settings.publicData;
        if (!auth0_domain || !auth0_clientId || !redirectPageId || !afterLoginPageId) {
            wwLib.wwLog.error(
                `auth0 configuration is not complete - auth0_domain: ${Boolean(
                    auth0_domain
                )}, auth0_clientId: ${Boolean(auth0_clientId)}, redirectPageId: ${Boolean(
                    redirectPageId
                )}, afterLoginPageId: ${Boolean(afterLoginPageId)}`
            );
            return;
        }
        const defaultLang = wwLib.wwWebsiteData.getInfo().langs.find(lang => lang.default);
        const pagePath = wwLib.wwPageHelper.getPagePath(redirectPageId, defaultLang.lang);

        const redirectURI = `${window.location.origin}${pagePath}`;
        wwLib.wwLog.error(`redirectURI path is: ${redirectURI}`);
        try {
            this.auth0_webClient = new auth0.WebAuth({
                audience: auth0_audienceURL,
                clientID: auth0_clientId,
                domain: auth0_domain,
                leeway: 60, // allow for clock skew between devices and server
                redirectUri: redirectURI,
                responseType: 'token',
                scope: 'openid profile email',
            });
        } catch (err) {
            wwLib.wwLog.error(err);
        }
    },
    async checkIsAuthenticated() {
        const isAuthenticated = await this.client.isAuthenticated();
        wwLib.wwVariable.updateValue(`${this.id}-isAuthenticated`, isAuthenticated);
        const accessToken = window.vm.config.globalProperties.$cookie.getCookie(ACCESS_COOKIE_NAME);
        wwLib.wwVariable.updateValue(`${this.id}-auth0_jwt`, accessToken);
        const user = await this.client.getUser();
        wwLib.wwVariable.updateValue(
            `${this.id}-user`,
            user ? JSON.parse(JSON.stringify(user).replace(/https:\/\/auth0.weweb.io\//g, '')) : null
        );
    },
    async checkRedirectHash() {
        try {
            const router = wwLib.manager ? wwLib.getEditorRouter() : wwLib.getFrontRouter();
            await router.isReady();
            const authHash = router.currentRoute.value.hash;
            wwLib.wwLog.error(`got auth hash of ${authHash}`);
            if (authHash) {
                this.auth0_webClient.parseHash({ hash: window.location.hash }, async (err, parsedHash) => {
                    wwLib.wwLog.error(`parseHash, err:${err} parsedHash:${parsedHash}`);
                    if (err) {
                        throw err;
                    } else {
                        await this.setCookieSession(parsedHash.accessToken);
                        this.redirectAfterLogin();
                    }
                });
            }
        } catch (err) {
            wwLib.wwLog.error(err);
        }
    },
    async setCookieSession(jwt) {
        window.vm.config.globalProperties.$cookie.setCookie(ACCESS_COOKIE_NAME, jwt);
        wwLib.wwVariable.updateValue(`${this.id}-auth0_jwt`, jwt);
    },
    redirectAfterLogin() {
        /* wwFront:start */
        const { redirectPageId } = this.settings.publicData;
        const pagePath = wwLib.wwPageHelper.getPagePath(redirectPageId);
        wwLib.goTo(pagePath);
        /* wwFront:end */
        /* wwEditor:start */
        wwLib.goTo(redirectPageId);
        /* wwEditor:end */
    },
    // ACTION ------------
    async googleLoginWithRedirect() {
        if (!this.auth0_webClient) {
            wwLib.wwLog.error('auth0 webclient is not initialised');
        } else
            return this.auth0_webClient.authorize({
                connection: 'google-oauth2',
                connection_scope: '',
            });
    },
    // ACTION ------------
    async logout() {
        const { afterLogoutPageId } = this.settings.publicData;

        const defaultLang = wwLib.wwWebsiteData.getInfo().langs.find(lang => lang.default);
        const pagePath = wwLib.wwPageHelper.getPagePath(afterLogoutPageId, defaultLang.lang);

        const logoutURI = `${window.location.origin}${pagePath}`;
        wwLib.wwLog.error(`logoutURI path is: ${logoutURI}`);

        window.vm.config.globalProperties.$cookie.removeCookie(ACCESS_COOKIE_NAME);

        if (this.web3_client) await this.web3_client.logout().catch(() => {});
        if (this.auth0_webClient)
            this.auth0_webClient.logout({
                returnTo: logoutURI,
            });
    },

    /*=============================================m_ÔÔ_m=============================================\
        Web3 API
    \================================================================================================*/
    web3_client: undefined,
    web3_loginAdapterName: undefined,

    async createWeb3Instance() {
        try {
            // skip if already initialised
            if (!this.web3_client) {
                const { auth0_clientId, web3_clientId } = this.settings.publicData;

                const chainConfig = {
                    chainNamespace: CHAIN_NAMESPACES.EIP155,
                    chainId: '0x1',
                };

                const Web3AuthCoreOptions = {
                    chainConfig,
                    clientId: web3_clientId,
                    enableLogging: true,
                    storageKey: 'local',
                };

                this.web3_client = new Web3AuthCore(Web3AuthCoreOptions);
                const adapter = new OpenloginAdapter({
                    adapterSettings: {
                        network: 'testnet',
                        clientId: web3_clientId,
                        uxMode: 'redirect',
                        loginConfig: {
                            jwt: {
                                name: 'any name',
                                verifier: 'JWT-br-test',
                                typeOfLogin: 'jwt',
                                clientId: auth0_clientId,
                            },
                        },
                    },
                });

                this.web3_client.configureAdapter(adapter);
                this.web3_loginAdapterName = adapter.name;

                await this.web3_client.init();
            }
        } catch (err) {
            wwLib.wwLog.error(err);
        }
    },

    async connectToWallet(jwtToken) {
        try {
            const { auth0_domain } = this.settings.publicData;

            await this.web3_client.init();
            await this.web3_client.connectTo(adapter.name, {
                loginProvider: 'jwt',
                extraLoginOptions: {
                    id_token: jwtToken,
                    verifierIdField: 'sub', // same as your JWT Verifier ID
                    domain: auth0_domain,
                },
            });
        } catch (err) {
            wwLib.wwLog.error(err);
        }
    },
    // ACTION ------------
    async web3_getUserInfo() {
        try {
            return this.web3_client.getUserInfo();
        } catch (err) {
            wwLib.wwLog.error(err);
        }
    },
    // ACTION ------------
    async web3_getBalance() {
        try {
            const web3Provider = web3.provider();

            const web3Instance = new Web3(web3Provider);
            const accounts = await web3Instance.eth.getAccounts();
            const balance = await web3Instance.eth.getBalance(accounts[0]);

            return balance;
        } catch (err) {
            wwLib.wwLog.error(err);
        }
    },
    // ACTION ------------
    async web3_signEthMessage(originalMessage) {
        try {
            const web3Provider = web3.provider();
            const web3 = new Web3();
            web3.setProvider(web3Provider);

            const fromAddress = (await web3.eth.getAccounts())[0];
            const params = [originalMessage, fromAddress];
            const method = 'eth_signTypedData';

            const signedMessage = await web3Provider.request({
                method,
                params,
            });

            return signedMessage;
        } catch (err) {
            wwLib.wwLog.error(err);
        }
    },
    // ACTION ------------
    async web3_sendEth(amount) {
        try {
            const web3Provider = web3.provider();
            const web3 = new Web3();
            web3.setProvider(web3Provider);

            const accounts = await web3.eth.getAccounts();

            const txRes = await web3.eth.sendTransaction({
                from: accounts[0],
                to: accounts[0],
                value: web3.utils.toWei(amount),
            });
            return txRes;
        } catch (err) {
            wwLib.wwLog.error(err);
        }
    },
};
