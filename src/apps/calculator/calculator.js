import AppBase from "../base/appBase.js";
import "./calculator.css";

class CalculatorApp extends AppBase {
    constructor() {
        super({
            id: "calculator",
            name: "Calculator",
            icon: "🧮"
        });
    }

    render() {
        return `
            <div class="rage-calculator">

                <div class="rage-calculator-display-container">
                    <div class="rage-calculator-expression" data-calc-expression></div>
                    <div class="rage-calculator-display" data-calc-display>
                        0
                    </div>
                </div>

                <div class="rage-calculator-grid">

                    <button
                        class="rage-calculator-button rage-calculator-clear"
                        data-calc-action="clear">
                        AC
                    </button>

                    <button
                        class="rage-calculator-button"
                        data-calc-action="delete">
                        DEL
                    </button>

                    <button
                        class="rage-calculator-button rage-calculator-operator"
                        data-calc-operation="divide">
                        ÷
                    </button>

                    <button
                        class="rage-calculator-button rage-calculator-operator"
                        data-calc-operation="multiply">
                        ×
                    </button>


                    <button
                        class="rage-calculator-button"
                        data-calc-number="7">
                        7
                    </button>

                    <button
                        class="rage-calculator-button"
                        data-calc-number="8">
                        8
                    </button>

                    <button
                        class="rage-calculator-button"
                        data-calc-number="9">
                        9
                    </button>

                    <button
                        class="rage-calculator-button rage-calculator-operator"
                        data-calc-operation="subtract">
                        −
                    </button>


                    <button
                        class="rage-calculator-button"
                        data-calc-number="4">
                        4
                    </button>

                    <button
                        class="rage-calculator-button"
                        data-calc-number="5">
                        5
                    </button>

                    <button
                        class="rage-calculator-button"
                        data-calc-number="6">
                        6
                    </button>

                    <button
                        class="rage-calculator-button rage-calculator-operator"
                        data-calc-operation="add">
                        +
                    </button>


                    <button
                        class="rage-calculator-button"
                        data-calc-number="1">
                        1
                    </button>

                    <button
                        class="rage-calculator-button"
                        data-calc-number="2">
                        2
                    </button>

                    <button
                        class="rage-calculator-button"
                        data-calc-number="3">
                        3
                    </button>

                    <button
                        class="rage-calculator-button rage-calculator-equals"
                        data-calc-action="equals">
                        =
                    </button>


                    <button
                        class="rage-calculator-button rage-calculator-zero"
                        data-calc-number="0">
                        0
                    </button>

                    <button
                        class="rage-calculator-button"
                        data-calc-number=".">
                        .
                    </button>

                </div>

                <div
                    class="rage-calculator-status"
                    data-calc-status>
                </div>

            </div>
        `;
    }
}

/*
 * ============================================================
 * CALCULATOR STATE
 * ============================================================
 */

const calculatorStates = new WeakMap();

function getCalculatorState(calculator) {
    if (!calculatorStates.has(calculator)) {
        calculatorStates.set(calculator, {
            currentValue: "0",
            previousValue: null,
            operation: null,
            waitingForOperand: false,

            // Rage state
            wrongAnswerNext: false,
            operatorSabotaged: false
        });
    }

    return calculatorStates.get(calculator);
}


/*
 * ============================================================
 * DISPLAY
 * ============================================================
 */

function updateDisplay(calculator) {
    const state = getCalculatorState(calculator);

    const display = calculator.querySelector(
        "[data-calc-display]"
    );

    const expression = calculator.querySelector(
        "[data-calc-expression]"
    );

    if (!display) {
        return;
    }

    display.textContent = state.currentValue;

    if (
        state.previousValue !== null &&
        state.operation !== null
    ) {
        expression.textContent =
            `${state.previousValue} ${getOperationSymbol(state.operation)}`;
    } else {
        expression.textContent = "";
    }
}


/*
 * ============================================================
 * OPERATION SYMBOL
 * ============================================================
 */

function getOperationSymbol(operation) {
    switch (operation) {
        case "add":
            return "+";

        case "subtract":
            return "−";

        case "multiply":
            return "×";

        case "divide":
            return "÷";

        default:
            return "";
    }
}


/*
 * ============================================================
 * NUMBER INPUT
 * ============================================================
 */

