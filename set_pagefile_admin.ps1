$ErrorActionPreference = "Stop"
$cs = Get-CimInstance Win32_ComputerSystem
Set-CimInstance -InputObject $cs -Property @{AutomaticManagedPagefile = $false}
$existing = Get-CimInstance Win32_PageFileSetting -Filter "Name='F:\\pagefile.sys'" -ErrorAction SilentlyContinue
if ($existing) {
  Set-CimInstance -InputObject $existing -Property @{InitialSize = 32768; MaximumSize = 102400}
} else {
  New-CimInstance -ClassName Win32_PageFileSetting -Property @{Name = 'F:\pagefile.sys'; InitialSize = 32768; MaximumSize = 102400}
}
Write-Output 'PAGEFILE_OK'
