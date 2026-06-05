from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import numpy as np
import joblib
import tensorflow as tf
from sklearn.metrics.pairwise import cosine_similarity
import re
import os
import uvicorn

app = FastAPI(
    title="KeduaKali AI Service (Surplus & Recommender)",
    description="API Cerdas untuk Prediksi Surplus & Rekomendasi Makanan",
    version="1.0.0"
)

# ==============================================================================
# 1. VARIABEL GLOBAL UNTUK SEMUA MODEL
# ==============================================================================
model_xgboost = None
scaler = None
encoders = None

ncf_model = None
item_encoder = None
ctx_repr_model = None
content_features_global = None
context_ohe = None
CONTEXT_CAT_COLS = None
CONTEXT_NUM_COLS = None
ingredient_encoder = None
category_encoder = None
content_numeric_scaler = None
CONTENT_CAT_COLS = None
CONTENT_NUMERIC_COLS = None
hybrid_features = None
hybrid_meta = None

# ==============================================================================
# 2. DEFINISI CUSTOM OBJECTS MODEL KERAS
# ==============================================================================
@tf.keras.utils.register_keras_serializable(package="KeduaKali")
class L2Normalize(tf.keras.layers.Layer):
    def __init__(self, axis: int = -1, epsilon: float = 1e-8, **kwargs):
        super().__init__(**kwargs)
        self.axis = axis
        self.epsilon = epsilon
    def call(self, inputs: tf.Tensor) -> tf.Tensor:
        return tf.math.l2_normalize(inputs, axis=self.axis, epsilon=self.epsilon)
    def get_config(self) -> dict:
        config = super().get_config()
        config.update({"axis": self.axis, "epsilon": self.epsilon})
        return config

@tf.keras.utils.register_keras_serializable(package="KeduaKali")
class DemandWeightedBCELoss(tf.keras.losses.Loss):
    def __init__(self, mae_weight: float = 0.10, reduction=tf.keras.losses.Reduction.NONE, **kwargs):
        super().__init__(reduction=reduction, **kwargs)
        self.mae_weight = mae_weight
    def call(self, y_true: tf.Tensor, y_pred: tf.Tensor) -> tf.Tensor:
        y_true = tf.cast(y_true, tf.float32)
        y_pred = tf.clip_by_value(tf.cast(y_pred, tf.float32), 1e-7, 1.0 - 1e-7)
        bce = tf.keras.backend.binary_crossentropy(y_true, y_pred)
        bce = tf.reshape(bce, tf.shape(y_true))
        mae = tf.abs(y_true - y_pred)
        return bce + self.mae_weight * mae
    def get_config(self) -> dict:
        config = super().get_config()
        config.update({"mae_weight": self.mae_weight})
        return config

