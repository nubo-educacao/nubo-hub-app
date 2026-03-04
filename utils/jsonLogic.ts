export function evaluateJsonLogic(rule: any, data: Record<string, any>): any {
    if (typeof rule !== 'object' || rule === null) {
        return rule;
    }

    const keys = Object.keys(rule);
    if (keys.length === 0) return false;

    const op = keys[0];
    let args = rule[op];
    if (!Array.isArray(args)) {
        args = [args];
    }

    if (op === 'var') {
        const varName = args[0];
        return data[varName];
    }

    const evalArgs = args.map((a: any) => evaluateJsonLogic(a, data));

    const compare = (a: any, b: any, opStr: string) => {
        if (a == null || b == null) return false;
        const numA = Number(a);
        const numB = Number(b);
        const valA = isNaN(numA) ? a : numA;
        const valB = isNaN(numB) ? b : numB;

        switch (opStr) {
            case '>': return valA > valB;
            case '>=': return valA >= valB;
            case '<': return valA < valB;
            case '<=': return valA <= valB;
            default: return false;
        }
    };

    switch (op) {
        case '==':
        case '===':
            if (typeof evalArgs[0] === 'string' && typeof evalArgs[1] === 'string') {
                return evalArgs[0].trim().toLowerCase() === evalArgs[1].trim().toLowerCase();
            }
            return evalArgs[0] === evalArgs[1];
        case '!=':
        case '!==':
            if (typeof evalArgs[0] === 'string' && typeof evalArgs[1] === 'string') {
                return evalArgs[0].trim().toLowerCase() !== evalArgs[1].trim().toLowerCase();
            }
            return evalArgs[0] !== evalArgs[1];
        case '>':
        case '>=':
        case '<':
        case '<=':
            return compare(evalArgs[0], evalArgs[1], op);
        case 'in':
            if (evalArgs[1] == null || evalArgs[0] == null) return false;
            if (Array.isArray(evalArgs[1])) {
                const val = evalArgs[0];
                if (typeof val === 'string') {
                    return evalArgs[1].some(x => String(x).trim().toLowerCase() === val.trim().toLowerCase());
                }
                return evalArgs[1].includes(val);
            }
            if (typeof evalArgs[1] === 'string') {
                return evalArgs[1].includes(String(evalArgs[0]));
            }
            return false;
        case 'and':
            return evalArgs.every(Boolean);
        case 'or':
            return evalArgs.some(Boolean);
        case '!':
            return !evalArgs[0];
        default:
            return false;
    }
}
