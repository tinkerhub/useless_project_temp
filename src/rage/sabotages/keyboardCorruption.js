const keyboardCorruption = {

    id: "keyboard-corruption",


    // ========================================
    // CHARACTER MAP
    // ========================================

    characterMap: {

        a: "4",
        b: "8",
        c: "(",
        d: "0",
        e: "3",
        f: "7",
        g: "9",
        h: "#",
        i: "1",
        j: "!",
        k: "κ",
        l: "1",
        m: "^^",
        n: "η",
        o: "0",
        p: "ρ",
        q: "9",
        r: "2",
        s: "$",
        t: "7",
        u: "υ",
        v: "\\/",
        w: "ω",
        x: "%",
        y: "¥",
        z: "2"
    },


    // ========================================
    // TRIGGER
    // ========================================

    trigger(data) {

        const event =
            data.originalEvent;

        const target =
            data.target;


        /*
         * Only corrupt text inputs.
         */
        if (
            !target ||
            !this.isTextInput(target)
        ) {

            return;
        }


        /*
         * Ignore control keys.
         */
        if (
            event.key.length !== 1
        ) {

            return;
        }


        /*
         * Don't corrupt every character.
         *
         * This makes it occasional rather
         * than completely unusable.
         */
        if (
            Math.random() > 0.45
        ) {

            return;
        }


        const replacement =
            this.getReplacement(
                event.key
            );


        if (!replacement) {

            return;
        }


        /*
         * Stop browser from entering
         * the original character.
         */
        event.preventDefault();


        /*
         * Insert corrupted character.
         */
        this.insertText(
            target,
            replacement
        );
    },


    // ========================================
    // CHECK INPUT
    // ========================================

    isTextInput(element) {

        if (
            element.tagName ===
            "TEXTAREA"
        ) {

            return true;
        }


        if (
            element.tagName ===
            "INPUT"
        ) {

            return [
                "text",
                "search",
                "email",
                "password",
                "number"
            ].includes(
                element.type
            );
        }


        return element.isContentEditable;
    },


    // ========================================
    // GET CORRUPTION
    // ========================================

    getReplacement(character) {

        const lower =
            character.toLowerCase();


        const replacement =
            this.characterMap[lower];


        if (!replacement) {

            return null;
        }


        if (
            character ===
            character.toUpperCase()
        ) {

            return replacement.toUpperCase();
        }


        return replacement;
    },


    // ========================================
    // INSERT
    // ========================================

    insertText(element, text) {

        if (
            element.isContentEditable
        ) {

            document.execCommand(
                "insertText",
                false,
                text
            );

            return;
        }


        const start =
            element.selectionStart;

        const end =
            element.selectionEnd;


        element.value =
            element.value.substring(
                0,
                start
            ) +
            text +
            element.value.substring(
                end
            );


        const newPosition =
            start + text.length;


        element.setSelectionRange(
            newPosition,
            newPosition
        );


        element.dispatchEvent(
            new Event(
                "input",
                {
                    bubbles: true
                }
            )
        );
    }
};


export default keyboardCorruption;