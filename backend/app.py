from flask import Flask, request, jsonify
from flask_cors import CORS

import pandas as pd
import numpy as np
import pickle

from sklearn.model_selection import train_test_split, KFold, cross_val_score
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error


app = Flask(__name__)
CORS(app)

# LOAD DATASET

gold = pd.read_csv("../gld_price_data_3000rows.csv")


gold.head()

gold.shape

gold.info()

# checking the number of missing value
gold.isnull().sum()

# getting the ststistical measures of the data
gold.describe()

#CORRELATION
correlation=gold.corr(numeric_only=True)

#PLOTTING WITH SEABORN

# plt.figure(figsize=(6,6))
# sns.heatmap(correlation,cbar=True,square=True,annot=True,annot_kws={"size":8},cmap="plasma")
# print(correlation['GLD'])



# FEATURES + TARGET

X = gold.drop(["Date", "GLD"], axis=1)
y = gold["GLD"]

# TRAIN TEST SPLIT

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)


# TRAIN MODEL

reg = RandomForestRegressor()
reg.fit(X_train, y_train)


# TEST PREDICTION + METRICS

pred = reg.predict(X_test)

r2 = r2_score(y_test, pred)
mae = mean_absolute_error(y_test, pred)
mse = mean_squared_error(y_test, pred)
rmse = np.sqrt(mse)


# K-FOLD CROSS VALIDATION

kfold = KFold(n_splits=5, shuffle=True, random_state=42)

cv_r2_scores = cross_val_score(reg, X, y, cv=kfold, scoring="r2")
cv_mae_scores = cross_val_score(reg, X, y, cv=kfold, scoring="neg_mean_absolute_error")
cv_mse_scores = cross_val_score(reg, X, y, cv=kfold, scoring="neg_mean_squared_error")

avg_cv_r2 = np.mean(cv_r2_scores)
avg_cv_mae = -np.mean(cv_mae_scores)
avg_cv_mse = -np.mean(cv_mse_scores)
avg_cv_rmse = np.sqrt(avg_cv_mse)


# SAVE MODEL AS PKL

with open("gold_model.pkl", "wb") as f:
    pickle.dump(reg, f)

print(" Model trained and saved: gold_model.pkl")



# ROUTES / APIs

@app.route("/")
def home():
    return "Gold Price Prediction Backend Running "



# METRICS API

@app.route("/metrics", methods=["GET"])
def metrics():
    return jsonify({
        "test_metrics": {
            "r2": round(float(r2), 5),
            "mae": round(float(mae), 5),
            "mse": round(float(mse), 5),
            "rmse": round(float(rmse), 5),
        },
        "kfold_metrics": {
            "avg_r2": round(float(avg_cv_r2), 5),
            "avg_mae": round(float(avg_cv_mae), 5),
            "avg_mse": round(float(avg_cv_mse), 5),
            "avg_rmse": round(float(avg_cv_rmse), 5),
        }
    })



#  PREDICT API

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()

    try:
        spx = float(data["SPX"])
        uso = float(data["USO"])
        slv = float(data["SLV"])
        eurusd = float(data["EURUSD"])

        input_data = np.array([[spx, uso, slv, eurusd]])
        prediction = reg.predict(input_data)[0]

        return jsonify({
            "prediction": round(float(prediction), 2)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400



#  CORRELATION API

@app.route("/correlation", methods=["GET"])
def correlation():
    corr = gold.corr(numeric_only=True)
    corr_with_gld = corr["GLD"].drop("GLD")

    return jsonify({
        "correlation_with_gld": {
            "SPX": round(float(corr_with_gld["SPX"]), 5),
            "USO": round(float(corr_with_gld["USO"]), 5),
            "SLV": round(float(corr_with_gld["SLV"]), 5),
            "EURUSD": round(float(corr_with_gld["EUR/USD"]), 5)
        }
    })



# GLD DISTRIBUTION API

@app.route("/gld_distribution", methods=["GET"])
def gld_distribution():
    gld_values = gold["GLD"].values

    counts, bin_edges = np.histogram(gld_values, bins=20)

    labels = []
    for i in range(len(bin_edges) - 1):
        labels.append(f"{bin_edges[i]:.1f}-{bin_edges[i+1]:.1f}")

    return jsonify({
        "labels": labels,
        "counts": counts.tolist()
    })


if __name__ == "__main__":
    app.run(debug=True)
