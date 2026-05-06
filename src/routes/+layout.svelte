<script lang="ts">
    import "./layout.css";
    import favicon from "$lib/assets/favicon.svg";
    import Navbar from "@/lib/blocks/Navbar.svelte";
    import ToastHost from "@/lib/blocks/ToastHost.svelte";
    import { page } from "$app/state";
    import { user } from "@/stores/auth.store";
    import { goto } from "$app/navigation";

    let { children } = $props();
    let currentPath = $derived(page.url.pathname);

    // الصفحات المتاحة للجميع (حتى بدون تسجيل دخول)
    const publicPaths = ["/", "/issue/feed", "/issue/new", "/issue/selected", "/auth/login", "/auth/signup"];

    $effect(() => {
        // منع غير الأدمن من صفحات الأدمن
        if ($user && $user.role !== "ADMIN" && $user.role !== "MUNICIPAL" && currentPath.startsWith("/admin")) {
            goto("/");
        }
        if ($user?.role === "MUNICIPAL" && currentPath === "/admin/regions") {
            goto("/admin/users");
        }
        // صفحات الأدمن للمشرف فقط (مش MUNICIPAL)
        // إذا الصفحة ليست عامة، يطلب تسجيل دخول
        const isPublic = publicPaths.some(p => currentPath === p || currentPath.startsWith(p + "?"));
        if (!$user && !isPublic) {
            goto(`/auth/login?goto=${currentPath}`);
        }
    });
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<ToastHost />

<main dir="rtl">
    {#if !currentPath.includes("auth")}
        <Navbar />
        <div class="mt-20">
            {@render children()}
        </div>
    {:else}
        {@render children()}
    {/if}
</main>
