let isOpenCvReady = false;

document.getElementById('imageInput').addEventListener('change', handleImageUpload);

function onOpenCvReady() {
    isOpenCvReady = true;
    document.getElementById('status').innerText = 'OpenCV.js Ready! Select an image to begin.';
    
    const imgElement = document.getElementById('imageSrc');
    if (imgElement.src && imgElement.src !== '') {
        processImage();
    }
}

function onOpenCvError() {
    document.getElementById('status').innerText = 'Failed to load OpenCV.js. Check your internet connection.';
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const imgElement = document.getElementById('imageSrc');
    const reader = new FileReader();

    reader.onload = function(event) {
        imgElement.src = event.target.result;
    };

    imgElement.onload = function() {
        if (isOpenCvReady) {
            processImage();
        } else {
            document.getElementById('status').innerText = 'Image loaded! Waiting for OpenCV.js...';
        }
    };

    reader.readAsDataURL(file);
}

function processImage() {
    document.getElementById('status').innerText = 'Analyzing rice grains...';

    let imgElement = document.getElementById('imageSrc');
    let src = cv.imread(imgElement);
    let gray = new cv.Mat();
    let blurred = new cv.Mat();
    let thresh = new cv.Mat();
    let cleaned = new cv.Mat();
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    // 1. Convert to Grayscale & Apply Heavy Gaussian Blur to flatten background glare
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    let ksize = new cv.Size(11, 11); 
    cv.GaussianBlur(gray, blurred, ksize, 0, 0, cv.BORDER_DEFAULT);

    // 2. Thresholding
    cv.threshold(blurred, thresh, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

    // 3. Morphological Noise Removal (Stronger Kernel: 7x7)
    let M = cv.Mat.ones(7, 7, cv.CV_8U);
    cv.morphologyEx(thresh, cleaned, cv.MORPH_OPEN, M);

    // 4. Contour Detection
    cv.findContours(cleaned, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let totalGrains = 0;
    let fullGrains = 0;
    let brokenGrains = 0;
    let grainData = [];

    // Filter Thresholds for High-Res Phone Photos
    const MIN_GRAIN_AREA = 800;   // Drop small background specks
    const MAX_GRAIN_AREA = 35000; // Drop massive glare borders

    for (let i = 0; i < contours.size(); ++i) {
        let cnt = contours.get(i);
        let area = cv.contourArea(cnt);

        if (area > MIN_GRAIN_AREA && area < MAX_GRAIN_AREA) { 
            let rect = cv.minAreaRect(cnt);
            let width = rect.size.width;
            let height = rect.size.height;
            
            let length = Math.max(width, height);
            let grainWidth = Math.min(width, height);
            let aspectRatio = length / (grainWidth || 1);

            // Rice grains are elongated. Reject square/boxy noise shapes (aspect ratio < 1.3)
            if (aspectRatio >= 1.3) {
                grainData.push({ contour: cnt, length: length, rect: rect });
            } else {
                cnt.delete();
            }
        } else {
            cnt.delete(); 
        }
    }

    if (grainData.length > 0) {
        // Calculate dynamic length threshold based on median length
        let sortedLengths = grainData.map(g => g.length).sort((a, b) => a - b);
        let medianLength = sortedLengths[Math.floor(sortedLengths.length / 2)];
        let thresholdLength = medianLength * 0.72;

        grainData.forEach(g => {
            totalGrains++;
            let isBroken = g.length < thresholdLength;

            if (isBroken) {
                brokenGrains++;
            } else {
                fullGrains++;
            }

            let color = isBroken 
                ? new cv.Scalar(255, 0, 0, 255)   // Red (Broken)
                : new cv.Scalar(0, 255, 0, 255);  // Green (Full)

            let vertices = cv.RotatedRect.points(g.rect);
            for (let j = 0; j < 4; j++) {
                cv.line(src, vertices[j], vertices[(j + 1) % 4], color, 2);
            }
        });
    }

    // Render output image on canvas
    cv.imshow('canvasOutput', src);

    // Update UI Results
    document.getElementById('totalGrains').innerText = totalGrains;
    document.getElementById('fullGrains').innerText = fullGrains;
    document.getElementById('brokenGrains').innerText = brokenGrains;
    document.getElementById('brokenRatio').innerText = totalGrains > 0 
        ? ((brokenGrains / totalGrains) * 100).toFixed(1) + '%' 
        : '0%';
    document.getElementById('status').innerText = 'Analysis complete!';

    // Clean Memory
    src.delete(); 
    gray.delete(); 
    blurred.delete(); 
    thresh.delete(); 
    cleaned.delete(); 
    M.delete(); 
    contours.delete(); 
    hierarchy.delete();
}
