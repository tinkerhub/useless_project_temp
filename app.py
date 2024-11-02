import streamlit as st
import openai

# Set your OpenAI API key
openai.api_key = "your_openai_api_key"  # Replace with your actual API key

def main():
    # Set page configuration
    st.set_page_config(page_title="Spill the Tea", page_icon="☕", layout="centered")
    
    # Background image style
    st.markdown(
        """
        <style>
        .main {
            background-image: url('https://i.imgur.com/EaHsffn.jpeg');
            background-size: cover;
            background-repeat: no-repeat;
            height: 100vh; /* Set height to full viewport */
            width: 100%; /* Set width to full viewport */
            position: absolute; /* Position the background */
            top: 0;
            left: 0;
            z-index: -1; /* Make sure the background is behind other elements */
        }
        </style>
        """, unsafe_allow_html=True
    )
    
    st.title("☕ Spill the Tea ☕")
    st.markdown("Choose an option below:")
    
    # Use st.query_params() to set parameters
    if st.button("Spill the Tea"):
        st.query_params(page="spill_tea")
        
    if st.button("Get Some Tea"):
        st.query_params(page="get_tea")


if __name__ == "__main__":
    main()
