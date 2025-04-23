import SingleExperiencePage from '../../components/SingleExperiencePage';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

// Helper function to fetch the experience data for SEO
async function fetchExperienceForSEO(experienceId) {
  const typeRes = await fetch(`${baseUrl}/api/experienceType?experienceId=${experienceId}`);
  if (!typeRes.ok) return null;

  const typeData = await typeRes.json();

  let apiUrl;
  if (typeData.type === 'general_post') {
    apiUrl = `${baseUrl}/api/generalPosts?experienceId=${experienceId}`;
  } else if (typeData.type === 'interview_experience') {
    apiUrl = `${baseUrl}/api/interviewExperiences?experienceId=${experienceId}`;
  } else {
    return null;
  }

  const res = await fetch(apiUrl);
  if (!res.ok) return null;

  const data = await res.json();
  return data.experiences?.[0] || null;
}

// This function is used for SEO meta tags
export async function generateMetadata({ params }) {
    // Wait for params to be available
    const { id } = await params; // Ensure params are awaited before using
  
    const experience = await fetchExperienceForSEO(id); // Use the awaited id
  
    // Create a custom description based on available fields
    const description = `${experience?.company_name || 'Company'} - ${experience?.level || 'Level G9'}: ${experience?.type === 'interview_experience' ? 'Interview Experience' : 'General Post'} shared by ${experience?.username || 'Anonymous'}`;
  
    // Default metadata if the experience is not found
    return {
      title: experience?.company_name || 'Shared Experience',  // Using company_name for the title
      description: description || 'Explore someone’s experience',  // Use the generated description
      openGraph: {
        title: experience?.company_name || 'Shared Experience',
        description: description || 'Explore someone’s experience',
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/experience/${id}`,  // URL for OpenGraph
        type: 'article',
        images: [
          // Add OpenGraph image URL if available (you can modify this part based on your data structure)
          experience?.image_url || 'default-image.jpg',
        ],
      },
      twitter: {
        card: 'summary_large_image', // Twitter card type (can be changed)
        title: experience?.company_name || 'Shared Experience',
        description: description || 'Explore someone’s experience',
        image: experience?.image_url || 'default-image.jpg',
      }
    };
  }
  

  export default async function ExperiencePage({ params }) {
    // Wait for params to be available
    const { id } = await params; // Ensure params are awaited before using
    return (
      <SingleExperiencePage experienceId={id} />
    );
  }
