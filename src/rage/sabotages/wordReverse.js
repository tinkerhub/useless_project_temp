const wordReverse = {

    id: "word-reverse",


    // ========================================
    // TRIGGER
    // ========================================

    trigger(data) {

        const event =
            data.originalEvent;

        const target =
            data.target;


        if (
            event.key !== " " &&
            event.key !== "Enter"
        ) {

            return;
        }


        if (
            !target ||
            !this.isTextInput(target)
        ) {

            return;
        }


        /*
         * Only reverse occasionally.
         */
        if (
            Math.random() > 0.50
        ) {

            return;
        }


        this.reverseCurrentWord(
            target
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
                "password"
            ].includes(
                element.type
            );
        }


        return false;
    },


    // ========================================
    // REVERSE WORD
    // ========================================

    reverseCurrentWord(input) {

        const position =
            input.selectionStart;


        if (
            position === null
        ) {

            return;
        }


        const beforeCursor =
            input.value.substring(
                0,
                position
            );


        /*
         * Find the beginning of
         * the current word.
         */
        const wordStart =
            Math.max(
                beforeCursor.lastIndexOf(" "),
                beforeCursor.lastIndexOf("\n")
            ) + 1;


        const word =
            input.value.substring(
                wordStart,
                position
            );


        if (
            word.length < 2
        ) {

            return;
        }


        const reversed =
            word.split("").reverse().join("");


        input.value =
            input.value.substring(
                0,
                wordStart
            ) +
            reversed +
            input.value.substring(
                position
            );


        /*
         * Put cursor back where it was.
         */
        input.setSelectionRange(
            position,
            position
        );


        input.dispatchEvent(
            new Event(
                "input",
                {
                    bubbles: true
                }
            )
        );
    }
};


export default wordReverse;