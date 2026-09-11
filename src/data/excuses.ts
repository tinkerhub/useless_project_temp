export type ExcuseLevel =
    | "plausible"
    | "questionable"
    | "ridiculous"
    | "unhinged";

export type Situation =
    | "late"
    | "assignment"
    | "reply"
    | "meeting"
    | "study"
    | "forgot";

export interface ExcuseTemplate {
    situation: Situation;
    level: ExcuseLevel;
    templates: string[];
}

export const excuseTemplates: ExcuseTemplate[] = [
    {
        situation: "late",
        level: "plausible",
        templates: [
            "There was unexpected traffic on the way here.",
            "My transport was delayed and I couldn't find another route.",
            "I underestimated how long it would take to get here.",
            "I left in what I believed was plenty of time, and the city proved me wrong.",
        ],
    },

    {
        situation: "late",
        level: "questionable",
        templates: [
            "There was a problem with my alarm and I didn't wake up properly.",
            "I had to turn back because I realized I had forgotten something important.",
            "My phone decided to stop cooperating at the worst possible time.",
            "I was very nearly here on time, and then I made the mistake of sitting down.",
            "I got ready on time, but then I decided to check one thing, and the one thing became the entire morning.",
        ],
    },

    {
        situation: "late",
        level: "ridiculous",
        templates: [
            "A delivery vehicle was blocking the only usable exit from my street.",
            "I had to help someone catch a dog that escaped onto the road.",
            "There was a completely unnecessary argument between two auto drivers that somehow blocked the entire road.",
            "Two separate slow walkers in front of me merged into one impossible-to-pass formation.",
            "I followed my usual route, and my usual route appears to have retired.",
        ],
    },

    {
        situation: "late",
        level: "unhinged",
        templates: [
            "I was on my way, but a man released approximately seventeen pigeons into the road and nobody knew what to do.",
            "There was a localized traffic anomaly and every road I took somehow led back to the same intersection.",
            "I would have arrived earlier, but I briefly became involved in an incident that I have been advised not to discuss.",
            "I was here. On time. Then time rearranged itself, and I do not wish to discuss the mechanics.",
            "The road I know was replaced overnight with a different road wearing its road.",
        ],
    },

    {
        situation: "assignment",
        level: "plausible",
        templates: [
            "I misunderstood the submission deadline.",
            "I ran into an unexpected technical issue while finishing the assignment.",
            "I had some trouble getting the final part working properly.",
            "I timed the submission badly and ran out of time at the very end.",
            "The submission was finished, but the portal wasn't accepting uploads.",
        ],
    },

    {
        situation: "assignment",
        level: "questionable",
        templates: [
            "I finished most of it, but the final file somehow got corrupted.",
            "My laptop started behaving strangely while I was preparing the submission.",
            "I thought I had submitted it, but apparently I had not completed the final step.",
            "I accidentally submitted an earlier draft that was missing everything I fixed in the final one.",
            "I completed it fully in my head, which I think should at least count for something.",
        ],
    },

    {
        situation: "assignment",
        level: "ridiculous",
        templates: [
            "The assignment was finished, but my computer chose that exact moment to enter a spiritual crisis.",
            "I accidentally overwrote the final version while trying to make a backup of it.",
            "Everything was ready until my file decided that it no longer believed in itself.",
            "The assignment file corrupted itself because I looked at it too hard.",
            "I renamed the file, and it has not responded to its new name.",
        ],
    },

    {
        situation: "assignment",
        level: "unhinged",
        templates: [
            "The assignment existed. I know this because I remember seeing it. Its current whereabouts are unknown.",
            "I submitted the assignment to my computer, but my computer appears to have submitted it to another dimension.",
            "I would explain what happened to the assignment, but honestly I don't think either of us is ready for that conversation.",
            "The assignment has been submitted to a higher authority and has not yet been returned.",
            "I have completed the assignment. It is beautiful. It is also not in this timeline.",
        ],
    },

    {
        situation: "reply",
        level: "plausible",
        templates: [
            "Sorry, I completely missed your message.",
            "I saw your message and meant to reply, but it slipped my mind.",
            "I've been a bit busy and didn't get around to responding.",
            "I read it and made a mental note to reply. The mental note economy has since collapsed.",
            "I kept meaning to reply, and somehow days passed without a single one of them triggering it.",
        ],
    },

    {
        situation: "reply",
        level: "questionable",
        templates: [
            "I read your message at a really bad time and then completely forgot about it.",
            "I opened the message while doing something else and thought I'd reply later.",
            "I genuinely thought I had already replied.",
            "I opened it intending to reply later, and 'later' turned out to be a myth.",
            "I wrote the reply, then backed out of sending it to keep rewriting it. It lives in drafts.",
        ],
    },

    {
        situation: "reply",
        level: "ridiculous",
        templates: [
            "I was composing a reply in my head for so long that I forgot I hadn't actually sent it.",
            "I accidentally marked the conversation as mentally resolved.",
            "I opened your message, stared at it, and somehow decided that counted as responding.",
            "I rehearsed my reply so thoroughly that I could swear we've already discussed this.",
            "I accidentally sent your reply to somebody else, and they were very confused.",
        ],
    },

    {
        situation: "reply",
        level: "unhinged",
        templates: [
            "I was going to reply, but then I started thinking about how words work and things escalated from there.",
            "Your message arrived during a period of severe administrative turbulence.",
            "I have no defensible explanation. I simply failed.",
            "I replied in a dream. The reply was perfect. It did not survive waking.",
            "The notification bay has become a graveyard of intentions, and your message is its most prominent resident.",
        ],
    },

    {
        situation: "meeting",
        level: "plausible",
        templates: [
            "I had the time confused and thought the meeting was later.",
            "A previous commitment ran over and I couldn't make it in time.",
            "I didn't receive the calendar invite until after the meeting had started.",
            "I wrote down the wrong room number and couldn't find where it was being held.",
        ],
    },

    {
        situation: "meeting",
        level: "questionable",
        templates: [
            "I had a meeting with myself at the same time, and I felt I couldn't abandon it.",
            "I was in the building, but I apparently stood in the wrong hallway the entire time.",
            "I kept waiting for a reminder that never arrived.",
            "I saw the notification and decided the meeting would understand.",
        ],
    },

    {
        situation: "meeting",
        level: "ridiculous",
        templates: [
            "I walked into a different meeting, realized halfway through, but felt it would be rude to leave, so I stayed until the end of that one instead.",
            "The lift opened into a completely different floor layout than I remember, and I genuinely cannot explain how that's possible.",
            "I was there. I was at the meeting. Unfortunately, it was a meeting no one else attended.",
        ],
    },

    {
        situation: "meeting",
        level: "unhinged",
        templates: [
            "I attended the meeting in a parallel dimension where it went very well, so I assumed I didn't need to be here.",
            "The meeting was moved one hour earlier without my knowledge, and I have reason to believe the meeting did this itself.",
            "I did attend. I sat there the whole time. This may be the first thing anyone has ever heard me say about that.",
        ],
    },

    {
        situation: "study",
        level: "plausible",
        templates: [
            "I ran out of time after spending the day on everything else.",
            "I planned to study, but I underestimated how much there was to cover.",
            "I had every intention of studying, but I kept putting it off until playing catch-up was no longer possible.",
        ],
    },

    {
        situation: "study",
        level: "questionable",
        templates: [
            "I studied the wrong topics, which is effectively the same as not studying.",
            "I opened my notes and decided that reading them twice would be enough. It was not.",
            "I was about to start studying when I realized I needed to plan how to study first.",
            "I studied during a moment of peak confidence that has since been strongly contested.",
        ],
    },

    {
        situation: "study",
        level: "ridiculous",
        templates: [
            "I studied so hard the night before that I fell asleep, and the material never actually made it in.",
            "I memorized the layout of the textbook instead of the content, I'm afraid.",
            "I did study, in my dreams, but the dreams are not graded.",
        ],
    },

    {
        situation: "study",
        level: "unhinged",
        templates: [
            "I was going to study, but then I realized I already have all the knowledge I need inside me. I do not.",
            "The subject accessed my study session and declined to be understood.",
            "I spent the evening proving to myself that the exam is a social construct. I still fail.",
        ],
    },

    {
        situation: "forgot",
        level: "plausible",
        templates: [
            "I put it somewhere safe. Too safe, apparently.",
            "It completely slipped my mind while I was getting ready.",
            "I had it with me, and then I did not. I cannot tell you where the transition happened.",
        ],
    },

    {
        situation: "forgot",
        level: "questionable",
        templates: [
            "I set it down somewhere so I wouldn't forget it. That is where the plan failed.",
            "I was going to bring it, and then my brain decided that this trip didn't count.",
            "I held it in my hand and still managed to leave without it. It made eye contact with me, and I did not.",
        ],
    },

    {
        situation: "forgot",
        level: "ridiculous",
        templates: [
            "I put it in a place that also exists in a dream, and I confused the two locations.",
            "The item is not lost. It is simply residing in a dimension slightly adjacent to this one.",
            "My hands were full of other, apparently more important nonsense, and your thing got outvoted.",
        ],
    },

    {
        situation: "forgot",
        level: "unhinged",
        templates: [
            "I have a strong recollection that the item has always been at my house. I would also like it if it were.",
            "I left it behind as a test. A test of what? We will never know, because I forgot the results.",
            "The item and I are currently in a disagreement about which of us is supposed to be remembered.",
        ],
    },
];