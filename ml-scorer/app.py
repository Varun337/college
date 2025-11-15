from fastapi import FastAPI
from pydantic import BaseModel
import random

app = FastAPI()

# ✅ Allow optional fields with defaults
class Transaction(BaseModel):
    amount: float
    merchant: str = "default"
    geo: str = "IN"
    device: str = "mobile"

@app.post("/score")
def score(transaction: Transaction):
    """
    Simulated fraud risk scoring model.
    Returns a score between 0.0 and 1.0
    """
    # Base score grows with transaction amount
    base_score = min(transaction.amount / 10000, 1.0)

    # Add some randomness to simulate behavior
    noise = random.uniform(-0.1, 0.1)
    risk_score = round(max(min(base_score + noise, 1.0), 0.0), 2)

    print(f"💡 Scored transaction: {transaction.dict()} => Score: {risk_score}")

    return {"score": risk_score}
