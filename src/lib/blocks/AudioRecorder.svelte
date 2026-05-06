<script lang="ts">
    import { onDestroy } from "svelte";
    import { Mic, MicOff, Square, Play, Pause, Trash2, CircleCheck } from "lucide-svelte";

    let { onRecorded = (_b: Blob) => {}, onCleared = () => {} }:
        { onRecorded?: (b: Blob) => void; onCleared?: () => void } = $props();

    let isRecording  = $state(false);
    let isPaused     = $state(false);
    let hasRecording = $state(false);
    let isPlaying    = $state(false);
    let duration     = $state(0);
    let error        = $state("");

    let mediaRecorder: MediaRecorder | null  = null;
    let audioChunks:   Blob[]                = [];
    let audioBlob:     Blob | null           = null;
    let audioUrl       = $state("");
    let audioEl       = $state<HTMLAudioElement | null>(null);
    let timer:         ReturnType<typeof setInterval>|null = null;
    let stream:        MediaStream|null      = null;

    const fmt = (s: number) =>
        `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;

    const startRecording = async () => {
        error = "";
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mime =
                MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" :
                MediaRecorder.isTypeSupported("audio/webm")             ? "audio/webm" :
                MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")  ? "audio/ogg;codecs=opus"  : "audio/ogg";

            mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
            audioChunks   = [];

            mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
            mediaRecorder.onstop = () => {
                const blobType = mime.split(";")[0];
                audioBlob    = new Blob(audioChunks, { type: blobType });
                audioUrl     = URL.createObjectURL(audioBlob);
                hasRecording = true;
                onRecorded(audioBlob);
            };

            mediaRecorder.start(250);
            isRecording = true; isPaused = false; duration = 0;
            timer = setInterval(() => {
                if (!isPaused) duration++;
                if (duration >= 300) stopRecording();
            }, 1000);
        } catch (e: any) {
            if      (e.name === "NotAllowedError") error = "لم يتم السماح بالوصول للمايكروفون.";
            else if (e.name === "NotFoundError")   error = "لم يتم العثور على مايكروفون.";
            else                                   error = "تعذر بدء التسجيل: " + e.message;
        }
    };

    const togglePause = () => {
        if (!mediaRecorder) return;
        if (isPaused) { mediaRecorder.resume(); isPaused = false; }
        else          { mediaRecorder.pause();  isPaused = true;  }
    };

    const stopRecording = () => {
        if (timer) { clearInterval(timer); timer = null; }
        if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
        stream?.getTracks().forEach(t => t.stop());
        isRecording = false; isPaused = false;
    };

    const togglePlay = () => {
        if (!audioEl) return;
        if (isPlaying) { audioEl.pause(); isPlaying = false; }
        else           { audioEl.play();  isPlaying = true;  }
    };

    const clearRecording = () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        audioBlob = null; audioUrl = ""; hasRecording = false;
        isPlaying = false; duration = 0; audioChunks = [];
        onCleared();
    };

    onDestroy(() => {
        if (timer) clearInterval(timer);
        stream?.getTracks().forEach(t => t.stop());
        if (audioUrl) URL.revokeObjectURL(audioUrl);
    });
</script>

<div class="space-y-3" dir="rtl">
    {#if !hasRecording}
        <div class="flex items-center gap-3 flex-wrap">
            {#if !isRecording}
                <button type="button" onclick={startRecording}
                    class="flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-50 border border-red-200
                           text-red-700 hover:bg-red-100 transition-all font-semibold text-sm shadow-sm">
                    <Mic class="size-5" />
                    بدء التسجيل الصوتي
                </button>
            {:else}
                <div class="flex items-center gap-3 flex-wrap">
                    <div class="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-2xl">
                        <div class="size-3 rounded-full bg-red-500 {isPaused ? '' : 'animate-pulse'}"></div>
                        <span class="text-red-700 font-mono text-base font-bold">{fmt(duration)}</span>
                        {#if isPaused}<span class="text-red-400 text-xs mr-1">متوقف</span>{/if}
                    </div>
                    <button type="button" onclick={togglePause}
                        class="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                        title={isPaused ? "استئناف" : "إيقاف مؤقت"}>
                        {#if isPaused}<Play class="size-5 text-slate-600" />{:else}<Pause class="size-5 text-slate-600" />{/if}
                    </button>
                    <button type="button" onclick={stopRecording}
                        class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors text-sm font-semibold">
                        <Square class="size-4 fill-current" /> إنهاء
                    </button>
                </div>
            {/if}
        </div>
        {#if isRecording}
            <p class="text-xs text-slate-400">الحد الأقصى 5 دقائق · متبقي {fmt(300-duration)}</p>
        {/if}
    {:else}
        <div class="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
            <div class="size-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <CircleCheck class="size-6 text-green-600" />
            </div>
            <div class="flex-1">
                <p class="text-sm font-bold text-green-800">تم التسجيل بنجاح</p>
                <p class="text-xs text-green-600">المدة: {fmt(duration)}</p>
            </div>
            <button type="button" onclick={togglePlay}
                class="p-2.5 rounded-xl hover:bg-green-100 transition-colors" title={isPlaying?"إيقاف":"تشغيل"}>
                {#if isPlaying}<Pause class="size-5 text-green-700" />{:else}<Play class="size-5 text-green-700" />{/if}
            </button>
            <button type="button" onclick={clearRecording}
                class="p-2.5 rounded-xl hover:bg-red-100 transition-colors" title="حذف">
                <Trash2 class="size-5 text-red-500" />
            </button>
        </div>
        <audio bind:this={audioEl} src={audioUrl} onended={() => isPlaying=false} class="hidden"></audio>
    {/if}

    {#if error}
        <div class="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            <MicOff class="size-5 shrink-0 mt-0.5" />
            <p>{error}</p>
        </div>
    {/if}
</div>
