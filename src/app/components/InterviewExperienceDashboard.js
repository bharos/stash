import { useState, useEffect, useCallback, useRef } from 'react';
import 'react-quill-new/dist/quill.snow.css';
import Select from 'react-select';
import debounce from 'lodash.debounce';
import { useUser } from '../context/UserContext'; // Use the custom hook to access user context
import Experience from './Experience';
import TrendingPosts from './TrendingPosts';
import supabase from '../utils/supabaseClient';

const InterviewExperienceDashboard = () => {
  const [companyName, setCompanyName] = useState('');
  const { user } = useUser(); // Use user from context here
  const [level, setLevel] = useState('');
  const [experiences, setExperiences] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [experiencesLoading, setExperiencesLoading] = useState(false);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'popular', 'trending'
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

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

// Refs to track the latest state values
const companyNameRef = useRef(companyName);
const levelRef = useRef(level);
const sortByRef = useRef(sortBy);

// Update refs when state changes
useEffect(() => {
  companyNameRef.current = companyName;
  levelRef.current = level;
  sortByRef.current = sortBy;
}, [companyName, level, sortBy]);

const fetchExperiences = useCallback(
  debounce(async () => {
    // Access the latest values using refs
    const currentCompanyName = companyNameRef.current;
    const currentLevel = levelRef.current;
    const currentSortBy = sortByRef.current;
    
    // Skip fetching if companyName is not set
    if (!currentCompanyName) return;
    setExperiencesLoading(true);

    try {
      // Construct query strings based on the latest values
      const companyQuery = currentCompanyName ? `&company_name=${currentCompanyName}` : '';
      const levelQuery = currentLevel ? `&level=${currentLevel}` : '';
      // Prepare the fetch headers
      const headers = {
        'Content-Type': 'application/json',
      };
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (sessionData?.session?.access_token) {
        // If token is available, add it to the Authorization header
        headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
      }

      const experiencesResponse = await fetch(`/api/interviewExperiences?${companyQuery}${levelQuery}&sort_by=${currentSortBy}`, {
        method: 'GET',
        headers: headers
      });
      const experiencesData = await experiencesResponse.json();

      if (experiencesResponse.ok) {
        setExperiences(experiencesData.experiences);
  
        // Loop through the experiences and fetch comments for each
        for (let experience of experiencesData.experiences) {
          const commentsResponse = await fetch(
            `/api/comments?experience_id=${experience.id}`, {
              method: 'GET',
              headers: headers
            });
          const commentsData = await commentsResponse.json();
          
          if (commentsResponse.ok) {
            experience.comments = commentsData.comments;
          } else {
            console.error('Failed to fetch comments:', commentsData.error);
          }
        }
  
        // Keep the 'isExpanded' flag true for the all experiences (UI state)
          experiencesData.experiences.map(experience => experience.isExpanded = true);
      } else {
        // If the fetch fails, clear the experiences state
        setExperiences([]);
        console.error('Failed to fetch experiences:', experiencesData.error);
      }
    } catch (error) {
      setExperiences([]);
      console.error('Error fetching experiences:', error);
    } finally {
      setExperiencesLoading(false);
    }
  }, 500), // 500ms debounce delay
  [] // Empty dependency array ensures that 'fetchExperiences' doesn't get recreated on every render
);

useEffect(() => {
  fetchData();
}, [fetchData]);

// Add back the effect to trigger fetchExperiences
useEffect(() => {
  if (companyName) {
    fetchExperiences();
  }
}, [companyName, level, sortBy, fetchExperiences]);

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

// Fetch trending posts
const fetchTrendingPosts = useCallback(async () => {
  try {
    const response = await fetch('/api/trending?limit=5');
    const data = await response.json();
    if (response.ok) {
      // Map the trending data to include necessary fields
      const mappedPosts = data.map(post => ({
        id: post.experience_id,
        title: post.title,
        company_name: post.company_name,
        level: post.level,
        likes: post.likes,
        comments: post.comments,
        trending_score: post.trending_score
      }));
      setTrendingPosts(mappedPosts);
    } else {
      console.error('Failed to fetch trending posts:', data.error);
    }
  } catch (error) {
    console.error('Error fetching trending posts:', error);
  }
}, []);

// Fetch available tags
const fetchTags = useCallback(async () => {
  try {
    const response = await fetch('/api/tags');
    const data = await response.json();
    if (response.ok) {
      setAvailableTags(data.tags);
    }
  } catch (error) {
    console.error('Error fetching tags:', error);
  }
}, []);

useEffect(() => {
  fetchTrendingPosts();
  fetchTags();
}, [fetchTrendingPosts, fetchTags]);

  return (
    <div className="dashboard-container p-2 sm:p-6 space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-4">Interview Experiences</h1>
        <p className="text-lg opacity-90">Discover real interview experiences and learn from others' journeys</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters Section */}
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select
                value={companyName ? { label: companyName, value: companyName } : null}
                onChange={(selectedOption) => setCompanyName(selectedOption?.value || '')}
                options={companyOptions}
                placeholder="Company Name"
                className="w-full sm:w-1/2"
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
            
            {/* Tags Filter */}
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTags(prev => 
                      prev.includes(tag) 
                        ? prev.filter(t => t !== tag)
                        : [...prev, tag]
                    );
                  }}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Sort Options */}
            <div className="flex gap-4">
              <button
                onClick={() => setSortBy('recent')}
                className={`px-4 py-2 rounded-lg ${
                  sortBy === 'recent'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`px-4 py-2 rounded-lg ${
                  sortBy === 'popular'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Popular
              </button>
            </div>
          </div>

          {/* Experiences List */}
          <div className="experience-list space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading company options...</p>
              </div>
            ) : experiencesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading experiences...</p>
              </div>
            ) : !companyName ? (
              <>
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-800">Choose a company to view interview experiences 👀</h3>
                </div>
                {/* Show Trending Posts on mobile when no company is selected */}
                <div className="lg:hidden">
                  <TrendingPosts />
                </div>
              </>
            ) : experiences.length > 0 ? (
              <>
                {experiences.map((experience) => (
                  <Experience
                    key={experience.id}
                    experience={experience}
                    updateExperience={updateExperience}
                    showOpenInNewTabButton={true}
                  />
                ))}
                <p className="text-center text-gray-500 mt-4">🏁 You've reached the end 🔚</p>
              </>
            ) : (
              <>
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No experiences available 🤐</h3>
                  <p className="text-gray-600">Try selecting a different company or level</p>
                </div>
                {/* Show Trending Posts on mobile when no experiences are found */}
                <div className="lg:hidden">
                  <TrendingPosts />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sidebar - Desktop Only */}
        <div className="hidden lg:block lg:col-span-1 space-y-6">
          <TrendingPosts />
        </div>
      </div>
    </div>
  );
};

export default InterviewExperienceDashboard;
