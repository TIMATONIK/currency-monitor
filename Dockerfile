FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY currency_parser.py .

CMD ["python", "currency_parser.py"]
