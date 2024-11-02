import streamlit as st
from utils.gpt_api_handler import dramatize_text
from utils.db_handler import save_tea_to_db

def main():
    st.title("Spill the Tea 🍵")
    st.write("Share your story anonymously and let the drama begin!")

    story = st.text_area("Enter your story here:", placeholder="Type your tea...")
    tags = st.text_input("Tags (comma-separated)", placeholder="e.g., work, love, friends")
    drama_level = st.slider("Drama Level", min_value=1, max_value=10, value=5, format="%d")

    if st.button("Teaify!"):
        if story.strip():
            dramatized_story = dramatize_text(story, drama_level)
            save_tea_to_db(dramatized_story, tags.split(",") if tags else [])
            st.success("Your tea has been added with extra spice!")
            st.write(f"**Dramatized Story:**\n{dramatized_story}")
        else:
            st.error("Please write a story before Teaifying!")

if __name__ == "__main__":
    main()
