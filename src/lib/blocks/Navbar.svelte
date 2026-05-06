<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import svgLogo from "$lib/assets/ain-al-balad-landscape.svg";
    import { clearUser, user } from "@/stores/auth.store";
    import { notificationsStore } from "@/stores/notifications.store";
    import { onMount } from "svelte";
    import {
        ChevronRight, List, LogOutIcon, MessageCircleCheckIcon,
        UserIcon, Menu, X, Home, Users, Map, Bell, BarChart3, UserX
    } from "lucide-svelte";
    import Button from "../components/ui/button/button.svelte";

    let scrolled           = $state(false);
    let mobileMenuOpen     = $state(false);
    let showNotifications  = $state(false);
    const navIconSurface = $derived(scrolled
        ? "rounded-2xl px-2 py-2 text-slate-900"
        : "rounded-2xl bg-white/70 px-3 py-2 text-slate-950 shadow-sm ring-1 ring-white/60 backdrop-blur-md"
    );
    const logoSurface = $derived(scrolled
        ? "rounded-2xl px-1 py-1"
        : "rounded-2xl bg-white/70 px-3 py-2 shadow-sm ring-1 ring-white/60 backdrop-blur-md"
    );
    const mobileIconSurface = $derived(scrolled
        ? "rounded-xl text-slate-900"
        : "rounded-xl bg-white/75 text-slate-950 shadow-sm ring-1 ring-white/60 backdrop-blur-md"
    );

    onMount(() => {
        if ($user) notificationsStore.fetch();
        const interval = setInterval(() => { if ($user) notificationsStore.fetch(); }, 60000);
        return () => clearInterval(interval);
    });

    if (typeof window !== "undefined") {
        window.addEventListener("scroll", () => { scrolled = window.scrollY > 20; });
    }

    function toggleMenu()         { mobileMenuOpen    = !mobileMenuOpen; }
    function toggleNotifications() {
        showNotifications = !showNotifications;
        if (showNotifications && $notificationsStore.unreadCount > 0)
            notificationsStore.markAllRead();
    }

    const nonAdminNavItems = [
        { id: 0, name: "الرئيسية",    path: "/",           icon: Home },
        { id: 1, name: "الشكاوى",     path: "/issue/feed", icon: List },
        { id: 2, name: "تقديم بلاغ",  path: "/issue/new",  icon: MessageCircleCheckIcon },
        { id: 3, name: "حسابي",       path: "/profile",    icon: UserIcon },
    ];
    const adminNavItems = [
        { id: 20, name: "المستخدمون", path: "/admin/users",   icon: Users },
        { id: 21, name: "المناطق",    path: "/admin/regions", icon: Map },
        { id: 22, name: "الإحصائيات", path: "/admin/stats",   icon: BarChart3 },
    ];

    const navItems = $derived(
        $user?.role === "ADMIN" ? [...nonAdminNavItems, ...adminNavItems] :
        $user?.role === "MUNICIPAL" ? [...nonAdminNavItems, adminNavItems[0]] :
        nonAdminNavItems
    );

    // الضيف يقدر يدخل فقط الرئيسية والشكاوى وتقديم بلاغ
    const guestNavItems = [
        { id: 0, name: "الرئيسية",   path: "/",           icon: Home },
        { id: 1, name: "الشكاوى",    path: "/issue/feed", icon: List },
        { id: 2, name: "تقديم بلاغ", path: "/issue/new",  icon: MessageCircleCheckIcon },
    ];
</script>

