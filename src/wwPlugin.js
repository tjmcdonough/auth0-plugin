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
import Axios from 'axios';

import torusUtils from '@toruslabs/torus.js';
import * as openLoginSubKey from '@toruslabs/openlogin-subkey';
import fetchNodeDetails from '@toruslabs/fetch-node-details';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';

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
        await this.checkIsAuthenticated();
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

        const redirectURI = `${window.location.origin}${pagePath}/?`;
        wwLib.wwLog.error(`redirectURI path is: ${redirectURI}`);
        console.log('auth0_audienceURL: ' + auth0_audienceURL);
        try {
            this.auth0_webClient = new auth0.WebAuth({
                // audience: auth0_audienceURL,
                clientID: auth0_clientId,
                domain: auth0_domain,
                leeway: 60, // allow for clock skew between devices and server
                redirectUri: redirectURI,
                responseType: 'id_token',
                scope: 'openid',
            });
        } catch (err) {
            wwLib.wwLog.error(err);
        }
    },
    async checkIsAuthenticated() {
        try {
            // set auth0 vars
            this.setAuthVars();
            // connect to web3
            await this.web3_connectToWallet();
            const accounts = await this.web3_getWalletAddress();
            wwLib.wwVariable.updateValue(`${this.id}-web3_accounts`, accounts);
        } catch (err) {
            wwLib.wwLog.error(`could not check authenticated user - ${err}`);
        }
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
                        this.setCookieSession(parsedHash.idToken);
                        this.loginToAcmeBackend(parsedHash.idToken);
                        this.redirectAfterLogin();
                    }
                });
            }
        } catch (err) {
            wwLib.wwLog.error(err);
        }
    },
    setCookieSession(jwt) {
        window.vm.config.globalProperties.$cookie.setCookie(ACCESS_COOKIE_NAME, jwt);
        wwLib.wwVariable.updateValue(`${this.id}-auth0_jwt`, jwt);
    },
    setAuthVars() {
        const idToken = window.vm.config.globalProperties.$cookie.getCookie(ACCESS_COOKIE_NAME);
        wwLib.wwVariable.updateValue(`${this.id}-auth0_jwt`, idToken);
        this.auth0_webClient.client.userInfo(idToken, (err, userProfile) => {
            if (err) {
                wwLib.wwLog.error(err);
            } else {
                wwLib.wwVariable.updateValue(`${this.id}-auth0_user`, userProfile);
            }
        });
    },
    redirectAfterLogin() {
        /* wwFront:start */
        const { afterLoginPageId } = this.settings.publicData;
        const pagePath = wwLib.wwPageHelper.getPagePath(afterLoginPageId);
        wwLib.goTo(pagePath);
        /* wwFront:end */
        /* wwEditor:start */
        wwLib.goTo(afterLoginPageId);
        /* wwEditor:end */
    },
    loginToAcmeBackend(jwt) {
        const headers = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: 'Bearer ' + jwt,
        };

        const serverUrl = 'https://dev.acmedao.com';

        Axios.post(`${serverUrl}/user/login`, {}, { headers })
            .then(response => {
                console.log('Successfully logged in using auth0');
            })
            .catch(error => {
                console.log('Failed to log in ' + error);
            });
    },
    // ACTION ------------
    async googleLoginWithRedirect() {
        return this.socialLoginWithRedirect('google-oauth2');
    },
    // ACTION ------------
    async appleLoginWithRedirect() {
        return this.socialLoginWithRedirect('apple');
    },
    // ACTION ------------
    async facebookLoginWithRedirect() {
        return this.socialLoginWithRedirect('facebook');
    },
    // ACTION ------------
    async socialLoginWithRedirect(socialConnection) {
        if (!this.auth0_webClient) {
            wwLib.wwLog.error('auth0 webclient is not initialised');
        } else
            return this.auth0_webClient.authorize({
                connection: socialConnection,
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

        if (this.web3_client) {
            await this.web3_client.logout().catch(() => {});
        }
        if (this.auth0_webClient) {
            this.auth0_webClient.logout({
                returnTo: logoutURI,
            });
        }
    },

    /*=============================================m_ÔÔ_m=============================================\
        Web3 API
    \================================================================================================*/
    web3_client: undefined,
    web3_loginAdapterName: undefined,
    web3_provider: undefined,

    async web3_connectToWallet() {
        try {
            const idToken = window.vm.config.globalProperties.$cookie.getCookie(ACCESS_COOKIE_NAME);
            const { web3_clientId, web3_verifierName } = this.settings.publicData;

            console.log('begin connect to wallet');
            // begin web3 self host

            const torus = new torusUtils({
                enableOneKey: true,
                network: 'https://polygon-mainnet.infura.io/v3/6b555ca82a3c440bb8cef518001c94c6',
                allowHost: 'https://signer-polygon.tor.us/api/allow',
                signerHost: 'https://signer-polygon.tor.us/api/sign',
            });

            // Initializing the NodeDetailManager instance for Ropsten Testnet
            // NOTE: change proxyAddress to `NodeDetailManager.PROXY_ADDRESS_MAINNET` when you switch to production
            const nodeDetailManager = new fetchNodeDetails({
                network: 'https://polygon-mainnet.infura.io/v3/6b555ca82a3c440bb8cef518001c94c6',
                proxyAddress: fetchNodeDetails.PROXY_ADDRESS_CYAN,
            });

            const chainConfig = {
                chainId: '0x1',
                rpcTarget: 'https://rpc.ankr.com/eth',
            };

            const parsedJWT = parseJwt(idToken);
            console.log('JWT parsed:', parsedJWT);
            const verifierId = parsedJWT.sub;
            console.log('Verifier ID:', verifierId);
            const { torusNodeEndpoints, torusNodePub, torusIndexes } = await nodeDetailManager.getNodeDetails({
                verifier: web3_verifierName,
                verifierId,
            });
            const userDetails = await torus.getUserTypeAndAddress(
                torusNodeEndpoints,
                torusNodePub,
                { verifier: web3_verifierName, verifierId },
                true
            );
            // Now we check if the user has enabled mfa or not.
            // if !userDetails.upgraded then mfa is not enabled.
            console.log(userDetails);
            const mfaEnabled = !(userDetails.typeOfUser === 'v2' && !userDetails.upgraded);
            console.log('Is MFA enabled: ', mfaEnabled);

            if (mfaEnabled == false) {
                console.log('if mfa disabled');
                // torus is initialized in code snippet above
                // if YES, login directly with the torus libraries within your app
                const keyDetails = await torus.retrieveShares(
                    torusNodeEndpoints,
                    torusIndexes,
                    web3_verifierName,
                    { verifier_id: verifierId },
                    idToken,
                    {}
                );
                // use the private key to get the provider

                const finalPrivKey = openLoginSubKey
                    .subkey(keyDetails.privKey.padStart(64, '0'), Buffer.from(web3_clientId, 'base64'))
                    .padStart(64, '0');
                console.log(finalPrivKey);
                const ethereumPrivateKeyProvider = new EthereumPrivateKeyProvider({
                    config: {
                        chainConfig,
                    },
                });
                await ethereumPrivateKeyProvider.setupProvider(finalPrivKey);
                console.log('eth provider: ', ethereumPrivateKeyProvider.provider);
                if (ethereumPrivateKeyProvider.provider) {
                    const web3 = new Web3(ethereumPrivateKeyProvider.provider);
                    this.web3_client = web3;
                    return web3;
                } else {
                    return null;
                }
            }
            return null;
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
    async web3_getWalletAddress() {
        console.log('Getting Wallet...');
        const accounts = await this.web3_client.eth.getAccounts();
        console.log('Wallets: ', JSON.stringify(accounts));

        return accounts;
    },

    async web3_getBalance() {
        try {
            console.log('Getting Wallet Balance...');
            const balance = await this.web3_client.eth.getBalance(accounts[0]);
            console.log('Balance: ', balance);
            return balance;
        } catch (err) {
            wwLib.wwLog.error(err);
        }
    },
    // ACTION ------------
    async web3_signEthMessage(originalMessage) {
        try {
            console.log('Signing Message...');
            const fromAddress = (await this.web3_client.eth.getAccounts())[0];
            const method = 'eth_signTypedData';
            const params = [originalMessage, fromAddress];

            const signedMessage = await this.web3_client.request({
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
            console.log('Sending Eth...');
            const accounts = await this.web3_client.eth.getAccounts();

            const txRes = await this.web3_client.eth.sendTransaction({
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

function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(
        window
            .atob(base64)
            .split('')
            .map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join('')
    );

    return JSON.parse(jsonPayload);
}
