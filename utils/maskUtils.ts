/**
 * Utility for applying and validating input masks in Partner Forms.
 */

export const applyMask = (value: string, maskType: string): string => {
    const cleanValue = value.replace(/\D/g, '');

    switch (maskType) {
        case 'cpf':
            return cleanValue
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})/, '$1-$2')
                .replace(/(-\d{2})\d+?$/, '$1');

        case 'cnpj':
            return cleanValue
                .replace(/(\d{2})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1/$2')
                .replace(/(\d{4})(\d{1,2})/, '$1-$2')
                .replace(/(-\d{2})\d+?$/, '$1');

        case 'phone':
            if (cleanValue.length <= 10) {
                return cleanValue
                    .replace(/(\d{2})(\d)/, '($1) $2')
                    .replace(/(\d{4})(\d{1,4})/, '$1-$2')
                    .replace(/(-\d{4})\d+?$/, '$1');
            } else {
                return cleanValue
                    .replace(/(\d{2})(\d)/, '($1) $2')
                    .replace(/(\d{5})(\d{1,4})/, '$1-$2')
                    .replace(/(-\d{4})\d+?$/, '$1');
            }

        case 'cep':
            return cleanValue
                .replace(/(\d{5})(\d)/, '$1-$2')
                .replace(/(-\d{3})\d+?$/, '$1');

        case 'brl':
            if (!cleanValue) return '';
            const amount = (parseInt(cleanValue) / 100).toFixed(2);
            return 'R$ ' + amount.replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');

        case 'date':
            return cleanValue
                .replace(/(\d{2})(\d)/, '$1/$2')
                .replace(/(\d{2})(\d)/, '$1/$2')
                .replace(/(\/\d{4})\d+?$/, '$1');

        case 'number':
            return cleanValue;

        default:
            return value;
    }
};

export const validateMask = (value: string, maskType: string): { isValid: boolean; error?: string } => {
    if (!value) return { isValid: true };

    const clean = value.replace(/\D/g, '');

    switch (maskType) {
        case 'cpf':
            if (clean.length !== 11) return { isValid: false, error: 'CPF deve ter 11 dígitos' };
            return { isValid: validateCPF(clean), error: 'CPF inválido' };

        case 'cnpj':
            if (clean.length !== 14) return { isValid: false, error: 'CNPJ deve ter 14 dígitos' };
            return { isValid: true }; // Basic length check for now

        case 'phone':
            if (clean.length < 10 || clean.length > 11) return { isValid: false, error: 'Telefone inválido' };
            return { isValid: true };

        case 'cep':
            if (clean.length !== 8) return { isValid: false, error: 'CEP deve ter 8 dígitos' };
            return { isValid: true };

        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return { isValid: emailRegex.test(value), error: 'E-mail inválido' };

        case 'date':
            if (clean.length !== 8) return { isValid: false, error: 'Data incompleta' };
            return { isValid: true };

        case 'textarea':
            if (value.length > 500) return { isValid: false, error: 'Máximo de 500 caracteres' };
            return { isValid: true };

        default:
            return { isValid: true };
    }
};

const validateCPF = (cpf: string): boolean => {
    if (/^(\d)\1+$/.test(cpf)) return false;
    let sum = 0;
    let remainder;
    for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;
    return true;
};
