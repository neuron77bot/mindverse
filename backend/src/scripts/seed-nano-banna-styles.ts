// Script para crear 20 estilos predefinidos optimizados para Nano Banna Edit
import 'dotenv/config';
import { connectDatabase } from '../services/database.js';
import { PromptStyleTag } from '../models/PromptStyleTag.js';

// ID de usuario del sistema para estilos predefinidos
// Puedes cambiar esto por un ID específico o usar un usuario admin
const SYSTEM_USER_ID = process.env.SYSTEM_USER_ID || 'system';

interface StyleDefinition {
  name: string;
  description: string;
  promptText: string;
  category?: string;
}

// 20 estilos optimizados para Nano Banna Edit
const styles: StyleDefinition[] = [
  // Cinematic/Film (3 estilos)
  {
    name: '@cinematic-noir',
    description: 'Film noir dramático con alto contraste',
    promptText:
      'cinematic film noir style, dramatic high contrast black and white, deep shadows, moody atmospheric lighting, vintage 1940s aesthetic, chiaroscuro lighting, classic Hollywood cinematography',
    category: 'cinematic',
  },
  {
    name: '@cinematic-warm',
    description: 'Tono cinematográfico cálido',
    promptText:
      'cinematic warm tones, golden hour lighting, soft amber and orange hues, film grain texture, anamorphic lens flare, professional color grading, shallow depth of field',
    category: 'cinematic',
  },
  {
    name: '@cinematic-cool',
    description: 'Tonos fríos estilo thriller',
    promptText:
      'cinematic cool blue tones, thriller movie aesthetic, desaturated colors with blue color grading, dramatic lighting, teal and orange color palette, modern blockbuster look',
    category: 'cinematic',
  },

  // Artistic/Painting (4 estilos)
  {
    name: '@oil-painting',
    description: 'Estilo óleo clásico',
    promptText:
      'classical oil painting style, rich textures, visible brushstrokes, Renaissance technique, museum quality artwork, deep colors with layered glazing, fine art masterpiece',
    category: 'artistic',
  },
  {
    name: '@watercolor-soft',
    description: 'Acuarela suave y etérea',
    promptText:
      'soft watercolor painting, delicate washes of color, translucent layers, organic bleeds and blooms, dreamy ethereal atmosphere, pastel color palette, artistic paper texture',
    category: 'artistic',
  },
  {
    name: '@digital-art',
    description: 'Arte digital moderno',
    promptText:
      'modern digital art, vibrant colors, clean lines, contemporary illustration style, professional digital painting, smooth gradients, polished finish, trending on artstation',
    category: 'artistic',
  },
  {
    name: '@impressionist',
    description: 'Estilo impresionista',
    promptText:
      'impressionist painting style, loose visible brushwork, emphasis on light and color, outdoor scene quality, Monet-inspired technique, dappled sunlight, soft focus, vibrant color palette',
    category: 'artistic',
  },

  // Anime/Cartoon (3 estilos)
  {
    name: '@anime-vibrant',
    description: 'Anime colorido y vibrante',
    promptText:
      'vibrant anime style, bold saturated colors, clean cel-shaded look, expressive features, dynamic composition, modern anime aesthetic, sharp linework, studio quality animation',
    category: 'anime',
  },
  {
    name: '@anime-dark',
    description: 'Anime oscuro y dramático',
    promptText:
      'dark anime style, dramatic shadows, muted color palette with selective bright accents, seinen manga aesthetic, gritty atmosphere, detailed character art, mature themes',
    category: 'anime',
  },
  {
    name: '@cartoon-2d',
    description: 'Cartoon 2D tradicional',
    promptText:
      'traditional 2D cartoon style, bold outlines, flat colors, simplified forms, playful character design, classic animation aesthetic, whimsical and fun',
    category: 'cartoon',
  },

  // Photography (3 estilos)
  {
    name: '@portrait-studio',
    description: 'Retrato de estudio profesional',
    promptText:
      'professional studio portrait photography, soft diffused lighting, clean background, sharp focus on subject, professional headshot quality, proper exposure, natural skin tones',
    category: 'photography',
  },
  {
    name: '@street-photography',
    description: 'Fotografía callejera documental',
    promptText:
      'street photography style, candid moment, documentary aesthetic, natural lighting, urban environment, authentic real-world scene, photojournalistic quality, decisive moment',
    category: 'photography',
  },
  {
    name: '@macro-detailed',
    description: 'Macro ultra detallado',
    promptText:
      'extreme macro photography, ultra detailed close-up, shallow depth of field, intricate textures visible, professional macro lens quality, sharp focus point, beautiful bokeh background',
    category: 'photography',
  },

  // Fantasy/Sci-Fi (3 estilos)
  {
    name: '@fantasy-epic',
    description: 'Fantasía épica',
    promptText:
      'epic fantasy art, grand scale, mythical atmosphere, detailed fantasy world, magical elements, dramatic composition, rich colors, concept art quality, heroic fantasy aesthetic',
    category: 'fantasy',
  },
  {
    name: '@cyberpunk-neon',
    description: 'Cyberpunk con neones',
    promptText:
      'cyberpunk aesthetic, neon lights, futuristic urban setting, vibrant purples and blues with pink accents, rain-slicked streets, high-tech low-life atmosphere, dystopian future',
    category: 'scifi',
  },
  {
    name: '@scifi-clean',
    description: 'Sci-fi limpio y futurista',
    promptText:
      'clean sci-fi aesthetic, sleek futuristic design, minimalist technology, white and chrome surfaces, advanced civilization, optimistic future vision, high-tech environment',
    category: 'scifi',
  },

  // Abstract/Experimental (4 estilos)
  {
    name: '@abstract-geometric',
    description: 'Abstracto geométrico',
    promptText:
      'abstract geometric art, bold shapes and forms, mathematical precision, vibrant color blocks, modern composition, clean lines, contemporary design, balanced asymmetry',
    category: 'abstract',
  },
  {
    name: '@glitch-art',
    description: 'Arte glitch digital',
    promptText:
      'glitch art aesthetic, digital distortion, RGB shift, databending effects, corrupted data visualization, pixel sorting, contemporary digital art, technological artifacts',
    category: 'experimental',
  },
  {
    name: '@minimalist-clean',
    description: 'Minimalista limpio',
    promptText:
      'minimalist aesthetic, clean simple composition, negative space, limited color palette, essential elements only, modern design, uncluttered, zen-like simplicity',
    category: 'minimalist',
  },
  {
    name: '@surreal-dream',
    description: 'Surrealismo onírico',
    promptText:
      'surreal dreamlike quality, impossible geometry, unexpected juxtapositions, Salvador Dali inspired, subconscious imagery, ethereal atmosphere, reality bending, symbolic elements',
    category: 'surreal',
  },
];

