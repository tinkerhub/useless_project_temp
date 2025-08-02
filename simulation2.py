import pandas as pd
from datetime import datetime, timedelta

SAPLING_COST = 50
FERTILIZER_COST_PER_KG = 0.5
CYCLE_MONTHS = 12
#heyhey
# Load data once
BANANA_DATA = pd.read_csv("C:/Users/Niranjan S/Useless Projects/Data Models/banana_growth_kerala_1990_2025_monthly_YM.csv")
CHILD_COST_DATA = pd.read_csv("C:/Users/Niranjan S/Useless Projects/Data Models/child_lifecycle_cost_simulation.csv")

def simulate_growth(dob_str):
    from datetime import datetime
    import pandas as pd

    # Parse date
    dob = datetime.strptime(dob_str, "%Y-%m-%d")
    current_date = datetime.now()
    age_years = current_date.year - dob.year - ((current_date.month, current_date.day) < (dob.month, dob.day))

    # Load data
    try:
        COST_DATA = pd.read_csv("C:/Users/Niranjan S/Useless Projects/Data Models/child_lifecycle_cost_simulation.csv")
        if "Annual_Cost" not in COST_DATA.columns:
            raise ValueError("Annual_Cost column missing")
    except Exception as e:
        raise Exception(f"CSV load error: {str(e)}")

    # Sanitize cost
    annual_cost = COST_DATA["Yearly_Expenditure_INR"].fillna(0).mean()  # Use average as a fallback

    # Tree income simulation
    income_per_tree_per_year = 1200  # example value
    number_of_trees = 1  # Or increase for compounding trees
    total_income = 0

    for year in range(age_years):
        yearly_income = income_per_tree_per_year * number_of_trees
        total_income += yearly_income
        # optionally simulate sucker multiplication
        number_of_trees *= 1.5  # compounding, adjust if needed

    # Adjust if cost included
    estimated_cost = annual_cost * age_years
    net_gain = total_income - estimated_cost

    # Fix negative or huge values
    if net_gain < 0:
        net_gain = 0

    return {
        "name": "anand m s",
        "amount": f"₹{round(net_gain, 2):,}"
    }

