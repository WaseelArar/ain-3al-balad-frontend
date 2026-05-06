<script lang="ts">
    import { setUser, user } from "@/stores/auth.store";
    import { issueStore } from "@/stores/issues.store";
    import apiInstance from "$lib/api/api";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import {
        User as UserIcon,
        Phone,
        ShieldCheck,
        History,
        ChevronLeft,
        MapPin,
        Loader2,
        ChevronRight,
        Map as MapIcon,
    } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import { onMount, onDestroy } from "svelte";

    type RegionSummary = {
        regionsId: number;
        name: string;
        imageUrl?: string;
    };

    onMount(async () => {
        if (!$user) {
            goto("/auth/login");
            return;
        }

        if ($user.regionsId && !$user.regionsImage) {
            try {
                const response = await apiInstance.get<RegionSummary[]>("/regions");
                const region = response.data.find(
                    (item) => item.regionsId === $user?.regionsId,
                );

                if (region && $user) {
                    setUser({
                        ...$user,
                        regionsName: $user.regionsName || region.name,
                        regionsImage: region.imageUrl || $user.regionsImage,
                    });
                }
            } catch {
                // Keep profile usable even if the region image cannot be loaded.
            }
        }

        issueStore.setUsersId($user.usersId);
    });

    onDestroy(() => {
        issueStore.setUsersId(undefined);
    });

    const roleConfig: Record<
        string,
        { label: string; color: string; icon: any }
    > = {
        ADMIN: {
            label: "مدير النظام",
            color: "text-purple-700 bg-purple-50 border-purple-200",
            icon: ShieldCheck,
        },
        MUNICIPAL: {
            label: "مشرف البلدية",
            color: "text-blue-700 bg-blue-50 border-blue-200",
            icon: ShieldCheck,
        },
        USER: {
            label: "مواطن",
            color: "text-slate-600 bg-slate-50 border-slate-200",
            icon: UserIcon,
        },
    };

    let items = $derived($issueStore.items);
    let meta = $derived($issueStore.meta);
    let loading = $derived($issueStore.loading);

    // صورة الخلفية للمنطقة
    let regionImage = $derived($user?.regionsImage ?? null);
</script>

<!--
  خلفية المنطقة: صورة المعلم التاريخي للمدينة/القرية/المخيم
  تظهر في أعلى الصفحة كـ hero section