async function seedNanoBannaStyles() {
  try {
    await connectDatabase();
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existen estilos con estos nombres
    const existingStyles = await PromptStyleTag.find({
      userId: SYSTEM_USER_ID,
      name: { $in: styles.map((s) => s.name) },
    });

    if (existingStyles.length > 0) {
      console.log(`⚠️  Advertencia: ${existingStyles.length} estilos ya existen:`);
      existingStyles.forEach((s) => console.log(`  - ${s.name}`));
      console.log('\n¿Deseas continuar y crear los estilos faltantes? (los existentes se omitirán)');
    }

    // Filtrar estilos que ya existen
    const existingNames = new Set(existingStyles.map((s) => s.name));
    const newStyles = styles.filter((s) => !existingNames.has(s.name));

    if (newStyles.length === 0) {
      console.log('✅ Todos los estilos ya existen. No hay nada que crear.');
      process.exit(0);
    }

    console.log(`\n📝 Creando ${newStyles.length} estilos nuevos...`);

    // Crear los estilos nuevos
    const created = await PromptStyleTag.insertMany(
      newStyles.map((style) => ({
        userId: SYSTEM_USER_ID,
        name: style.name,
        description: style.description,
        promptText: style.promptText,
      }))
    );

    console.log(`\n✅ ${created.length} estilos creados exitosamente:\n`);

    // Agrupar por categoría para mejor visualización
    const categories = new Map<string, StyleDefinition[]>();
    newStyles.forEach((style) => {
      const cat = style.category || 'other';
      if (!categories.has(cat)) {
        categories.set(cat, []);
      }
      categories.get(cat)!.push(style);
    });

    categories.forEach((styles, category) => {
      console.log(`\n📁 ${category.toUpperCase()}:`);
      styles.forEach((style) => {
        console.log(`  ✓ ${style.name} - ${style.description}`);
      });
    });

    console.log('\n📊 Resumen:');
    console.log(`  • Total de estilos creados: ${created.length}`);
    console.log(`  • Categorías: ${categories.size}`);
    console.log(`  • Usuario: ${SYSTEM_USER_ID}`);

    console.log('\n💡 Próximos pasos:');
    console.log('  1. Generar previews para cada estilo usando el endpoint:');
    console.log('     POST /prompt-styles/:id/generate-preview');
    console.log('  2. Verificar que los estilos aparecen en la UI');
    console.log('  3. Probar la generación de imágenes con cada estilo');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedNanoBannaStyles();