# ==============================================================================
# 3. LOAD SEMUA ARTEFAK AI SAAT STARTUP
# ==============================================================================
@app.on_event("startup")
def load_all_models():
    global model_xgboost, scaler, encoders
    global ncf_model, ctx_repr_model, content_features_global
    global item_encoder, ingredient_encoder, category_encoder, content_numeric_scaler, context_ohe
    global CONTENT_CAT_COLS, CONTENT_NUMERIC_COLS, CONTEXT_CAT_COLS, CONTEXT_NUM_COLS
    global hybrid_features, hybrid_meta

    print("⏳ Memuat semua model AI ke dalam memory...")

    # --- A. Load Model XGBoost ---
    try:
        model_xgboost = joblib.load('xgboost_surplus_model.pkl')
        scaler = joblib.load('scaler_numeric.pkl')
        encoders = joblib.load('encoders_dict.pkl')
        print("✅ [XGBoost] Model Surplus & Scaler berhasil dimuat!")
    except Exception as e:
        print(f"❌ [XGBoost] Error memuat model: {e}")

   # --- B. Load Model NCF (Rekomendasi) ---
    try:
        artifact_dir = "artifacts_hybrid_recommender/"

        preprocess_arts = joblib.load(artifact_dir + "hybrid_preprocess_artifacts.joblib")
        item_encoder           = preprocess_arts["item_encoder"]
        ingredient_encoder     = preprocess_arts["ingredient_encoder"]
        category_encoder       = preprocess_arts["category_encoder"]
        content_numeric_scaler = preprocess_arts["content_numeric_scaler"]
        context_ohe            = preprocess_arts["context_ohe"]

        CONTENT_CAT_COLS  = preprocess_arts.get("content_cat_cols",
            ["restaurant_type", "meal_type", "price_segment", "waste_level"])
        CONTENT_NUMERIC_COLS = preprocess_arts.get("content_numeric_cols",
            ["actual_selling_price", "typical_ingredient_cost",
             "observed_market_price", "price_margin", "Wastage Food Amount"])
        CONTEXT_CAT_COLS  = preprocess_arts.get("context_cat_cols",
            ["restaurant_type", "meal_type", "weather_condition", "price_segment"])
        CONTEXT_NUM_COLS  = preprocess_arts.get("context_num_cols",
            ["day_of_week", "is_weekend", "has_promotion", "special_event"])

        hybrid_meta     = pd.read_csv(artifact_dir + "hybrid_item_metadata.csv")
        hybrid_meta.columns = [col.strip() for col in hybrid_meta.columns]
        hybrid_features = np.load(artifact_dir + "hybrid_augmented_features.npy")

        ncf_model = tf.keras.models.load_model(
            artifact_dir + "kedua_kali_ncf_model.keras",
            custom_objects={
                "L2Normalize": L2Normalize,
                "DemandWeightedBCELoss": DemandWeightedBCELoss
            }
        )

        ctx_repr_model = tf.keras.Model(
            ncf_model.input["context_input"],
            ncf_model.get_layer("ctx_bn_2").output,
            name="ctx_repr_extractor"
        )

        content_features_global = hybrid_features[:, :74]

        print("✅ [NCF v2] Otak Sistem Rekomendasi berhasil dimuat!")
        print(f"   hybrid_features shape : {hybrid_features.shape}")
        print(f"   content_features shape: {content_features_global.shape}")
    except Exception as e:
        print(f"❌ [NCF] Gagal memuat artefak model: {e}")

    print("🚀 Server FastAPI Siap Tempur!")

# ==============================================================================
# 4. FUNGSI-FUNGSI PENDUKUNG NCF
# ==============================================================================
def clean_text(value: object) -> str:
    text = "" if pd.isna(value) else str(value).lower()
    text = re.sub(r"[^a-z0-9\s_,-]", " ", text)
    return re.sub(r"\s+", " ", text).strip() if text else "unknown"

def split_ingredients(value: object) -> list[str]:
    return [
        part.strip() for part in re.split(r"[,|;/]+", clean_text(value))
        if part.strip() and part.strip() != "unknown"
    ]

def l2_normalize_np(matrix: np.ndarray, axis: int = 1, epsilon: float = 1e-8) -> np.ndarray:
    matrix = np.asarray(matrix, dtype="float32")
    norm = np.maximum(np.linalg.norm(matrix, axis=axis, keepdims=True), epsilon)
    return matrix / norm

def normalize_01(values) -> np.ndarray:
    values = np.asarray(list(values), dtype="float32")
    if len(values) == 0:
        return values
    min_val, max_val = np.nanmin(values), np.nanmax(values)
    if np.isclose(max_val - min_val, 0):
        return np.zeros_like(values, dtype="float32")
    return (values - min_val) / (max_val - min_val)

def build_query_context_vector(req) -> np.ndarray:
    cat_data = pd.DataFrame([{
        "restaurant_type":   clean_text(req.restaurant_type),
        "meal_type":         clean_text(req.meal_type),
        "weather_condition": clean_text(req.weather_condition),
        "price_segment":     clean_text(getattr(req, "price_segment", "regular")),
    }], columns=CONTEXT_CAT_COLS)
    x_cat = context_ohe.transform(cat_data.fillna("unknown")).astype("float32")
    x_num = np.array([[
        req.day_of_week, req.is_weekend,
        req.has_promotion, req.special_event
    ]], dtype="float32")
    return np.hstack([x_cat, x_num])