<nav class="fixed top-0 w-full z-50 transition-all duration-300 border-b {scrolled
    ? 'bg-white/90 backdrop-blur-md border-slate-200 shadow-md'
    : 'bg-transparent border-transparent'}">

    <div class="container mx-auto px-4 h-20 flex justify-between items-center">

        <!-- الشعار -->
        <div class="flex items-center h-full py-3 gap-3">
            {#if page.url.pathname !== "/"}
                <Button onclick={() => history.back()} class="p-2 rounded-full size-11 shrink-0">
                    <ChevronRight class="size-6 text-background" />
                </Button>
            {/if}
            <button
                type="button"
                class="flex h-full max-h-12 items-center transition-all hover:-translate-y-0.5 hover:bg-white/85 hover:shadow-md {logoSurface}"
                aria-label="الرئيسية"
                onclick={() => goto("/")}
            >
                <img src={svgLogo} alt="عين على البلد" class="h-full max-h-12 object-contain" />
            </button>
            {#if $user?.regionsName}
                <span class="hidden md:inline text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                    {$user.regionsName}
                </span>
            {/if}
        </div>

        <!-- Desktop Nav -->
        <div class="hidden md:flex items-center gap-3">
            {#if !$user}
                <!-- زائر: يشوف روابط الضيف -->
                {#each guestNavItems as item (item.id)}
                    <button onclick={() => goto(item.path)}
                        class="flex flex-col items-center gap-1.5 transition-all hover:-translate-y-0.5 hover:bg-white/85 hover:text-primary hover:shadow-md group {navIconSurface}
                               {page.url.pathname === item.path ? 'text-primary' : ''}">
                        <item.icon class="size-7 group-hover:scale-110 transition-transform" />
                        <span class="text-xs font-semibold">{item.name}</span>
                    </button>
                {/each}
                <div class="flex gap-2 mr-2">
                    <Button variant="outline" size="sm"
                        onclick={() => goto(`/auth/login?goto=${page.url.pathname}`)}>
                        تسجيل الدخول
                    </Button>
                    <Button size="sm"
                        onclick={() => goto(`/auth/signup?goto=${page.url.pathname}`)}>
                        انشاء حساب
                    </Button>
                </div>
            {:else}
                {#each navItems as item (item.id)}
                    <button onclick={() => goto(item.path)}
                        class="flex flex-col items-center gap-1.5 transition-all hover:-translate-y-0.5 hover:bg-white/85 hover:text-primary hover:shadow-md group {navIconSurface}
                               {page.url.pathname === item.path ? 'text-primary' : ''}">
                        <item.icon class="size-7 group-hover:scale-110 transition-transform" />
                        <span class="text-xs font-semibold">{item.name}</span>
                    </button>
                {/each}

                <!-- الإشعارات -->
                <div class="relative">
                    <button onclick={toggleNotifications}
                        class="flex flex-col items-center gap-1.5 transition-all hover:-translate-y-0.5 hover:bg-white/85 hover:text-primary hover:shadow-md group relative {navIconSurface}">
                        <div class="relative">
                            <Bell class="size-7 group-hover:scale-110 transition-transform" />
                            {#if $notificationsStore.unreadCount > 0}
                                <span class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold px-1">
                                    {$notificationsStore.unreadCount > 9 ? "9+" : $notificationsStore.unreadCount}
                                </span>
                            {/if}
                        </div>
                        <span class="text-xs font-semibold">إشعارات</span>
                    </button>

                    {#if showNotifications}
                        <div class="absolute left-0 top-16 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                            <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 class="font-bold text-slate-800">الإشعارات</h3>
                                <button onclick={toggleNotifications} class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors">
                                    <X class="size-5" />
                                </button>
                            </div>
                            <div class="max-h-80 overflow-y-auto divide-y divide-slate-50">
                                {#if $notificationsStore.items.length === 0}
                                    <div class="p-8 text-center text-slate-400 text-sm">لا توجد إشعارات</div>
                                {:else}
                                    {#each $notificationsStore.items as notif}
                                        <button class="w-full text-right p-4 hover:bg-slate-50 transition-colors {!notif.isRead ? 'bg-blue-50/60 border-r-2 border-primary' : ''}"
                                            onclick={() => { if (notif.issuesId) goto(`/issue/selected?issuesId=${notif.issuesId}`); showNotifications=false; }}>
                                            <p class="text-sm text-slate-700 font-medium leading-relaxed">{notif.message}</p>
                                            <p class="text-xs text-slate-400 mt-1">
                                                {new Date(notif.createdAt).toLocaleDateString("ar-EG",{hour:"2-digit",minute:"2-digit"})}
                                            </p>
                                        </button>
                                    {/each}
                                {/if}
                            </div>
                        </div>
                    {/if}
                </div>

                <!-- تسجيل خروج -->
                <button onclick={clearUser}
                    class="flex flex-col items-center gap-1.5 text-red-500 transition-all hover:-translate-y-0.5 hover:bg-white/85 hover:text-red-600 hover:shadow-md group {navIconSurface}">
                    <LogOutIcon class="size-7" />
                    <span class="text-xs font-semibold">خروج</span>
                </button>
            {/if}
        </div>

        <!-- Mobile -->
        <div class="md:hidden flex items-center gap-2">
            {#if $user && $notificationsStore.unreadCount > 0}
                <button onclick={toggleNotifications} class="relative p-2 transition-all hover:bg-white/85 {mobileIconSurface}">
                    <Bell class="size-7" />
                    <span class="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {$notificationsStore.unreadCount}
                    </span>
                </button>
            {/if}
            <button onclick={toggleMenu} class="p-2 transition-all hover:bg-white/85 {mobileIconSurface}">
                {#if mobileMenuOpen}<X class="size-8" />{:else}<Menu class="size-8" />{/if}
            </button>
        </div>
    </div>

    <!-- Mobile Notifications -->
    {#if showNotifications && $user}
        <div class="md:hidden bg-white border-b border-slate-100 shadow-lg max-h-60 overflow-y-auto">
            {#each $notificationsStore.items.slice(0,5) as notif}
                <button class="w-full text-right p-4 border-b border-slate-50 text-sm hover:bg-slate-50"
                    onclick={() => { if(notif.issuesId) goto(`/issue/selected?issuesId=${notif.issuesId}`); showNotifications=false; }}>
                    <p class="font-medium text-slate-700">{notif.message}</p>
                </button>
            {/each}
            {#if $notificationsStore.items.length === 0}
                <p class="text-center text-slate-400 py-4 text-sm">لا توجد إشعارات</p>
            {/if}
        </div>
    {/if}

    <!-- Mobile Menu -->
    {#if mobileMenuOpen}
        <div class="md:hidden bg-white border-b border-slate-200 absolute w-full left-0 shadow-xl z-40 animate-in slide-in-from-top duration-200">
            <div class="flex flex-col p-4 gap-2">
                {#if !$user}
                    {#each guestNavItems as item}
                        <button class="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors"
                            onclick={() => { goto(item.path); toggleMenu(); }}>
                            <item.icon class="size-7 text-primary" />
                            <span class="font-semibold text-lg">{item.name}</span>
                        </button>
                    {/each}
                    <div class="flex gap-2 mt-2 pt-3 border-t border-slate-100">
                        <Button variant="outline" class="flex-1" onclick={() => { goto("/auth/login"); toggleMenu(); }}>دخول</Button>
                        <Button class="flex-1" onclick={() => { goto("/auth/signup"); toggleMenu(); }}>تسجيل</Button>
                    </div>
                {:else}
                    {#each navItems as item}
                        <button class="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors"
                            onclick={() => { goto(item.path); toggleMenu(); }}>
                            <item.icon class="size-7 text-primary" />
                            <span class="font-semibold text-lg">{item.name}</span>
                        </button>
                    {/each}
                    <div class="pt-2 border-t border-slate-100 mt-1">
                        <button onclick={() => { clearUser(); toggleMenu(); }}
                            class="flex items-center gap-4 p-3 text-red-600 w-full rounded-xl hover:bg-red-50">
                            <LogOutIcon class="size-7" />
                            <span class="font-bold text-lg">تسجيل الخروج</span>
                        </button>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</nav>
