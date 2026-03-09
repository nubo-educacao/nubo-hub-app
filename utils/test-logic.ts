import { evaluateJsonLogic } from './jsonLogic';

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
                    "Ensino Superior Incompleto",
                    "Ensino Médio Completo",
                    "Ensino Medio Completo",
                    "Superior Completo",
                    "Superior Incompleto",
                    "Pós-gradução",
                    "Ensino médio completo"
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
