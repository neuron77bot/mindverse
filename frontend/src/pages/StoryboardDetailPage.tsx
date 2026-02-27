import { useParams } from 'react-router-dom';
import StoryboardDetailView from '../components/Storyboard/StoryboardDetailView';

export default function StoryboardDetailPage() {
  const { id } = useParams<{ id: string }>();

  return <StoryboardDetailView id={id} />;
}
