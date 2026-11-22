param(
  [string]$Catalog = "F:\DSH WORKSPACE\lumen-flow\training\bilibili_columns.json",
  [string]$Output = "F:\DSH WORKSPACE\lumen-flow\training\bilibili_columns_full.json",
  [int]$Limit = 0
)

$ErrorActionPreference = "Stop"
$data = Get-Content -LiteralPath $Catalog -Raw -Encoding utf8 | ConvertFrom-Json
$columns = @($data.columns)
if ($Limit -gt 0) { $columns = $columns | Select-Object -First $Limit }
$headers = @{
  "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/157.0 Safari/537.36"
  "Referer" = "https://www.bilibili.com/"
}
$rows = @()
$index = 0
foreach ($column in $columns) {
  $index++
  $id = [string]$column.id
  $content = ""
  $pics = @()
  try {
    $response = Invoke-WebRequest -Uri "https://api.bilibili.com/x/article/view?id=$id" -Headers $headers -UseBasicParsing -TimeoutSec 20
    $json = $response.Content | ConvertFrom-Json
    if ($json.code -eq 0) {
      $content = [string]$json.data.content
      $content = [regex]::Replace($content, '<[^>]+>', ' ')
      $content = [System.Net.WebUtility]::HtmlDecode($content)
      $pics = @($json.data.image_urls)
    }
  } catch {
    $content = ""
  }
  $text = "$($column.title) $($column.summary) $content"
  $blocked = $text -match '裸体|全裸|性交|做爱|口交|阴茎|阴道|肉棒|精液|肛交|乱伦'
  if ($blocked) {
    $label = "blocked"
  } elseif ($text -match '2\.5D|2\.5d|半写实|写实|厚涂|光影|质感|体积感|CG|3D|渲染') {
    $label = "2_5d_semi"
  } elseif ($text -match '脚|足|手部|人体|解剖|结构|姿势') {
    $label = "anatomy_study"
  } elseif ($text -match '短漫|漫画|四格') {
    $label = "manga"
  } elseif ($text -match '萌|可爱|萝莉|Q版|猫耳|女仆') {
    $label = "moe_2d"
  } elseif ($text -match '赛璐珞|平涂|动画|TV|原画|线稿|图集|画集') {
    $label = "flat_cel"
  } else {
    $label = "unknown"
  }
  $rows += [pscustomobject]@{
    id = $column.id
    title = $column.title
    url = $column.url
    publish = $column.publish
    label = $label
    blocked = [bool]$blocked
    content_excerpt = $content.Substring(0, [Math]::Min(500, $content.Length))
    image_count = @($pics).Count
  }
  if ($index % 20 -eq 0) { Write-Host "classified $index / $($columns.Count)" }
  Start-Sleep -Milliseconds 120
}
$payload = [pscustomobject]@{
  source = $data.source
  uid = $data.uid
  count = $rows.Count
  generated = (Get-Date).ToString("o")
  columns = $rows
}
$payload | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $Output -Encoding utf8
Write-Host "wrote $Output ($($rows.Count))"