def build_query_hybrid_vector(req) -> np.ndarray:
    valid_ingredients = [
        ing for ing in split_ingredients(req.extra_preferences)
        if ing in ingredient_encoder.classes_
    ]
    if not valid_ingredients:
        valid_ingredients = ["unknown"]
    x_ingredients = ingredient_encoder.transform([valid_ingredients]).astype("float32")

    cat_frame = pd.DataFrame([{
        "restaurant_type": clean_text(req.restaurant_type),
        "meal_type":       clean_text(req.meal_type),
        "price_segment":   clean_text(getattr(req, "price_segment", "regular")),
        "waste_level":     "high_waste",
    }], columns=CONTENT_CAT_COLS)
    x_category = category_encoder.transform(cat_frame).astype("float32")

    median_numeric = hybrid_meta[CONTENT_NUMERIC_COLS].median(numeric_only=True).to_frame().T
    x_numeric = content_numeric_scaler.transform(
        median_numeric[CONTENT_NUMERIC_COLS]
    ).astype("float32")

    query_content = np.hstack([x_ingredients, x_category, x_numeric]).astype("float32")
    query_content = l2_normalize_np(query_content)[0]

    ctx_vec  = build_query_context_vector(req)
    ctx_repr = ctx_repr_model.predict(ctx_vec, verbose=0)[0]
    ctx_repr = ctx_repr / max(np.linalg.norm(ctx_repr), 1e-8)

    query_hybrid = np.hstack([query_content, ctx_repr]).astype("float32")
    return query_hybrid / max(np.linalg.norm(query_hybrid), 1e-8)

def compute_ncf_scores(candidates: pd.DataFrame, req) -> np.ndarray:
    scores = np.full(len(candidates), 0.5, dtype="float32")
    valid  = candidates["menu_key"].isin(set(item_encoder.classes_)).values
    if not valid.any():
        return scores

    ctx_vec      = build_query_context_vector(req)
    feature_rows = candidates.loc[valid, "feature_row"].astype(int).values
    item_feats   = content_features_global[feature_rows]
    ctx_tiled    = np.tile(ctx_vec, (len(item_feats), 1))

    inputs = {
        "context_input": ctx_tiled,
        "item_input":    item_feats
    }
    scores[valid] = ncf_model.predict(inputs, verbose=0).reshape(-1)
    return scores

def load_surplus_candidates(path="surplus_predictions.csv"):
    if not os.path.exists(path):
        return None
    surplus = pd.read_csv(path)
    surplus.columns = [str(col).strip() for col in surplus.columns]
    if "menu_item_name" not in surplus.columns:
        return None
    surplus["menu_key"] = surplus["menu_item_name"].map(clean_text)
    surplus["predicted_surplus"] = pd.to_numeric(
        surplus.get("predicted_surplus", 0.0), errors="coerce"
    ).fillna(0.0)
    return surplus

# ==============================================================================
# 5. ENDPOINT 1: PREDIKSI SURPLUS (XGBoost)
# ==============================================================================
class RestaurantData(BaseModel):
    restaurant_id: int
    restaurant_type: str
    menu_item_name: str
    meal_type: str
    typical_ingredient_cost: float
    observed_market_price: float
    actual_selling_price: float
    weather_condition: str
    has_promotion: bool
    special_event: bool
    day_of_week: int
    is_weekend: int
    month: int

