param(
  [Parameter(Mandatory = $true)]
  [string]$CpuHtml,
  [Parameter(Mandatory = $true)]
  [string]$GpuHtml
)

$ErrorActionPreference = "Stop"

function Get-FirstNumber([string]$html) {
  $match = [regex]::Match($html, '([0-9]+(?:[\.,][0-9]+)?)')
  if (-not $match.Success) { return 0 }
  $raw = $match.Groups[1].Value -replace ",", ""
  return [double]::Parse($raw, [System.Globalization.CultureInfo]::InvariantCulture)
}

function Extract-Table([string]$html) {
  $theadMatch = [regex]::Match($html, '(?s)<thead>(.*?)</thead>')
  if (-not $theadMatch.Success) { return $null }

  $headers = @()
  foreach ($m in [regex]::Matches($theadMatch.Value, 'data-mhth="([^"]+)"')) {
    $headers += $m.Groups[1].Value
  }

  $rows = @()
  foreach ($rowMatch in [regex]::Matches($html, '(?s)<tr class="hovertarget.*?</tr>')) {
    $rows += $rowMatch.Value
  }

  return [pscustomobject]@{
    Headers = $headers
    Rows = $rows
  }
}

function Parse-Items([string]$html, [string]$sourceUrl, [string[]]$allowedVendors) {
  $table = Extract-Table $html
  if (-not $table) { return @() }

  $valueIndex = $table.Headers.IndexOf("MC_VALUE")
  $benchIndex = $table.Headers.IndexOf("MC_BENCH")
  if ($valueIndex -lt 0 -or $benchIndex -lt 0) { return @() }

  $items = @()
  foreach ($row in $table.Rows) {
    $tds = @()
    foreach ($cell in [regex]::Matches($row, '(?s)<td[^>]*>(.*?)</td>')) {
      $tds += $cell.Groups[1].Value
    }
    if ($tds.Count -lt 3) { continue }

    $rankMatch = [regex]::Match($tds[0], '<div>(\d+)</div>')
    $rank = if ($rankMatch.Success) { [int]$rankMatch.Groups[1].Value } else { 0 }

    $nameMatch = [regex]::Match($tds[1], '(AMD|Intel|Nvidia)\s+<a[^>]*>([^<]+)</a>')
    if (-not $nameMatch.Success) { continue }

    $vendor = $nameMatch.Groups[1].Value
    if ($allowedVendors -and ($allowedVendors -notcontains $vendor)) { continue }

    $model = $nameMatch.Groups[2].Value
    $name = "$vendor $model"

    $valueCellIndex = 2 + $valueIndex
    $benchCellIndex = 2 + $benchIndex
    if ($tds.Count -le $valueCellIndex -or $tds.Count -le $benchCellIndex) { continue }

    $value = Get-FirstNumber $tds[$valueCellIndex]
    $score = Get-FirstNumber $tds[$benchCellIndex]

    $items += [pscustomobject]@{
      name = [System.Net.WebUtility]::HtmlDecode($name)
      score = $score
      value = $value
      rank = $rank
      source = $sourceUrl
    }
  }

  $sorted = $items | Sort-Object -Property rank
  return $sorted
}

$cpuHtmlContent = Get-Content -Path $CpuHtml -Raw -Encoding UTF8
$gpuHtmlContent = Get-Content -Path $GpuHtml -Raw -Encoding UTF8

$cpus = Parse-Items $cpuHtmlContent "https://cpu.userbenchmark.com/" @("Intel", "AMD")
$gpus = Parse-Items $gpuHtmlContent "https://gpu.userbenchmark.com/" @("Nvidia", "AMD", "Intel")

$dataDir = Join-Path (Split-Path -Parent $PSScriptRoot) "data"
if (-not (Test-Path $dataDir)) { New-Item -ItemType Directory -Path $dataDir | Out-Null }

$cpus | ConvertTo-Json -Depth 4 | Set-Content -Path (Join-Path $dataDir "cpus.json") -Encoding UTF8
$gpus | ConvertTo-Json -Depth 4 | Set-Content -Path (Join-Path $dataDir "gpus.json") -Encoding UTF8

$cpuJs = "window.__CPU_DATA__ = " + ($cpus | ConvertTo-Json -Depth 4) + ";"
$gpuJs = "window.__GPU_DATA__ = " + ($gpus | ConvertTo-Json -Depth 4) + ";"
$cpuJs | Set-Content -Path (Join-Path $dataDir "cpus.js") -Encoding UTF8
$gpuJs | Set-Content -Path (Join-Path $dataDir "gpus.js") -Encoding UTF8

Write-Host "CPU: $($cpus.Count) voci, GPU: $($gpus.Count) voci."
