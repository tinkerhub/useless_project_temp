import openai

# Ensure you set your OpenAI API key as an environment variable or configure it securely
openai.api_key = "your-openai-api-key"

def dramatize_text(text, drama_level):
    prompt = f"Make the following story more dramatic based on the level {drama_level}:\n{text}"
    response = openai.Completion.create(
        engine="text-davinci-003",
        prompt=prompt,
        max_tokens=300
    )
    return response.choices[0].text.strip()
