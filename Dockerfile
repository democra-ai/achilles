FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml .
RUN pip install --no-cache-dir .

COPY . .

ENV ACHILLES_HOST=0.0.0.0
ENV ACHILLES_PORT=8900

EXPOSE 8900

CMD ["python", "-m", "achilles.main"]
