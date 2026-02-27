import StoryboardListView from '../components/Storyboard/StoryboardListView';
import Breadcrumb from '../components/UI/Breadcrumb';

export default function StoryboardListPage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
      <Breadcrumb items={[{ label: 'Storyboards' }]} />
      <StoryboardListView />
    </div>
  );
}
