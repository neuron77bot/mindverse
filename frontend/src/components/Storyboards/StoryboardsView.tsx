export default function StoryboardsView() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      padding: '24px',
      color: 'white'
    }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px' }}>
        Mis Storyboards
      </h1>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        {/* Card 1 */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          border: '1px solid #334155',
          overflow: 'hidden'
        }}>
          <div style={{
            aspectRatio: '16/9',
            backgroundColor: '#111827',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px'
          }}>
            🤖
          </div>
          <div style={{ padding: '16px' }}>
            <div style={{
              fontSize: '12px',
              padding: '4px 8px',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              color: '#60a5fa',
              borderRadius: '4px',
              display: 'inline-block',
              marginBottom: '8px'
            }}>
              🎙️ Voz
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              La aventura del robot perdido
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}>
              Un robot se pierde en una ciudad desconocida y debe encontrar su camino de regreso a casa.
            </p>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontSize: '12px', 
              color: '#64748b' 
            }}>
              <span>📚 3 viñetas</span>
              <span>24/02/2026</span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          border: '1px solid #334155',
          overflow: 'hidden'
        }}>
          <div style={{
            aspectRatio: '16/9',
            backgroundColor: '#111827',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px'
          }}>
            🌲
          </div>
          <div style={{ padding: '16px' }}>
            <div style={{
              fontSize: '12px',
              padding: '4px 8px',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              color: '#60a5fa',
              borderRadius: '4px',
              display: 'inline-block',
              marginBottom: '8px'
            }}>
              📝 Texto
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              El misterio del bosque encantado
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}>
              Una niña descubre que su abuelo era un mago y debe resolver un antiguo misterio en el bosque.
            </p>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontSize: '12px', 
              color: '#64748b' 
            }}>
              <span>📚 1 viñeta</span>
              <span>23/02/2026</span>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          border: '1px solid #334155',
          overflow: 'hidden'
        }}>
          <div style={{
            aspectRatio: '16/9',
            backgroundColor: '#111827',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px'
          }}>
            ⚡
          </div>
          <div style={{ padding: '16px' }}>
            <div style={{
              fontSize: '12px',
              padding: '4px 8px',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              color: '#60a5fa',
              borderRadius: '4px',
              display: 'inline-block',
              marginBottom: '8px'
            }}>
              🎙️ Voz
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              Superhéroe por un día
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}>
              Un chico tímido obtiene superpoderes por 24 horas y debe decidir qué hacer con ellos.
            </p>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontSize: '12px', 
              color: '#64748b' 
            }}>
              <span>📚 5 viñetas</span>
              <span>22/02/2026</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        border: '1px solid rgba(234, 179, 8, 0.3)',
        borderRadius: '8px',
        color: '#fbbf24'
      }}>
        ⚠️ Vista estática de prueba - Sin conexión a backend todavía
      </div>
    </div>
  );
}
