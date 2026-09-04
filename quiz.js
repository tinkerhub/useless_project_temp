const questionAudioContainer =
  document.getElementById("question-audio-container");


/* =========================
   GET PHOTO ELEMENT
========================= */

const questionImage =
  document.getElementById("question-image");


/* =========================
   QUESTIONS
========================= */

const questions = [

  {
    question:
      "When you meet another Malayali outside Kerala, what's the first thing you want to know?",

    image:
      "images/question1.jpeg",

    answers: [
      {
        text:
          "Nothing, just say namaskaram",

        points:
          2
      },

      {
        text:
          "Sadhanam kayil indo?",

        points:
          8
      },

      {
        text:
          "aliyaaaa......(malayali sixth sense)",

        points:
          4
      },

      {
        text:
          "\"Naattil evideya?(rest is history)\" immediately",

        points:
          10
      }
    ]
  },


  {
    question:
      "Your ideal food looks like...",

    image:
      "images/question10.jpeg",

    answers: [
      {
        text:
          "Porotta and Beef",

        image:
          "images/q41.jpeg",

        points:
          10
      },

      {
        text:
          "Burger And Sandwich",

        image:
          "images/q42.jpeg",

        points:
          2
      },

      {
        text:
          "Biriyani",

        image:
          "images/q43.jpeg",

        points:
          5
      },

      {
        text:
          "Full sadya energy",

        image:
          "images/question4.jpeg",

        points:
          8
      }
    ]
  },


  {
    question:
      "Her Famous Quote",

    image:
      "images/question9.jpeg",

    answers: [
      {
        text:
          "Don't Produce Too much",

        points:
          10
      },

      {
        text:
          "Don't talk too much",

        points:
          5
      },

      {
        text:
          "Don't expect too much",

        points:
          2
      }
    ]
  },


  {
    question:
      "Dialogue From which movie",

    audio:
      "audio/q2.mpeg",

    image:
      "images/q11.jpeg",

    answers: [
      {
        text:
          "Vellanakalude naadu",

        image:
          "images/m1.jpeg",

        points:
          10
      },

      {
        text:
          "Ponmuttayidunna tharavu",

        image:
          "images/m2.jpeg",

        points:
          2
      },

      {
        text:
          "Meesha Madhavan",

        image:
          "images/m33.jpeg",

        points:
          5
      },

      {
        text:
          "Manichithrathaazhu",

        image:
          "images/m5.jpeg",

        points:
          8
      }
    ]
  },


  {
    question:
      "What is the first thing you teach your non mallu friend",

    image:
      "images/question5.jpeg",

    answers: [
      {
        text:
          "Poda Patti!!",

        points:
          10
      },

      {
        text:
          "peru entha?",

        points:
          4
      },

      {
        text:
          "Sugam aano?",

        points:
          8
      },

      {
        text:
          "Kazhicho?",

        points:
          10
      }
    ]
  },


  {
    question:
      "What do you call this?",

    image:
      "images/t1.jpeg",

    answers: [
      {
        text:
          "Kstrc",

        points:
          2
      },

      {
        text:
          "Aana Vandi",

        points:
          5
      },

      {
        text:
          "Bus",

        points:
          8
      }
    ]
  },


  {
    question:
      "Listen carefully. Associate this song with right person?",

    image:
      "images/question6.jpeg",

    audio:
      "audio/q1.mpeg",

    answers: [
      {
        image:
          "images/p1.jpeg",

        points:
          8
      },

      {
        image:
          "images/p2.jpeg",

        points:
          10
      },

      {
        image:
          "images/p3.jpeg",

        points:
          5
      }
    ]
  }

];


/* =========================
   VARIABLES
========================= */

let currentQuestion = 0;

let totalScore = 0;

let selectedPoints = null;

let resultClicks = 0;


/* =========================
   GET HTML ELEMENTS
========================= */

const questionText =
  document.getElementById("question-text");


