export default async function handler(req, res) {
  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME;

  if (!token || !baseId || !tableName) {
    return res.status(500).json({
      error: "Missing Airtable environment variables"
    });
  }

  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?maxRecords=10`;

  try {
    const airtableResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!airtableResponse.ok) {
      const errorText = await airtableResponse.text();
      return res.status(airtableResponse.status).json({
        error: "Airtable request failed",
        details: errorText
      });
    }

    const data = await airtableResponse.json();

    const assignments = data.records.map((record) => {
      const fields = record.fields || {};

      return {
        id: record.id,
        assignment_name: fields.assignment_name || "",
        student: fields.student || "",
        clinical_site: fields.clinical_site || "",
        start_date: fields.start_date || "",
        end_date: fields.end_date || "",
        rotation_type: fields.rotation_type || "",
        readiness_status: fields.readiness_status || "",
        readiness_score: fields.readiness_score || "",
        risk_reason: fields.risk_reason || "",
        recommended_action: fields.recommended_action || "",
        ai_summary: fields.ai_summary || "",
        review_notes: fields.review_notes || "",
        ai_reviewed_at: fields.ai_reviewed_at || ""
      };
    });

    return res.status(200).json({
      assignments
    });
  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
}
