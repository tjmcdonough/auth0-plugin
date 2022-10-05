<template>
    <div class="auth0-settings-edit">
        <wwEditorFormRow required label="Web3 ClientId">
            <wwEditorInputText v-model="settings.publicData.web3_clientId" type="text" placeholder="" large
                @update:modelValue="setClientId" />
        </wwEditorFormRow>
        <wwLoader :loading="isLoading" />
    </div>
</template>

<script>
export default {
    props: {
        settings: { type: Object, required: true },
    },
    emits: ['update:settings'],
    data () {
        return {
            isLoading: false,
            clientId: undefined,
        };
    },
    methods: {
        setClientId (clientId) {
            wwLib.wwLog.log('setting web3 clientId')
            this.$emit('update:settings', {
                ...this.settings,
                publicData: { ...this.settings.publicData, web3_clientId: clientId },
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
