/**
 * This script verifies that the robots.txt file is correctly configured
 * to prevent indexing of the admin panel.
 *
 * Run with: npx ts-node scripts/verify-robots.ts
 */

import fs from "fs"
import path from "path"

function verifyRobotsTxt() {
  try {
    const robotsPath = path.join(process.cwd(), "public", "robots.txt")
    const robotsContent = fs.readFileSync(robotsPath, "utf8")

    console.log("Checking robots.txt configuration...")

    // Check for User-agent: *
    if (!robotsContent.includes("User-agent: *")) {
      console.error('❌ Missing "User-agent: *" directive in robots.txt')
    } else {
      console.log('✅ Found "User-agent: *" directive')
    }

    // Check for Disallow: /
    if (!robotsContent.includes("Disallow: /")) {
      console.error('❌ Missing "Disallow: /" directive in robots.txt')
    } else {
      console.log('✅ Found "Disallow: /" directive')
    }

    // Check for Noindex directive
    if (!robotsContent.includes("Noindex:")) {
      console.warn('⚠️ Consider adding "Noindex: /" directive for additional protection')
    } else {
      console.log('✅ Found "Noindex" directive')
    }

    console.log("\nRobots.txt content:")
    console.log("-------------------")
    console.log(robotsContent)
    console.log("-------------------")

    console.log("\nReminder: robots.txt is just one layer of protection.")
    console.log("Ensure you also have meta tags and HTTP headers configured.")
  } catch (error) {
    console.error("Error verifying robots.txt:", error)
  }
}

verifyRobotsTxt()
