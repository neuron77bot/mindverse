import GalleryView from '../components/Gallery/GalleryView';
import Breadcrumb from '../components/UI/Breadcrumb';

export default function GalleryPage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
      <Breadcrumb items={[{ label: 'Galería' }]} />
      <GalleryView />
    </div>
  );
}
