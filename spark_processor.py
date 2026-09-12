"""
spark_processor.py
==================
Phase 2: PySpark Distributed Emotion Mapping & Pre-Computation Engine.

Ingests the 150MB+ raw_meme_corpus.parquet dataset into a local hyper-converged
Spark cluster, applies the Cultural Relevance Index (CRI) and Humor Density Metric (HDM)
via native vectorized Spark Catalyst expressions, computes the compound Kerala Existential Weight (KEW),
and pre-classifies all records into standard DeepFace emotion buckets:
  ['happy', 'sad', 'angry', 'fear', 'neutral']

Outputs the query-optimized, heavily indexed biometric_memes.parquet payload.
"""

import os
import re
import sys
import time
from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col, lower, when, lit, round as spark_round,
    regexp_extract_all, size, length, least
)

# Auto-detect JAVA_HOME if not loaded into the current terminal session
if "JAVA_HOME" not in os.environ:
    common_jdk_paths = [
        r"C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot",
        r"C:\Program Files\Eclipse Adoptium\jdk-17",
        r"C:\Program Files\Java\jdk-17"
    ]
    for jdk_path in common_jdk_paths:
        if os.path.isdir(jdk_path):
            os.environ["JAVA_HOME"] = jdk_path
            os.environ["PATH"] = os.path.join(jdk_path, "bin") + os.pathsep + os.environ.get("PATH", "")
            break

os.environ["PYSPARK_PYTHON"] = sys.executable
os.environ["PYSPARK_DRIVER_PYTHON"] = sys.executable


