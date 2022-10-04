<template>
    <div class="auth0-settings-edit">
        <wwEditorFormRow required label="Auth0 Domain">
            <template #append-label>
                <a class="auth0-settings-edit__link" href="https://manage.auth0.com/#/apis" target="_blank">
                    Find it here
                </a>
            </template>
            <wwEditorInputText type="text" name="domain" placeholder="tenant-name.us.auth0.com"
                :model-value="settings.publicData.auth0_domain" large @update:modelValue="setDomain" />
        </wwEditorFormRow>
        <wwEditorFormRow required label="Auth0 ClientId">
            <wwEditorInputText v-model="settings.publicData.auth0_clientId" type="text" placeholder="" large
                @update:modelValue="setClientId" />
        </wwEditorFormRow>
        <wwEditorFormRow required label="Auth0 Audience URL">
            <wwEditorInputText v-model="settings.publicData.auth0_audienceURL" type="text"
                placeholder="https://my.audience.com" large @update:modelValue="setAudienceURL" />
        </wwEditorFormRow>
        <wwEditorFormRow v-if="!isProd">
            <button type="button" class="ww-editor-button -primary -small" @click="setUpApps">
                Set-Up Auth0 applications
            </button>
        </wwEditorFormRow>
        <wwLoader :loading="isLoading" />
    </div>
</template>

<script>
import auth0 from '../../wwPlugin.js';

export default {
    props: {
        settings: { type: Object, required: true },
    },
    emits: ['update:settings'],
    data () {
        return {
            isLoading: false,
            client: undefined,
            clientId: undefined,
            clientName: wwLib.wwWebsiteData.getWebsiteName(),
        };
    },
    computed: {
        isProd () {
            return wwLib.envMode === 'production';
        },
    },
    methods: {
        setDomain (domain) {
            wwLib.wwLog.log('setting domain');
            domain.replace('https://', '').replace('/api/v2/', '');
            this.$emit('update:settings', { ...this.settings, publicData: { ...this.settings.publicData, auth0_domain: domain } });
        },
        setClientId (clientId) {
            wwLib.wwLog.log('setting clientId')
            this.$emit('update:settings', {
                ...this.settings,
                privateData: { ...this.settings.publicData, auth0_clientId: clientId },
            });
        },
        async onClientIdChange () {
            this.isLoading = true;
            try {

                const newClient = await auth0.createClient();
                this.client = newClient;
                wwLib.wwLog.log(newClient);
            } catch (err) {
                wwLib.wwNotification.open({ text: 'Make sure the domain and token are correct.', color: 'red' });
                wwLib.wwLog.error(err);
            }
            this.isLoading = false;
        },
        setAudienceURL (audienceURL) {
            this.$emit('update:settings', {
                ...this.settings,
                publicData: { ...this.settings.publicData, auth0_audienceURL: audienceURL },
            });
        }
    },
};
</script>

<style lang="scss" scoped>
.auth0-settings-edit {
    display: flex;
    flex-direction: column;

    &__link {
        color: var(--ww-color-blue-500);
        margin-left: var(--ww-spacing-02);
    }

    &__row {
        display: flex;
        align-items: center;
    }

    &__radio-label {
        margin-left: var(--ww-spacing-02);
    }
}
</style>
