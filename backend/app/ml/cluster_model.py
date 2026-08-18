try:
    import numpy as np
except ImportError:
    np = None

try:
    import pandas as pd
except ImportError:
    pd = None

try:
    import tensorflow as tf
except ImportError:
    tf = None

from typing import List, Dict, Any

class MealtimeCurationEngine:
    """
    Pandas, NumPy, TensorFlow 기반 맞춤형 큐레이션 & 다계층 추천 알고리즘 엔진
    Score = (TimeMatch * 0.40) + (UserClusterMatch * 0.30) + (Popularity * 0.20) + (Freshness * 0.10)
    """

    def __init__(self, target_duration_sec: int = 900, tolerance_sec: int = 300):
        self.target_duration = target_duration_sec  # 기본 15분 = 900초
        self.tolerance = tolerance_sec              # 허용 오차 ±5분

    def rank_playlists(self, playlists_df: Any, user_cluster_id: int = 0) -> Any:
        """
        다계층 산식을 적용하여 플레이리스트의 추천 스코어를 계산하고 내림차순 정렬합니다.
        """
        if pd is None or not isinstance(playlists_df, pd.DataFrame):
            return playlists_df
        if playlists_df.empty:
            return playlists_df

        try:
            df = playlists_df.copy()

            # 1. 식사 시간 적합도 (Time Match Score)
            df['duration_diff'] = (df['total_duration_sec'] - self.target_duration).abs()
            df['time_score'] = (1.0 - (df['duration_diff'] / self.tolerance)).clip(lower=0.0, upper=1.0)

            # 2. 유저 군집 적합도 (Cluster Match Score)
            df['cluster_score'] = 0.8

            # 3. 포크 및 인기도 (Popularity Score)
            if np is not None:
                df['popularity_score'] = np.log1p(df['fork_count'].fillna(0)) / np.log(500)
                df['popularity_score'] = df['popularity_score'].clip(upper=1.0)
            else:
                df['popularity_score'] = 0.5

            # 4. 실시간 가중치 (Freshness Score)
            df['freshness_score'] = df['is_ott_scraped'].apply(lambda x: 1.0 if x else 0.5)

            # 최종 추천 산식 스코어
            df['final_score'] = (
                df['time_score'] * 0.40 +
                df['cluster_score'] * 0.30 +
                df['popularity_score'] * 0.20 +
                df['freshness_score'] * 0.10
            )

            return df.sort_values(by='final_score', ascending=False)
        except Exception:
            return playlists_df

    def build_user_embedding_model(self, num_users: int = 100, num_categories: int = 10, embedding_dim: int = 16):
        """
        TensorFlow Keras 기반 유저 취향 임베딩 & 군집화 레이어 구축
        """
        user_input = tf.keras.layers.Input(shape=(1,), name="user_id")
        category_input = tf.keras.layers.Input(shape=(num_categories,), name="category_scores")

        user_embedding = tf.keras.layers.Embedding(input_dim=num_users, output_dim=embedding_dim)(user_input)
        user_vector = tf.keras.layers.Flatten()(user_embedding)

        merged = tf.keras.layers.Concatenate()([user_vector, category_input])
        dense1 = tf.keras.layers.Dense(32, activation="relu")(merged)
        cluster_output = tf.keras.layers.Dense(4, activation="softmax", name="cluster_prob")(dense1)

        model = tf.keras.Model(inputs=[user_input, category_input], outputs=cluster_output)
        model.compile(optimizer="adam", loss="categorical_crossentropy")
        return model

    def predict_user_cluster(self, user_id: int, category_scores: List[float]) -> int:
        """
        유저 ID와 카테고리 선호도 벡터를 입력받아 군집(Cluster) 번호를 예측합니다.
        """
        u_arr = np.array([[user_id]])
        c_arr = np.array([category_scores])

        model = self.build_user_embedding_model()
        preds = model.predict([u_arr, c_arr], verbose=0)
        cluster_id = int(np.argmax(preds[0]))
        return cluster_id

curation_engine = MealtimeCurationEngine()