@app.post("/predict")
def predict_surplus(data: RestaurantData):
    if model_xgboost is None:
        return {"error": "Model XGBoost belum siap."}

    try:
        df = pd.DataFrame([data.model_dump() if hasattr(data, 'model_dump') else data.dict()])

        for col in ['restaurant_type', 'menu_item_name', 'meal_type']:
            if col in encoders:
                if df[col][0] not in encoders[col].classes_:
                    df[col] = encoders[col].classes_[0]
                df[col] = encoders[col].transform(df[col])

        numeric_cols = ['typical_ingredient_cost', 'observed_market_price', 'actual_selling_price']
        df[numeric_cols] = scaler.transform(df[numeric_cols])
        df = pd.get_dummies(df)

        if hasattr(model_xgboost, 'feature_names_in_'):
            features = model_xgboost.feature_names_in_
            df = df.reindex(columns=features, fill_value=0)

        prediction = model_xgboost.predict(df)
        predicted_qty = float(prediction[0])

        weather_impact = {"Sunny": +12, "Cloudy": 0, "Rainy": -12}
        day_impact = {0: -12, 1: -10, 2: -5, 3: 0, 4: +8, 5: +18, 6: +12}
        promo_impact = +18 if data.has_promotion else 0
        event_impact = +25 if data.special_event else 0

        margin_ratio = data.typical_ingredient_cost / max(data.actual_selling_price, 1)
        price_impact = round((0.5 - margin_ratio) * 40)

        competitiveness = data.actual_selling_price / max(data.observed_market_price, 1)
        comp_impact = round((1.0 - competitiveness) * 30)

        if predicted_qty < 20:
            status = "Surplus Kritis"
            diskon_pct = 50
            rec = f"⚠️ Prediksi penjualan sangat rendah ({round(predicted_qty)} porsi). Diskon segera {diskon_pct}% dan aktifkan notifikasi push ke pengguna terdekat."
        elif predicted_qty < 50:
            status = "Waspada"
            diskon_pct = 30
            rec = f"🟡 Volume {round(predicted_qty)} porsi di zona waspada. Aktifkan bundling promo atau diskon {diskon_pct}% mulai 2 jam sebelum tutup."
        else:
            status = "Aman"
            diskon_pct = 0
            rec = f"✅ Prediksi stabil ({round(predicted_qty)} porsi). Tidak perlu intervensi — pantau terus tiap shift."

        harga_diskon = round(data.actual_selling_price * (1 - diskon_pct / 100))
        porsi_terselamatkan = max(0, round(predicted_qty * 0.8))
        co2_dicegah = round(porsi_terselamatkan * 0.5, 1)

        return {
            "predicted_sales_qty": round(predicted_qty, 1),
            "status": status,
            "recommendation": rec,
            "model_r2_score": "0.7972",
            "factor_breakdown": [
                {"label": "Cuaca", "icon": "🌤️", "impact": weather_impact.get(data.weather_condition, 0), "desc": data.weather_condition},
                {"label": "Hari", "icon": "📅", "impact": day_impact.get(data.day_of_week, 0), "desc": ["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu"][data.day_of_week]},
                {"label": "Promo", "icon": "🏷️", "impact": promo_impact, "desc": "Aktif" if data.has_promotion else "Tidak Aktif"},
                {"label": "Event", "icon": "🎉", "impact": event_impact, "desc": "Ada Event" if data.special_event else "Hari Biasa"},
                {"label": "Harga vs HPP", "icon": "💰", "impact": price_impact, "desc": f"Margin {round(margin_ratio*100)}%"},
                {"label": "Daya Saing", "icon": "📊", "impact": comp_impact, "desc": f"vs Pasar {round(competitiveness*100)}%"},
            ],
            "diskon_rekomendasi": {
                "persentase": diskon_pct,
                "harga_asli": data.actual_selling_price,
                "harga_diskon": harga_diskon,
            },
            "co2_dicegah": co2_dicegah,
            "porsi_terselamatkan": porsi_terselamatkan,
        }
    except Exception as e:
        print("ERROR DARI XGBOOST:", str(e))
        return {"error": str(e)}

