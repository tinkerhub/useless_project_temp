import pymongo

# Connect to MongoDB
client = pymongo.MongoClient("mongodb+srv://aishanama2015:<pdgWIWRmIehfwAb7>@teacluster0.k0k6a.mongodb.net/?retryWrites=true&w=majority&appName=TeaCluster0")
db = client['spill_the_tea_db']
collection = db['tea_stories']

def save_tea_to_db(story, tags, drama_level):
    # Create a document with all necessary fields
    document = {
        "text": story,
        "tags": tags,  # Store tags as a list
        "drama_level": drama_level,  # Add drama level
        "timestamp": datetime.utcnow()  # Add timestamp
    }
    collection.insert_one(document)

def get_tea_from_db(search_query=""):
    if search_query:
        return list(collection.find({"tags": {"$in": search_query.split(",")}}))
    else:
        return list(collection.find())