function inputNumber(calculator, number) {
    const state = getCalculatorState(calculator);

    if (state.waitingForOperand) {
        state.currentValue = number;
        state.waitingForOperand = false;
        updateDisplay(calculator);
        return;
    }

    if (number === ".") {
        if (state.currentValue.includes(".")) {
            return;
        }

        state.currentValue += ".";
        updateDisplay(calculator);
        return;
    }

    if (state.currentValue === "0") {
        state.currentValue = number;
    } else {
        state.currentValue += number;
    }

    updateDisplay(calculator);
}


/*
 * ============================================================
 * OPERATION INPUT
 * ============================================================
 */

function chooseOperation(calculator, operation) {
    const state = getCalculatorState(calculator);

    if (state.previousValue !== null && !state.waitingForOperand) {
        calculate(calculator);
    }

    /*
     * 😈 OPERATOR SABOTAGE
     *
     * Approximately 20% of operator selections
     * secretly swap + and -.
     */

    let actualOperation = operation;

    if (
        (operation === "add" || operation === "subtract") &&
        Math.random() < 0.20
    ) {
        actualOperation =
            operation === "add"
                ? "subtract"
                : "add";

        state.operatorSabotaged = true;

        showStatus(
            calculator,
            "😈 Operator privileges revoked."
        );
    }

    state.previousValue = state.currentValue;
    state.operation = actualOperation;
    state.waitingForOperand = true;

    updateDisplay(calculator);
}


/*
 * ============================================================
 * CALCULATION
 * ============================================================
 */

function calculate(calculator) {
    const state = getCalculatorState(calculator);

    if (
        state.previousValue === null ||
        state.operation === null
    ) {
        return;
    }

    const first = Number(state.previousValue);
    const second = Number(state.currentValue);

    let result;

    switch (state.operation) {
        case "add":
            result = first + second;
            break;

        case "subtract":
            result = first - second;
            break;

        case "multiply":
            result = first * second;
            break;

        case "divide":
            if (second === 0) {
                result = "ERROR";
            } else {
                result = first / second;
            }
            break;

        default:
            return;
    }


    /*
     * ========================================================
     * 😈 WRONG ANSWER SABOTAGE
     * ========================================================
     *
     * Around 20% of calculations deliberately produce
     * a wrong answer.
     *
     * The next calculation is allowed to work normally.
     */

    if (
        result !== "ERROR" &&
        !state.wrongAnswerNext &&
        Math.random() < 0.20
    ) {
        const correctResult = result;

        result = createWrongAnswer(correctResult);

        state.wrongAnswerNext = true;

        showStatus(
            calculator,
            "😈 Calculator confidence: 100%"
        );
    } else {
        state.wrongAnswerNext = false;
    }


    state.currentValue = formatResult(result);
    state.previousValue = null;
    state.operation = null;
    state.waitingForOperand = true;

    updateDisplay(calculator);

    /*
     * Clear sabotage status after a short delay.
     */
    setTimeout(() => {
        if (calculator.isConnected) {
            clearStatus(calculator);
        }
    }, 1800);
}


/*
 * ============================================================
 * WRONG ANSWER GENERATOR
 * ============================================================
 */

function createWrongAnswer(correctResult) {
    const numericResult = Number(correctResult);

    if (!Number.isFinite(numericResult)) {
        return correctResult;
    }

    /*
     * For small numbers, a simple +1/-1 error
     * makes the sabotage believable.
     */

    if (Math.abs(numericResult) < 10) {
        return numericResult + 1;
    }

    /*
     * Larger numbers get a slightly different error.
     */

    const difference =
        Math.max(1, Math.round(Math.abs(numericResult) * 0.1));

    return numericResult + difference;
}


/*
 * ============================================================
 * RESULT FORMATTING
 * ============================================================
 */

function formatResult(result) {
    if (result === "ERROR") {
        return result;
    }

    if (!Number.isFinite(Number(result))) {
        return "ERROR";
    }

    const numericResult = Number(result);

    /*
     * Avoid ugly floating-point results such as:
     *
     * 0.30000000000000004
     */

    return Number(
        numericResult.toFixed(10)
    ).toString();
}


/*
 * ============================================================
 * CLEAR
 * ============================================================
 */

function clearCalculator(calculator) {
    calculatorStates.set(calculator, {
        currentValue: "0",
        previousValue: null,
        operation: null,
        waitingForOperand: false,
        wrongAnswerNext: false,
        operatorSabotaged: false
    });

    clearStatus(calculator);
    updateDisplay(calculator);
}


/*
 * ============================================================
 * DELETE
 * ============================================================
 */

