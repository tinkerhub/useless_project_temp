import { KADI_ROASTS } from '../data/roasts';
import { SnackType } from '../types';

export interface AnalysisResult {
  score: number;
  verdictTitle: string;
  verdictDesc: string;
  footer: string;
  badgeText: string;
  badgeClass: string;
  barColor: string;
  metrics?: {
    dominantHue?: string;
    detectedAttributes?: string[];
  };
}

/**
 * Analyzes an image client-side using HTML5 Canvas pixel sampling,
 * combined with filename heuristics. Fully functional offline.
 */
export async function analyzeSnackImage(
  imageElementOrSrc: HTMLImageElement | string,
  fileName: string,
  type: SnackType
): Promise<AnalysisResult> {
  const lowerName = fileName.toLowerCase();

  // Try extracting pixel color statistics if image is loaded
  let greenRatio = 0;
  let darkRatio = 0;
  let yellowRatio = 0;

  try {
    const img = await resolveImage(imageElementOrSrc);
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, 100, 100);
      const imgData = ctx.getImageData(0, 0, 100, 100).data;
      let totalPixels = 100 * 100;
      let greenCount = 0;
      let darkCount = 0;
      let yellowCount = 0;

      for (let i = 0; i < imgData.length; i += 4) {
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];

        // Dark/black
        if (r < 60 && g < 60 && b < 60) {
          darkCount++;
        }
        // Green
        else if (g > r * 1.15 && g > 75 && b < 130) {
          greenCount++;
        }
        // Yellow
        else if (r > 150 && g > 130 && b < 110) {
          yellowCount++;
        }
      }

      greenRatio = greenCount / totalPixels;
      darkRatio = darkCount / totalPixels;
      yellowRatio = yellowCount / totalPixels;
    }
  } catch (err) {
    console.warn('Canvas pixel analysis skipped (fallback to name heuristics):', err);
  }

  if (type === 'tholi') {
    // 1. Dark/Fossil/Biohazard
    const isDark = lowerName.includes('black') || 
                    lowerName.includes('dark') || 
                    lowerName.includes('overripe') || 
                    lowerName.includes('old') || 
                    lowerName.includes('fossil') || 
                    darkRatio > 0.35;

    // 2. Green/Unripe
    const isGreen = lowerName.includes('green') || 
                    lowerName.includes('unripe') || 
                    lowerName.includes('raw') || 
                    greenRatio > 0.25;

    // 3. Spotted
    const isSpotted = lowerName.includes('spot') || 
                      lowerName.includes('cheetah') || 
                      lowerName.includes('leopard');

    if (isDark) {
      return {
        score: 98,
        verdictTitle: "Biohazard / Fossil",
        verdictDesc: "Bro ask your mom before you have that... or call a museum. This isn't food anymore, it's compost with a soul.",
        footer: "Critical dark mass detected.",
        badgeText: "Biohazard",
        badgeClass: "roast-badge",
        barColor: "var(--accent-black)"
      };
    } else if (isGreen) {
      const greenScore = Math.floor(Math.random() * 10) + 5;
      return {
        score: greenScore,
        verdictTitle: "Solid Tree Branch",
        verdictDesc: "Are you a parrot? Why are you trying to eat a neon-green stick? Give it 5 business days or use it as a weapon.",
        footer: "High chlorophyll count detected.",
        badgeText: "Uncooked Fruit",
        badgeClass: "badge",
        barColor: "var(--accent-green)"
      };
    } else if (isSpotted) {
      const spotScore = Math.floor(Math.random() * 7) + 88;
      return {
        score: spotScore,
        verdictTitle: "Sugar Freckle Cheetah",
        verdictDesc: "Natural sweetness at 100% capacity. The peel is soft, fragile, and ready to slip. Devour before the fruit flies form a committee.",
        footer: "Sugar freckle concentration optimal.",
        badgeText: "Maximum Sugar",
        badgeClass: "badge",
        barColor: "var(--accent-yellow)"
      };
    } else {
      const yellowScore = Math.floor(Math.random() * 15) + 75;
      return {
        score: yellowScore,
        verdictTitle: "Prime Snack Era",
        verdictDesc: "Peak structural stability and sweetness. Consume within the next 14 minutes.",
        footer: "Optimal yellow balance certified.",
        badgeText: "Peak Perfection",
        badgeClass: "badge",
        barColor: "var(--accent-yellow)"
      };
    }
  } else {
    // Kadi (Chai biscuit integrity)
    let randomScore: number;
    if (lowerName.includes('wet') || lowerName.includes('drown') || lowerName.includes('soggy') || lowerName.includes('broke') || lowerName.includes('black') || lowerName.includes('sludge')) {
      randomScore = Math.floor(Math.random() * 20);
    } else if (lowerName.includes('rusk') || lowerName.includes('perfection') || lowerName.includes('master')) {
      randomScore = Math.floor(Math.random() * 16) + 84;
    } else {
      randomScore = Math.floor(Math.random() * 80) + 20;
    }

    const matchedRoast = KADI_ROASTS.find(r => randomScore >= r.minScore && randomScore <= r.maxScore) || KADI_ROASTS[1];

    return {
      score: randomScore,
      verdictTitle: matchedRoast.title,
      verdictDesc: matchedRoast.desc,
      footer: matchedRoast.footer,
      badgeText: matchedRoast.badgeText,
      badgeClass: matchedRoast.badgeClass,
      barColor: randomScore < 46 ? "var(--accent-red)" : "var(--accent-tea)"
    };
  }
}

function resolveImage(input: HTMLImageElement | string): Promise<HTMLImageElement> {
  if (typeof input !== 'string') {
    return Promise.resolve(input);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = input;
  });
}
