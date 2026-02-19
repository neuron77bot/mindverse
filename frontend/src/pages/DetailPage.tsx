import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useMindverseStore } from '../store/mindverseStore';
import DetailView from '../components/Home/DetailView';

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const node = useMindverseStore((s) => s.nodes.find((n) => n.id === id));
  const setFocusedNode = useMindverseStore((s) => s.setFocusedNode);

  if (!node) return <Navigate to="/" replace />;

  return (
    <DetailView
      node={node}
      onBack={() => navigate('/')}
      onNavigateToMap={(nodeId) => {
        setFocusedNode(nodeId ?? null);
        navigate('/mapa');
      }}
    />
  );
}