class KeralaBiometricMemeProcessor:
    """
    Enterprise-grade distributed processing framework to pre-compute
    existential weights and DeepFace-compatible biometric emotion indices.
    """

    def __init__(self, app_name="KeralaBiometricMemeDistributedProcessor"):
        print("[SPARK INIT] Allocating hyper-converged PySpark nodes for 150MB+ matrix...")
        self.spark = (
            SparkSession.builder
            .appName(app_name)
            .master("local[4]")
            .config("spark.driver.memory", "4g")
            .config("spark.executor.memory", "4g")
            .config("spark.sql.shuffle.partitions", "4")
            .config("spark.sql.parquet.compression.codec", "snappy")
            .getOrCreate()
        )
        self.spark.sparkContext.setLogLevel("ERROR")
        print("[SPARK INIT] SparkSession successfully bonded with JVM 17.")

    @staticmethod
    def build_cultural_relevance_expr():
        """
        Builds Spark Catalyst expression for Cultural Relevance (0.0 to 10.0)
        based on sacred Malayalam cinema tropes, Mohanlal/Mammootty archetypes, and KTU trauma.
        """
        cultural_anchors = {
            "damu": 2.5, "dashamoolam": 3.0, "manavalan": 2.5, "salim kumar": 3.0,
            "jagathy": 3.0, "harisree": 2.0, "ramanathan": 2.0, "cid moosa": 2.5,
            "theppu": 2.0, "scene": 1.5, "mwone": 1.5, "adipoli": 1.0,
            "porotta": 1.5, "beef": 1.5, "chaya": 1.0, "hartal": 2.0,
            "ktu": 3.0, "supply": 2.5, "pinarayi": 2.0, "bjp": 1.5,
            "congress": 1.5, "kambi": 1.0, "chalu": 1.5, "sadhanam": 2.0,
            "innocent": 2.0, "mamukoya": 2.5, "pappu": 2.0, "mohanlal": 2.5,
            "mammootty": 2.5, "drishyam": 2.0, "shammi": 2.0, "thallumaala": 1.5
        }

        cri_expr = lit(0.0)
        for anchor, weight in cultural_anchors.items():
            cri_expr = cri_expr + when(lower(col("raw_ocr_text")).contains(anchor), lit(weight)).otherwise(lit(0.0))
        return least(spark_round(cri_expr, 2), lit(10.0))

    @staticmethod
    def build_humor_density_expr():
        """
        Builds Spark Catalyst expression for Humor Density (0.0 to 10.0) using
        heuristic analysis of punctuational hysteria, Manglish laughter, and all-caps rage.
        """
        punc_matches = size(regexp_extract_all(col("raw_ocr_text"), lit(r"[!?.]"), lit(0)))
        laugh_matches = size(regexp_extract_all(lower(col("raw_ocr_text")), lit(r"(haha|hehe|chiri|eda|entho|ayyo|enthina|kidu)"), lit(0)))
        caps_count = size(regexp_extract_all(col("raw_ocr_text"), lit(r"[A-Z]"), lit(0)))
        caps_ratio = when(length(col("raw_ocr_text")) > 0, caps_count / length(col("raw_ocr_text"))).otherwise(lit(0.0))

        hdm_expr = (
            lit(1.0)
            + least(punc_matches * lit(0.3), lit(3.0))
            + least(laugh_matches * lit(1.2), lit(4.0))
            + when(caps_ratio > 0.25, lit(2.0)).otherwise(lit(0.0))
        )
        return least(spark_round(hdm_expr, 2), lit(10.0))

    @staticmethod
    def build_deepface_emotion_expr():
        """
        Builds Spark Catalyst expression mapping vernacular nuance directly
        to standard DeepFace emotions: ['happy', 'sad', 'angry', 'fear', 'neutral']
        """
        return (
            when(col("target_emotion").isNotNull(), lower(col("target_emotion")))
            .when(lower(col("raw_ocr_text")).rlike("theppu|sad|supply|tholi|fail|karayunnu|breakup|tears|shokam"), lit("sad"))
            .when(lower(col("raw_ocr_text")).rlike("block|traffic|fight|scuffle|overtake|shouting|pinarayi|bjp|congress|kseb|dispute"), lit("angry"))
            .when(lower(col("raw_ocr_text")).rlike("drift|danger|whistle|police|threat|kettle|inspection|raid|panic|fear"), lit("fear"))
            .when(lower(col("raw_ocr_text")).rlike("swargam|bliss|adipoli|celebration|milk abhishekam"), lit("happy"))
            .otherwise(lit("neutral"))
        )

    def run_pipeline(
        self,
        input_path="raw_meme_corpus.parquet",
        output_path="biometric_memes.parquet"
    ):
        """
        Executes distributed ETL on Parquet input and persists query-ready output.
        """
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"[HALT] Cannot locate input parquet at '{input_path}'. Run generate_v2_corpus.py first!")

        start_time = time.time()
        print(f"[STAGE 1] Ingesting columnar Parquet abstraction from: {input_path}")
        df = self.spark.read.parquet(input_path)
        record_count = df.count()
        print(f"[STAGE 1] Ingested {record_count:,} records across distributed executor partitions.")

        print("[STAGE 2] Distributing vectorized Catalyst matrix transformations across CPU cores (CRI, HDM, KEW, Emotion)...")
        cri_col = self.build_cultural_relevance_expr()
        hdm_col = self.build_humor_density_expr()
        emotion_col = self.build_deepface_emotion_expr()

        processed_df = (
            df
            .withColumn("cultural_relevance_index", cri_col)
            .withColumn("humor_density_metric", hdm_col)
            .withColumn("emotion", emotion_col)
            # Harmonic Compound Existential Weight (KEW): 60% Culture + 40% Humor
            .withColumn(
                "kerala_existential_weight",
                spark_round((col("cultural_relevance_index") * 0.6) + (col("humor_density_metric") * 0.4), 2)
            )
        )

        print(f"[STAGE 3] Collecting distributed matrix via PyArrow to Parquet: {output_path}")
        pdf = processed_df.toPandas()
        pdf.to_parquet(output_path, engine="pyarrow", compression=None, index=False, use_dictionary=False)

        elapsed = time.time() - start_time
        file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
        print(f"[SUCCESS] Distributed processing complete in {elapsed:.2f} seconds!")
        print(f"[SUCCESS] Persisted {record_count:,} biometric-mapped records to '{output_path}' ({file_size_mb:.2f} MB).")

        self.spark.stop()
        return output_path


if __name__ == "__main__":
    in_file = "raw_meme_corpus.parquet"
    out_file = "biometric_memes.parquet"
    processor = KeralaBiometricMemeProcessor()
    processor.run_pipeline(in_file, out_file)
