<script lang="ts">
    import { onMount } from "svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import * as Field from "$lib/components/ui/field/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import * as Alert from "$lib/components/ui/alert/index.js";
    import AlertCircle from "lucide-svelte/icons/alert-circle";
    import MapPin from "lucide-svelte/icons/map-pin";
    import Trash2 from "lucide-svelte/icons/trash-2";
    import Loader2 from "lucide-svelte/icons/loader-2";
    import ImageIcon from "lucide-svelte/icons/image";
    import Pencil from "lucide-svelte/icons/pencil";
    import X from "lucide-svelte/icons/x";
    import Check from "lucide-svelte/icons/check";
    import ChevronDown from "lucide-svelte/icons/chevron-down";
    import ChevronLeft from "lucide-svelte/icons/chevron-left";
    import apiInstance from "$lib/api/api";

    type Region = {
        regionsId: number;
        name: string;
        description: string;
        imageUrl?: string;
        governorate?: string;
    };

    // Palestinian governorates list
    const GOVERNORATES = [
        "القدس","رام الله والبيرة","الخليل","بيت لحم","نابلس",
        "جنين","طولكرم","قلقيلية","سلفيت","طوباس","أريحا والأغوار",
        "غزة","شمال غزة","خان يونس","رفح","الوسطى",
    ];

    let regions      = $state<Region[]>([]);
    let name         = $state("");
    let description  = $state("");
    let imageUrl     = $state("");
    let governorate  = $state("");
    let previewErr   = $state(false);
    let error        = $state("");
    let loading      = $state(true);
    let submitting   = $state(false);

    // Edit
    let editingId      = $state<number | null>(null);
    let editName       = $state("");
    let editDesc       = $state("");
    let editImg        = $state("");
    let editGov        = $state("");
    let editPreviewErr = $state(false);

    // Collapse per governorate
    let collapsed = $state<Record<string, boolean>>({});

    $effect(() => { imageUrl;    previewErr   = false; });
    $effect(() => { editImg;     editPreviewErr = false; });

    // Group regions by governorate
    let grouped = $derived(() => {
        const map = new Map<string, Region[]>();
        for (const r of regions) {
            const gov = r.governorate || "أخرى";
            if (!map.has(gov)) map.set(gov, []);
            map.get(gov)!.push(r);
        }
        return map;
    });

    const fetchRegions = async () => {
        loading = true;
        try {
            const res = await apiInstance.get("/regions");
            regions = res.data;
        } catch (err: any) {
            error = err.response?.data?.message || "فشل في تحميل المناطق";
        } finally {
            loading = false;
        }
    };

    const handleCreate = async (e: SubmitEvent) => {
        e.preventDefault();
        submitting = true; error = "";
        try {
            await apiInstance.post("/admin/regions", {
                name, description,
                imageUrl: imageUrl || null,
                governorate: governorate || null,
            });
            name = ""; description = ""; imageUrl = ""; governorate = "";
            previewErr = false;
            await fetchRegions();
        } catch (err: any) {
            error = err.response?.data?.message || "فشل في إضافة المنطقة";
        } finally {
            submitting = false;
        }
    };

    const startEdit = (r: Region) => {
        editingId = r.regionsId;
        editName  = r.name;
        editDesc  = r.description || "";
        editImg   = r.imageUrl || "";
        editGov   = r.governorate || "";
        editPreviewErr = false;
    };

    const handleEdit = async (id: number) => {
        submitting = true; error = "";
        try {
            await apiInstance.put(`/admin/regions/${id}`, {
                name: editName, description: editDesc,
                imageUrl: editImg || null,
                governorate: editGov || null,
            });
            editingId = null;
            await fetchRegions();
        } catch (err: any) {
            error = err.response?.data?.message || "فشل في تحديث المنطقة";
        } finally {
            submitting = false;
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("هل أنت متأكد من حذف هذه المنطقة؟")) return;
        try {
            await apiInstance.delete(`/admin/regions/${id}`);
            await fetchRegions();
        } catch (err: any) {
            error = err.response?.data?.message || "فشل في حذف المنطقة";
        }
    };

    const toggleCollapse = (gov: string) => {
        collapsed[gov] = !collapsed[gov];
    };

    onMount(fetchRegions);
</script>

