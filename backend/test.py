import random
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

# Define a data model for user input
class UserInput(BaseModel):
    favorite_movies: list[str]
    favorite_books: list[str]

@app.post("/recommendation/")
def get_recommendation(user_input: UserInput):
    # Generate recommendations based on genres (for simplicity)
    recommendations = {
        "movies": [
            "Obscure Tax Document",
            "A Guide to Quantum Physics",
            "A Movie About Paperclips"
        ],
        "books": [
            "Instruction Manual for a Blender",
            "History of Paperclips",
            "A Guide to Quantum Physics"
        ]
    }
    # Randomly select one recommendation from movies and books
    return {
        "movies_recommendation": random.choice(recommendations["movies"]),
        "books_recommendation": random.choice(recommendations["books"]),
    }
