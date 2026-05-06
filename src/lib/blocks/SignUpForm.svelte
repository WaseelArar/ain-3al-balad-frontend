<script lang="ts">
    import { onMount } from "svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import * as Field from "$lib/components/ui/field/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import * as Alert from "$lib/components/ui/alert/index.js";
    import AlertCircle from "lucide-svelte/icons/alert-circle";
    import MapPin from "lucide-svelte/icons/map-pin";
    import Search from "lucide-svelte/icons/search";
    import Eye from "lucide-svelte/icons/eye";
    import EyeOff from "lucide-svelte/icons/eye-off";
    import ChevronDown from "lucide-svelte/icons/chevron-down";
    import X from "lucide-svelte/icons/x";
    import apiInstance from "$lib/api/api";
    import { sanitizePhone, sanitizeText, validatePhone, validateUsername } from "$lib/utils/validation";

    type Region = {
        regionsId: number;
        name: string;
        imageUrl?: string;
        governorate?: string;
    };

    let username    = $state("");
    let password    = $state("");
    let confirmPw   = $state("");
    let phone       = $state("");
    let error       = $state("");
    let usernameError = $state("");
    let phoneError    = $state("");
    let loadingReg  = $state(true);
    let showPw      = $state(false);
    let showCPw     = $state(false);
    let imgErr      = $state(false);

    // Picker state
    let regions      = $state<Region[]>([]);
    let pickerOpen   = $state(false);
    let searchQuery  = $state("");
    let selectedReg  = $state<Region | null>(null);

    $effect(() => { selectedReg; imgErr = false; });

    // تجميع المناطق المفلترة تحت محافظاتها
    let grouped = $derived(() => {
        const q = searchQuery.trim().toLowerCase();
        const filtered = q
            ? regions.filter(r =>
                r.name.includes(q) ||
                r.name.toLowerCase().includes(q) ||
                (r.governorate && r.governorate.includes(q))
              )
            : regions;

        const map = new Map<string, Region[]>();
        for (const r of filtered) {
            const gov = r.governorate || "أخرى";
            if (!map.has(gov)) map.set(gov, []);
            map.get(gov)!.push(r);
        }
        return map;
    });

    let {
        dest = "/",
        signup = $bindable(
            (u: string, p: string, pw: string, r: string) => console.log(u, p, pw, r)
        ),
    }: {
        dest?: string;
        signup?: (username: string, phone: string, password: string, regionsId: string) => void | Promise<void>;
    } = $props();

    onMount(async () => {
        try {
            const res = await apiInstance.get("/regions");
            regions = res.data;
        } catch (err: any) {
            error = err.response?.data?.message || "تعذر تحميل قائمة المناطق";
        } finally {
            loadingReg = false;
        }
    });

    const selectRegion = (r: Region) => {
        selectedReg = r;
        pickerOpen = false;
        searchQuery = "";
    };

    const handleTextInput = (event: Event) => {
        const input = event.currentTarget as HTMLInputElement;
        const cleanValue = sanitizeText(input.value);
        if (input.value !== cleanValue) {
            input.value = cleanValue;
            username = cleanValue;
        }
        usernameError = "";
    };

    const handlePhoneInput = (event: Event) => {
        const input = event.currentTarget as HTMLInputElement;
        const cleanValue = sanitizePhone(input.value);
        if (input.value !== cleanValue) {
            input.value = cleanValue;
            phone = cleanValue;
        }
        phoneError = "";
    };

    const handleSubmit = async (event: SubmitEvent) => {
        error = "";
        usernameError = "";
        phoneError = "";
        event.preventDefault();

        const usernameValidation = validateUsername(username);
        if (!usernameValidation.isValid) { usernameError = usernameValidation.error || "اسم المستخدم غير صالح"; return; }

        const phoneValidation = validatePhone(phone);
        if (!phoneValidation.isValid) { phoneError = phoneValidation.error || "رقم الهاتف غير صالح"; return; }

        if (!selectedReg)            { error = "الرجاء اختيار المنطقة السكنية"; return; }
        if (password !== confirmPw)  { error = "كلمات المرور غير متطابقة"; return; }
        if (password.length < 8)     { error = "يجب أن تكون كلمة المرور 8 حروف على الأقل"; return; }
        try {
            await signup(username.trim(), phone.trim(), password, String(selectedReg.regionsId));
        } catch (err: any) {
            error = err.response?.data?.message || "فشل انشاء الحساب، تأكد من البيانات";
        }
    };

    // Close picker on Escape
    const onKeydown = (e: KeyboardEvent) => { if (e.key === "Escape") pickerOpen = false; };
