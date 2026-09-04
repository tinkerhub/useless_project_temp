import streamlit as st
from PIL import Image
from google import genai
import json

# 1. Page Configuration
st.set_page_config(
    page_title="ChalkLife — The Calcium Index",
    page_icon="🖍️",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# 2. Inject Custom Blackboard / Lab CSS Theme
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Space+Mono:wght@400;700&display=swap');

/* Main Background */
.stApp {
    background: #111827;
    color: #f3f4f6;
    font-family: 'Space Mono', monospace;
}

/* Hide default Streamlit headers */
header {visibility: hidden;}
footer {visibility: hidden;}

/* Custom Header Title */
.chalk-title {
    font-family: 'Caveat', cursive;
    font-size: 5rem !important;
    color: #fef08a;
    text-shadow: 0 0 15px rgba(254, 240, 138, 0.4);
    text-align: center;
    margin-bottom: 0px;
}

.chalk-subtitle {
    font-family: 'Space Mono', monospace;
    font-size: 0.95rem;
    color: #9ca3af;
    text-align: center;
    margin-bottom: 35px;
    letter-spacing: 2px;
    text-transform: uppercase;
}

/* Custom Metric Card Containers */
.metric-card {
    background: #1f2937;
    border: 2px solid #374151;
    border-radius: 16px;
    padding: 24px 16px;
    text-align: center;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    transition: all 0.3s ease;
    height: 100%;
}

.metric-card:hover {
    border-color: #fef08a;
    transform: translateY(-4px);
    box-shadow: 0 15px 30px -5px rgba(254, 240, 138, 0.15);
}

.metric-value {
    font-family: 'Space Mono', monospace;
    font-size: 2.5rem;
    font-weight: 700;
    color: #38bdf8;
    margin-top: 10px;
    margin-bottom: 5px;
}

.metric-label {
    font-size: 0.8rem;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 1.5px;
}

/* Report / Roast Box */
.roast-box {
    background: rgba(254, 240, 138, 0.04);
    border-left: 6px solid #fef08a;
    padding: 25px;
    border-radius: 0 16px 16px 0;
    font-family: 'Caveat', cursive;
    font-size: 2.1rem;
    color: #fef08a;
    margin-top: 25px;
    line-height: 1.3;
}

/* Action Button */
.stButton>button {
    width: 100%;
    background: linear-gradient(135deg, #fef08a 0%, #eab308 100%) !important;
    color: #0f172a !important;
    font-family: 'Space Mono', monospace !important;
    font-weight: 700 !important;
    font-size: 1.2rem !important;
    border-radius: 12px !important;
    border: none !important;
    padding: 16px 24px !important;
    box-shadow: 0 4px 20px rgba(234, 179, 8, 0.3) !important;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.stButton>button:hover {
    box-shadow: 0 6px 25px rgba(234, 179, 8, 0.6) !important;
    transform: scale(1.01);
}

/* File Uploader Custom Styling */
[data-testid="stFileUploader"] {
    background-color: #1f2937;
    border: 2px dashed #4b5563;
    border-radius: 16px;
    padding: 20px;
}

/* Progress Gauge */
.gauge-bg {
    background: #374151;
    border-radius: 20px;
    height: 18px;
    width: 100%;
    overflow: hidden;
    margin-top: 12px;
}

.gauge-fill {
    background: linear-gradient(90deg, #38bdf8, #fef08a);
    height: 100%;
    border-radius: 20px;
}
</style>
""", unsafe_allow_html=True)

# 3. Sidebar Configuration
st.sidebar.markdown("### ⚙️ Lab Settings")
api_key = st.sidebar.text_input("Gemini API Key", type="password", help="Paste your key here or hardcode it in app.py")

# 4. Header UI
st.markdown('<div class="chalk-title">🖍️ CHALK LIFE</div>', unsafe_allow_html=True)
st.markdown('<div class="chalk-subtitle">Predicting Calcium Carbonate Lifespan via Handwriting Geometry</div>', unsafe_allow_html=True)

# 5. Main Layout Split
col_left, col_right = st.columns([1, 1], gap="large")

with col_left:
    st.markdown("##### 📥 Step 1: Upload Handwriting Sample")
    uploaded_file = st.file_uploader("Upload paper scan (A4 / Notebook)", type=["jpg", "png", "jpeg"])
    
    img = None
    if uploaded_file:
        img = Image.open(uploaded_file)
        st.image(img, caption="Loaded Handwriting Sample", use_container_width=True)
    else:
        st.info("💡 Tip: Upload a clear photo of handwritten text or paper.")

with col_right:
    st.markdown("##### 🔬 Step 2: Run Degradation Physics")
    
    if img and st.button("⚡ ANALYZE CALCIUM LIFESPAN"):
        if not api_key:
            st.error("⚠️ Please enter a Gemini API Key in the left sidebar first!")
        else:
            with st.spinner("🔬 Computing stroke thickness, downward pressure, and chalk friction coefficient..."):
                try:
                    client = genai.Client(api_key=api_key)
                    
                    prompt = """
                    Analyze this handwritten sample image. 
                    Act as a senior material physics researcher studying chalk degradation on a standard slate blackboard.
                    
                    Return ONLY a raw, valid JSON object (no markdown, no triple backticks) with these exact keys:
                    {
                        "estimated_letters_in_sample": 12,
                        "avg_stroke_length_per_letter_cm": 2.8,
                        "pressure_tier": "Balanced Academic",
                        "wear_factor": 1.1,
                        "academic_roast": "Your cursive 'e' exerts excessive friction on blackboard slates, risking early chalk fracture."
                    }
                    """
                    
                    response = client.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=[img, prompt]
                    )
                    
                    raw_text = response.text.strip().replace("```json", "").replace("```", "").strip()
                    data = json.loads(raw_text)
                    
                    # Chalk calculations
                    TOTAL_USABLE_CHALK_CM = 120000.0  # 1200 meters of stroke length per chalk
                    stroke_per_letter = float(data.get("avg_stroke_length_per_letter_cm", 2.5))
                    wear_factor = float(data.get("wear_factor", 1.0))
                    
                    effective_cost_per_letter = stroke_per_letter * wear_factor
                    total_letters = int(TOTAL_USABLE_CHALK_CM / effective_cost_per_letter)
                    total_words = int(total_letters / 5)
                    
                    # Display Results Cards
                    st.markdown("---")
                    res_c1, res_c2 = st.columns(2)
                    
                    with res_c1:
                        st.markdown(f"""
                        <div class="metric-card">
                            <div class="metric-label">Total Letters Remaining</div>
                            <div class="metric-value">{total_letters:,}</div>
                            <div class="gauge-bg"><div class="gauge-fill" style="width: 85%;"></div></div>
                        </div>
                        """, unsafe_allow_html=True)
                    
                    with res_c2:
                        st.markdown(f"""
                        <div class="metric-card">
                            <div class="metric-label">Estimated Word Capacity</div>
                            <div class="metric-value">{total_words:,}</div>
                            <div class="metric-label" style="margin-top:10px;">Pressure Style: <b style="color:#fef08a">{data.get("pressure_tier", "Standard")}</b></div>
                        </div>
                        """, unsafe_allow_html=True)
                    
                    # Physicist's Roast Box
                    st.markdown(f"""
                    <div class="roast-box">
                        " {data.get('academic_roast', 'Handwriting exhibits harmonic equilibrium with calcium carbonate.')} "
                    </div>
                    """, unsafe_allow_html=True)
                    
                    # Equivalent Metrics
                    st.markdown("<br>", unsafe_allow_html=True)
                    st.markdown("###### 📊 Equivalence Breakdown:")
                    st.write(f"• **Quadratic Equations:** ~{int(total_letters / 18):,} formulas")
                    st.write(f"• **Formal Resignation Letters:** ~{int(total_words / 150):,} documents")
                    st.write(f"• **Classroom Disciplinary Warnings:** ~{int(total_letters / 14):,} times")
                    
                except Exception as e:
                    st.error(f"Analysis Error: {e}")