const answersContainer =
  document.getElementById("answers-container");


const questionNumber =
  document.getElementById("question-number");


const nextButton =
  document.getElementById("next-button");


const progressFill =
  document.getElementById("progress-fill");


/* =========================
   BUTTON MODE
========================= */

/*
  We use one button click handler
  to avoid duplicate event listeners.
*/

nextButton.addEventListener(
  "click",
  handleButtonClick
);


function handleButtonClick() {

  if (currentQuestion < questions.length) {

    handleNext();

  }

}


/* =========================
   SHUFFLE ANSWERS
========================= */

function shuffleAnswers(answers) {

  const shuffled =
    [...answers];


  for (
    let i = shuffled.length - 1;
    i > 0;
    i--
  ) {

    const randomIndex =
      Math.floor(
        Math.random() * (i + 1)
      );


    const temporary =
      shuffled[i];


    shuffled[i] =
      shuffled[randomIndex];


    shuffled[randomIndex] =
      temporary;

  }


  return shuffled;

}


/* =========================
   SHOW QUESTION
========================= */

function showQuestion() {

  selectedPoints = null;


  nextButton.disabled =
    true;


  const current =
    questions[currentQuestion];


  /* UPDATE PHOTO */

  if (questionImage) {

    questionImage.src =
      current.image;


    questionImage.alt =
      `Question ${currentQuestion + 1} image`;

  }


  /* QUESTION NUMBER */

  questionNumber.textContent =
    `Q.${currentQuestion + 1}/${questions.length}`;


  /* QUESTION TEXT */

  questionText.textContent =
    current.question;


  /* =========================
     QUESTION AUDIO
  ========================= */

  questionAudioContainer.innerHTML =
    "";


  if (current.audio) {

    const audio =
      document.createElement("audio");


    audio.src =
      current.audio;


    audio.controls =
      true;


    audio.classList.add(
      "question-audio"
    );


    questionAudioContainer.appendChild(
      audio
    );

  }


  /* CLEAR OLD ANSWERS */

  answersContainer.innerHTML =
    "";


  /* SHUFFLE ANSWERS */

  const shuffledAnswers =
    shuffleAnswers(
      current.answers
    );


  /* CREATE ANSWER BUTTONS */

  shuffledAnswers.forEach(
    function(answer) {


      const button =
        document.createElement(
          "button"
        );


      button.classList.add(
        "answer-option"
      );


      /* IMAGE ANSWER */

      if (answer.image) {

        const optionImage =
          document.createElement(
            "img"
          );


        optionImage.src =
          answer.image;


        optionImage.alt =
          answer.text || "Answer option";


        optionImage.classList.add(
          "answer-image"
        );


        button.appendChild(
          optionImage
        );


        /* Only add text if it exists */

        if (answer.text) {

          const optionText =
            document.createElement(
              "span"
            );


          optionText.textContent =
            answer.text;


          optionText.classList.add(
            "answer-text"
          );


          button.appendChild(
            optionText
          );

        }


        button.classList.add(
          "image-answer"
        );

      }


      /* TEXT ANSWER */

      else {

        button.textContent =
          answer.text;

      }


      /* ANSWER CLICK */

      button.addEventListener(
        "click",
        function() {

          selectAnswer(
            button,
            answer.points
          );

        }
      );


      answersContainer.appendChild(
        button
      );

    }
  );


  updateProgress();

}


/* =========================
   SELECT ANSWER
========================= */

function selectAnswer(
  button,
  points
) {

  const allAnswers =
    document.querySelectorAll(
      ".answer-option"
    );


  allAnswers.forEach(
    function(answer) {

      answer.classList.remove(
        "selected"
      );

    }
  );


  button.classList.add(
    "selected"
  );


  selectedPoints =
    points;


  nextButton.disabled =
    false;

}


/* =========================
   NEXT QUESTION
========================= */

