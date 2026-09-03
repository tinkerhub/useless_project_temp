// ======================================================
// 🦁🐔 ZOO TALKS - ANIMAL TRANSLATOR
// ======================================================

// Get HTML elements
const animalSelect = document.getElementById("animalSelect");
const textInput = document.getElementById("textInput");
const translateButton = document.getElementById("translateButton");
const clearButton = document.getElementById("clearButton");
const output = document.getElementById("output");
const speakButton = document.getElementById("speakButton");


// ======================================================
// CURRENT STATE
// ======================================================

let currentSound = "";
let currentAnimal = "chicken";


// ======================================================
// 🐾 ANIMAL LANGUAGE DATABASE
// ======================================================

const animalLanguages = {

    // ==================================================
    // 🐔 CHICKEN
    // ==================================================

    chicken: {

        hello: [
            "🐔 KOKORIKOOOO!",
            "🐔 KAKARAKOOOO!",
            "🐔 KOKKA-BOKKA!",
            "🐔 KARA-KARA-KOOOO!",
            "🐔 BOK-BOK-KARAAA!",
            "🐔 KOKORAKA-KOO!"
        ],

        morning: [
            "🐔 KAKARAKOOOOOO!",
            "🐔 KOKORIKAAAA!",
            "🐔 KARA-KARA-KOOOO!",
            "🐔 KAKKA-KARAKOOO!",
            "🐔 KOK-KOK-KARAAAA!",
            "🐔 KAKAROOO-KAKAROOO!"
        ],

        night: [
            "🐔 KOO-KOO-KAAAA...",
            "🐔 KOK-KOOO-KAAA...",
            "🐔 KUUU-KAK-KOO...",
            "🐔 KOOO-KARAAA...",
            "🐔 KOK-KOK-KUUU..."
        ],

        how: [
            "🐔 BOKKABOKKA?",
            "🐔 KOKKA-BOKKA?",
            "🐔 BOK-BOK-KARAA?",
            "🐔 KORAKA-BOK?",
            "🐔 KAK-BOK-KOO?"
        ],

        thanks: [
            "🐔 KOKKA-BOK!",
            "🐔 BOK-BOK-KOO!",
            "🐔 KAKA-KOK!",
            "🐔 KORAKA-BOK!",
            "🐔 KOK-KAK-BOK!"
        ],

        love: [
            "🐔 KAKOOO-KAKOOO!",
            "🐔 KOKKA-KOOOO! ❤️",
            "🐔 KARA-KARAAA! ❤️",
            "🐔 KAK-KAK-KOOOO! ❤️",
            "🐔 KORAKA-KOOOO! ❤️"
        ],

        hungry: [
            "🐔 BOK-BOK-BOKKAAAA!",
            "🐔 KOKKA-BOK-BOKKAAA!",
            "🐔 BOKKA-BOKKA-BOK!",
            "🐔 KAK-BOK-BOKKAAA!",
            "🐔 KOK-KOK-BOKAAAA!"
        ],

        food: [
            "🐔 KOKKA-BOK-BOKKAAA!",
            "🐔 BOK-BOK-KARAAAA!",
            "🐔 KAKKA-BOKKA!",
            "🐔 KOKORAKA-BOK!",
            "🐔 BOKKA-KOKKAAA!"
        ],

        happy: [
            "🐔 KOKORIKOOOO!",
            "🐔 KAKARAKA-KOOOO!",
            "🐔 BOKKA-BOKKA-KOO!",
            "🐔 KOK-KOK-KARAAA!"
        ],

        sad: [
            "🐔 KOOO... BOK...",
            "🐔 KAKOOO...",
            "🐔 BOK... BOK...",
            "🐔 KOO-KOO-KAAA..."
        ],

        angry: [
            "🐔 KAK-KAK-KARAAAA!",
            "🐔 BOK-BOK-BOKKAAA!",
            "🐔 KRAAA-KOK!",
            "🐔 KAKARAKAAAA!"
        ],

        bye: [
            "🐔 KARAKOOOO! BOK BOK!",
            "🐔 KOKKA-KOOOO! BOK!",
            "🐔 KAKARAAA! BOK-BOK!",
            "🐔 KOO-KA-KOOOO!"
        ],

        random: [
            "🐔 KOKA-BOKA-KOOOO!",
            "🐔 BOKKARAKOOO!",
            "🐔 KOO-KA-KOO!",
            "🐔 KAK-BOK-KARAAA!",
            "🐔 KOKORAKAAAA!",
            "🐔 BOKA-BOKA-KOO!",
            "🐔 KARA-KARA-KOOOO!",
            "🐔 KOKKA-KOKKA-BOK!",
            "🐔 KAKKA-BOKKA-KOOOO!",
            "🐔 KORAKA-KORAKA-BOK!"
        ]
    },


    // ==================================================
    // 🐶 DOG
    // ==================================================

    dog: {

        hello: [
            "🐶 WOOF-WOOF!",
            "🐶 WOOOFFFF!",
            "🐶 ARF-ARF!",
            "🐶 BOW-WOW!",
            "🐶 RUFF-RUFF!",
            "🐶 WOOF-WOO-WOO!"
        ],

        morning: [
            "🐶 AWOOOOOO!",
            "🐶 WOOF-WOOF-WOOF!",
            "🐶 ARF-AROOOO!",
            "🐶 RUFF-RUFF-GOOD!",
            "🐶 WOOOO-AWOOOO!"
        ],

        night: [
            "🐶 AWWOOOOOO...",
            "🐶 WOOO... RUFF...",
            "🐶 AWOOO-WOOO...",
            "🐶 RUFF... WOOOO..."
        ],

        how: [
            "🐶 WOOF-WOOF?",
            "🐶 ARF-RUFF?",
            "🐶 WOO-WOO?",
            "🐶 RUFF-RUFF-WOO?"
        ],

        thanks: [
            "🐶 WOOF-WOOF!",
            "🐶 RUFF-RUFF!",
            "🐶 ARF-WOOF!",
            "🐶 BOW-WOW!"
        ],

        love: [
            "🐶 WOOF-WOOF! ❤️",
            "🐶 WOOO-RUFF! ❤️",
            "🐶 WHIMPER-WOOF! ❤️",
            "🐶 ARF-ARF-WOO! ❤️"
        ],

        hungry: [
            "🐶 WOOF-WOOF-BOW!",
            "🐶 RUFF-RUFF-WOOF!",
            "🐶 ARF-ARF-ARF!",
            "🐶 WOO-WOO-WOO!",
            "🐶 BOW-WOW-RUFF!"
        ],

        food: [
            "🐶 WOOF-BOW-WOW!",
            "🐶 RUFF-RUFF-FOOD!",
            "🐶 ARF-WOOF-WOOF!",
            "🐶 WOO-WOO-BOW!"
        ],

        happy: [
            "🐶 WOOF-WOOF-WOOF!",
            "🐶 YIP-YIP-YIP!",
            "🐶 WOOO-WOOF!",
            "🐶 BOW-WOW-WOO!"
        ],

        sad: [
            "🐶 WHIIIMPER...",
            "🐶 WOOO... WOO...",
            "🐶 WHINE-WOOF...",
            "🐶 RUFF... WHIMPER..."
        ],

        angry: [
            "🐶 GRRRRR-WOOF!",
            "🐶 GRRRR-ARF!",
            "🐶 WOOF-WOOF-GRRR!",
            "🐶 RAWR-WOOF!",
            "🐶 GRRRRRRR!"
        ],

        bye: [
            "🐶 WOOF-WOOF!",
            "🐶 AWOOOO!",
            "🐶 RUFF-RUFF!",
            "🐶 BOW-WOW!",
            "🐶 WOOO-WOOF!"
        ],

        random: [
            "🐶 WOOF-WOOF!",
            "🐶 ARF-ARF!",
            "🐶 RUFF-RUFF!",
            "🐶 BOW-WOW!",
            "🐶 WOOOFFFF!",
            "🐶 AWOOOO!",
            "🐶 GRRR-WOOF!",
            "🐶 WOO-WOO-RUFF!",
            "🐶 ARF-WOOF!",
            "🐶 RUFF-ARF-RUFF!"
        ]
    },


    // ==================================================
    // 🐱 CAT
    // ==================================================

    cat: {

        hello: [
            "🐱 MEOOOOW!",
            "🐱 MEOW-MEOW!",
            "🐱 MRAAAOW!",
            "🐱 MEE-YAAOW!",
            "🐱 MROW-MROW!"
        ],

        morning: [
            "🐱 MEOOOOW-MEOW!",
            "🐱 MRAAAOW!",
            "🐱 MEE-YAAOW!",
            "🐱 MROW-MROW-MEOOW!"
        ],

        night: [
            "🐱 MRRROOOOW...",
            "🐱 MEOOOOW...",
            "🐱 PURRRR...",
            "🐱 MROW... MROW..."
        ],

        how: [
            "🐱 MEOOW?",
            "🐱 MRRRAOW?",
            "🐱 MEO-MEO?",
            "🐱 MIAAAOW?"
        ],

        thanks: [
            "🐱 MEOOW-MEOOW!",
            "🐱 PURR-MEOOW!",
            "🐱 MROW-MROW!",
            "🐱 MRRR-MEO!"
        ],

        love: [
            "🐱 PURRRRR! ❤️",
            "🐱 MEOOOOW! ❤️",
            "🐱 MRRRAAAOW! ❤️",
            "🐱 MROW-MROW! ❤️"
        ],

        hungry: [
            "🐱 MEOOW-MEOOW!",
            "🐱 MRAAAOW-MEOOW!",
            "🐱 MEE-YAAOW!",
            "🐱 MROW-MROW-MROW!"
        ],

        food: [
            "🐱 MEOOW-MEOW!",
            "🐱 MRAOW-MRAOW!",
            "🐱 MIAAAOW!",
            "🐱 MRRR-MEOOW!"
        ],

        happy: [
            "🐱 PURRRR-MEOOW!",
            "🐱 MEO-MEO-MEO!",
            "🐱 MRRRAAAOW!",
            "🐱 PURR-PURR!"
        ],

        sad: [
            "🐱 MEOOOOW...",
            "🐱 MRRR... MEOOW...",
            "🐱 MIAAAOW...",
            "🐱 MROW... MROW..."
        ],

        angry: [
            "🐱 HISSSSS!",
            "🐱 MRRRAAAOW!",
            "🐱 HISS-MEOOW!",
            "🐱 HSSSS-MRAOW!",
            "🐱 GRRRR-MEOOW!"
        ],

        bye: [
            "🐱 MEOOOOW!",
            "🐱 MROW-MROW!",
            "🐱 MRRRAOW!",
            "🐱 PURR-MEOOW!"
        ],

        random: [
            "🐱 MEOOOOW!",
            "🐱 MEOW-MEOW!",
            "🐱 MEE-YAAOW!",
            "🐱 MRAAAOW!",
            "🐱 PURR-MEOOW!",
            "🐱 MEO-MEO-MEO!",
            "🐱 MIAAAOW!",
            "🐱 MRROOOOW!",
            "🐱 MEOOW-MRRR!",
            "🐱 MROW-MROW!"
        ]
    },


    // ==================================================
    // 🐮 COW
    // ==================================================

    cow: {

        hello: [
            "🐮 MOOOOOO!",
            "🐮 MOOO-MOO!",
            "🐮 MMOOOOOO!",
            "🐮 MOOOO-MUH!",
            "🐮 MOO-MOOOO!"
        ],

        morning: [
            "🐮 MOOOOOO-MOO!",
            "🐮 MMOOOOOO!",
            "🐮 MOOO-WAAAA!",
            "🐮 MOOOO-MOOOO!"
        ],

        night: [
            "🐮 MOOOOOO...",
            "🐮 MMMOOOO...",
            "🐮 MOOO-MUUU...",
            "🐮 MMMMMOOO..."
        ],

        how: [
            "🐮 MOOO?",
            "🐮 MOO-MOO?",
            "🐮 MMMMMOO?",
            "🐮 MOOOO-MUH?"
        ],

        thanks: [
            "🐮 MOO-MOO!",
            "🐮 MOOOO!",
            "🐮 MUUU-MOO!",
            "🐮 MOOO-MUH!"
        ],

        love: [
            "🐮 MOOOOOO! ❤️",
            "🐮 MOOO-MOOO! ❤️",
            "🐮 MUUUUU! ❤️",
            "🐮 MMMOOOO! ❤️"
        ],

        hungry: [
            "🐮 MOOOO-MOO!",
            "🐮 MOOO-WAAAA!",
            "🐮 MMOOO-AAAA!",
            "🐮 MOOOOOO-MUH!"
        ],

        food: [
            "🐮 MOO-MOO-MOOOO!",
            "🐮 MOOOO-MUH!",
            "🐮 MUUU-MOO!",
            "🐮 MOOO-AAAA!"
        ],

        happy: [
            "🐮 MOOOOOO!",
            "🐮 MOO-MOO-MOO!",
            "🐮 MMOOOO!",
            "🐮 MOOO-MOOOO!"
        ],

        sad: [
            "🐮 MOOOO...",
            "🐮 MMMMMOOO...",
            "🐮 MOOO... MOO...",
            "🐮 MUUUUU..."
        ],

        angry: [
            "🐮 MMMMMOOOO!",
            "🐮 MOOOOOO!",
            "🐮 MOOO-GRRR!",
            "🐮 MMMMOOOOOO!"
        ],

        bye: [
            "🐮 MOOOOOO!",
            "🐮 MOOO-MOO!",
            "🐮 MUUUUU!",
            "🐮 MOOOO-MUH!"
        ],

        random: [
            "🐮 MOOOOOO!",
            "🐮 MOOOO-MOO!",
            "🐮 MMOOOOOO!",
            "🐮 MOOO-MOOOO!",
            "🐮 MOO-MOO-MOOOO!",
            "🐮 MOOOOOOO-MUH!",
            "🐮 MMMMMOOOO!",
            "🐮 MOOO-WAAAA!",
            "🐮 MUUUUUU!",
            "🐮 MMMMOOOOOO!"
        ]
    },


    // ==================================================
    // 🐸 FROG
    // ==================================================

    frog: {

        hello: [
            "🐸 RIBBIT!",
            "🐸 RIBBIT-RIBBIT!",
            "🐸 CROAAAK!",
            "🐸 RIB-RIBBIT!",
            "🐸 KROAAK!"
        ],

        morning: [
            "🐸 RIBBIIIIIT!",
            "🐸 CROAAAK!",
            "🐸 RIB-RIB-RIBBIT!",
            "🐸 KROAAK-RIBBIT!"
        ],

        night: [
            "🐸 CROOOOAAAK...",
            "🐸 RIBBIT...",
            "🐸 KRRR-RIBBIT...",
            "🐸 CROAK-CROAK..."
        ],

        how: [
            "🐸 RIBBIT?",
            "🐸 CROAAK?",
            "🐸 KROK-KROK?",
            "🐸 RIB-RIB?"
        ],

        thanks: [
            "🐸 RIBBIT!",
            "🐸 KROAK-KROAK!",
            "🐸 CROK!",
            "🐸 RIB-RIBBIT!"
        ],

        love: [
            "🐸 RIBBIIIIIT! ❤️",
            "🐸 CROAAAK! ❤️",
            "🐸 RIB-RIBBIT! ❤️",
            "🐸 KROOOAK! ❤️"
        ],

        hungry: [
            "🐸 RIBBIT-RIBBIT!",
            "🐸 CROK-CROK!",
            "🐸 KRAK-KRAK!",
            "🐸 RIBBIIIIIT!"
        ],

        food: [
            "🐸 KROAK-KROAK!",
            "🐸 RIB-RIBBIT!",
            "🐸 CROAAAK-RIBBIT!",
            "🐸 KRAK-KRAK!"
        ],

        happy: [
            "🐸 RIBBIT-RIBBIT-RIBBIT!",
            "🐸 CROOOAK!",
            "🐸 KROK-KROK!",
            "🐸 RIBBIIIIIT!"
        ],

        sad: [
            "🐸 RIBBIT...",
            "🐸 CROAAAK...",
            "🐸 KROK... KROK...",
            "🐸 RIB-RIB..."
        ],

        angry: [
            "🐸 KROAAAK!",
            "🐸 CROK-CROK-CROAAAK!",
            "🐸 KRRR-RIBBIT!",
            "🐸 KRAAAK!"
        ],

        bye: [
            "🐸 RIBBIT-RIBBIT!",
            "🐸 CROAAAK!",
            "🐸 KROK-KROK!",
            "🐸 RIBBIIIIIT!"
        ],

        random: [
            "🐸 RIBBIT!",
            "🐸 RIBBIT-RIBBIT!",
            "🐸 CROAAAK!",
            "🐸 RIB-RIBBIT!",
            "🐸 CROK-CROK!",
            "🐸 RIBBIIIIIT!",
            "🐸 KROAAK!",
            "🐸 RIBBIT-KROAK!",
            "🐸 CROK-CROOOAK!",
            "🐸 KRRR-RIBBIT!"
        ]
    },


    // ==================================================
    // 🐦 BIRD
    // ==================================================

    bird: {

        hello: [
            "🐦 CHIRP-CHIRP!",
            "🐦 TWEET-TWEET!",
            "🐦 CHIRRRRP!",
            "🐦 CHEEP-CHEEP!",
            "🐦 TWEET-CHIRP!"
        ],

        morning: [
            "🐦 CHIRRRRUP!",
            "🐦 TWEET-TWEEEET!",
            "🐦 CHIRP-CHIRP-CHIRP!",
            "🐦 CHEEP-CHEEP!"
        ],

        night: [
            "🐦 CHIRP... CHIRP...",
            "🐦 TWEET...",
            "🐦 PEEP... PEEP...",
            "🐦 CHIRRR..."
        ],

        how: [
            "🐦 CHIRP?",
            "🐦 TWEET-TWEET?",
            "🐦 CHEEP?",
            "🐦 CHIRR?"
        ],

        thanks: [
            "🐦 CHIRP-CHIRP!",
            "🐦 TWEET-TWEET!",
            "🐦 CHEEP-CHIRP!",
            "🐦 PEEP-PEEP!"
        ],

        love: [
            "🐦 TWEET-TWEEEET! ❤️",
            "🐦 CHIRRRP! ❤️",
            "🐦 CHEEP-CHEEP! ❤️",
            "🐦 CHIRP-CHIRP! ❤️"
        ],

        hungry: [
            "🐦 CHEEP-CHEEP!",
            "🐦 PEEP-PEEP-PEEP!",
            "🐦 TWEET-TWEET!",
            "🐦 CHIRP-CHIRR!"
        ],

        food: [
            "🐦 CHEEP-CHEEP!",
            "🐦 TWEET-TWEET-TWEET!",
            "🐦 PEEP-PEEP!",
            "🐦 CHIRR-CHIRR!"
        ],

        happy: [
            "🐦 CHIRP-CHIRP-TWEEEET!",
            "🐦 TWEET-TWEET!",
            "🐦 CHIRRRRUP!",
            "🐦 CHEEP-CHEEP-CHEEP!"
        ],

        sad: [
            "🐦 PEEP... PEEP...",
            "🐦 CHIRP...",
            "🐦 TWEET... TWEET...",
            "🐦 CHEEEP..."
        ],

        angry: [
            "🐦 CHIRRRAAAK!",
            "🐦 TWEET-TWEET-CHIRR!",
            "🐦 KRAAAK!",
            "🐦 CHIRR-CHIRR!"
        ],

        bye: [
            "🐦 TWEET-TWEET!",
            "🐦 CHIRP-CHIRP!",
            "🐦 CHEEP-CHEEP!",
            "🐦 CHIRRRRUP!"
        ],

        random: [
            "🐦 CHIRP-CHIRP!",
            "🐦 TWEET-TWEET!",
            "🐦 CHIRRRRP!",
            "🐦 CHEEP-CHEEP!",
            "🐦 CHIRP-CHIRR!",
            "🐦 TWEET-CHIRP!",
            "🐦 CHEE-CHEE-CHEEP!",
            "🐦 CHIRR-CHIRR!",
            "🐦 PEEP-PEEP!",
            "🐦 TWEE-TWEE-CHIRP!"
        ]
    },


    // ==================================================
    // 🦁 LION
    // ==================================================

    lion: {

        hello: [
            "🦁 ROOOOAAAR!",
            "🦁 RAAAAAWR!",
            "🦁 GRRRRAAAAR!",
            "🦁 ROAR-ROAR!",
            "🦁 RRRROOOAAAR!"
        ],

        morning: [
            "🦁 RROOOAAARRR!",
            "🦁 GRRRRAAA!",
            "🦁 RAAAAWWWR!",
            "🦁 ROOOOAR!"
        ],

        night: [
            "🦁 ROOOOOOAAAR...",
            "🦁 GRRRRR...",
            "🦁 RAAAWWWR...",
            "🦁 RRRROOO..."
        ],

        how: [
            "🦁 ROAAAR?",
            "🦁 GRRRR?",
            "🦁 RRAAAWR?",
            "🦁 ROAR?"
        ],

        thanks: [
            "🦁 ROAR-ROAR!",
            "🦁 GRRRRAAA!",
            "🦁 RAAAWWR!",
            "🦁 ROOOAR!"
        ],

        love: [
            "🦁 RROOOAAAR! ❤️",
            "🦁 GRRRRRAAA! ❤️",
            "🦁 RAAAWWWR! ❤️",
            "🦁 ROOOOAR! ❤️"
        ],

        hungry: [
            "🦁 GRRRRAAAAR!",
            "🦁 ROOOOAAAR!",
            "🦁 RAAAWWWR-GRRR!",
            "🦁 RRRROOOAR!"
        ],

        food: [
            "🦁 ROAR-GRRR!",
            "🦁 RAAAWWWR!",
            "🦁 GRRRR-ROAR!",
            "🦁 RROOOOAR!"
        ],

        happy: [
            "🦁 ROOOOAAAR!",
            "🦁 RAAAWWWR!",
            "🦁 GRRRRAAA!",
            "🦁 ROAR-ROAR!"
        ],

        sad: [
            "🦁 RRRROOO...",
            "🦁 GRRRR...",
            "🦁 ROOOAR...",
            "🦁 RAAA..."
        ],

        angry: [
            "🦁 GRRRRRRR!",
            "🦁 RAAAAWWWR!",
            "🦁 ROOOOAAAR!",
            "🦁 GRRRRAAAWWWR!",
            "🦁 RRRROOOO!"
        ],

        bye: [
            "🦁 ROOOOAAAR!",
            "🦁 RAAAWWWR!",
            "🦁 GRRRR-ROAR!",
            "🦁 ROAR-ROAR!"
        ],

        random: [
            "🦁 ROOOOAAAR!",
            "🦁 RAAAAWR!",
            "🦁 GRRRRAAAAR!",
            "🦁 ROAR-ROAR!",
            "🦁 RRRROOOAAAR!",
            "🦁 RAAWRRRR!",
            "🦁 GRRRR-RAAA!",
            "🦁 ROOOAR-MRRAAA!",
            "🦁 RRRRAAAWWWR!",
            "🦁 GRRRRRRR!"
        ]
    }
};


