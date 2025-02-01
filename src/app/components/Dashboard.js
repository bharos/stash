import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic'; // Import dynamic from next/dynamic
import 'react-quill-new/dist/quill.snow.css';
import Select from 'react-select';
import debounce from 'lodash.debounce';

// Dynamically import ReactQuill
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const Dashboard = () => {
  const [companyName, setCompanyName] = useState('');
  const [level, setLevel] = useState('');
  const [experiences, setExperiences] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [experiencesLoading, setExperiencesLoading] = useState(false);

  // Function to fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch company names
      const companyResponse = await fetch('/api/companyNames');
      const companyData = await companyResponse.json();
      if (companyResponse.ok) {
        setCompanyOptions(companyData.map(item => ({
          label: item.name.trim(), // Trim spaces
          value: item.name.trim(),
        })));
      } else {
        console.error('Failed to fetch company names:', companyData.error);
      }
    } catch (error) {
      console.error('Error fetching company names:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced experience fetch
  const fetchExperiences = useCallback(
    debounce(async () => {
      setExperiencesLoading(true);
      try {
        // If companyName is empty, don't include company_name in the query string
        const companyQuery = companyName ? `&company_name=${companyName}` : '';
        const levelQuery = level ? `&level=${level}` : '';
        const experiencesResponse = await fetch(`/api/experiences?${companyQuery}${levelQuery}`);
        const experiencesData = await experiencesResponse.json();
        if (experiencesResponse.ok) {
          setExperiences(experiencesData.experiences);
        } else {
          console.error('Failed to fetch experiences:', experiencesData.error);
        }
      } catch (error) {
        console.error('Error fetching experiences:', error);
      } finally {
        setExperiencesLoading(false);
      }
    }, 500), // Debounce delay in milliseconds
    [companyName, level]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchExperiences(); // This will now fetch experiences even if companyName is empty
  }, [companyName, level, fetchExperiences]);

  const toggleExperienceDetails = (experienceId) => {
    setExperiences(prevExperiences =>
      prevExperiences.map(experience =>
        experience.id === experienceId
          ? { ...experience, isExpanded: !experience.isExpanded }
          : experience
      )
    );
  };

  return (
    <div className="dashboard-container p-6 space-y-6">
      {/* Filters Section */}
      <div className="filters mb-6 flex gap-4">
        {/* Autocomplete for Company Name */}
        <Select
          value={companyName ? { label: companyName, value: companyName } : null}
          onChange={(selectedOption) => setCompanyName(selectedOption?.value || '')}
          options={companyOptions}
          placeholder="Select a Company"
          className="w-1/3"
          isClearable // Allow clearing the selection
          isSearchable // Allow typing in the search box
        />
        {/* Level Search */}
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
        ) : experiences.length > 0 ? (
          experiences.map((experience) => (
            <div
              key={experience.id}
              className={`experience-card bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6 mt-4 relative overflow-hidden ${
                experience.isExpanded ? 'h-auto' : 'h-[200px]'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold">{experience.company_name[0]}</span>
                </div>
                <div className="flex-grow">
                  <h3 className="text-2xl font-semibold text-gray-900">{experience.company_name}</h3>
                  <p className="text-gray-500">Level: <span className="font-medium text-gray-700">{experience.level}</span></p>
                </div>
                {/* Expand/Shrink Button (Top Right) */}
                <button
                  onClick={() => toggleExperienceDetails(experience.id)}
                  className="absolute top-2 right-2 text-blue-600 font-semibold text-2xl w-8 h-8 bg-white rounded-full flex items-center justify-center border border-blue-600"
                >
                  {experience.isExpanded ? '–' : '+'}
                </button>
              </div>

              {/* Experience Details */}
              <div className="experience-details mt-4">
                {experience.rounds.map((round, index) => (
                  <div key={index} className="round-container mb-4">
                    <h4 className="font-semibold text-xl text-blue-600">Round {index + 1}: {round.round_type}</h4>
                    <div className="w-full p-0 border-none rounded-md">
                      <ReactQuill
                        value={round.details}
                        readOnly
                        theme="snow"
                        className="w-full bg-transparent p-0 text-gray-900 min-h-[100px]"
                        modules={{
                          toolbar: false, // No toolbar
                        }}
                        style={{
                          backgroundColor: 'transparent',
                          color: '#333',
                          margin: 0,
                          padding: 0,
                          width: '100%',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No experiences found.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
