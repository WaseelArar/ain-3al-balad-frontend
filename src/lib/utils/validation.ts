export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

const textOnlyRegex = /^[\u0600-\u06FFa-zA-Z\s]+$/;
const numbersOnlyRegex = /^[0-9]+$/;

export function sanitizeText(value: string): string {
    return value.replace(/[^\u0600-\u06FFa-zA-Z\s]/g, "");
}

export function sanitizePhone(value: string): string {
    return value.replace(/[^0-9]/g, "").slice(0, 10);
}

export function validateTextOnly(value: string, fieldName = "هذا الحقل"): ValidationResult {
    const trimmed = value.trim();

    if (!trimmed) {
        return { isValid: false, error: `${fieldName} مطلوب` };
    }

    if (!textOnlyRegex.test(trimmed)) {
        return {
            isValid: false,
            error: `${fieldName} يجب أن يحتوي على نصوص فقط بدون أرقام أو رموز`,
        };
    }

    return { isValid: true };
}

export function validateUsername(value: string): ValidationResult {
    const result = validateTextOnly(value, "اسم المستخدم");
    if (!result.isValid) return result;

    if (value.trim().length < 2) {
        return {
            isValid: false,
            error: "اسم المستخدم يجب أن يكون حرفين على الأقل",
        };
    }

    return { isValid: true };
}

export function validatePhone(value: string): ValidationResult {
    const trimmed = value.trim();

    if (!trimmed) {
        return { isValid: false, error: "رقم الهاتف مطلوب" };
    }

    if (!numbersOnlyRegex.test(trimmed)) {
        return { isValid: false, error: "رقم الهاتف يجب أن يحتوي على أرقام فقط" };
    }

    if (trimmed.length !== 10) {
        return {
            isValid: false,
            error: `رقم الهاتف يجب أن يتكون من 10 أرقام بالضبط (أدخلت ${trimmed.length})`,
        };
    }

    return { isValid: true };
}
