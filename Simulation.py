import pandas as pd
from datetime import datetime, timedelta

SAPLING_COST = 50
FERTILIZER_COST_PER_KG = 0.5
CYCLE_MONTHS = 12

# Load your data once
DATA = pd.read_csv('C:/Users/Niranjan S/Useless Projects/Data Models/banana_growth_kerala_updated.csv')

def simulate_growth(start_date_str):
    current_date = datetime.today()
    planting_date = datetime.strptime(start_date_str, "%Y-%m-%d")
    
    current_trees = 1
    total_profit = 0
    history = []

    date = planting_date
    while date <= current_date:
        year = date.year
        month = date.month

        row = DATA[(DATA["Year"] == year) & (DATA["Month"] == month)]
        if row.empty:
            break

        row = row.iloc[0]
        yield_per_tree = row["Yield_per_Tree_kg"]
        market_price = row["Market_Price_per_kg"]
        fertilizer_kg = row["Fertilizer_Used_kg"]
        suckers_per_tree = row["Suckers_per_Tree"]

        income = current_trees * yield_per_tree * market_price
        fertilizer_cost = fertilizer_kg * current_trees * FERTILIZER_COST_PER_KG
        profit = income - fertilizer_cost

        suckers_generated = int(current_trees * suckers_per_tree)
        saplings_from_profit = int(profit // SAPLING_COST)

        new_trees = suckers_generated + saplings_from_profit
        total_profit += profit

        history.append({
            "Cycle": date.strftime("%Y-%m"),
            "Trees": current_trees,
            "Income": round(income),
            "Profit": round(profit),
            "Total_Profit": round(total_profit),
            "New_Trees": new_trees
        })

        current_trees = new_trees
        date += timedelta(days=30 * CYCLE_MONTHS)

    return {
    "profit": round(total_profit),
    "history": history
    }