// ======================================================
// 🧠 UNDERSTAND USER'S ENGLISH
// ======================================================

function detectMeaning(text) {

    text = text.toLowerCase().trim();

    if (text === "") {
        return "empty";
    }

    // Good morning FIRST
    if (
        text.includes("good morning") ||
        text.includes("morning") ||
        text.includes("wake up")
    ) {
        return "morning";
    }

    // Good night
    if (
        text.includes("good night") ||
        text.includes("night") ||
        text.includes("sleep")
    ) {
        return "night";
    }

    // How are you
    if (
        text.includes("how are you") ||
        text.includes("how r u")
    ) {
        return "how";
    }

    // Thank you
    if (
        text.includes("thank you") ||
        text.includes("thanks")
    ) {
        return "thanks";
    }

    // Love
    if (
        text.includes("i love you") ||
        text.includes("love you") ||
        text.includes("love")
    ) {
        return "love";
    }

    // Hungry
    if (
        text.includes("hungry") ||
        text.includes("eat") ||
        text.includes("eating")
    ) {
        return "hungry";
    }

    // Food
    if (
        text.includes("food") ||
        text.includes("breakfast") ||
        text.includes("lunch") ||
        text.includes("dinner")
    ) {
        return "food";
    }

    // Happy
    if (
        text.includes("happy") ||
        text.includes("excited") ||
        text.includes("great") ||
        text.includes("awesome")
    ) {
        return "happy";
    }

    // Sad
    if (
        text.includes("sad") ||
        text.includes("cry") ||
        text.includes("upset")
    ) {
        return "sad";
    }

    // Angry
    if (
        text.includes("angry") ||
        text.includes("mad") ||
        text.includes("annoyed")
    ) {
        return "angry";
    }

    // Bye
    if (
        text.includes("bye") ||
        text.includes("goodbye") ||
        text.includes("see you")
    ) {
        return "bye";
    }

    // Hello LAST
    if (
        text.includes("hello") ||
        text.includes("hi") ||
        text.includes("hey")
    ) {
        return "hello";
    }

    return "random";
}


