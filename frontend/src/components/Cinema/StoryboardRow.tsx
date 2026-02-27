import StoryboardCard from './StoryboardCard';

interface Frame {
  frame: number;
  scene: string;
  visualDescription: string;
  dialogue?: string;
  imageUrl?: string;
}

interface Storyboard {
  _id: string;
  title: string;
  description?: string;
  genre?: string;
  thumbnailUrl: string | null;
  frameCount: number;
  duration: string;
  createdAt: string;
  frames: Frame[];
}

interface StoryboardRowProps {
  title: string;
  storyboards: Storyboard[];
  onCardClick: (storyboard: Storyboard) => void;
}

export default function StoryboardRow({ title, storyboards, onCardClick }: StoryboardRowProps) {
  if (storyboards.length === 0) return null;

  return (
    <div className="mb-8 w-full">
      <h2 className="text-xl font-semibold text-white mb-4 px-4 sm:px-8">{title}</h2>
      <div className="relative w-full cinema-scroll-container scrollbar-hide">
        <div className="flex flex-nowrap gap-4 px-4 sm:px-8 pb-4">
          {storyboards.map((sb) => (
            <StoryboardCard key={sb._id} storyboard={sb} onClick={() => onCardClick(sb)} />
          ))}
        </div>
      </div>
    </div>
  );
}
