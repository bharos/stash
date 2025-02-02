import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
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
  const [newComments, setNewComments] = useState({}); // State for comments per experience

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

  const toggleExperienceDetails = (experienceId) => {
    setExperiences((prevExperiences) =>
      prevExperiences.map((experience) =>
        experience.id === experienceId
          ? { ...experience, isExpanded: !experience.isExpanded }
          : experience
      )
    );
  };

  // Handle comment submission
  const handleCommentSubmit = async (experienceId) => {
    const comment = newComments[experienceId];
  
    if (comment && comment.trim()) {
      try {
        const response = await fetch('/api/comments', {
          method: 'POST',
          body: JSON.stringify({ experience_id: experienceId, comment }),
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
  
        if (response.ok) {
          // Add the new comment to the respective experience
          setExperiences((prevExperiences) =>
            prevExperiences.map((experience) =>
              experience.id === experienceId
                ? { ...experience, comments: [...experience.comments, data.comment] }
                : experience
            )
          );
          // Clear the input for the specific experience
          setNewComments((prevState) => ({ ...prevState, [experienceId]: '' }));
        } else {
          console.error('Failed to add comment:', data.error);
        }
      } catch (error) {
        console.error('Error submitting comment:', error);
      }
    }
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
            <p className="text-gray-500">
              Level: <span className="font-medium text-gray-700">{experience.level}</span>
            </p>
          </div>
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
              <h4 className="font-semibold text-xl text-blue-600">
                Round {index + 1}: {round.round_type}
              </h4>
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

        {/* Comments Section */}
        <div className="comments mt-4">
          <h3 className="text-xl font-semibold text-gray-800">Comments</h3>
          <div className="comments-list space-y-4">
            {experience.comments && experience.comments.length > 0 ? (
              experience.comments.map((comment, index) => (
                <div key={index} className="comment p-4 bg-gray-100 rounded-lg">
                  <p>{comment?.comment || 'No content available'}</p>
                </div>
              ))
            ) : (
              <p>No comments yet.</p>
            )}
          </div>

          {/* Add Comment */}
                <div className="add-comment mt-4">
                <textarea
                  value={newComments[experience.id] || ''}
                  onChange={(e) =>
                  setNewComments({ ...newComments, [experience.id]: e.target.value })
                  }
                  placeholder="Add a comment"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
               <button
    onClick={() => handleCommentSubmit(experience.id)}
    className={`mt-2 p-2 rounded-lg text-white ${
      !newComments[experience.id] || !newComments[experience.id].trim()
        ? 'bg-gray-400 cursor-not-allowed'  // Disabled button styles
        : 'bg-blue-600 hover:bg-blue-700'  // Active button styles
    } ${!newComments[experience.id] || !newComments[experience.id].trim() ? 'hover:bg-gray-400' : ''}`} // Remove hover effect when disabled
    disabled={!newComments[experience.id] || !newComments[experience.id].trim()} // Disable button if empty or whitespace
  >
    Add Comment
  </button>
                </div>
              </div>
              </div>
            ))
            ) : (
            <p className="text-center text-gray-500">No experiences available.</p> // Show this when no experiences are available for the selected company
  )}
</div>
    </div>
  );
};

export default Dashboard;