// ======================================================
// 🎲 RANDOM SOUND
// ======================================================

function getRandomSound(soundArray) {

    const randomIndex =
        Math.floor(Math.random() * soundArray.length);

    return soundArray[randomIndex];
}


// ======================================================
// 🌍 TRANSLATE
// ======================================================

function translateAnimal() {

    const text = textInput.value.trim();

    if (text === "") {

        output.textContent = "🐾 BOK-BOK?";

        currentSound = "empty";

        return;
    }

    currentAnimal = animalSelect.value;

    const meaning = detectMeaning(text);

    currentSound = meaning;

    const animalData =
        animalLanguages[currentAnimal];

    let soundList =
        animalData[meaning];

    if (!soundList) {

        soundList =
            animalData.random;
    }

    const result =
        getRandomSound(soundList);

    output.textContent = result;

    // Animation
    output.classList.remove("result-pop");

    void output.offsetWidth;

    output.classList.add("result-pop");
}


// ======================================================
// 🔊 ANIMAL VOICE
// ======================================================

function speakAnimalSound() {

    if (
        !output.textContent ||
        output.textContent.includes("Your zoo sound") ||
        output.textContent.includes("BOK-BOK?")
    ) {
        return;
    }

    let animalText =
        output.textContent
            .replace("🐔", "")
            .replace("🐶", "")
            .replace("🐱", "")
            .replace("🐮", "")
            .replace("🐸", "")
            .replace("🐦", "")
            .replace("🦁", "")
            .replace("❤️", "")
            .trim();

    if (animalText === "") return;

    // Stop previous voice
    window.speechSynthesis.cancel();

    const speech =
        new SpeechSynthesisUtterance(animalText);


    // ==================================================
    // DIFFERENT VOICE FOR EACH ANIMAL
    // ==================================================

    if (currentAnimal === "chicken") {

        speech.rate = 0.70;
        speech.pitch = 1.9;
        speech.volume = 1;

    }

    else if (currentAnimal === "dog") {

        speech.rate = 0.75;
        speech.pitch = 0.65;
        speech.volume = 1;

    }

    else if (currentAnimal === "cat") {

        speech.rate = 0.72;
        speech.pitch = 1.7;
        speech.volume = 1;

    }

    else if (currentAnimal === "cow") {

        speech.rate = 0.55;
        speech.pitch = 0.55;
        speech.volume = 1;

    }

    else if (currentAnimal === "frog") {

        speech.rate = 0.95;
        speech.pitch = 1.4;
        speech.volume = 1;

    }

    else if (currentAnimal === "bird") {

        speech.rate = 1.15;
        speech.pitch = 2.3;
        speech.volume = 1;

    }

    else if (currentAnimal === "lion") {

        speech.rate = 0.48;
        speech.pitch = 0.35;
        speech.volume = 1;

    }


    // ==================================================
    // SPEAK
    // ==================================================

    window.speechSynthesis.speak(speech);
}


