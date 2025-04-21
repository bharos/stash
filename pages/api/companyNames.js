import supabase from '../../src/app/utils/supabaseClient';

export default async function handler(req, res) {
  const onlyWithQuestions = req.query.onlyWithQuestions === 'true';

  try {
    let allData = [];

    if (onlyWithQuestions) {
      // Fetch distinct company names that exist in experiences
      const { data: companyNamesInExperiences, error } = await supabase
      .from('experiences')
      .select('company_name')
      .eq('type', 'interview_experience')
      .then(res => ({
        data: [...new Set(res.data.map(d => d.company_name))], // unique list
        error: res.error
      }));

      if (error) {
        console.error('Error fetching company_names from experiences:', error);
        return res.status(500).json({ error: error.message });
      }

      if (companyNamesInExperiences.length === 0) {
        return res.status(404).json({ error: 'No companies with questions found' });
      }

      // Fetch all companies that exist in the above list
      const { data, error: companyError } = await supabase
        .from('company_names')
        .select('name, featured')
        .in('name', companyNamesInExperiences);

      if (companyError) {
        console.error('Error fetching company names:', companyError);
        return res.status(500).json({ error: companyError.message });
      }

      allData = data;
    } else {
      // Normal full data fetch with batching
      let from = 0;
      let to = 999;
      let fetchMore = true;

      const { count, error: countError } = await supabase
        .from('company_names')
        .select('id', { count: 'exact', head: true });

      if (countError) {
        console.error('Error fetching count:', countError);
        return res.status(500).json({ error: countError.message });
      }

      while (fetchMore) {
        const { data, error } = await supabase
          .from('company_names')
          .select('name, featured')
          .range(from, to);

        if (error) {
          console.error('Error fetching data:', error);
          return res.status(500).json({ error: error.message });
        }

        allData = [...allData, ...data];

        if (allData.length >= count) {
          fetchMore = false;
        } else {
          from = to + 1;
          to = to + 1000;
        }
      }
    }

    // Sort: featured first
    allData.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });

    console.log('Fetched company names size:', allData.length);

    if (allData.length === 0) {
      return res.status(404).json({ error: 'No company names found' });
    }

    return res.status(200).json(allData);
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
