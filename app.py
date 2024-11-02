import streamlit as st
import openai

# Set your OpenAI API key
openai.api_key = "your_openai_api_key"  # Replace with your actual API key

def main():
    st.set_page_config(page_title="Spill the Tea", page_icon="☕", layout="centered")
    
    # Background image style
    st.markdown(
        """
        <style>
        .main { background-image: url('https://images.pexels.com/photos/255379/pexels-photo-255379.jpeg?cs=srgb&dl=pexels-padrinan-255379.jpg&fm=jpg');
                background-size: cover; }
        </style>
        """, unsafe_allow_html=True
    )
    
    st.title("☕ Spill the Tea ☕")
    st.markdown("Enter your gossip below, and I'll transform it into Regina George-level drama and chicness!")

    # User input for gossip
    user_input = st.text_area("What's the tea?", placeholder="Enter your gossip here...")

    if st.button("Spill the Drama"):
        if user_input:
            # Generate dramatic output
            with st.spinner("Adding that dramatic flair..."):
                dramatic_output = make_dramatic(user_input)
            st.write(dramatic_output)
        else:
            st.warning("Please spill some tea for me to work with!")

# Function to make the gossip dramatic
def make_dramatic(gossip):
    response = openai.ChatCompletion.create(
        model="gpt-4",  # You can also use "gpt-3.5-turbo" if needed
        messages=[
            {"role": "system", "content": "You are Regina George from Mean Girls, known for your chic, dramatic, and stylish persona. Respond in a way that is dramatic, classy, and stylishly sassy."},
            {"role": "user", "content": f"Here’s the tea: {gossip}. Make it chic, dramatic, and iconic!"}
        ]
    )
    # Extract the response content
    return response['choices'][0]['message']['content']

if __name__ == "__main__":
    main()
