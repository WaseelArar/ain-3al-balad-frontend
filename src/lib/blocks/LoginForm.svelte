<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import {
        FieldGroup,
        Field,
        FieldLabel,
        FieldDescription,
    } from "$lib/components/ui/field/index.js";
    import * as Alert from "$lib/components/ui/alert/index.js";
    import AlertCircle from "@lucide/svelte/icons/alert-circle";
    import { sanitizeText, validateUsername } from "$lib/utils/validation";

    let username = $state("");
    let password = $state("");
    let error = $state("");
    let usernameError = $state("");
    let {
        dest = "/",
        login = $bindable((username: string, password: string) =>
            console.log("username: ", username, ",password: ", password),
        ),
    }: {
        dest?: string;
        login?: (username: string, password: string) => void | Promise<void>;
    } = $props();
    const id = $props.id();

    const handleUsernameInput = (event: Event) => {
        const input = event.currentTarget as HTMLInputElement;
        const cleanValue = sanitizeText(input.value);
        if (input.value !== cleanValue) {
            input.value = cleanValue;
            username = cleanValue;
        }
        usernameError = "";
    };

    const handleSubmit = async (event: SubmitEvent) => {
        error = "";
        usernameError = "";
        event.preventDefault();

        const usernameValidation = validateUsername(username);
        if (!usernameValidation.isValid) {
            usernameError = usernameValidation.error || "اسم المستخدم غير صالح";
            return;
        }

        try {
            await login(username.trim(), password);
        } catch (err: any) {
            error =
                err.response?.data?.message ||
                "فشل تسجيل الدخول، تأكد من البيانات";
        }
    };
</script>

<Card.Root class="mx-auto w-full max-w-sm">
    <Card.Header>
        <Card.Title class="text-2xl">سجل الدخول الى حسابك</Card.Title>
        <Card.Description
            >ادخل اسم المستخدم وكلمة المرور ادناه لتسجيل الدخول</Card.Description
        >
    </Card.Header>
    <Card.Content>
        <form onsubmit={handleSubmit}>
            <FieldGroup>
                <Field>
                    <FieldLabel for="username-{id}">اسم المستخدم</FieldLabel>
                    <Input
                        id="username-{id}"
                        type="text"
                        placeholder="اسم المستخدم"
                        required
                        bind:value={username}
                        oninput={handleUsernameInput}
                    />
                    {#if usernameError}
                        <p class="text-xs text-red-500 mt-1">{usernameError}</p>
                    {/if}
                </Field>
                <Field>
                    <div class="flex items-center">
                        <FieldLabel for="password-{id}">كلمة المرور</FieldLabel>
                        <a
                            href="##"
                            class="ms-auto inline-block text-sm underline"
                        >
                            هل نسيت كلمة المرور?
                        </a>
                    </div>
                    <Input
                        id="password-{id}"
                        type="password"
                        required
                        placeholder="كلمة المرور"
                        bind:value={password}
                    />
                </Field>
                {#if error}
                    <Field>
                        <Alert.Root
                            variant="destructive"
                            class="bg-destructive/10 text-destructive rounded-2xl border-none"
                        >
                            <AlertCircle class="size-5" />
                            <Alert.Title class="font-bold">خطأ</Alert.Title>
                            <Alert.Description>{error}</Alert.Description>
                        </Alert.Root>
                    </Field>
                {/if}
                <Field>
                    <Button type="submit" class="w-full">تسجيل الدخول</Button>
                    <FieldDescription class="text-center">
                        لا تمتلك حساب بالفعل?
                        <a href={`/auth/signup?goto=${dest}`}>انشئ حساب</a>
                    </FieldDescription>
                </Field>
            </FieldGroup>
        </form>
    </Card.Content>
</Card.Root>
