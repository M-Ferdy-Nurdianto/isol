$ErrorActionPreference = "Stop"

$aiRulesDir = "d:\Githab\RB Remake\.ai_rules"
$agentsDir = "d:\Githab\RB Remake\.agents"
$skillsDir = "$agentsDir\skills"
$cursorRules = "d:\Githab\RB Remake\.cursorrules"
$agentsMd = "$agentsDir\AGENTS.md"

# Create directories
New-Item -ItemType Directory -Force -Path $agentsDir | Out-Null
New-Item -ItemType Directory -Force -Path $skillsDir | Out-Null
New-Item -ItemType Directory -Force -Path "$skillsDir\rb-ecommerce" | Out-Null
New-Item -ItemType Directory -Force -Path "$skillsDir\rb-database-auth" | Out-Null
New-Item -ItemType Directory -Force -Path "$skillsDir\rb-ui-ux" | Out-Null
New-Item -ItemType Directory -Force -Path "$skillsDir\rb-optimization" | Out-Null

# 1. Global Rules
$globalFiles = @(
    "01_PROJECT_MANIFESTO.md", "02_BRAND_IDENTITY_GUIDE.md", "03_AI_VIBE_PROTOCOL_SOP.md",
    "04_CORE_TECH_STACK.md", "05_SYSTEM_ARCHITECTURE_MAP.md", "06_DIRECTORY_STRUCTURE_RULES.md",
    "11_GLOBAL_STYLING_TOKENS.md"
)
$globalContent = ""
foreach ($file in $globalFiles) {
    if (Test-Path "$aiRulesDir\$file") {
        $content = Get-Content "$aiRulesDir\$file" -Raw
        $globalContent += "`n`n$content"
    }
}
$globalContent = $globalContent.Trim()
Set-Content -Path $cursorRules -Value $globalContent -Encoding UTF8
Set-Content -Path $agentsMd -Value $globalContent -Encoding UTF8

# 2. Skill: rb-ecommerce
$ecommerceFiles = @("15_SHOP_&_CART_LOGIC.md", "16_CHECKOUT_PIPELINE_FLOW.md", "17_DIGITAL_RECEIPT_ENGINE.md")
$ecommerceContent = @"
---
name: rb-ecommerce
description: Use when working on shopping cart, checkout flow, receipts, or products logic for RB Remake.
---
"@
foreach ($file in $ecommerceFiles) {
    if (Test-Path "$aiRulesDir\$file") {
        $content = Get-Content "$aiRulesDir\$file" -Raw
        $ecommerceContent += "`n`n$content"
    }
}
Set-Content -Path "$skillsDir\rb-ecommerce\SKILL.md" -Value $ecommerceContent -Encoding UTF8

# 3. Skill: rb-database-auth
$dbFiles = @("07_DATABASE_SCHEMA_CORE.md", "08_DATABASE_SCHEMA_METADATA.md", "09_SUPABASE_RLS_POLICIES.md", "10_DATA_FETCHING_PATTERNS.md", "20_REALTIME_MONITORING_SYSTEM.md")
$dbContent = @"
---
name: rb-database-auth
description: Use when writing database schemas, Supabase auth, RLS policies, data fetching, or realtime features for RB Remake.
---
"@
foreach ($file in $dbFiles) {
    if (Test-Path "$aiRulesDir\$file") {
        $content = Get-Content "$aiRulesDir\$file" -Raw
        $dbContent += "`n`n$content"
    }
}
Set-Content -Path "$skillsDir\rb-database-auth\SKILL.md" -Value $dbContent -Encoding UTF8

# 4. Skill: rb-ui-ux
$uiFiles = @("12_GLASSMORPHISM_TECHNICAL_SPEC.md", "13_ANIMATION_&_TRANSITION.md", "14_RESPONSIVE_BREAKPOINTS.md", "19_ADMIN_DASHBOARD_LAYOUT.md", "21_ERROR_HANDLING_&_TOASTS.md")
$uiContent = @"
---
name: rb-ui-ux
description: Use when working on advanced CSS, glassmorphism, animations, responsive design, admin layouts, or toast notifications.
---
"@
foreach ($file in $uiFiles) {
    if (Test-Path "$aiRulesDir\$file") {
        $content = Get-Content "$aiRulesDir\$file" -Raw
        $uiContent += "`n`n$content"
    }
}
Set-Content -Path "$skillsDir\rb-ui-ux\SKILL.md" -Value $uiContent -Encoding UTF8

# 5. Skill: rb-optimization
$optFiles = @("18_IMAGE_COMPRESSION_WORKFLOW.md", "22_SEO_&_METADATA_STRATEGY.md", "23_PERFORMANCE_&_CACHING.md")
$optContent = @"
---
name: rb-optimization
description: Use when working on SEO, meta tags, image compression, caching, or performance optimization.
---
"@
foreach ($file in $optFiles) {
    if (Test-Path "$aiRulesDir\$file") {
        $content = Get-Content "$aiRulesDir\$file" -Raw
        $optContent += "`n`n$content"
    }
}
Set-Content -Path "$skillsDir\rb-optimization\SKILL.md" -Value $optContent -Encoding UTF8

# Rename original folder to avoid confusion and auto-indexing
Rename-Item -Path $aiRulesDir -NewName ".ai_rules_archive"

Write-Host "Reorganization complete!"
