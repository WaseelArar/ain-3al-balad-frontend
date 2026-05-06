<script lang="ts">
    import { Button }    from "$lib/components/ui/button/index.js";
    import * as Field    from "$lib/components/ui/field/index.js";
    import { Input }     from "$lib/components/ui/input/index.js";
    import apiInstance   from "$lib/api/api";
    //@ts-ignore
    import imageCompression from "browser-image-compression";
    import Spinner       from "$lib/components/ui/spinner/spinner.svelte";
    import * as Alert    from "$lib/components/ui/alert/index.js";
    import AlertCircle   from "@lucide/svelte/icons/alert-circle";
    import { ForwardIcon, ImageIcon, LocateIcon, LocationEdit, Trash2, CheckCircle2 } from "lucide-svelte";
    import Textarea      from "@/lib/components/ui/textarea/textarea.svelte";
    import svgLogo       from "$lib/assets/ainalbalad.svg";
    import { onDestroy } from "svelte";
    import Switch        from "@/lib/components/ui/switch/switch.svelte";
    import Label         from "@/lib/components/ui/label/label.svelte";
    import AudioRecorder from "@/lib/blocks/AudioRecorder.svelte";
    import { user }      from "@/stores/auth.store";
    import { sanitizePhone, sanitizeText, validatePhone, validateTextOnly } from "$lib/utils/validation";

    let image        = $state<File|Blob|undefined>();
    let previewUrl   = $state("");
    let loadingimage = $state(false);
    let attachImage  = $state(false);
    let audioBlob    = $state<Blob|null>(null);
    let attachAudio  = $state(false);
    let location     = $state({ longitude: 0, latitude: 0 });
    let altLocation  = $state("");
    let description  = $state("");
    let publicIssue  = $state(false);
    let loading      = $state(false);
    let error        = $state("");
    let success      = $state(false);
    // بيانات الضيف
    let guestName    = $state("");
    let guestPhone   = $state("");
    let guestNameError  = $state("");
    let guestPhoneError = $state("");

    const handleGuestNameInput = (event: Event) => {
        const input = event.currentTarget as HTMLInputElement;
        const cleanValue = sanitizeText(input.value);
        if (input.value !== cleanValue) {
            input.value = cleanValue;
            guestName = cleanValue;
        }
        guestNameError = "";
    };

    const handleGuestPhoneInput = (event: Event) => {
        const input = event.currentTarget as HTMLInputElement;
        const cleanValue = sanitizePhone(input.value);
        if (input.value !== cleanValue) {
            input.value = cleanValue;
            guestPhone = cleanValue;
        }
        guestPhoneError = "";
    };

    const uploadImage = async (): Promise<string> => {
        if (!image) return "";
        const fd = new FormData();
        fd.append("file", image, "image.jpg");
        const res = await apiInstance.post("/upload", fd);
        return res.data.path as string;
    };

    const uploadAudio = async (): Promise<string> => {
        if (!audioBlob) return "";
        const type = audioBlob.type || "audio/webm";
        const ext  = type.includes("ogg") ? ".ogg" : type.includes("mp4") ? ".mp4" : type.includes("wav") ? ".wav" : ".webm";
        const fd   = new FormData();
        fd.append("file", audioBlob, `recording${ext}`);
        const res  = await apiInstance.post("/upload/audio", fd);
        return res.data.path as string;
    };

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        error = "";
        guestNameError = "";
        guestPhoneError = "";
        if (!description.trim() || description.trim().length < 5) {
            error = "الرجاء إدخال وصف المشكلة (5 أحرف على الأقل)";
            return;
        }
        if (!$user) {
            const guestNameValidation = validateTextOnly(guestName, "الاسم");
            if (!guestNameValidation.isValid) {
                guestNameError = guestNameValidation.error || "الاسم غير صالح";
                error = "يرجى تصحيح الأخطاء في النموذج";
                return;
            }

            if (guestPhone.trim()) {
                const guestPhoneValidation = validatePhone(guestPhone);
                if (!guestPhoneValidation.isValid) {
                    guestPhoneError = guestPhoneValidation.error || "رقم الهاتف غير صالح";
                    error = "يرجى تصحيح الأخطاء في النموذج";
                    return;
                }
            }
        }
        if (!altLocation.trim() && location.latitude === 0) {
            error = "الرجاء تحديد الموقع";
            return;
        }
        try {
            loading = true;
            let imageUrl = "", audioUrl = "";
            if (attachImage && image)  imageUrl = await uploadImage();
            if (attachAudio && audioBlob) audioUrl = await uploadAudio();

            await apiInstance.post("/issues", {
                location: location.latitude !== 0 ? location : undefined,
                altLocation, description,
                privateIssue: !publicIssue,
                image:  imageUrl  || undefined,
                audio:  audioUrl  || undefined,
                guestName:  $user ? undefined : guestName.trim(),
                guestPhone: $user ? undefined : guestPhone.trim() || undefined,
            });

            image = undefined; previewUrl = ""; audioBlob = null;
            attachAudio = false; attachImage = false;
            location = { longitude:0, latitude:0 };
            altLocation = ""; description = ""; guestName = ""; guestPhone = "";
            success = true;
        } catch (err: any) {
            error =
                err.response?.data?.message ??
                (err.message === "Network Error"
                    ? "تعذر الاتصال بالخادم. تأكد أن الخادم يعمل ثم حاول مرة أخرى."
                    : err.message) ??
                "خطأ: تعذر رفع البلاغ";
        } finally {
            loading = false;
        }
    };

    const handleImagePick = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        loadingimage = true;
        try {
            const c = await imageCompression(file, { maxSizeMB: 1, useWebWorker: true });
            image = new File([c], file.name, { type: c.type });
            previewUrl = URL.createObjectURL(image);
        } catch (e: any) { error = e?.message ?? "خطأ في تحميل الصورة"; }
        finally { loadingimage = false; }
    };

    const getLocation = () => {
        if (!navigator.geolocation) { error = "المتصفح لا يدعم تحديد الموقع"; return; }
        navigator.geolocation.getCurrentPosition(
            pos => { location = { longitude: pos.coords.longitude, latitude: pos.coords.latitude }; },
            err => { error = err.message; },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    onDestroy(() => { if (previewUrl) URL.revokeObjectURL(previewUrl); });
</script>

<div class="w-full min-h-screen" dir="rtl">
    {#if loading}
        <div class="w-full h-screen flex justify-center items-center">
            <div class="flex flex-col items-center gap-4">
                <Spinner class="size-12 text-primary" />
                <p class="text-slate-500 font-medium">جارِ رفع البلاغ...</p>
            </div>
        </div>

    {:else if success}
        <div class="w-full h-screen flex flex-col items-center justify-center gap-6 px-6" dir="rtl">
            <div class="size-24 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 class="size-14 text-green-600" />
            </div>
            <div class="text-center">
                <h2 class="text-3xl font-black text-slate-800 mb-2">تم إرسال البلاغ!</h2>
                <p class="text-slate-500 text-lg max-w-sm">سيتم مراجعته من قبل الجهة المسؤولة في أقرب وقت.</p>
            </div>
            <Button onclick={() => success = false} class="px-8 py-3 text-lg rounded-2xl">
                تقديم بلاغ جديد
            </Button>
        </div>

    {:else}
        <div class="max-w-2xl mx-auto px-6 py-8">
            <div class="flex flex-col lg:flex-row gap-8 items-start">
                <!-- الشعار (يظهر فقط على الشاشات الكبيرة) -->
                <div class="hidden lg:flex flex-col items-center justify-center gap-4 w-64 shrink-0 pt-12">
                    <img src={svgLogo} alt="logo" class="w-full" />
                    <p class="text-center text-slate-500 text-sm leading-relaxed">
                        صوتك يصل للبلدية، ابلغ عن المشاكل في منطقتك
                    </p>
                </div>

                <!-- النموذج -->
                <div class="flex-1">
                    <div class="mb-8">
                        <h1 class="text-3xl font-black text-slate-800">تقديم بلاغ</h1>
                        <p class="text-slate-500 mt-1">
                            {$user ? `مرحباً ${$user.username}، أدخل تفاصيل المشكلة` : "يمكنك تقديم بلاغ بدون تسجيل دخول"}
                        </p>
                    </div>

                    <form onsubmit={handleSubmit} class="space-y-6">

                        <!-- بيانات الضيف -->
                        {#if !$user}
                            <div class="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-4">
                                <p class="text-sm font-bold text-amber-800 flex items-center gap-2">
                                    👤 أنت تتقدم كضيف
                                </p>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label class="text-sm font-semibold mb-1.5 block">الاسم *</Label>
                                        <Input placeholder="اسمك الكريم" bind:value={guestName} oninput={handleGuestNameInput} required class="rounded-xl" />
                                        {#if guestNameError}
                                            <p class="text-xs text-red-500 mt-1">{guestNameError}</p>
                                        {/if}
                                    </div>
                                    <div>
                                        <Label class="text-sm font-semibold mb-1.5 block">رقم الهاتف (اختياري)</Label>
                                        <Input placeholder="للتواصل معك" bind:value={guestPhone} oninput={handleGuestPhoneInput} maxlength={10} class="rounded-xl" dir="ltr" />
                                        {#if guestPhoneError}
                                            <p class="text-xs text-red-500 mt-1">{guestPhoneError}</p>
                                        {:else if guestPhone.trim()}
                                            <p class="text-xs text-amber-600 mt-1">10 أرقام بالضبط</p>
                                        {/if}
                                    </div>
                                </div>
                                <p class="text-xs text-amber-600">
                                    <a href="/auth/login" class="underline font-semibold">سجّل دخولك</a> لتتمكن من متابعة بلاغاتك لاحقاً
                                </p>
                            </div>
                        {/if}

                        <!-- الموقع -->
                        <div class="space-y-3">
                            <Label class="text-base font-bold block">📍 الموقع *</Label>
                            <Button type="button" onclick={getLocation} variant="outline" class="w-full rounded-xl h-12 text-base">
                                <LocateIcon class="size-5 ml-2" /> تحديد موقعي تلقائياً
                            </Button>

                            {#if location.latitude !== 0}
                                <div class="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                                    <span class="text-green-700 font-semibold text-sm">✓ تم تحديد الموقع</span>
                                    <div class="flex gap-2">
                                        <a href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                                           target="_blank" rel="noopener noreferrer"
                                           class="text-xs text-blue-600 underline flex items-center gap-1">
                                            عرض <ForwardIcon class="size-3" />
                                        </a>
                                        <button type="button" onclick={() => location={longitude:0,latitude:0}}
                                            class="text-xs text-red-500 flex items-center gap-1">
                                            <Trash2 class="size-3" /> حذف
                                        </button>
                                    </div>
                                </div>
                            {:else}
                                <div class="relative">
                                    <Input placeholder="أو أدخل الموقع يدوياً (اسم الشارع، الحي...)"
                                        bind:value={altLocation} class="rounded-xl h-12 text-base pr-4" />
                                </div>
                            {/if}
                        </div>

                        <!-- الوصف -->
                        <div class="space-y-2">
                            <Label class="text-base font-bold block">📝 وصف المشكلة *</Label>
                            <Textarea placeholder="اشرح المشكلة بالتفصيل... (ما هي؟ أين بالضبط؟ منذ متى؟)"
                                bind:value={description} class="rounded-xl min-h-[120px] text-base resize-none" />
                            <p class="text-xs text-slate-400 text-left">{description.length}/1000</p>
                        </div>

                        <!-- التسجيل الصوتي -->
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <Label class="text-base font-bold">🎙️ تسجيل صوتي</Label>
                                <div class="flex items-center gap-2">
                                    <Switch bind:checked={attachAudio} />
                                    <span class="text-sm text-slate-500">تفعيل</span>
                                </div>
                            </div>
                            {#if attachAudio}
                                <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                    <AudioRecorder
                                        onRecorded={(b) => { audioBlob = b; }}
                                        onCleared={()  => { audioBlob = null; }}
                                    />
                                </div>
                                <p class="text-xs text-slate-400">سجّل وصفاً صوتياً إضافياً (حد أقصى 5 دقائق)</p>
                            {/if}
                        </div>

                        <!-- الصورة -->
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <Label class="text-base font-bold">📷 إرفاق صورة</Label>
                                <div class="flex items-center gap-2">
                                    <Switch bind:checked={attachImage} />
                                    <span class="text-sm text-slate-500">تفعيل</span>
                                </div>
                            </div>
                            {#if attachImage}
                                <input id="imgInput" class="hidden" type="file"
                                    onchange={handleImagePick} accept="image/*" />
                                <button type="button" onclick={() => document.getElementById("imgInput")?.click()}
                                    class="w-full rounded-2xl border-2 border-dashed border-slate-300 hover:border-primary transition-colors overflow-hidden">
                                    {#if image}
                                        <img class="w-full max-h-64 object-cover" src={previewUrl} alt="صورة المشكلة" />
                                    {:else}
                                        <div class="flex flex-col items-center gap-3 py-10 text-slate-400">
                                            {#if loadingimage}
                                                <Spinner class="size-8" />
                                                <p class="text-sm">جارِ ضغط الصورة...</p>
                                            {:else}
                                                <ImageIcon class="size-10" />
                                                <p class="text-sm font-medium">انقر لاختيار صورة</p>
                                                <p class="text-xs">JPG, PNG, WebP (حد أقصى 15MB)</p>
                                            {/if}
                                        </div>
                                    {/if}
                                </button>
                            {/if}
                        </div>

                        <!-- عام/خاص -->
                        <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="font-bold text-slate-800">مشاركة عامة</p>
                                    <p class="text-xs text-slate-500 mt-0.5">يسمح للمستخدمين بالتفاعل والتأكيد</p>
                                </div>
                                <Switch bind:checked={publicIssue} />
                            </div>
                        </div>

                        <!-- خطأ -->
                        {#if error}
                            <Alert.Root variant="destructive" class="rounded-2xl">
                                <AlertCircle class="size-5" />
                                <Alert.Title class="font-bold">خطأ</Alert.Title>
                                <Alert.Description>{error}</Alert.Description>
                            </Alert.Root>
                        {/if}

                        <!-- إرسال -->
                        <Button type="submit" class="w-full h-14 text-lg font-bold rounded-2xl shadow-md hover:shadow-lg transition-all">
                            إرسال البلاغ 🚀
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    {/if}
</div>
