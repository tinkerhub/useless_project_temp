import streamlit as st
from utils.db_handler import get_tea_from_db

def main():
    st.title("Get Some Tea ☕")
    st.write("Browse the latest drama-filled stories!")

    # Background image style
    st.markdown(
        """
        <style>
        .main { background-image: url('https://i.imgur.com/kuHrL6K.png');
                background-size: cover; }
        </style>
        """, unsafe_allow_html=True
    )

    # Define the tea categories and corresponding images
    tea_categories = {
        "Work": "https://i.imgur.com/0ozazoc.png",
        "University": "https://i.imgur.com/ZToGmJI.png",
        "Love": "https://i.imgur.com/gk2WyIk.png",
        "Friends": "https://i.imgur.com/WL3nsM4.png",
        "Others": "https://i.imgur.com/ftDq9hg.png",
        "Exes": "https://i.imgur.com/9Cc0Qmq.png",
        "Family": "https://i.imgur.com/aMQeD57.png",
    }

    # Display buttons for each tea category
    selected_category = None

    col1, col2, col3 = st.columns(3)  # Creating three columns for layout

    # Creating buttons for each category
    for category, img_url in tea_categories.items():
        with st.container():
            st.image(img_url, width=100)  # Displaying the image
            if st.button(category):
                selected_category = category  # Store the selected category
                st.session_state.selected_category = selected_category  # Save selected category in session state

    # If a category is selected, clear previous content and fetch stories
    if selected_category:
        st.rerun()  # Refresh the app to show new content

    # Display the selected category stories
    if "selected_category" in st.session_state:
        selected_category = st.session_state.selected_category
        st.write(f"You selected: **{selected_category}**")
        
        stories = get_tea_from_db(selected_category.lower())  # Fetch stories with the selected tag

        if stories:
            for story in stories:
                st.markdown(f"**Story**: {story['text']}")
                st.markdown(f"*Tags*: {', '.join(story['tags'])}")
                st.markdown(f"*Drama Level*: {story.get('drama_level', 'N/A')}")
                st.markdown(f"*Posted on*: {story['timestamp'].strftime('%Y-%m-%d %H:%M:%S')}")
                st.markdown("---")  # Separator between stories
        else:
            st.write("No stories found for the selected category.")

if __name__ == "__main__":
    main()