<div class="p-6 space-y-6 max-w-5xl mx-auto" dir="rtl">

    <!-- ── العنوان ── -->
    <div class="flex items-center gap-3">
        <div class="size-10 rounded-2xl bg-primary flex items-center justify-center">
            <MapPin class="size-5 text-primary-foreground" />
        </div>
        <div>
            <h1 class="text-2xl font-black">إدارة المناطق</h1>
            <p class="text-sm text-slate-500">
                {regions.length} منطقة في {grouped().size} محافظة
            </p>
        </div>
    </div>

    <!-- ── نموذج الإضافة ── -->
    <Card.Root class="rounded-3xl border-none shadow-sm bg-slate-50/50">
        <Card.Header>
            <Card.Title class="text-lg">إضافة منطقة جديدة</Card.Title>
            <Card.Description>
                حدد المحافظة لتظهر المنطقة مجمّعة تحتها في قائمة التسجيل
            </Card.Description>
        </Card.Header>
        <Card.Content>
            <form onsubmit={handleCreate} class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <!-- الاسم -->
                    <div class="space-y-1.5">
                        <Field.Label for="r-name">اسم المنطقة *</Field.Label>
                        <Input id="r-name" bind:value={name} required
                            placeholder="مثال: بيت لاهيا، مخيم الدهيشة"
                            class="bg-white rounded-xl h-10" />
                    </div>
                    <!-- المحافظة -->
                    <div class="space-y-1.5">
                        <Field.Label for="r-gov">المحافظة *</Field.Label>
                        <select
                            id="r-gov"
                            bind:value={governorate}
                            class="w-full h-10 rounded-xl border border-input bg-white px-3 text-sm text-right appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                            dir="rtl"
                        >
                            <option value="">اختر المحافظة...</option>
                            {#each GOVERNORATES as gov}
                                <option value={gov}>{gov}</option>
                            {/each}
                        </select>
                    </div>
                    <!-- الوصف -->
                    <div class="space-y-1.5">
                        <Field.Label for="r-desc">الوصف</Field.Label>
                        <Input id="r-desc" bind:value={description}
                            placeholder="وصف مختصر"
                            class="bg-white rounded-xl h-10" />
                    </div>
                </div>

                <!-- رابط الصورة -->
                <div class="space-y-1.5">
                    <Field.Label for="r-img" class="flex items-center gap-1.5">
                        <ImageIcon class="size-3.5" />
                        رابط صورة المعلم التاريخي
                    </Field.Label>
                    <Input id="r-img" bind:value={imageUrl}
                        placeholder="https://upload.wikimedia.org/..."
                        class="bg-white rounded-xl h-10 font-mono text-sm"
                        dir="ltr" />
                    <p class="text-xs text-slate-400">
                        ستظهر هذه الصورة كخلفية لكل مستخدم مسجّل من هذه المنطقة
                    </p>
                </div>

                <!-- معاينة الصورة -->
                {#if imageUrl && !previewErr}
                    <div class="relative rounded-2xl overflow-hidden h-32 border border-slate-200">
                        <img src={imageUrl} alt="معاينة"
                            class="w-full h-full object-cover"
                            onerror={() => { previewErr = true; }} />
                        <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-3">
                            <span class="text-white text-sm font-medium">{name || "معاينة"} {governorate ? `— ${governorate}` : ""}</span>
                        </div>
                    </div>
                {/if}
                {#if imageUrl && previewErr}
                    <div class="rounded-2xl border border-red-200 bg-red-50 h-16 flex items-center justify-center gap-2 text-red-500 text-sm">
                        <ImageIcon class="size-4" />
                        <span>رابط الصورة غير صحيح</span>
                    </div>
                {/if}

                <Button type="submit" disabled={submitting}
                    class="rounded-xl h-10 px-8 font-bold">
                    {#if submitting}<Loader2 class="size-4 animate-spin ml-2" />{/if}
                    إضافة المنطقة
                </Button>
            </form>
        </Card.Content>
    </Card.Root>

    <!-- ── خطأ ── -->
    {#if error}
        <Alert.Root variant="destructive" class="rounded-2xl border-none bg-destructive/10 text-destructive">
            <AlertCircle class="size-5" />
            <Alert.Title>خطأ</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
    {/if}

    <!-- ══════════════════════════════════════
         الجدول مجمّع حسب المحافظة
    ══════════════════════════════════════ -->
    {#if loading}
        <div class="flex justify-center py-16">
            <Loader2 class="size-8 animate-spin text-slate-300" />
        </div>
    {:else if grouped().size === 0}
        <Card.Root class="rounded-3xl border-dashed border-2 border-slate-200 text-center py-16">
            <MapPin class="size-8 mx-auto mb-2 text-slate-300" />
            <p class="text-slate-400">لا توجد مناطق حالياً</p>
        </Card.Root>
    {:else}
        <div class="space-y-3">
            {#each [...grouped().entries()] as [gov, items]}
                <Card.Root class="rounded-2xl border-none shadow-sm overflow-hidden">
                    <!-- رأس المحافظة — قابل للطي -->
                    <button
                        type="button"
                        onclick={() => toggleCollapse(gov)}
                        class="w-full flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                    >
                        <div class="flex items-center gap-2.5">
                            <MapPin class="size-4 text-slate-400" />
                            <span class="font-bold text-sm">محافظة {gov}</span>
                            <span class="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">
                                {items.length}
                            </span>
                        </div>
                        <ChevronLeft class="size-4 text-slate-400 transition-transform {collapsed[gov] ? 'rotate-90' : '-rotate-90'}" />
                    </button>

                    <!-- صفوف المنطقة -->
                    {#if !collapsed[gov]}
                        <div class="divide-y divide-slate-50">
                            {#each items as region (region.regionsId)}
                                {#if editingId === region.regionsId}
                                    <!-- صف التعديل -->
                                    <div class="bg-blue-50/40 border-r-2 border-r-blue-400 p-3">
                                        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                                            <Input bind:value={editName} class="h-8 text-sm rounded-lg" placeholder="الاسم" />
                                            <select
                                                bind:value={editGov}
                                                class="h-8 rounded-lg border border-input bg-white px-2 text-sm text-right"
                                                dir="rtl"
                                            >
                                                <option value="">المحافظة...</option>
                                                {#each GOVERNORATES as g}
                                                    <option value={g}>{g}</option>
                                                {/each}
                                            </select>
                                            <Input bind:value={editDesc} class="h-8 text-sm rounded-lg" placeholder="الوصف" />
                                            <Input bind:value={editImg} class="h-8 text-xs rounded-lg font-mono" placeholder="رابط الصورة" dir="ltr" />
                                        </div>
                                        {#if editImg && !editPreviewErr}
                                            <div class="relative rounded-lg overflow-hidden h-14 mb-2 w-32">
                                                <img src={editImg} alt="" class="w-full h-full object-cover"
                                                    onerror={() => { editPreviewErr = true; }} />
                                            </div>
                                        {/if}
                                        <div class="flex items-center gap-1.5">
                                            <Button size="sm" disabled={submitting}
                                                onclick={() => handleEdit(region.regionsId)}
                                                class="h-7 px-3 rounded-lg bg-green-500 hover:bg-green-600 text-xs font-bold">
                                                {#if submitting}<Loader2 class="size-3 animate-spin ml-1" />{/if}
                                                حفظ
                                            </Button>
                                            <Button variant="ghost" size="sm"
                                                onclick={() => { editingId = null; }}
                                                class="h-7 px-2 rounded-lg text-xs">
                                                إلغاء
                                            </Button>
                                        </div>
                                    </div>
                                {:else}
                                    <!-- صف العرض -->
                                    <div class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                                        <!-- صورة مصغرة -->
                                        {#if region.imageUrl}
                                            <div class="w-12 h-9 rounded-lg overflow-hidden shrink-0 border border-slate-100 shadow-sm">
                                                <img src={region.imageUrl} alt={region.name}
                                                    class="w-full h-full object-cover"
                                                    onerror={(e) => {
                                                        const t = e.currentTarget as HTMLImageElement;
                                                        t.parentElement!.style.display = 'none';
                                                    }} />
                                            </div>
                                        {:else}
                                            <div class="w-12 h-9 rounded-lg bg-slate-100 shrink-0 flex items-center justify-center">
                                                <ImageIcon class="size-3.5 text-slate-400" />
                                            </div>
                                        {/if}

                                        <!-- الاسم والوصف -->
                                        <div class="flex-1 min-w-0">
                                            <p class="font-semibold text-sm text-slate-800 truncate">{region.name}</p>
                                            {#if region.description}
                                                <p class="text-xs text-slate-400 truncate">{region.description}</p>
                                            {/if}
                                        </div>

                                        <!-- الرقم -->
                                        <span class="text-xs font-mono text-slate-300 shrink-0">#{region.regionsId}</span>

                                        <!-- أزرار -->
                                        <div class="flex items-center gap-1 shrink-0">
                                            <Button variant="ghost" size="icon"
                                                onclick={() => startEdit(region)}
                                                class="hover:bg-blue-50 hover:text-blue-600 rounded-full h-8 w-8"
                                                title="تعديل">
                                                <Pencil class="size-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon"
                                                onclick={() => handleDelete(region.regionsId)}
                                                class="hover:bg-red-50 hover:text-red-500 rounded-full h-8 w-8"
                                                title="حذف">
                                                <Trash2 class="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                {/if}
                            {/each}
                        </div>
                    {/if}
                </Card.Root>
            {/each}
        </div>
    {/if}
</div>
