import pymongo

# Connect to MongoDB
client = pymongo.MongoClient("mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority")
db = client['spill_the_tea_db']
collection = db['tea_stories']

def save_tea_to_db(story, tags):
    document = {"text": story, "tags": tags}
    collection.insert_one(document)

def get_tea_from_db(search_query=""):
    if search_query:
        return list(collection.find({"tags": {"$in": search_query.split(",")}}))
    else:
        return list(collection.find())
