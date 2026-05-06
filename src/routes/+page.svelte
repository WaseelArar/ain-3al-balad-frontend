<script lang="ts">
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import BellRing from "lucide-svelte/icons/bell-ring";
    import ClipboardList from "lucide-svelte/icons/clipboard-list";
    import Landmark from "lucide-svelte/icons/landmark";
    import ListChecks from "lucide-svelte/icons/list-checks";
    import MapPinned from "lucide-svelte/icons/map-pinned";
    import Megaphone from "lucide-svelte/icons/megaphone";
    import Sparkles from "lucide-svelte/icons/sparkles";
    import apiInstance from "$lib/api/api";
    import fallbackLandmark from "$lib/assets/ain-al-balad-landscape.png";
    import { setUser, user } from "@/stores/auth.store";

    type RegionSummary = {
        regionsId: number;
        name: string;
        imageUrl?: string;
    };

    let landmarkImageError = $state(false);
    let lastLandmarkImage = $state<string | undefined>(undefined);

    const features = [
        {
            title: "تقديم البلاغات",
            description:
                "ارفع شكواك بخصوص الطرق، النظافة، أو الإنارة في ثوان معدودة مع تفاصيل واضحة.",
            icon: ClipboardList,
        },
        {
            title: "تحديد الموقع الذكي",
            description:
                "نستخدم خرائط دقيقة لضمان وصول فرق الصيانة للمكان الصحيح فوراً.",
            icon: MapPinned,
        },
        {
            title: "متابعة مباشرة",
            description:
                'تتبع حالة طلبك من "قيد المراجعة" إلى "تم التنفيذ" لحظة بلحظة.',
            icon: BellRing,
        },
    ];

    const landmark = $derived({
        name: $user?.regionsName || "عين ع البلد",
        image:
            $user?.regionsImage && !landmarkImageError
                ? $user.regionsImage
                : fallbackLandmark,
        subtitle: $user?.regionsName
            ? "معلم منطقتك الأثري"
            : "معلم بلدك يظهر بعد اختيار منطقتك",
    });

    $effect(() => {
        const nextImage = $user?.regionsImage;
        if (nextImage !== lastLandmarkImage) {
            lastLandmarkImage = nextImage;
            landmarkImageError = false;
        }
    });

    onMount(async () => {
        const currentUser = $user;
        if (!currentUser?.regionsId || currentUser.regionsImage) return;

        try {
            const response = await apiInstance.get<RegionSummary[]>("/regions");
            const region = response.data.find(
                (item) => item.regionsId === currentUser.regionsId,
            );

            if (!region) return;

            setUser({
                ...currentUser,
                regionsName: currentUser.regionsName || region.name,
                regionsImage: region.imageUrl || currentUser.regionsImage,
            });
        } catch {
            // الصفحة الرئيسية تبقى قابلة للاستخدام حتى لو لم يعمل الخادم.
        }
    });
</script>

<div
    class="min-h-screen bg-white text-slate-950 font-sans selection:bg-slate-900 selection:text-white"
    dir="rtl"
