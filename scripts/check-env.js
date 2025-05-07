const fs = require("fs")
const path = require("path")

// Define required environment variables
const requiredEnvVars = ["API_BASE_URL", "NEXT_PUBLIC_API_URL"]

// Check if .env.local exists
const envLocalPath = path.join(process.cwd(), ".env.local")
const envExamplePath = path.join(process.cwd(), ".env.example")

if (!fs.existsSync(envLocalPath)) {
  console.log("\x1b[33m%s\x1b[0m", "⚠️  Warning: .env.local file not found")
  console.log("\x1b[36m%s\x1b[0m", "📝 Please create a .env.local file based on .env.example")

  if (fs.existsSync(envExamplePath)) {
    console.log("\x1b[32m%s\x1b[0m", "✅ .env.example file found. You can copy it to .env.local and update the values.")
    console.log("\x1b[36m%s\x1b[0m", "   cp .env.example .env.local")
  } else {
    console.log(
      "\x1b[31m%s\x1b[0m",
      "❌ .env.example file not found. Please create a .env.local file with the following variables:",
    )
    requiredEnvVars.forEach((envVar) => {
      console.log(`   ${envVar}=your_value_here`)
    })
  }

  console.log("\x1b[0m", "") // Reset color
} else {
  console.log("\x1b[32m%s\x1b[0m", "✅ .env.local file found")

  // Read .env.local file
  const envContent = fs.readFileSync(envLocalPath, "utf8")
  const envVars = {}

  // Parse environment variables
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim()
      envVars[key] = value
    }
  })

  // Check for missing required variables
  const missingVars = requiredEnvVars.filter((envVar) => !envVars[envVar])

  if (missingVars.length > 0) {
    console.log("\x1b[33m%s\x1b[0m", `⚠️  Warning: Missing required environment variables: ${missingVars.join(", ")}`)
    console.log("\x1b[36m%s\x1b[0m", "   Please add them to your .env.local file")
  } else {
    console.log("\x1b[32m%s\x1b[0m", "✅ All required environment variables are set")
  }

  console.log("\x1b[0m", "") // Reset color
}