function handleNext() {

  if (
    selectedPoints === null
  ) {

    return;

  }


  totalScore +=
    selectedPoints;


  currentQuestion++;


  if (
    currentQuestion < questions.length
  ) {

    showQuestion();

  }

  else {

    showResultWaitingPage();

  }

}


/* =========================
   UPDATE PROGRESS
========================= */

function updateProgress() {

  const progress =
    (
      (currentQuestion + 1) /
      questions.length
    ) * 100;


  progressFill.style.width =
    progress + "%";

}


/* =========================
   RESULT WAITING PAGE
========================= */

function showResultWaitingPage() {

  resultClicks =
    0;


  /* REMOVE QUESTION AUDIO */

  if (questionAudioContainer) {

    questionAudioContainer.innerHTML =
      "";

  }


  /* FINAL MODE */

  const desktopLayout =
    document.querySelector(
      ".desktop-layout"
    );


  if (desktopLayout) {

    desktopLayout.classList.add(
      "final-mode"
    );

  }


  /* PAGE CONTENT */

  questionNumber.textContent =
    "FINAL STEP";


  questionText.innerHTML =
    `ARE YOU READY TO SEE<br>YOUR RESULT? 👀`;


  answersContainer.innerHTML =
    `
      <div class="result-message">
        Click the button 3 times to unlock
        the surprise! 🔓
      </div>
    `;


  /* BUTTON */

  nextButton.textContent =
    "SHOW RESULT (0/3)";


  nextButton.disabled =
    false;


  /* SPECIAL BUTTON ACTION */

  nextButton.onclick =
    handleResultClicks;


  progressFill.style.width =
    "100%";

}


/* =========================
   RESULT CLICK COUNTER
========================= */

function handleResultClicks() {

  resultClicks++;


  nextButton.textContent =
    `SHOW RESULT (${resultClicks}/3)`;


  if (
    resultClicks >= 3
  ) {

    /* Remove counter action */

    nextButton.onclick =
      null;


    /* Show final video */

    showResult();

  }

}


/* =========================
   SHOW FINAL VIDEO
========================= */

/* =========================
   SHOW FINAL VIDEO
========================= */

/* =========================
   SHOW FINAL VIDEO
========================= */

function showResult() {

  const desktopLayout =
    document.querySelector(".desktop-layout");

  if (desktopLayout) {

    desktopLayout.classList.add(
      "final-mode"
    );

  }


  /* Remove question audio */

  if (questionAudioContainer) {

    questionAudioContainer.innerHTML = "";

  }


  questionNumber.textContent =
    "THE END";


  questionText.textContent =
    "WHAT ELSE DID YOU EXPECT?👀";


  answersContainer.innerHTML =
    "";


  /* VIDEO WRAPPER */

  const videoWrapper =
    document.createElement("div");

  videoWrapper.classList.add(
    "video-wrapper"
  );


  /* VIDEO */

  const video =
    document.createElement("video");

  video.src =
    "video/final.mp4";

  video.controls =
    true;

  video.preload =
    "auto";

  video.playsInline =
    true;

  video.classList.add(
    "final-video"
  );


  /* PLAY BUTTON */

  const playButton =
    document.createElement("button");

  playButton.classList.add(
    "video-play-button"
  );

  playButton.innerHTML =
    "▶";


  videoWrapper.appendChild(
    video
  );

  videoWrapper.appendChild(
    playButton
  );

  answersContainer.appendChild(
    videoWrapper
  );


  /* PLAY WITH SOUND */

  playButton.addEventListener(
    "click",
    function() {

      video.muted =
        false;

      video.volume =
        1;

      video.play()
        .then(function() {

          playButton.style.display =
            "none";

        })
        .catch(function(error) {

          console.log(
            "Video could not play:",
            error
          );

        });

    }
  );


  /* Show play button again
     when video ends */

  video.addEventListener(
    "ended",
    function() {

      playButton.style.display =
        "flex";

    }
  );


  /* =========================
     POST CREDIT BUTTON
  ========================= */

  nextButton.textContent =
    "POST CREDIT SCENE 🎬";

  nextButton.disabled =
    false;


  /* Remove old events */

  nextButton.removeEventListener(
    "click",
    handleNext
  );


  nextButton.onclick =
    showPostCreditScene;


  progressFill.style.width =
    "100%";

}
/* =========================
   POST CREDIT SCENE
========================= */

