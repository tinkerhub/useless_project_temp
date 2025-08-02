def simulate_growth(start_date_str):
    planting_date = datetime.strptime(start_date_str, "%Y-%m-%d")
    current_date = datetime.today()
    
    date = planting_date
    current_trees = 1
    total_profit = 0
    age = 0
    history = []

    while date <= current_date:
        year = date.year
        month = date.month

        row = BANANA_DATA[(BANANA_DATA["Year"] == year) & (BANANA_DATA["Month"] == month)]
        if row.empty or age >= len(CHILD_COST_DATA):
            break

        row = row.iloc[0]
        yield_kg = row["Yield_per_Tree_kg"]
        price = row["Market_Price_per_kg"]
        fertilizer_kg = row["Fertilizer_Used_kg"]
        suckers = row["Suckers_per_Tree"]

        income = current_trees * yield_kg * price
        fertilizer_cost = current_trees * fertilizer_kg * FERTILIZER_COST_PER_KG
        child_cost = CHILD_COST_DATA.loc[CHILD_COST_DATA["Age"] == age, "Yearly_Expenditure_INR"].values[0]
        profit = income - fertilizer_cost - child_cost

        suckers_generated = int(current_trees * suckers)
        saplings_from_profit = int(profit // SAPLING_COST)
        new_trees = suckers_generated + saplings_from_profit
        total_profit += profit

        history.append({
            "Cycle": date.strftime("%Y-%m"),
            "Age": age,
            "Trees": current_trees,
            "Income": round(income),
            "Fert_Cost": round(fertilizer_cost),
            "Child_Cost": round(child_cost),
            "Profit": round(profit),
            "Total_Profit": round(total_profit),
            "New_Trees": new_trees
        })

        current_trees = new_trees
        age += 1
        date += timedelta(days=30 * CYCLE_MONTHS)

    return {
        "total_profit": round(total_profit),
        "history": history
    }