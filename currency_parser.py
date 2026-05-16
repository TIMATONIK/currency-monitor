import sys
import csv
from datetime import datetime

import requests
from tabulate import tabulate

API_URL = "https://www.cbr-xml-daily.ru/daily_json.js"
TOP_CURRENCIES = ["USD", "EUR", "CNY", "GBP", "JPY", "CHF", "HKD", "SGD", "TRY", "KZT"]


def fetch_rates() -> dict:
    try:
        resp = requests.get(API_URL, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.ConnectionError:
        _die("API недоступен. Проверьте подключение к интернету.")
    except requests.exceptions.Timeout:
        _die("Таймаут запроса (10 сек). Попробуйте позже.")
    except requests.exceptions.HTTPError as e:
        _die(f"HTTP-ошибка: {e}")
    except ValueError:
        _die("Неверный формат ответа API (ожидался JSON).")


def parse_rates(data: dict) -> tuple[list[dict], str]:
    try:
        valute = data["Valute"]
        date_str = datetime.fromisoformat(data["Date"]).strftime("%d.%m.%Y")
    except (KeyError, TypeError, ValueError):
        _die("Неожиданная структура данных API.")

    rows = []
    for code in TOP_CURRENCIES:
        if code not in valute:
            print(f"[warn] {code} отсутствует в ответе ЦБ, пропускаем.", file=sys.stderr)
            continue
        cur = valute[code]
        try:
            rate = float(cur["Value"]) / int(cur["Nominal"])
        except (KeyError, TypeError, ZeroDivisionError) as e:
            _die(f"Ошибка при разборе {code}: {e}")

        rows.append({
            "name":    cur.get("Name", "—"),
            "code":    code,
            "rate":    rate,
            "nominal": cur["Nominal"],
            "value":   cur["Value"],
        })

    rows.sort(key=lambda r: r["rate"], reverse=True)
    return rows, date_str


def print_table(rows: list[dict], date_str: str) -> None:
    print(f"\nКурсы валют ЦБ РФ на {date_str}\n")
    table = [
        [i + 1, r["name"], r["code"], f'{r["rate"]:.4f} ₽', r["nominal"]]
        for i, r in enumerate(rows)
    ]
    headers = ["#", "Название", "Код", "Курс за ед.", "Номинал"]
    print(tabulate(table, headers=headers, tablefmt="rounded_outline"))


def save_csv(rows: list[dict], date_str: str) -> str:
    filename = f"rates_{date_str.replace('.', '-')}.csv"
    fields = ["name", "code", "rate", "nominal", "value"]
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow({k: row[k] for k in fields})
    return filename


def _die(msg: str) -> None:
    print(f"Ошибка: {msg}", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    data = fetch_rates()
    rows, date_str = parse_rates(data)
    print_table(rows, date_str)
    filename = save_csv(rows, date_str)
    print(f"\nСохранено: {filename}")


if __name__ == "__main__":
    main()