function deleteLastCharacter(calculator) {
    const state = getCalculatorState(calculator);

    if (state.waitingForOperand) {
        return;
    }

    if (state.currentValue.length <= 1) {
        state.currentValue = "0";
    } else {
        state.currentValue =
            state.currentValue.slice(0, -1);
    }

    updateDisplay(calculator);
}


/*
 * ============================================================
 * 😈 RUNAWAY EQUALS BUTTON
 * ============================================================
 */

function maybeMoveEqualsButton(calculator) {
    /*
     * 25% chance of triggering.
     */

    if (Math.random() >= 0.25) {
        return;
    }

    const equalsButton = calculator.querySelector(
        "[data-calc-action='equals']"
    );

    if (!equalsButton) {
        return;
    }

    equalsButton.classList.add(
        "rage-calculator-equals-runaway"
    );

    /*
     * Move the button using CSS variables.
     */

    const x =
        Math.floor(Math.random() * 70) - 35;

    const y =
        Math.floor(Math.random() * 50) - 25;

    equalsButton.style.setProperty(
        "--rage-equals-x",
        `${x}px`
    );

    equalsButton.style.setProperty(
        "--rage-equals-y",
        `${y}px`
    );

    showStatus(
        calculator,
        "😈 You thought you could press that?"
    );

    console.log(
        "😈 Calculator sabotage triggered: Equals button moved"
    );

    /*
     * Return the button after a short delay.
     */

    setTimeout(() => {
        if (!equalsButton.isConnected) {
            return;
        }

        equalsButton.classList.remove(
            "rage-calculator-equals-runaway"
        );

        equalsButton.style.removeProperty(
            "--rage-equals-x"
        );

        equalsButton.style.removeProperty(
            "--rage-equals-y"
        );
    }, 1400);
}


/*
 * ============================================================
 * STATUS MESSAGE
 * ============================================================
 */

function showStatus(calculator, message) {
    const status = calculator.querySelector(
        "[data-calc-status]"
    );

    if (!status) {
        return;
    }

    status.textContent = message;
}


function clearStatus(calculator) {
    const status = calculator.querySelector(
        "[data-calc-status]"
    );

    if (status) {
        status.textContent = "";
    }
}


/*
 * ============================================================
 * EVENT HANDLING
 * ============================================================
 *
 * We use event delegation so the calculator doesn't require
 * changes to WindowManager or AppManager.
 */

document.addEventListener("click", (event) => {
    const calculator = event.target.closest(
        ".rage-calculator"
    );

    if (!calculator) {
        return;
    }

    const button = event.target.closest(
        "button"
    );

    if (!button) {
        return;
    }


    /*
     * Number
     */

    const number = button.dataset.calcNumber;

    if (number !== undefined) {
        inputNumber(calculator, number);
        return;
    }


    /*
     * Operation
     */

    const operation = button.dataset.calcOperation;

    if (operation !== undefined) {
        chooseOperation(
            calculator,
            operation
        );

        return;
    }


    /*
     * Actions
     */

    const action = button.dataset.calcAction;

    switch (action) {

        case "clear":
            clearCalculator(calculator);
            break;

        case "delete":
            deleteLastCharacter(calculator);
            break;

        case "equals":
            maybeMoveEqualsButton(calculator);
            calculate(calculator);
            break;
    }
});


/*
 * ============================================================
 * KEYBOARD SUPPORT
 * ============================================================
 */

document.addEventListener("keydown", (event) => {

    /*
     * Only react when the calculator is actually visible.
     */

    const calculators = document.querySelectorAll(
        ".rage-calculator"
    );

    if (calculators.length === 0) {
        return;
    }

    const calculator =
        calculators[calculators.length - 1];

    if (!calculator.isConnected) {
        return;
    }


    /*
     * Numbers
     */

    if (/^[0-9.]$/.test(event.key)) {
        inputNumber(
            calculator,
            event.key
        );

        return;
    }


    /*
     * Operators
     */

    const operationMap = {
        "+": "add",
        "-": "subtract",
        "*": "multiply",
        "/": "divide"
    };

    if (operationMap[event.key]) {
        chooseOperation(
            calculator,
            operationMap[event.key]
        );

        return;
    }


    /*
     * Enter = Equals
     */

    if (event.key === "Enter" || event.key === "=") {

        maybeMoveEqualsButton(calculator);

        calculate(calculator);

        return;
    }


    /*
     * Escape = Clear
     */

    if (event.key === "Escape") {
        clearCalculator(calculator);
        return;
    }


    /*
     * Backspace = Delete
     */

    if (event.key === "Backspace") {
        deleteLastCharacter(calculator);
    }
});


export default CalculatorApp;