</script>

<svelte:window onkeydown={onKeydown} />

<!-- ═══════════════════════════════════════
     خلفية ديناميكية حسب المنطقة المختارة
═══════════════════════════════════════ -->
{#if selectedReg?.imageUrl && !imgErr}
    <div class="fixed inset-0 -z-20 transition-all duration-700">
        <img
            src={selectedReg.imageUrl}
            alt={selectedReg.name}
            class="w-full h-full object-cover"
            onerror={() => { imgErr = true; }}
        />
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <div class="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"></div>
    </div>
    <div class="fixed bottom-5 left-0 right-0 text-center pointer-events-none z-0">
        <p class="text-white/30 text-xs tracking-widest">{selectedReg.governorate} · {selectedReg.name}</p>
    </div>
{/if}

<!-- ═══ البطاقة الرئيسية ═══ -->
<Card.Root
    class="mx-auto w-full max-w-sm shadow-2xl transition-all duration-500
           {selectedReg?.imageUrl && !imgErr
               ? 'bg-white/10 backdrop-blur-xl border-white/20'
               : 'bg-white border-slate-200'}"
    dir="rtl"
>
    <Card.Header class="pb-3">
        <div class="flex items-center gap-2 mb-0.5">
            <div class="size-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <MapPin class="size-4 text-primary-foreground" />
            </div>
            <Card.Title class="text-xl {selectedReg?.imageUrl && !imgErr ? 'text-white' : ''}">
                انشئ حسابك
            </Card.Title>
        </div>
        <Card.Description class={selectedReg?.imageUrl && !imgErr ? 'text-white/55' : ''}>
            {#if selectedReg && !imgErr && selectedReg.imageUrl}
                <span class="text-white/80 font-medium">{selectedReg.name}</span>
                <span class="text-white/40"> — {selectedReg.governorate}</span>
            {:else}
                أدخل معلوماتك لبدء رحلتك
            {/if}
        </Card.Description>
    </Card.Header>

    <Card.Content>
        <form onsubmit={handleSubmit} class="space-y-3.5">

            <!-- اسم المستخدم -->
            <Field.Field>
                <Field.Label for="su-name" class="text-sm {selectedReg?.imageUrl && !imgErr ? 'text-white/80' : ''}">
                    اسم المستخدم
                </Field.Label>
                <Input id="su-name" type="text" placeholder="أمير سامر" required bind:value={username} oninput={handleTextInput}
                    class="h-10 rounded-xl {selectedReg?.imageUrl && !imgErr
                        ? 'bg-white/10 border-white/25 text-white placeholder:text-white/35' : ''}" />
                {#if usernameError}
                    <p class="text-xs text-red-500 mt-1">{usernameError}</p>
                {:else}
                    <p class="text-xs {selectedReg?.imageUrl && !imgErr ? 'text-white/40' : 'text-slate-400'} mt-1">
                        حروف فقط (عربي أو إنجليزي)
                    </p>
                {/if}
            </Field.Field>

            <!-- ══════════════════════════════
                 Picker المنطقة المخصص
            ══════════════════════════════ -->
            <Field.Field>
                <Field.Label class="text-sm {selectedReg?.imageUrl && !imgErr ? 'text-white/80' : ''}">
                    المدينة / القرية / المخيم
                </Field.Label>

                <!-- زر فتح القائمة -->
                <button
                    type="button"
                    onclick={() => { pickerOpen = !pickerOpen; searchQuery = ""; }}
                    class="w-full h-10 rounded-xl border px-3 text-sm text-right flex items-center justify-between gap-2 transition-colors
                           {selectedReg?.imageUrl && !imgErr
                               ? 'border-white/25 bg-white/10 text-white hover:bg-white/15'
                               : 'border-input bg-background hover:bg-slate-50'}"
                >
                    <span class={!selectedReg ? 'text-slate-400' : ''}>
                        {selectedReg ? selectedReg.name : "اختر مدينتك أو قريتك..."}
                    </span>
                    <ChevronDown class="size-4 opacity-50 shrink-0 transition-transform {pickerOpen ? 'rotate-180' : ''}" />
                </button>

                <!-- ══ Dropdown Picker ══ -->
                {#if pickerOpen}
                    <button
                        type="button"
                        class="fixed inset-0 z-40 cursor-default bg-transparent"
                        aria-label="إغلاق قائمة المناطق"
                        onclick={() => { pickerOpen = false; }}
                    ></button>

                    <div class="absolute z-50 mt-1 w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
                         style="max-height: 380px; display: flex; flex-direction: column;">

                        <!-- حقل البحث -->
                        <div class="p-2.5 border-b border-slate-100 shrink-0">
                            <div class="relative">
                                <Search class="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                <input
                                    bind:value={searchQuery}
                                    placeholder="ابحث عن مدينة أو قرية أو مخيم..."
                                    class="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 pr-9 pl-3 text-sm outline-none focus:border-slate-400 focus:bg-white transition-colors"
                                    dir="rtl"
                                />
                                {#if searchQuery}
                                    <button
                                        type="button"
                                        onclick={() => { searchQuery = ""; }}
                                        class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X class="size-3.5" />
                                    </button>
                                {/if}
                            </div>
                        </div>

                        <!-- القائمة المجمّعة بالمحافظات -->
                        <div class="overflow-y-auto flex-1" style="overscroll-behavior: contain;">
                            {#if grouped().size === 0}
                                <div class="py-10 text-center text-slate-400 text-sm">
                                    <Search class="size-6 mx-auto mb-2 opacity-40" />
                                    لا توجد نتائج
                                </div>
                            {:else}
                                {#each [...grouped().entries()] as [gov, items]}
                                    <!-- عنوان المحافظة -->
                                    <div class="sticky top-0 bg-slate-50 border-b border-slate-100 px-3 py-1.5 z-10">
                                        <div class="flex items-center gap-1.5">
                                            <MapPin class="size-3 text-slate-400" />
                                            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                محافظة {gov}
                                            </span>
                                            <span class="text-xs text-slate-400 mr-auto">({items.length})</span>
                                        </div>
                                    </div>

                                    <!-- عناصر المحافظة -->
                                    {#each items as region (region.regionsId)}
                                        <button
                                            type="button"
                                            onclick={() => selectRegion(region)}
                                            class="w-full flex items-center gap-3 px-3 py-2.5 text-right hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0
                                                   {selectedReg?.regionsId === region.regionsId ? 'bg-primary/5 border-r-2 border-r-primary' : ''}"
                                        >
                                            <!-- صورة مصغرة -->
                                            {#if region.imageUrl}
                                                <div class="w-10 h-7 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                                                    <img
                                                        src={region.imageUrl}
                                                        alt={region.name}
                                                        class="w-full h-full object-cover"
                                                        onerror={(e) => {
                                                            const t = e.currentTarget as HTMLImageElement;
                                                            t.parentElement!.style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            {:else}
                                                <div class="w-10 h-7 rounded-lg bg-slate-100 shrink-0 flex items-center justify-center">
                                                    <MapPin class="size-3 text-slate-400" />
                                                </div>
                                            {/if}

                                            <span class="flex-1 text-sm font-medium text-slate-800">{region.name}</span>

                                            {#if selectedReg?.regionsId === region.regionsId}
                                                <div class="size-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                                                    <svg class="size-2.5 text-white" viewBox="0 0 10 10" fill="none">
                                                        <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                                    </svg>
                                                </div>
                                            {/if}
                                        </button>
                                    {/each}
                                {/each}
                            {/if}
                        </div>
                    </div>
                {/if}

                <!-- معاينة صغيرة للمنطقة المختارة -->
                {#if selectedReg?.imageUrl && !imgErr}
                    <div class="relative rounded-xl overflow-hidden h-16 mt-1.5 border border-white/20">
                        <img
                            src={selectedReg.imageUrl}
                            alt={selectedReg.name}
                            class="w-full h-full object-cover"
                            onerror={() => { imgErr = true; }}
                        />
                        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end px-3 py-1.5">
                            <span class="text-white text-xs font-medium">{selectedReg.name} — {selectedReg.governorate}</span>
                        </div>
                    </div>
                {/if}
            </Field.Field>

            <!-- رقم الهاتف -->
            <Field.Field>
                <Field.Label for="su-phone" class="text-sm {selectedReg?.imageUrl && !imgErr ? 'text-white/80' : ''}">
                    رقم الهاتف
                </Field.Label>
                <Input id="su-phone" type="tel" placeholder="0599123456" required bind:value={phone} oninput={handlePhoneInput} maxlength={10} dir="ltr"
                    class="h-10 rounded-xl {selectedReg?.imageUrl && !imgErr
                        ? 'bg-white/10 border-white/25 text-white placeholder:text-white/35' : ''}" />
                {#if phoneError}
                    <p class="text-xs text-red-500 mt-1">{phoneError}</p>
                {:else}
                    <p class="text-xs {selectedReg?.imageUrl && !imgErr ? 'text-white/40' : 'text-slate-400'} mt-1">
                        10 أرقام بالضبط، أرقام فقط
                    </p>
                {/if}
            </Field.Field>

            <!-- كلمتا المرور -->
            <div class="grid grid-cols-2 gap-2">
                <Field.Field>
                    <Field.Label for="su-pw" class="text-xs {selectedReg?.imageUrl && !imgErr ? 'text-white/80' : ''}">
                        كلمة المرور
                    </Field.Label>
                    <div class="relative">
                        <Input id="su-pw" type={showPw ? "text" : "password"} required bind:value={password}
                            class="h-10 rounded-xl pl-9 {selectedReg?.imageUrl && !imgErr
                                ? 'bg-white/10 border-white/25 text-white' : ''}" />
                        <button type="button" onclick={() => { showPw = !showPw; }}
                            class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {#if showPw}<EyeOff class="size-3.5" />{:else}<Eye class="size-3.5" />{/if}
                        </button>
                    </div>
                    <Field.Description class="text-xs {selectedReg?.imageUrl && !imgErr ? 'text-white/40' : ''}">
                        8 حروف على الأقل
                    </Field.Description>
                </Field.Field>

                <Field.Field>
                    <Field.Label for="su-cpw" class="text-xs {selectedReg?.imageUrl && !imgErr ? 'text-white/80' : ''}">
                        تأكيد المرور
                    </Field.Label>
                    <div class="relative">
                        <Input id="su-cpw" type={showCPw ? "text" : "password"} required bind:value={confirmPw}
                            class="h-10 rounded-xl pl-9 {selectedReg?.imageUrl && !imgErr
                                ? 'bg-white/10 border-white/25 text-white' : ''}" />
                        <button type="button" onclick={() => { showCPw = !showCPw; }}
                            class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {#if showCPw}<EyeOff class="size-3.5" />{:else}<Eye class="size-3.5" />{/if}
                        </button>
                    </div>
                </Field.Field>
            </div>

            <!-- خطأ -->
            {#if error}
                <Alert.Root variant="destructive" class="bg-destructive/10 text-destructive rounded-2xl border-none">
                    <AlertCircle class="size-4" />
                    <Alert.Title class="font-bold text-sm">خطأ</Alert.Title>
                    <Alert.Description class="text-sm">{error}</Alert.Description>
                </Alert.Root>
            {/if}

            <!-- زر الإرسال -->
            <Button type="submit" class="w-full h-11 rounded-xl font-bold text-base
                {selectedReg?.imageUrl && !imgErr ? 'bg-white text-slate-900 hover:bg-white/90' : ''}">
                انشاء حساب
            </Button>

            <p class="text-center text-sm {selectedReg?.imageUrl && !imgErr ? 'text-white/50' : 'text-slate-500'}">
                لديك حساب؟
                <a href={`/auth/login?goto=${dest}`}
                   class="{selectedReg?.imageUrl && !imgErr ? 'text-white underline' : 'text-primary hover:underline'} font-medium">
                    سجل الدخول
                </a>
            </p>
        </form>
    </Card.Content>
</Card.Root>
