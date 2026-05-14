# Data Export

A utility skill that exports structured data from an agent's working context to external formats and destinations. This skill handles serialization, format conversion, and delivery of datasets to files, streams, or remote endpoints.

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| data | object \| array | Yes | The dataset or structured object to be exported |
| format | string | Yes | Target serialization format (e.g., `json`, `csv`, `tsv`, `jsonl`) |
| destination | string | No | File path or URL where the exported data should be written; defaults to stdout if omitted |
| delimiter | string | No | Field delimiter for delimiter-separated formats such as CSV or TSV; defaults to `,` |
| headers | boolean | No | Whether to include a header row when exporting tabular formats; defaults to `true` |
| encoding | string | No | Character encoding for the output file (e.g., `utf-8`, `latin-1`); defaults to `utf-8` |
| append | boolean | No | If `true`, appends to an existing file rather than overwriting it; defaults to `false` |

## Outputs

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Indicates whether the export completed without errors |
| destination | string | The resolved path or URL where data was written, or `stdout` if no destination was provided |
| rows_exported | integer | Number of records or top-level items written during the export |
| bytes_written | integer | Total number of bytes written to the destination |
| format | string | The serialization format that was applied |
| error | string | Human-readable error message if `success` is `false`; absent otherwise |

## Example

```python
result = await agent.run_skill(
    "data-export",
    data=[
        {"id": 1, "name": "Alice", "score": 95},
        {"id": 2, "name": "Bob",   "score": 87},
        {"id": 3, "name": "Carol", "score": 91},
    ],
    format="csv",
    destination="/tmp/scores.csv",
    headers=True,
    encoding="utf-8",
    append=False,
)

print(result["rows_exported"])  # 3
print(result["bytes_written"])  # e.g., 52
print(result["destination"])    # /tmp/scores.csv
```

## Constraints

- **No external environment variables are required** for local file exports; remote destinations (e.g., `s3://`, `https://`) may require credentials available in the execution environment (e.g., `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`).
- The `delimiter` parameter is ignored for non-delimited formats such as `json` and `jsonl`.
- When `destination` is a remote URL the skill performs a synchronous HTTP PUT or cloud-SDK upload; network timeouts are governed by the host environment and are not configurable through this skill.
- Large datasets are streamed row-by-row to avoid excessive memory consumption, but the entire `data` object must be serializable before export begins.
- Nested objects within a CSV/TSV export are JSON-stringified into a single cell; deeply nested structures should be flattened before calling this skill.
- The `append` flag is only honoured for local file destinations; remote destinations always overwrite.