<script lang="ts">
    import AlertCircle from "lucide-svelte/icons/alert-circle";
    import CheckCircle2 from "lucide-svelte/icons/check-circle-2";
    import X from "lucide-svelte/icons/x";
    import { toast } from "@/stores/toast.store";
</script>

{#if $toast.length > 0}
    <div
        class="fixed left-4 top-24 z-[200] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
        aria-live="polite"
        dir="rtl"
    >
        {#each $toast as item (item.id)}
            <div
                class="flex items-start gap-3 rounded-lg border bg-white p-3 text-right shadow-xl shadow-slate-950/10 {item.type ===
                'success'
                    ? 'border-emerald-200'
                    : 'border-red-200'}"
                role="status"
            >
                {#if item.type === "success"}
                    <CheckCircle2 class="mt-0.5 size-5 shrink-0 text-emerald-600" />
                {:else}
                    <AlertCircle class="mt-0.5 size-5 shrink-0 text-red-600" />
                {/if}

                <p class="flex-1 text-sm font-semibold leading-6 text-slate-800">
                    {item.message}
                </p>

                <button
                    type="button"
                    class="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    title="إغلاق"
                    onclick={() => toast.dismiss(item.id)}
                >
                    <X class="size-4" />
                </button>
            </div>
        {/each}
    </div>
{/if}