// ======================================================
// 🧹 CLEAR BUTTON
// ======================================================

function clearAll() {

    textInput.value = "";

    output.textContent =
        "Your zoo sound will appear here...";

    currentSound = "";

    window.speechSynthesis.cancel();

    textInput.focus();
}


// ======================================================
// 🐾 ANIMAL CHANGED
// ======================================================

animalSelect.addEventListener("change", function () {

    currentAnimal =
        animalSelect.value;

    const previewSounds = {

        chicken:
            "🐔 KOKORIKOOOO!",

        dog:
            "🐶 WOOF-WOOF!",

        cat:
            "🐱 MEOOOOW!",

        cow:
            "🐮 MOOOOOO!",

        frog:
            "🐸 RIBBIT-RIBBIT!",

        bird:
            "🐦 CHIRP-CHIRP!",

        lion:
            "🦁 ROOOOAAAR!"
    };

    output.textContent =
        previewSounds[currentAnimal];

    currentSound = "hello";
});


// ======================================================
// 🔘 BUTTON EVENTS
// ======================================================

translateButton.addEventListener(
    "click",
    translateAnimal
);

speakButton.addEventListener(
    "click",
    speakAnimalSound
);

clearButton.addEventListener(
    "click",
    clearAll
);


// ======================================================
// ⌨️ CTRL + ENTER
// ======================================================

textInput.addEventListener(
    "keydown",
    function(event) {

        if (
            event.ctrlKey &&
            event.key === "Enter"
        ) {

            translateAnimal();
        }
    }
);


// ======================================================
// 🚀 START
// ======================================================

console.log(
    "🐾 Zoo Talks Animal Translator Loaded!"
);