import streamlit as st

def main():
    st.set_page_config(page_title="Spill the Tea", page_icon="☕", layout="centered")
    st.markdown(
        """
        <style>
        .main { background-image: url('https://images.pexels.com/photos/255379/pexels-photo-255379.jpeg?cs=srgb&dl=pexels-padrinan-255379.jpg&fm=jpg');
                background-size: cover; }
        </style>
        """, unsafe_allow_html=True
    )
    
    st.title("☕ Spill the Tea ☕")
    st.markdown("Choose an option below:")
    
    if st.button("Spill the Tea"):
        st.experimental_set_query_params(page="spill_tea")
        
    if st.button("Get Some Tea"):
        st.experimental_set_query_params(page="get_tea")

if __name__ == "__main__":
    main()
