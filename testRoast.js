const { generateEmotionalDamage } = require('./src/aiRoast');

async function test() {
    const result = await generateEmotionalDamage({
        language: "JavaScript",
        error: "Unexpected token ')'",
        errorCount: 3,
        codingSpeed: "slow"
    });

    console.log("\n===== EMOTIONAL DAMAGE IDE =====\n");
    console.log(result);
}

test();