import supabase from '../../src/app/utils/supabaseClient';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      const { user_id } = req.query;  // Use 'user_id' as the query parameter

      if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
      }

      try {
        // Fetch user profile
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', user_id)  // Ensure that user_id matches your table's column name
          .single();  // Fetch single row

        if (error) {
          console.error('Error fetching profile data:', error.message);  // Log the error

          // Handle specific error for no matching rows (PGRST116)
          if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Profile not found, please create one' });
          }

          // If some other error occurs, return a 500 error
          return res.status(500).json({ error: 'Error retrieving profile data' });
        }

        // If profile data exists, return the username
        return res.status(200).json({ username: data?.username || null });
      } catch (err) {
        console.error('Unexpected error:', err);  // Log any unexpected errors
        return res.status(500).json({ error: 'Unexpected error occurred' });
      }

    case 'POST':
      const { user_id: postUserId, username, isUnSubscribed } = req.body; // Changed to isUnSubscribed

      if (!postUserId) {
        return res.status(400).json({ error: 'user_id is required' });
      }

      if (username && username.length > 12) {
        return res.status(400).json({ error: 'Username can\'t be longer than 12 letters' });
      }

      try {
        // Try fetching the existing profile
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', postUserId)
          .single();

        const updates = {};
        if (username) updates.username = username;
        if (isUnSubscribed !== undefined) updates.is_unsubscribed = isUnSubscribed; // Updated field

        if (!existingProfile) {
          // If profile does not exist, insert a new one
          const { error: createError } = await supabase
            .from('profiles')
            .insert([{ user_id: postUserId, ...updates }]);

          if (createError) {
            console.error('Error creating profile:', createError.message); // Log error
            return res.status(500).json({ error: 'Error creating profile' });
          }

          return res.status(201).json({ message: 'Profile created successfully' });
        } else {
          // Profile exists, update the fields
          const { error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('user_id', postUserId);

          if (updateError) {
            console.error('Update error:', updateError);
            return res.status(500).json({ error: 'Error updating profile' });
          }

          return res.status(200).json({ message: 'Profile updated successfully' });
        }
      } catch (err) {
        console.error('Unexpected error during POST request:', err); // Log unexpected errors
        return res.status(500).json({ error: 'Unexpected error occurred' });
      }

    default:
      return res.status(405).json({ error: 'Method Not Allowed' });
  }
}
