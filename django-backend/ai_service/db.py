import os
from datetime import datetime, timezone
import requests
from pymongo import MongoClient


class MongoStore:
    def __init__(self):
        uri = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017")
        db_name = os.getenv("MONGODB_DB", "mindful")
        self.client = MongoClient(uri, serverSelectionTimeoutMS=2500)
        self.db = self.client[db_name]

    def ping(self):
        self.client.admin.command("ping")
        return True

    def append_chat(self, user_id, message, response, language):
        self.db.chat_logs.insert_one(
            {
                "user_id": user_id,
                "message": message,
                "response": response,
                "language": language,
                "created_at": datetime.now(timezone.utc),
            }
        )

    def add_mood_log(self, user_id, payload):
        doc = {"user_id": user_id, "payload": payload, "created_at": datetime.now(timezone.utc)}
        self.db.mood_logs.insert_one(doc)

    def add_report(self, user_id, report_type, payload):
        doc = {
            "user_id": user_id,
            "report_type": report_type,
            "payload": payload,
            "created_at": datetime.now(timezone.utc),
        }
        self.db.reports.insert_one(doc)

    def positivity_samples(self, limit=12):
        cursor = self.db.chat_logs.find({}, {"response": 1, "_id": 0}).sort("created_at", -1).limit(limit)
        return [c.get("response", "") for c in cursor if c.get("response")]


class SurrealStore:
    def __init__(self):
        self.url = os.getenv("SURREALDB_URL", "http://127.0.0.1:8000/rpc")
        self.user = os.getenv("SURREALDB_USER", "root")
        self.password = os.getenv("SURREALDB_PASS", "root")
        self.namespace = os.getenv("SURREALDB_NS", "mindful")
        self.database = os.getenv("SURREALDB_DB", "wellness")
        self._token = None

    def _rpc(self, method, params):
        payload = {"id": 1, "method": method, "params": params}
        headers = {"Content-Type": "application/json"}
        if self._token:
            headers["Authorization"] = f"Bearer {self._token}"
        res = requests.post(self.url, json=payload, headers=headers, timeout=10)
        res.raise_for_status()
        data = res.json()
        if data.get("error"):
            raise RuntimeError(data["error"].get("message", "SurrealDB RPC error"))
        return data.get("result")

    def connect(self):
        token = self._rpc("signin", [{"user": self.user, "pass": self.password}])
        self._token = token
        self._rpc("use", [self.namespace, self.database])
        return True

    def write_metric(self, user_id, metric_type, value):
        query = "CREATE metrics CONTENT {user_id: $user_id, metric_type: $metric_type, value: $value, created_at: time::now()};"
        return self._rpc("query", [query, {"user_id": user_id, "metric_type": metric_type, "value": value}])

    def dashboard_stats(self, user_id="anonymous"):
        query = (
            "SELECT metric_type, count() AS points, math::mean(value) AS avg_value "
            "FROM metrics WHERE user_id = $user_id GROUP BY metric_type;"
        )
        rows = self._rpc("query", [query, {"user_id": user_id}])
        if not rows:
            return []
        result_rows = rows[0].get("result", []) if isinstance(rows, list) else []
        return result_rows


_mongo = None
_surreal = None


def get_mongo():
    global _mongo
    if _mongo is None:
        _mongo = MongoStore()
        _mongo.ping()
    return _mongo


def get_surreal():
    global _surreal
    if _surreal is None:
        _surreal = SurrealStore()
        _surreal.connect()
    return _surreal
