import { useState, useEffect, useCallback } from 'react';
import 'react-quill-new/dist/quill.snow.css';
import Select from 'react-select';
import debounce from 'lodash.debounce';
import { useUser } from '../context/UserContext'; // Use the custom hook to access user context
import Experience from './Experience';

const Dashboard = () => {
  const [companyName, setCompanyName] = useState('');
  const { user, setUser } = useUser(); // Use user from context here
  const [level, setLevel] = useState('');
  const [experiences, setExperiences] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [experiencesLoading, setExperiencesLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (companyOptions.length > 0) return; // Only fetch if companyOptions is empty
    
    setLoading(true);
    try {
      const companyResponse = await fetch('/api/companyNames');
      const companyData = await companyResponse.json();
      if (companyResponse.ok) {
        setCompanyOptions(
          companyData.map((item) => ({
            label: item.name.trim(),
            value: item.name.trim(),
          }))
        );
      } else {
        console.error('Failed to fetch company names:', companyData.error);
      }
    } catch (error) {
      console.error('Error fetching company names:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchExperiences = useCallback(
    debounce(async () => {
      if (!companyName) return; // Skip fetching if company filter is not set
      
      setExperiencesLoading(true);
      try {
        const companyQuery = companyName ? `&company_name=${companyName}` : '';
        const levelQuery = level ? `&level=${level}` : '';
        const userQuery = user.user_id ? `&userId=${user.user_id}` : '';
        const experiencesResponse = await fetch(
          `/api/experiences?${companyQuery}${levelQuery}${userQuery}`
        );
        const experiencesData = await experiencesResponse.json();
        if (experiencesResponse.ok) {
          setExperiences(experiencesData.experiences);
          // Fetch comments for each experience
          for (let experience of experiencesData.experiences) {
            const commentsResponse = await fetch(
              `/api/comments?experience_id=${experience.id}`
            );
            const commentsData = await commentsResponse.json();
            if (commentsResponse.ok) {
              experience.comments = commentsData.comments;
            } else {
              console.error('Failed to fetch comments:', commentsData.error);
            }
          }
            // Keep the isExpanded flag true for the first experience
            if (experiencesData.experiences.length > 0) {
              experiencesData.experiences[0].isExpanded = true;
            }
        } else {
          // Clear experiences on failure
          setExperiences([]);
          console.error('Failed to fetch experiences:', experiencesData.error);
        }
      } catch (error) {
        // Clear experiences on failure
        setExperiences([]);
        console.error('Error fetching experiences:', error);
      } finally {
        setExperiencesLoading(false);
      }
    }, 1000),
    [companyName, level, user]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchExperiences();
  }, [companyName, level, user, fetchExperiences]);

  /**
 * Updates the list of experiences in the state.
 * 
 * This function checks if the experience has been marked for deletion (i.e., `deleted: true`).
 * - If `deleted` is `true`, it removes the experience with the matching `id` from the list.
 * - If `deleted` is `false` or not present, it updates the experience in the list by replacing the one with the matching `id` with the updated data.
 * @param {Object} updatedExperience - The experience object containing updated data, including an `id` to identify the experience.
 * @param {boolean} updatedExperience.deleted - A flag indicating whether the experience should be deleted. If `true`, the experience will be removed from the list.
 * @param {string} updatedExperience.id - The unique identifier of the experience to update or delete.
 */
const updateExperience = (updatedExperience) => {
  setExperiences((prevExperiences) =>
    updatedExperience.deleted
      ? prevExperiences.filter((experience) => experience.id !== updatedExperience.id)
      : prevExperiences.map((experience) =>
          experience.id === updatedExperience.id ? updatedExperience : experience
        )
  );
};



  return (
    <div className="dashboard-container p-6 space-y-6">
      {/* Filters Section */}
      <div className="filters mb-6 flex flex-col sm:flex-row sm:gap-4 sm:justify-start sm:space-x-4">
      <Select
          value={companyName ? { label: companyName, value: companyName } : null}
          onChange={(selectedOption) => setCompanyName(selectedOption?.value || '')}
          options={companyOptions}
          placeholder="Company Name"
          className="w-full sm:w-1/2 mb-3 sm:mb-0" // Full width on mobile, half width on small screens
          isClearable
          isSearchable
        />
        <input
          type="text"
          placeholder="Level search"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="w-full sm:w-1/2 p-2 border border-gray-300 rounded-lg"
          />
      </div>

      {/* Experiences List */}
      <div className="experience-list space-y-6">
        {loading ? (
          <p className="text-center text-gray-500">Loading company options...</p>
        ) : experiencesLoading ? (
          <p className="text-center text-gray-500">Loading experiences...</p>
        ) : !companyName ? (
          <p className="text-center text-gray-500">Choose a company to view interview experiences 👀</p> // Show this when no company is selected
        ) : experiences.length > 0 ? (
          experiences.map((experience) => (
            <Experience
            key={experience.id}
            experience={experience}
            updateExperience={updateExperience}
            showOpenInNewTabButton={true}
          />
          
        ))) : (
          <p className="text-center text-gray-500">No experiences available 🤐</p> // Show this when no experiences are available for the selected company
        )}
      </div>
    </div>
  );
};

export default Dashboard;
