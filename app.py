import streamlit as st

def main():
    st.set_page_config(page_title="Spill the Tea", page_icon="☕", layout="centered")
    st.markdown(
        """
        <style>
        .main { background-image: url('https://imgur.com/a/4sB6PMc');
                background-size: cover; }
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
