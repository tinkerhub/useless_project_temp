from flask import Flask, request, jsonify
from flask_cors import CORS
from simulation2 import simulate_growth
import traceback

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return "✅ Banana & Child Simulation API is running. Use /simulate?date=YYYY-MM-DD"

@app.route("/simulate", methods=["GET"])
def simulate_route():
    start_date = request.args.get('date')
    if not start_date:
        return jsonify({"error": "Missing date parameter"}), 400

    try:
        result = simulate_growth(start_date)
        return jsonify(result)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
