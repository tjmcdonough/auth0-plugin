<template>
    <div class="web3-settings-summary">
        <wwEditorFormRow label="Client ID">
            <div class="web3-settings-summary__elem">
                <div>
                    <wwEditorIcon large name="bitcoin" class="web3-settings-summary__icon" />
                </div>
                <span class="web3-settings-summary__value caption-m">
                    {{ settings.publicData.web3_clientId }}
                </span>
            </div>
        </wwEditorFormRow>
        <wwEditorFormRow label="Verifier Name">
            <div class="web3-settings-summary__elem">
                <div>
                    <wwEditorIcon large name="bitcoin" class="web3-settings-summary__icon" />
                </div>
                <span class="web3-settings-summary__value caption-m">
                    {{ settings.publicData.web3_verifierName }}
                </span>
            </div>
        </wwEditorFormRow>
    </div>
</template>

<script>
export default {
    props: {
        settings: { type: Object, required: true },
    },
};
</script>

<style lang="scss" scoped>
.web3-settings-summary {
    &__elem {
        display: flex;
        align-items: center;

        &:not(:last-child) {
            margin-bottom: var(--ww-spacing-02);
        }
    }

    &__icon {
        margin-right: var(--ww-spacing-02);
    }

    &__value {
        overflow: hidden;
        text-overflow: ellipsis;
    }
}
</style>
