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
        const experiencesResponse = await fetch(
          `/api/experiences?${companyQuery}${levelQuery}`
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
        } else {
          console.error('Failed to fetch experiences:', experiencesData.error);
        }
      } catch (error) {
        console.error('Error fetching experiences:', error);
      } finally {
        setExperiencesLoading(false);
      }
    }, 500),
    [companyName, level]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchExperiences();
  }, [companyName, level, fetchExperiences]);

  const updateExperience = (updatedExperience) => {
    setExperiences((prevExperiences) =>
      prevExperiences.map((experience) =>
        experience.id === updatedExperience.id ? updatedExperience : experience
      )
    );
  };


  return (
    <div className="dashboard-container p-6 space-y-6">
      {/* Filters Section */}
      <div className="filters mb-6 flex gap-4">
        <Select
          value={companyName ? { label: companyName, value: companyName } : null}
          onChange={(selectedOption) => setCompanyName(selectedOption?.value || '')}
          options={companyOptions}
          placeholder="Select a Company"
          className="w-1/3"
          isClearable
          isSearchable
        />
        <input
          type="text"
          placeholder="Search by level"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg w-1/3"
        />
      </div>

      {/* Experiences List */}
      <div className="experience-list space-y-6">
        {loading ? (
          <p className="text-center text-gray-500">Loading company options...</p>
        ) : experiencesLoading ? (
          <p className="text-center text-gray-500">Loading experiences...</p>
        ) : !companyName ? (
          <p className="text-center text-gray-500">Choose a company to view interview experiences</p> // Show this when no company is selected
        ) : experiences.length > 0 ? (
          experiences.map((experience) => (
            <Experience
            key={experience.id}
            experience={experience}
            updateExperience={updateExperience}
          />
          
        ))) : (
          <p className="text-center text-gray-500">No experiences available.</p> // Show this when no experiences are available for the selected company
        )}
      </div>
    </div>
  );
};

export default Dashboard;
