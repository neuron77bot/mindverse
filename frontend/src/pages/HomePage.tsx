import { useNavigate } from 'react-router-dom';
import { useMindverseStore } from '../store/mindverseStore';
import HomeView from '../components/Home/HomeView';
import type { MindverseNode } from '../types';

export default function HomePage() {
  const navigate = useNavigate();
  const setFocusedNode = useMindverseStore((s) => s.setFocusedNode);

  const handleNavigateToMap = (nodeId?: string) => {
    setFocusedNode(nodeId ?? null);
    navigate('/mapa');
  };

  const handleNavigateToDetail = (node: MindverseNode) => {
    navigate(`/detail/${node.id}`);
  };

  return (
    <HomeView onNavigateToMap={handleNavigateToMap} onNavigateToDetail={handleNavigateToDetail} />
  );
}
