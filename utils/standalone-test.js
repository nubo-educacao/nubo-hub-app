const evaluateJsonLogic = (rule, data) => {
    if (Array.isArray(rule)) {
        return rule.map(item => evaluateJsonLogic(item, data));
    }

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

    const evalArgs = args.map((a) => evaluateJsonLogic(a, data));

    const normalizeValue = (val) => {
        if (val === true || (typeof val === 'string' && val.toLowerCase() === 'sim')) return 'sim';
        if (val === false || (typeof val === 'string' && val.toLowerCase() === 'não') || (typeof val === 'string' && val.toLowerCase() === 'nao')) return 'não';
        if (typeof val === 'string') {
            const trimmed = val.trim();
            if (trimmed !== '' && !isNaN(Number(trimmed))) return Number(trimmed);
            return trimmed.toLowerCase();
        }
        return val;
    };

    switch (op) {
        case '==':
        case '===':
            return normalizeValue(evalArgs[0]) === normalizeValue(evalArgs[1]);
        case 'in':
            if (evalArgs[1] == null || evalArgs[0] == null) return false;
            if (Array.isArray(evalArgs[1])) {
                const val = evalArgs[0];
                if (typeof val === 'string') {
                    return evalArgs[1].some(x => String(x).trim().toLowerCase() === val.trim().toLowerCase());
                }
                return evalArgs[1].includes(val);
            }
            return false;
        case '<':
            return Number(evalArgs[0]) < Number(evalArgs[1]);
        default:
            return false;
    }
};

const testData = {
    "País de nascimento": "Outro país e sou naturalizado brasileiro",
    "Escolaridade": "Ensino Superior Completo",
    "Idade": "28"
};

const rules = [
    {
        name: "País de nascimento",
        rule: {
            "in": [
                { "var": "País de nascimento" },
                ["Brasil", "Outro país e sou naturalizado brasileiro"]
            ]
        }
    },
    {
        name: "Escolaridade",
        rule: {
            "in": [
                { "var": "Escolaridade" },
                [
                    "Ensino Superior Completo",
                    "Ensino Superior Incompleto"
                ]
            ]
        }
    },
    {
        name: "Idade",
        rule: {
            "<": [
                { "var": "Idade" },
                34
            ]
        }
    }
];

console.log("Starting JsonLogic Verification Test...");
rules.forEach(r => {
    const result = evaluateJsonLogic(r.rule, testData);
    console.log(`Criterion: ${r.name} | Result: ${result ? 'PASSED ✅' : 'FAILED ❌'}`);
});