>
    {#if $user}
    <section class="relative -mt-20 h-56 w-full overflow-hidden bg-slate-100 md:h-72">
        <img
            src={landmark.image}
            alt={landmark.subtitle}
            class="h-full w-full object-cover object-center"
            onerror={() => {
                landmarkImageError = true;
            }}
        />
        <div class="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-white"></div>
        <div class="absolute bottom-4 right-6 text-right">
            <p class="text-white/80 text-xs font-bold tracking-normal">
                {landmark.name}
            </p>
        </div>
    </section>
    {/if}

    <header class="relative overflow-hidden bg-white pt-18 pb-20">
        <div class="container mx-auto px-6 relative z-10">
            <div class="mx-auto max-w-3xl text-center">
                <div
                    class="mb-8 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-900 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm"
                >
                    <Sparkles class="ml-2 size-4" />
                    نظام البلاغات والخدمات البلدية المتكامل
                </div>
                <h1
                    class="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]"
                >
                    عينك على بلدك،
                    <span class="block text-slate-400 font-medium"
                        >وصوتك واصل للبلدية.</span
                    >
                </h1>
                <p
                    class="mx-auto max-w-2xl text-lg text-slate-600 mb-10 leading-relaxed"
                >
                    منصة رقمية موحدة تمنح المواطن دوراً ريادياً في تطوير الخدمات
                    البلدية. أبلغ عن أي خلل، تابع التقدم، وساهم في جعل بلدك
                    أجمل.
                </p>
                <div class="flex flex-col sm:flex-row justify-center gap-4">
                    <button
                        onclick={() => goto("issue/new")}
                        class="inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-slate-900 px-10 text-base font-bold text-slate-50 shadow-lg shadow-slate-200 transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl"
                    >
                        <Megaphone class="size-5" />
                        تقديم بلاغ الآن
                    </button>
                    <button
                        onclick={() => goto("issue/feed")}
                        class="inline-flex h-14 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-10 text-base font-bold text-slate-900 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md"
                    >
                        <ListChecks class="size-5" />
                        تصفح الشكاوى
                    </button>
                </div>
            </div>
        </div>

        <div
            class="absolute top-0 right-0 -z-10 w-1/2 h-full opacity-[0.03] pointer-events-none"
        >
            <svg viewBox="0 0 400 400" class="w-full h-full fill-slate-950">
                <path
                    d="m158.72 176.05l-0.14 0.14q0.54-0.54 0.54-1.34 0-1.61-1.88-1.61-0.67 0-1.87 0.4-7.51 1.88-16.75 3.49-9.11 1.6-18.36 1.6-0.54 0-0.8 0-0.14 0-0.81 0-23.45 0-35.51-13.53-0.67-0.8-1.2-1.88-0.54-1.2-0.54-2.54 0-2.28 1.21-4.83 3.35-7.1 8.97-13.66 5.63-6.57 11.39-11.66v0.13l4.02-3.75q1.34-1.21 2.55-2.28 1.21-1.2 2.41-2.14 0.94-0.81 2.01-1.61 1.07-0.94 2.15-1.88 3.08-2.41 6.56-5.09 3.49-2.81 4.96-6.56l5.9-15.01q0.26-0.94-0.27-1.48-0.54-0.67-1.34-0.67-0.4 0-0.94 0.54-2.95 2.81-6.3 5.09-3.35 2.28-7.23 4.29v-0.13q-1.75 0.8-3.35 1.34-1.48 0.4-2.68 0.4-2.55 0-4.43-1.61-2.81-2.41-4.28-4.56-1.48-2.14-2.28-5.89 5.36 0.8 11.12 2.41 1.47 0.4 2.01-0.94l5.36-16.88q0.27-0.81-0.13-1.34-0.27-0.54-0.94-0.67l-2.55-0.54q-2.54-0.67-5.09-1.07-2.41-0.54-5.36-0.67-4.29 0-7.37 2.55-2.95 2.54-4.82 6.29-1.88 3.62-2.82 7.37-0.94 3.89-0.94 8.18 0 6.43 1.61 10.99 1.74 4.55 4.69 8.17 0.67 0.94 1.34 1.74 0.67 0.81 1.21 1.61-5.76 4.96-10.59 11.79-4.69 6.84-8.44 14.47-2.55 5.5-4.69 11.93-2.14 6.3-2.14 13.4 0 5.9 1.47 10.59 1.61 4.69 4.15 8.17 4.29 5.63 12.2 8.84 8.04 3.22 17.02 3.22 10.72 0 20.63-3.22 10.05-3.35 18.23-8.57 8.17-5.36 13.13-11.53z"
                />
            </svg>
        </div>
    </header>

    <section id="features" class="py-24 bg-slate-50/50">
        <div class="container mx-auto px-6">
            <div class="grid md:grid-cols-3 gap-8">
                {#each features as feature}
                    <div
                        class="group relative rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
                    >
                        <div
                            class="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-900 transition-colors group-hover:bg-slate-900 group-hover:text-white"
                        >
                            <feature.icon class="size-6" />
                        </div>
                        <h3 class="text-xl font-bold mb-3">{feature.title}</h3>
                        <p class="text-slate-600 leading-relaxed text-sm">
                            {feature.description}
                        </p>
                    </div>
                {/each}
            </div>
        </div>
    </section>

    <section class="py-24">
        <div class="container mx-auto px-6 text-center">
            <div
                class="bg-slate-900 rounded-3xl p-12 md:p-20 relative overflow-hidden shadow-2xl shadow-slate-200 transition-all hover:-translate-y-1 hover:shadow-slate-300"
            >
                <div class="relative z-10 max-w-2xl mx-auto">
                    <h2 class="text-4xl md:text-5xl font-bold text-white mb-6">
                        مستعد للمساهمة؟
                    </h2>
                    <p class="text-slate-400 text-lg mb-10">
                        تحتاج فقط لدقيقتين لإرسال بلاغك ومساعدتنا في تحسين خدمات
                        مدينتك.
                    </p>
                    <button
                        onclick={() => goto("issue/new")}
                        class="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-bold px-12 py-4 rounded-xl transition-all hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-lg"
                    >
                        <Megaphone class="size-5" />
                        ابدأ بلاغك الأول
                    </button>
                </div>
                <div
                    class="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:20px_20px]"
                ></div>
            </div>
        </div>
    </section>

    <footer class="border-t border-slate-200 py-12">
        <div
            class="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-sm"
        >
            <div class="flex items-center gap-2">
                <Landmark class="size-5 text-slate-400" />
                <span
                    >© {new Date().getFullYear()} عين ع البلد. جميع الحقوق محفوظة.</span
                >
            </div>
            <div class="flex gap-6">
                <a href="/" class="hover:text-slate-900 transition-colors"
                    >سياسة الخصوصية</a
                >
                <a href="/" class="hover:text-slate-900 transition-colors"
                    >اتصل بنا</a
                >
            </div>
        </div>
    </footer>
</div>

<style>
    :global(html) {
        scroll-behavior: smooth;
    }
</style>
