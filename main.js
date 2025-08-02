document.addEventListener('DOMContentLoaded', () => {
  // === UPLOAD PAGE LOGIC ===
  const uploadInput = document.getElementById('photoUpload');
  const submitBtn = document.getElementById('submitBtn');
  const nameInput = document.getElementById('userName');

  if (submitBtn && uploadInput) {
    submitBtn.addEventListener('click', () => {
      const file = uploadInput.files[0];
      let userName = "You";
      if (nameInput) {
        userName = nameInput.value.trim() || "You";
        sessionStorage.setItem("userName", userName);
      }
      if (!file) {
        alert("Upload your face first.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("File too big! Must be under 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = function (e) {
        sessionStorage.setItem("uploadedImage", e.target.result);
        sessionStorage.removeItem("matchResult");
        window.location.href = "processing.html";
      };
      reader.readAsDataURL(file);
    });
  }

  // === PROCESSING PAGE LOGIC ===
  if (document.body.classList.contains("processing-page")) {
    setTimeout(() => {
      const veggies = [
        {
          name: "🥔 You are a Potato",
          roast: "Congratulations, you radiate the energy of a forgotten sack in a damp cellar. People would rather get a disease than eat you raw. Even instant mashed potatoes have more ambition.",
          img: "images/potato.png",
          theme: { gradient: "linear-gradient(135deg, #e4c16f 0%, #b5884d 100%)", accent: "#a27641" }
        },
        {
          name: "🍅 You are a Tomato",
          roast: "You’re soft, squishy, and people make faces if they see you in a salad. The only time anyone likes you is after you’re completely pulverized—with seasoning, lots and lots of seasoning.",
          img: "images/tomato.png",
          theme: { gradient: "linear-gradient(135deg, #ff6a5b 0%, #a72128 100%)", accent: "#ff3a1a" }
        },
        {
          name: "🥕 You are Carrot",
          roast: "So boring, you’re best known as rabbit food. The highlight of your existence is making people’s vision slightly less terrible—too bad you can’t do anything about personalities.",
          img: "images/carrot.png",
          theme: { gradient: "linear-gradient(135deg, #faa700 0%, #f75d57 100%)", accent: "#fa6b24" }
        },
        {
          name: "🍈 You are Jackfruit",
          roast: "Spiky, confusing, and massive—yet still somehow unappetizing. People look at you and have questions about evolution.",
          img: "images/jackfruit.png",
          theme: { gradient: "linear-gradient(135deg, #eaff6e 0%, #84ab2a 100%)", accent: "#c4c844" }
        },
        {
          name: "🍆 You are Eggplant",
          roast: "People only acknowledge you as a bad emoji. Anyone who bites you raw regrets every decision that led them there.",
          img: "images/eggplant.png",
          theme: { gradient: "linear-gradient(135deg, #b86cc0 0%, #683197 100%)", accent: "#a060c6" }
        },
        {
          name: "🍉 You are Watermelon",
          roast: "You’re basically water, but somehow manage to be sticky and annoying. No one remembers you, except as that thing full of seeds and disappointment.",
          img: "images/watermelon.png",
          theme: { gradient: "linear-gradient(135deg, #f63a51 0%, #37e197 100%)", accent: "#37e197" }
        },
        {
          name: "🧅 You are Onion",
          roast: "You bring people to tears by simply existing. Peeling away your layers is like therapy: expensive, laborious, and ultimately unrewarding.",
          img: "images/onion.png",
          theme: { gradient: "linear-gradient(135deg, #fff0be 0%, #debbc2 100%)", accent: "#b67e99" }
        },
        {
          name: "🥒 You are Bittergourd",
          roast: "People actively avoid you. The only time they want you is when someone tells them it's 'good for health'—which is the vegetable world’s lowest compliment.",
          img: "images/bittergourd.png",
          theme: { gradient: "linear-gradient(135deg, #8afa77 0%, #2d4d37 100%)", accent: "#34734b" }
        },
        {
          name: "🥒 You are Cucumber",
          roast: "No taste, no presence, no flair. You’re the backup dancer of vegetables: always there, never wanted.",
          img: "images/cucumber.png",
          theme: { gradient: "linear-gradient(135deg, #b2fcd1 0%, #41905b 100%)", accent: "#399e69" }
        },
        {
          name: "🥚 You are Egg",
          roast: "You crumble under the slightest pressure. People can’t even agree if you count as breakfast or a cholesterol risk.",
          img: "images/egg.png",
          theme: { gradient: "linear-gradient(135deg, #fffbe0 0%, #e6e2b7 100%)", accent: "#fed86e" }
        },
        {
          name: "🥬 You are Drumstick",
          roast: "Stringy, forgettable, and no one actually likes you except people who can't admit to bad decisions in life.",
          img: "images/drumstick.png",
          theme: { gradient: "linear-gradient(135deg, #baeba7 0%, #216a2a 100%)", accent: "#4fb269" }
        },
        {
          name: "🍍 You are Pineapple",
          roast: "Rough outside, unwelcoming spikes, and only good after someone suffers to reach your mediocre interior. Even pizza says 'keep away.'",
          img: "images/pineapple.png",
          theme: { gradient: "linear-gradient(135deg, #ffd46e 0%, #e6be29 100%)", accent: "#ffb300" }
        },
        {
          name: "🎃 You are Pumpkin",
          roast: "Annoying trend every October, but the rest of the year? More dead inside than a Thanksgiving centerpiece.",
          img: "images/pumpkin.png",
          theme: { gradient: "linear-gradient(135deg, #ffdd7e 0%, #ff923a 100%)", accent: "#f87e07" }
        },
        {
          name: "🌶️ You are Red Chilli",
          roast: "All heat, no substance. People only remember you when you ruin their day—or their digestive system.",
          img: "images/redchilli.png",
          theme: { gradient: "linear-gradient(135deg, #fe4e50 0%, #a10024 100%)", accent: "#fe1616" }
        }
      ];
      const randomMatch = veggies[Math.floor(Math.random() * veggies.length)];
      sessionStorage.setItem("matchResult", JSON.stringify(randomMatch));
      window.location.href = "output.html";
    }, 4000);
  }

  // === OUTPUT PAGE LOGIC & CERTIFICATE ===
  if (document.body.classList.contains("output-page")) {
    const imageData = sessionStorage.getItem("uploadedImage");
    const userFace = document.getElementById("userFace");
    const veggiePic = document.getElementById("veggiePic");
    const fruitNameEl = document.querySelector('.fruit-name');
    const roastTextEl = document.querySelector('.roast-text');
    const overlay = document.getElementById("outputOverlay");
    // Matching array (same as above)
    const veggies = [
      {
        name: "🥔 You are a Potato",
        roast: "Congratulations, you radiate the energy of a forgotten sack in a damp cellar. People would rather get a disease than eat you raw. Even instant mashed potatoes have more ambition.",
        img: "images/potato.png",
        theme: { gradient: "linear-gradient(135deg, #e4c16f 0%, #b5884d 100%)", accent: "#a27641" }
      },
      // ... repeat all other veggie objects exactly as above ...
      {
        name: "🌶️ You are Red Chilli",
        roast: "All heat, no substance. People only remember you when you ruin their day—or their digestive system.",
        img: "images/redchilli.png",
        theme: { gradient: "linear-gradient(135deg, #fe4e50 0%, #a10024 100%)", accent: "#fe1616" }
      }
    ];

    if (userFace && imageData) {
      userFace.src = imageData;
      userFace.style.display = "block";
    }

    userFace.onload = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('models/');
        await faceapi.nets.faceLandmark68Net.loadFromUri('models/');
        const detection = await faceapi
          .detectSingleFace(userFace, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();
        let match;
        if (detection) {
          const landmarks = detection.landmarks;
          const jaw = landmarks.getJawOutline();
          const leftBrow = landmarks.getLeftEyeBrow();
          const faceWidth = jaw[16].x - jaw[0].x;
          const faceHeight = jaw[8].y - leftBrow[0].y;
          const aspectRatio = faceWidth / faceHeight;
          if (aspectRatio > 1.15) {
            match = veggies.find(v => v.name.includes("Jackfruit")) || veggies[0];
          } else if (aspectRatio < 0.85) {
            match = veggies.find(v => v.name.includes("Drumstick")) ||
                    veggies.find(v => v.name.includes("Cucumber")) ||
                    veggies.find(v => v.name.includes("Carrot")) || veggies[0];
          } else if (faceHeight > 190) {
            match = veggies.find(v => v.name.includes("Eggplant")) ||
                    veggies.find(v => v.name.includes("Pumpkin")) || veggies[0];
          } else if (faceWidth < 120) {
            match = veggies.find(v => v.name.includes("Red Chilli")) || veggies[0];
          } else {
            match = veggies[Math.floor(Math.random() * veggies.length)];
          }
        } else {
          match = veggies[Math.floor(Math.random() * veggies.length)];
        }

        if (veggiePic && match.img) { veggiePic.src = match.img; veggiePic.style.display = "block"; }
        fruitNameEl.textContent = match.name;
        roastTextEl.textContent = match.roast;

        if (match.theme && overlay) {
          overlay.style.background = match.theme.gradient;
          fruitNameEl.style.color = match.theme.accent;
          document.dispatchEvent(new CustomEvent('fruitThemeUpdate', { detail: match.theme }));
        }

        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(match.roast);
        msg.pitch = 0.8;
        msg.rate = 1;
        speechSynthesis.speak(msg);

      } catch (err) {
        const fallback = veggies[Math.floor(Math.random() * veggies.length)];
        if (veggiePic && fallback.img) { veggiePic.src = fallback.img; veggiePic.style.display = "block"; }
        fruitNameEl.textContent = fallback.name;
        roastTextEl.textContent = fallback.roast;
        if (fallback.theme && overlay) {
          overlay.style.background = fallback.theme.gradient;
          fruitNameEl.style.color = fallback.theme.accent;
          document.dispatchEvent(new CustomEvent('fruitThemeUpdate', { detail: fallback.theme }));
        }
        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(fallback.roast);
        msg.pitch = 0.8;
        msg.rate = 1;
        speechSynthesis.speak(msg);
      }
    };
    if (userFace && userFace.complete) userFace.onload();

    // === Certificate Download Logic (with classic stamp) ===
    document.getElementById('downloadCertBtn')?.addEventListener('click', function() {
      const userName = sessionStorage.getItem("userName") || "You";
      const fruitName = document.querySelector('.fruit-name')?.textContent || "";
      const roast = document.querySelector('.roast-text')?.textContent || "";
      const veggieImgSrc = document.getElementById('veggiePic')?.src || "";

      const canvas = document.createElement('canvas');
      canvas.width = 680;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');

      // Comic pop-art background
      ctx.fillStyle = "#fbeab8";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(340,180);
      for(let i=0;i<24;i++){
        ctx.rotate(Math.PI/12);
        ctx.fillStyle = i%2? "#ff8c00":"#fed700";
        ctx.beginPath();
        ctx.moveTo(0,0); ctx.lineTo(0,-180); ctx.lineTo(12,-160); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      ctx.strokeStyle = "#fe4e50";
      ctx.lineWidth = 7;
      ctx.strokeRect(12,12,canvas.width-24,canvas.height-24);

      let img = new window.Image();
      img.crossOrigin='anonymous';
      img.onload = function() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(110, 155, 68, 0, 2*Math.PI);
        ctx.clip();
        ctx.drawImage(img, 42, 87, 136, 136);
        ctx.restore();

        ctx.font = "900 35px Montserrat, sans-serif";
        ctx.fillStyle = "#d40032";
        ctx.textAlign = "center";
        ctx.fillText("Face-to-Fruit Certificate", canvas.width/2, 60);

        ctx.font = "bold 31px Montserrat, sans-serif";
        ctx.fillStyle = "#0f0243";
        ctx.fillText(" ", 340, 225);

        ctx.font = "24px Montserrat, sans-serif";
        ctx.fillStyle = "#e26ee5";
        ctx.fillText(fruitName, 340, 270);

        ctx.font = "18px 'Fira Sans', sans-serif";
        ctx.fillStyle = "#374750";
        let roastLines = ctx.measureText(roast).width > 520
          ? roast.match(/.{1,44}(\s|$)/g) : [roast];
        roastLines && roastLines.forEach((l,i)=>
          ctx.fillText(l,340, 310+30*i));

        // "ROASTED" badge
        ctx.beginPath();
        ctx.arc(570,85,38,0,2*Math.PI);
        ctx.closePath();
        ctx.fillStyle="#ff6a5b";
        ctx.fill();
        ctx.font="900 19px Montserrat,sans-serif";
        ctx.fillStyle="#fff";
        ctx.fillText("ROASTED!",570, 92);

        // --- Certificate "stamp" with checkmark and CERTIFIED ---
        ctx.save();
        ctx.globalAlpha = 0.87;
        ctx.beginPath();
        ctx.arc(90, 385, 48, 0, 2 * Math.PI);
        ctx.fillStyle = "#ff9125";
        ctx.shadowColor = "#e46e15";
        ctx.shadowBlur = 9;
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(90, 388);
        ctx.rotate(-Math.PI / 14);
        ctx.font = "bold 21px Montserrat, sans-serif";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 2.5;
        ctx.fillText("CERTIFIED", 0, 6);
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 5.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(70, 388);
        ctx.lineTo(85, 400);
        ctx.lineTo(110, 370);
        ctx.stroke();
        ctx.restore();

        let link = document.createElement('a');
        link.download = `${userName}_FaceToFruit_Certificate.png`;
        link.href = canvas.toDataURL();
        link.click();
      };
      img.src = veggieImgSrc;
    });
  }
});
