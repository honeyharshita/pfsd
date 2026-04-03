Django GraphQL AI Backend

Service endpoint:
- http://localhost:8000/graphql/
- http://localhost:8000/health/

Setup:
1) Create virtual environment and activate it.
2) Install dependencies from requirements.txt.
3) Update .env values.
4) Run:
   python manage.py migrate
   python manage.py runserver 0.0.0.0:8000

GraphQL examples:

query {
  chat(message: "I feel anxious today", userId: "anonymous", language: "en")
}

query {
  moodForecast(data: "[{\"mood\":\"anxious\",\"day\":\"mon\"}]", userId: "anonymous", language: "en")
}

query {
  dashboardStats(userId: "anonymous")
}

mutation {
  runHealthCheck
}
