function extractOobCode(firebaseLink, userEmail, type = "/reset-password") {
  try {
    const url = new URL(firebaseLink);
    const oobCode = url.searchParams.get("oobCode");

    if (!oobCode) {
      throw new Error("oobCode not found in Firebase link.");
    }

    // Build custom frontend reset link
    return `${
      process.env.FRONTEND_URL
    }/auth/${type}?oobCode=${encodeURIComponent(
      oobCode
    )}&email=${encodeURIComponent(userEmail)}`;
  } catch (err) {
    console.error("Error extracting oobCode:", err.message);
    throw err;
  }
}

module.exports = extractOobCode;