# ==============================================================================
# 6. ENDPOINT 2: REKOMENDASI PRODUK (Hybrid NCF)
# ==============================================================================
class RecommendationRequest(BaseModel):
    user_id: Optional[int] = None
    item_id: Optional[int] = None
    restaurant_id: str = "unknown_restaurant"
    restaurant_type: str = "unknown"
    meal_type: str = "unknown"
    weather_condition: str = "unknown"
    price_segment: str = "regular"
    day_of_week: int = 0
    is_weekend: int = 0
    has_promotion: int = 0
    special_event: int = 0
    extra_preferences: str = ""
    top_k: int = 4

@app.post("/api/recommend")
async def get_recommendations(req: RecommendationRequest):
    if hybrid_meta is None or hybrid_features is None or ncf_model is None:
        print("❌ Model NCF atau metadata tidak termuat dengan benar.")
        return {"status": "error", "recommendations": []}

    try:
        candidates = hybrid_meta.copy()
        surplus_candidates = load_surplus_candidates("surplus_predictions.csv")

        if surplus_candidates is not None:
            merged = candidates.merge(
                surplus_candidates[["menu_key", "predicted_surplus"]],
                on="menu_key", how="inner"
            )
            positive = merged[merged["predicted_surplus"] > 0].copy()
            candidates = positive if not positive.empty \
                else candidates.assign(predicted_surplus=1.0)  # fallback semua dapat skor
        else:
            # Tidak ada surplus file — pakai semua kandidat dengan skor dummy
            wastage_col = "Wastage Food Amount" if "Wastage Food Amount" in candidates.columns else None
            if wastage_col:
                candidates = candidates.assign(predicted_surplus=candidates[wastage_col].fillna(1.0))
                candidates["predicted_surplus"] = candidates["predicted_surplus"].replace(0, 1.0)
            else:
                candidates = candidates.assign(predicted_surplus=1.0)

        if candidates.empty:
            return {
                "status": "success",
                "message": "Tidak ada menu surplus saat ini.",
                "recommendations": []
            }

        query_vector = build_query_hybrid_vector(req)
        feature_rows = candidates["feature_row"].astype(int).values
        hybrid_sim   = cosine_similarity(
            query_vector.reshape(1, -1), hybrid_features[feature_rows]
        ).reshape(-1)
        hybrid_sim   = (hybrid_sim + 1.0) / 2.0

        ncf_scores    = compute_ncf_scores(candidates, req)
        surplus_boost = normalize_01(candidates["predicted_surplus"].values)

        hybrid_weight, ncf_weight, surplus_weight = 0.60, 0.35, 0.05
        candidates["final_score"] = (
            hybrid_weight  * hybrid_sim
            + ncf_weight   * ncf_scores
            + surplus_weight * surplus_boost
        )

        candidates["ncf_score"] = ncf_scores  # tambahkan ini sebelum filter
        candidates = candidates[
        (candidates["final_score"] >= 0.40) &
        (candidates["ncf_score"]   >= 0.05)
        ].reset_index(drop=True) if "ncf_score" in candidates.columns else \
        candidates[candidates["final_score"] >= 0.40].reset_index(drop=True)

        final_recs = candidates.sort_values("final_score", ascending=False).head(req.top_k).reset_index(drop=True)

        # Ambil IDs (logika sama seperti sebelumnya)
        top_ids = []
        if "id" in final_recs.columns:
            top_ids = final_recs["id"].dropna().astype(int).tolist()
        elif "menu_key" in final_recs.columns:
            extracted = final_recs["menu_key"].str.extract(r'(\d+)')
            if not extracted.empty and extracted[0].dropna().shape[0] > 0:
                top_ids = extracted[0].dropna().astype(int).tolist()
        if not top_ids:
            top_ids = (final_recs.index + 1).tolist()

        print(f"🎯 AI Berhasil Menghitung Rekomendasi IDs: {top_ids}")

        return {
            "status": "success",
            "message": "Rekomendasi hybrid berhasil dikalkulasi.",
            "recommendations": top_ids
        }

    except Exception as e:
        print("❌ ERROR PADA SAAT REKOMENDASI NCF:", str(e))
        return {"status": "error", "recommendations": []}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)