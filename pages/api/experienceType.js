// /api/experienceType.js
import supabase from '../../src/app/utils/supabaseClient';

export default async function handler(req, res) {
  const { experienceId } = req.query;

  if (!experienceId) {
    return res.status(400).json({ error: "experienceId is required" });
  }

  try {
    const { data, error } = await supabase
      .from("experiences")
      .select("type")
      .eq("id", experienceId)
      .single(); // Fetch single record
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Experience not found" });
    }

    res.status(200).json({ type: data.type });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