function showPostCreditScene() {

  /* Clear button action */

  nextButton.onclick =
    null;


  /* Remove first video */

  answersContainer.innerHTML =
    "";


  /* Change heading */

  questionNumber.textContent =
    "POST CREDIT SCENE";


  questionText.textContent =
    "ONE MORE THING... 👀";


  /* Create video wrapper */

  const videoWrapper =
    document.createElement("div");

  videoWrapper.classList.add(
    "video-wrapper"
  );


  /* Create second video */

  const video =
    document.createElement("video");

  video.src =
    "video/postcredit.mp4";

  video.controls =
    true;

  video.preload =
    "auto";

  video.playsInline =
    true;

  video.classList.add(
    "final-video"
  );


  /* Center play button */

  const playButton =
    document.createElement("button");

  playButton.classList.add(
    "video-play-button"
  );

  playButton.innerHTML =
    "▶";


  /* Add video */

  videoWrapper.appendChild(
    video
  );

  videoWrapper.appendChild(
    playButton
  );

  answersContainer.appendChild(
    videoWrapper
  );


  /* Play second video with sound */

  playButton.addEventListener(
    "click",
    function() {

      video.muted =
        false;

      video.volume =
        1;

      video.play()
        .then(function() {

          playButton.style.display =
            "none";

        })
        .catch(function(error) {

          console.log(
            "Video could not play:",
            error
          );

        });

    }
  );


  /* Show play button if video ends */

  video.addEventListener(
    "ended",
    function() {

      playButton.style.display =
        "flex";

    }
  );


  /* =========================
     REMOVE NEXT BUTTON
  ========================= */

  nextButton.style.display =
    "none";


  progressFill.style.width =
    "100%";

}

/* =========================
   RESTART QUIZ
========================= */

function restartQuiz() {

  /* RESET VARIABLES */

  currentQuestion =
    0;


  totalScore =
    0;


  selectedPoints =
    null;


  resultClicks =
    0;


  /* STOP VIDEO */

  const oldVideo =
    document.querySelector(
      ".final-video"
    );


  if (oldVideo) {

    oldVideo.pause();

    oldVideo.currentTime =
      0;

  }


  /* RETURN TO NORMAL LAYOUT */

  const desktopLayout =
    document.querySelector(
      ".desktop-layout"
    );


  if (desktopLayout) {

    desktopLayout.classList.remove(
      "final-mode"
    );

  }


  /* CLEAR SPECIAL BUTTON ACTION */

  nextButton.onclick =
    null;


  /* RESET BUTTON */

  nextButton.textContent =
    "NEXT →";


  nextButton.disabled =
    true;

nextButton.style.display = "block";
  /* START FROM FIRST QUESTION */

  showQuestion();

}



/* =========================
   CLOCK
========================= */

function updateClock() {

  const clock =
    document.getElementById(
      "clock"
    );


  if (!clock) {

    return;

  }


  const now =
    new Date();


  let hours =
    now.getHours();


  let minutes =
    now.getMinutes();


  const ampm =
    hours >= 12
      ? "PM"
      : "AM";


  hours =
    hours % 12;


  if (hours === 0) {

    hours =
      12;

  }


  if (minutes < 10) {

    minutes =
      "0" + minutes;

  }


  clock.textContent =
    `${hours}:${minutes} ${ampm}`;

}


/* START CLOCK */

updateClock();


setInterval(
  updateClock,
  1000
);


/* =========================
   START QUIZ
========================= */

showQuestion();