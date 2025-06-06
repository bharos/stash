import { redirect } from 'next/navigation'; // For server-side redirects
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
  const { id } = await params;

  const experience = await fetchExperienceForSEO(id);

  if (!experience) {
    return {
      title: 'Experience Not Found',
      description: 'The requested experience could not be found.',
    };
  }

  // Fallbacks
  const username = experience?.username || 'Anonymous';
  const company = experience?.company_name || 'Company';
  const level = experience?.level || 'Level';
  const titleText = experience?.title || 'Shared Experience';

  // Custom title & description logic
  const isInterview = experience?.type === 'interview_experience';
  const isGeneralPost = experience?.type === 'general_post';

  const title = isInterview
    ? `${company} ${level} Interview Experience`
    : isGeneralPost
    ? `${titleText} - Post`
    : 'Experience';

  const description = isInterview
    ? `${company} ${level} interview experience shared by ${username}. Learn about the coding questions, design rounds, and more.`
    : isGeneralPost
    ? `Discussion: "${titleText}" by ${username}. Join the conversation and share your thoughts.`
    : 'Explore someone’s experience. Real stories and learnings from interviews and discussions.';

  const pageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/experience/${id}/${experience.slug}`;
  const image = experience?.image_url || 'default-image.jpg';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: 'article',
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      image,
    },
  };
}

export default async function ExperiencePage({ params }) {
  const { id } = await params;

  // Fetch the experience by ID
  const experience = await fetchExperienceForSEO(id);
  if (!experience) {
    return <div>Experience not found</div>;
  }

  console.log("Experience data:", experience);
  // Redirect to the `id/slug` URL format
  if (experience?.slug) {
    redirect(`/experience/${experience.id}/${experience.slug}`);
  }

  // If no slug is available, render the page (fallback)
  return <SingleExperiencePage experienceId={id} />;
}