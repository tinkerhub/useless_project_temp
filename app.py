from flask import Flask, request, jsonify
from flask_cors import CORS
from Simulation import simulate_growth

app = Flask(__name__)
CORS(app, resources={r"/simulate*": {"origins": "http://127.0.0.1:5500"}})

@app.route("/")
def home():
    return "✅ Banana Simulation API is running. Use /simulate?date=YYYY-MM-DD"

@app.route("/simulate", methods=["GET"])
def simulate():
    start_date = request.args.get('date')
    if not start_date:
        return jsonify({"error": "Missing date parameter"}), 400

    try:
        result = simulate_growth(start_date)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
