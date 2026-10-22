export async function testApiConnection() {
  try {
    // The schema endpoint is outside /api/v1/, so use fetch directly
    // for this diagnostic test.
    const response = await fetch("http://localhost:8000/api/schema/");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const schemaText = await response.text();

    console.log("TaskFlow API connected successfully.");
    console.log("Schema received:", schemaText.length, "characters");

    return true;
  } catch (error) {
    console.error("TaskFlow API connection failed:", error);
    return false;
  }
}
