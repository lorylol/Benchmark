# BenchLab

Sito statico con benchmark CPU/GPU e sezione coppie.

## Dati reali (UserBenchmark)

UserBenchmark usa spesso captcha. Se il download diretto fallisce, salva le pagine HTML dal browser.

1. Installa le dipendenze Python:
  - `pip install -r requirements.txt`
2. Metodo diretto (se non blocca):
  - `python scripts/fetch_userbenchmark.py`
3. Metodo con HTML salvato:
  - Apri https://cpu.userbenchmark.com/ e https://gpu.userbenchmark.com/ nel browser
  - Completa il captcha e salva le pagine in locale
  - Esegui:
    - `python scripts/fetch_userbenchmark.py --cpu-html <cpu.html> --gpu-html <gpu.html>`

I file JSON vengono salvati in `data/` (con versione compatta) insieme ai file `cpus.js` e `gpus.js` usati come fallback.
Le CPU Intel vengono filtrate con una regola "best effort" per mantenere i modelli 2010+ (Core i, Core Ultra, Xeon recenti) ed escludere le serie legacy.

## Import senza Python (PowerShell)

Se non vuoi usare Python, puoi importare i dati dai file HTML salvati:

```
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/parse_userbenchmark.ps1 -CpuHtml .\cpu.html -GpuHtml .\gpu.html
```

I JSON verranno aggiornati in `data/`.

## Pulizia dati

Per normalizzare i JSON (spazi, duplicati, rank) e filtrare Intel 2010+:

```
python scripts/clean_data.py --intel-2010
```

Per mantenere solo CPU recenti (best effort) dal 2015 in poi:

```
python scripts/clean_data.py --recent-year 2015
```

## Coppie CPU+GPU

Per le coppie serve una fonte esplicita (URL) o un file JSON con campi:

```json
[
  {
    "cpu": "Nome CPU",
    "gpu": "Nome GPU",
    "score": 123.4,
    "value": 98.7,
    "rank": 1,
    "source": "https://sito-fonte/"
  }
]
```
