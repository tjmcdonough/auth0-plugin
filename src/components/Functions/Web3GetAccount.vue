<template>
    <wwEditorFormRow label="Web 3" required>
        <wwEditorInputRow label="Web3 Instance" required type="query" :model-value="web3Instance" bindable
            @update:modelValue="setWeb3Instance" />
    </wwEditorFormRow>
</template>

<script>
export default {
    props: {
        plugin: { type: Object, required: true },
        args: {
            type: Object,
            default: () => ({
                web3Instance: null,
            }),
        },
    },
    emits: ['update:args'],
    data () {
        return {
        };
    },
    computed: {
        web3Instance () {
            return this.args.web3Instance;
        },
    },
    methods: {
        setWeb3Instance (web3Instance) {
            this.$emit('update:args', { ...this.args, web3Instance });
        },
    },
};
</script>