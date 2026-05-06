<script lang="ts">
    import LoginForm from "$lib/blocks/LoginForm.svelte";
    import svgLogo from "$lib/assets/ainalbalad.svg";
    import apiInstance from "$lib/api/api";
    import { setUser } from "@/stores/auth.store";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";

    const dest = page.url.searchParams.get("goto") ?? "/";

    async function login(username: string, password: string) {
        try {
            const res = await apiInstance.post("/login", { username, password });
            setUser(res.data.user);
            goto(dest);
        } catch (err: any) {
            throw err;
        }
    }
</script>

<!-- خلفية صورة القدس مع تأثير Ken Burns -->
<div class="relative w-full min-h-screen overflow-hidden flex items-center justify-center">

    <!-- الصورة الخلفية -->
    <div
        class="absolute inset-0 -z-10 animate-kenburns"
        style="
            background-image: url('https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Dome_of_the_rock_by_David_Bjorgen.jpg/1280px-Dome_of_the_rock_by_David_Bjorgen.jpg');
            background-size: cover;
            background-position: center;
        "
    ></div>
    <!-- طبقة التعتيم -->
    <div class="absolute inset-0 -z-10 bg-black/55"></div>
    <div class="absolute inset-0 -z-10 bg-gradient-to-b from-black/30 to-black/70"></div>

    <!-- محتوى النموذج -->
    <div class="w-full max-w-sm mx-auto px-4 py-8">
        <div class="text-center mb-6">
            <img src={svgLogo} alt="عين ع البلد" class="h-16 mx-auto mb-3 drop-shadow-lg" />
            <p class="text-white/50 text-xs tracking-widest">عين ع البلد — منصة البلاغات البلدية</p>
        </div>
        <LoginForm {dest} {login} />
    </div>
</div>

<style>
    @keyframes kenburns {
        from { transform: scale(1); }
        to   { transform: scale(1.08); }
    }
    .animate-kenburns {
        animation: kenburns 20s ease-in-out infinite alternate;
    }
</style>
