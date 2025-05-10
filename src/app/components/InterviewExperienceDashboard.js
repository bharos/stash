import { useState, useEffect, useCallback, useRef } from 'react';
import 'react-quill-new/dist/quill.snow.css';
import Select from 'react-select';
import debounce from 'lodash.debounce';
import { useUser } from '../context/UserContext'; // Use the custom hook to access user context
import { useDarkMode } from '../context/DarkModeContext';
import { useViewLimitContext } from '../context/ViewLimitContext'; // Import view limit context directly
import Experience from './Experience';
import TrendingPosts from './TrendingPosts';
import ContentPaywall from './ContentPaywall';
import supabase from '../utils/supabaseClient';

const InterviewExperienceDashboard = () => {
  const { darkMode } = useDarkMode();
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
  
  // Access view limit data and functions directly from context
  const { viewLimitData, fetchViewLimitData } = useViewLimitContext();

  // State to track whether to show the paywall
  const [showPaywall, setShowPaywall] = useState(false);

  // Update showPaywall when viewLimitData changes
  useEffect(() => {
    // Check if user has reached the view limit and is not premium
    const shouldShowPaywall = user?.user_id && viewLimitData.isLimitReached && !viewLimitData.isPremium;
    setShowPaywall(shouldShowPaywall);
  }, [viewLimitData, user?.user_id]);

  const fetchData = useCallback(async () => {
    if (companyOptions.length > 0) return; // Only fetch if companyOptions is empty
    
    setLoading(true);
    try {
      const companyResponse = await fetch('/api/companyNames?onlyWithQuestions=true');
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
      
      // Fetch the latest view limit data to update the UI
      // This ensures the UI stays in sync after dashboard views are counted
      if (user?.user_id) {
        fetchViewLimitData();
      }
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
    fetchViewLimitData();
}, [fetchTrendingPosts, fetchTags, user?.user_id]); // fetchViewLimitData intentionally omitted

  return (
    <div className={`dashboard-container p-2 sm:p-6 space-y-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-4 text-white">Interview Experiences</h1>
        <p className="text-lg text-blue-100">Discover real interview experiences and learn from others' journeys</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {/* View Limit Warning - Only show when close to limit but not when paywall is displayed */}
          {user?.user_id && !viewLimitData.isPremium && viewLimitData.remainingViews <= 1 && !viewLimitData.isLimitReached && (
            <div className={`p-4 mb-4 border ${darkMode ? 'bg-gray-800 border-yellow-600' : 'bg-yellow-50 border-yellow-200'} rounded-lg`}>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <span className="material-icons text-yellow-500">warning</span>
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                    Almost at daily view limit
                  </h3>
                  <div className={`mt-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <p>You have {viewLimitData.remainingViews} view left today. Consider posting content to earn coins or upgrading to premium.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            {/* Search filters */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-lg shadow-sm p-4 space-y-4 border`}>
              <div className="flex flex-col sm:flex-row gap-4">
                <Select
                  value={companyName ? { label: companyName, value: companyName } : null}
                  onChange={(selectedOption) => setCompanyName(selectedOption?.value || '')}
                  options={companyOptions}
                  placeholder="Company Name"
                  className="w-full sm:w-1/2"
                  isClearable
                  isSearchable
                  theme={(theme) => ({
                    ...theme,
                    colors: {
                      ...theme.colors,
                      primary: '#3b82f6',
                      primary75: '#60a5fa',
                      primary50: '#93c5fd',
                      primary25: '#bfdbfe',
                      neutral0: darkMode ? '#1f2937' : '#ffffff',
                      neutral5: darkMode ? '#374151' : '#f3f4f6',
                      neutral10: darkMode ? '#4b5563' : '#e5e7eb',
                      neutral20: darkMode ? '#6b7280' : '#d1d5db',
                      neutral30: darkMode ? '#9ca3af' : '#9ca3af',
                      neutral40: darkMode ? '#d1d5db' : '#6b7280',
                      neutral50: darkMode ? '#e5e7eb' : '#4b5563',
                      neutral60: darkMode ? '#f3f4f6' : '#374151',
                      neutral70: darkMode ? '#f9fafb' : '#1f2937',
                      neutral80: darkMode ? '#ffffff' : '#111827',
                      neutral90: darkMode ? '#ffffff' : '#111827',
                    },
                  })}
                />
                <input
                  type="text"
                  placeholder="Level search"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className={`w-full sm:w-1/2 p-2 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
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
                        : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
                      : darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
                      : darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
                  <p className={`mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading company options...</p>
                </div>
              ) : experiencesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className={`mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading experiences...</p>
                </div>
              ) : !companyName ? (
                <>
                  <div className={`text-center py-12 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-lg shadow-sm border`}>
                    <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Choose a company to view interview experiences 👀</h3>
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
                  <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-4`}>🏁 You've reached the end 🔚</p>
                </>
              ) : (
                <>
                  <div className={`text-center py-12 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-lg shadow-sm border`}>
                    <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-2`}>No experiences available 🤐</h3>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Try selecting a different company or level</p>
                  </div>
                  {/* Show Trending Posts on mobile when no experiences are found */}
                  <div className="lg:hidden">
                    <TrendingPosts />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Desktop Only */}
        <div className="hidden lg:block lg:col-span-1 space-y-6">
          <TrendingPosts />
        </div>
      </div>

      {/* Content Paywall - Shown when view limit is reached */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <ContentPaywall />
        </div>
      )}
    </div>
  );
};

export default InterviewExperienceDashboard;