-->
{#if regionImage}
    <div class="relative -mt-20 mb-0 h-52 w-full overflow-hidden bg-slate-100 sm:h-64 lg:h-72">
        <img
            src={regionImage}
            alt={$user?.regionsName}
            class="h-full w-full object-cover object-center"
        />
        <!-- طبقة التلاشي من الأسفل -->
        <div class="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-white"></div>
        <!-- اسم المنطقة والمعلم -->
        <div class="absolute bottom-4 right-6 text-right">
            <p class="text-white/70 text-xs font-medium tracking-wider uppercase">
                {$user?.regionsName}
            </p>
        </div>
    </div>
{/if}

<div class="container mx-auto max-w-2xl p-6 pb-24 {regionImage ? '-mt-8' : ''}" dir="rtl">
    {#if $user}
        {@const RoleIcon = roleConfig[$user.role]?.icon || UserIcon}

        <div class="p-8 flex flex-col items-center text-center {regionImage ? 'pt-4' : ''}">
            <div
                class="size-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 border-4 border-white shadow-sm"
            >
                <RoleIcon class="size-12 text-primary" />
            </div>

            <h1 class="text-2xl font-bold text-slate-900">
                {$user.username}
            </h1>

            <Badge
                variant="outline"
                class="mt-3 px-6 py-1.5 rounded-full border shadow-sm font-bold {roleConfig[
                    $user.role
                ]?.color || roleConfig.USER.color}"
            >
                {roleConfig[$user.role]?.label || "مواطن"}
            </Badge>
        </div>

        <div
            class="bg-white/50 p-6 space-y-4 rounded-3xl mb-8 border border-slate-100 shadow-sm"
        >
            <div class="flex items-center gap-4 text-slate-600">
                <Phone class="size-5 text-slate-400" />
                <span class="font-medium">رقم الهاتف:</span>
                <span dir="ltr" class="text-slate-900">{$user.phone}</span>
            </div>

            <div class="flex items-center gap-4 text-slate-600">
                <MapIcon class="size-5 text-slate-400" />
                <span class="font-medium">المنطقة السكنية:</span>
                <span class="text-slate-900"
                    >{$user.regionsName || "غير محددة"}</span
                >
            </div>

            <!-- معاينة صغيرة لصورة المنطقة في البروفايل -->
            {#if regionImage}
                <div class="flex items-start gap-4 text-slate-600">
                    <MapPin class="size-5 text-slate-400 mt-1 flex-shrink-0" />
                    <div class="flex-1">
                        <span class="font-medium block mb-2">المعلم التاريخي:</span>
                        <div class="relative aspect-[16/7] max-h-40 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                            <img
                                src={regionImage}
                                alt={$user.regionsName}
                                class="h-full w-full object-cover object-center"
                            />
                            <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-2">
                                <span class="text-white text-xs">{$user.regionsName}</span>
                            </div>
                        </div>
                    </div>
                </div>
            {/if}

            <div class="flex items-center gap-4 text-slate-600">
                <ShieldCheck class="size-5 text-slate-400" />
                <span class="font-medium">رقم العضوية:</span>
                <span class="text-slate-900 text-sm font-mono"
                    >#{$user.usersId}</span
                >
            </div>
        </div>

        <div class="space-y-4">
            <div class="flex items-center justify-between px-2">
                <h2 class="text-lg font-bold flex items-center gap-2">
                    <History class="size-5 text-primary" />
                    بلاغاتي السابقة
                </h2>
                <Badge variant="outline" class="rounded-lg">{meta.total}</Badge>
            </div>

            {#if loading && items.length === 0}
                <div class="flex justify-center py-12">
                    <Loader2 class="animate-spin text-primary" />
                </div>
            {:else if items.length > 0}
                <div class="grid gap-3">
                    {#each items as issue}
                        <button
                            onclick={() =>
                                goto(
                                    `/issue/selected?issuesId=${issue.issuesId}`,
                                )}
                            class="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-primary/30 transition-all text-right shadow-sm group"
                        >
                            <div class="flex items-center gap-4">
                                <div
                                    class="size-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors"
                                >
                                    <MapPin
                                        class="size-5 text-slate-500 group-hover:text-primary"
                                    />
                                </div>
                                <div>
                                    <p
                                        class="font-bold text-slate-800 line-clamp-1"
                                    >
                                        {issue.description}
                                    </p>
                                    <p class="text-xs text-slate-400">
                                        {new Date(
                                            issue.date,
                                        ).toLocaleDateString("ar-EG")}
                                    </p>
                                </div>
                            </div>
                            <Badge
                                variant={issue.solved ? "default" : "secondary"}
                            >
                                {issue.solved ? "مكتمل" : "قيد المعالجة"}
                            </Badge>
                        </button>
                    {/each}
                </div>

                <div class="flex items-center justify-center gap-4 mt-8">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={meta.page === 1}
                        onclick={issueStore.prevPage}
                        class="rounded-xl"
                    >
                        <ChevronRight class="ml-2 size-4" /> السابق
                    </Button>
                    <span class="text-sm font-medium text-slate-500">
                        صفحة {meta.page} من {meta.totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={meta.page === meta.totalPages}
                        onclick={issueStore.nextPage}
                        class="rounded-xl"
                    >
                        التالي <ChevronLeft class="mr-2 size-4" />
                    </Button>
                </div>
            {:else}
                <div
                    class="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200"
                >
                    <p class="text-slate-400 text-sm">
                        لم تقم بتقديم أي بلاغات بعد
                    </p>
                    <Button variant="link" onclick={() => goto("/issue/new")}
                        >قدّم بلاغك الأول الآن</Button
                    >
                </div>
            {/if}
        </div>
    {/if}
</div>
