import supabase from '../config/supabaseClient';

// Función para sincronizar stickers del bucket con la base de datos
export const syncStickersFromBucket = async (userId) => {
  try {
    // 1. Obtener todos los archivos del bucket
    const { data: files, error: listError } = await supabase.storage
      .from('stickers')
      .list('', {
        limit: 1000,
        offset: 0
      });

    if (listError) {
      throw listError;
    }

    // 2. Filtrar solo imágenes
    const imageFiles = files.filter(file => 
      file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    );

    // 3. Verificar cuáles stickers ya existen en la DB
    const { data: existingStickers, error: fetchError } = await supabase
      .from('stickers')
      .select('namesticker');

    if (fetchError) {
      throw fetchError;
    }

    const existingNames = new Set(existingStickers.map(s => s.namesticker));

    // 4. Preparar stickers nuevos para insertar
    const newStickers = [];
    
    for (const file of imageFiles) {
      if (!existingNames.has(file.name)) {
        // Generar URL pública
        const { data: urlData } = supabase.storage
          .from('stickers')
          .getPublicUrl(file.name);

        // Generar nombre y descripción a partir del archivo
        const displayName = file.name
          .replace(/\.[^/.]+$/, '') // Remover extensión
          .replace(/[-_]/g, ' ') // Reemplazar guiones y underscores por espacios
          .replace(/\b\w/g, l => l.toUpperCase()); // Capitalizar palabras

        const description = `Encuentra el sticker de ${displayName.toLowerCase()}`;

        newStickers.push({
          iduser: userId,
          namesticker: file.name,
          urlsticker: urlData.publicUrl,
          descriptionsticker: description
        });
      }
    }

    // 5. Insertar nuevos stickers en la DB
    if (newStickers.length > 0) {
      const { data: insertedStickers, error: insertError } = await supabase
        .from('stickers')
        .insert(newStickers)
        .select();

      if (insertError) {
        throw insertError;
      }

      console.log(`✅ Sincronizados ${newStickers.length} stickers nuevos`);
      return insertedStickers;
    }

    console.log('✅ Todos los stickers ya están sincronizados');
    return [];

  } catch (error) {
    console.error('❌ Error sincronizando stickers:', error);
    throw error;
  }
};

// Función para obtener todos los stickers de la DB con sus IDs
export const getAllStickersFromDB = async () => {
  try {
    const { data: stickers, error } = await supabase
      .from('stickers')
      .select('*')
      .order('id');

    if (error) {
      throw error;
    }

    return stickers;
  } catch (error) {
    console.error('❌ Error obteniendo stickers de la DB:', error);
    throw error;
  }
};

// Función para crear o obtener usuario
export const createOrGetUser = async () => {
  try {
    // Obtener usuario autenticado de Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Usuario no autenticado');
    }

    console.log('🔍 Buscando usuario con email:', user.email);

    // Verificar si el usuario ya existe usando el email como identificador único
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('emailuser', user.email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw fetchError;
    }

    // Si el usuario existe, devolverlo
    if (existingUser) {
      console.log('✅ Usuario encontrado en DB:', existingUser);
      return existingUser;
    }

    // Si no existe, crearlo
    const userData = {
      username: user.user_metadata?.full_name || 
                user.user_metadata?.name || 
                user.email?.split('@')[0] || 
                'Usuario',
      emailuser: user.email
    };

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log('✅ Usuario creado en la DB:', newUser);
    return newUser;

  } catch (error) {
    console.error('❌ Error creando/obteniendo usuario:', error);
    throw error;
  }
};

// Función para crear un nuevo juego
export const createGame = async (userId) => {
  try {
    const { data: game, error } = await supabase
      .from('game')
      .insert({
        userid: userId,
        createdate: new Date().toISOString(),
        timeplayed: null, // Se actualizará al finalizar
        scoregame: 0 // Se actualizará al finalizar
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('✅ Juego creado:', game);
    return game;

  } catch (error) {
    console.error('❌ Error creando juego:', error);
    throw error;
  }
};

// Función para finalizar juego y guardar resultados
export const finishGame = async (gameId, timePlayed, foundStickerIds, score) => {
  try {
    // 1. Actualizar el juego con el tiempo y score
    const { error: updateError } = await supabase
      .from('game')
      .update({
        timeplayed: timePlayed, // formato: '00:01:30' para 1 minuto 30 segundos
        scoregame: score
      })
      .eq('id', gameId);

    if (updateError) {
      throw updateError;
    }

    // 2. Guardar los stickers encontrados
    if (foundStickerIds.length > 0) {
      const stickerGameEntries = foundStickerIds.map(stickerId => ({
        gameid: gameId,
        stickerid: stickerId
      }));

      const { error: stickersError } = await supabase
        .from('stickersongame')
        .insert(stickerGameEntries);

      if (stickersError) {
        throw stickersError;
      }
    }

    console.log('✅ Juego finalizado y guardado');
    return true;

  } catch (error) {
    console.error('❌ Error finalizando juego:', error);
    throw error;
  }
};

// Función para obtener un sticker aleatorio como objetivo
export const getRandomTargetSticker = async () => {
  try {
    const stickers = await getAllStickersFromDB();
    
    if (stickers.length === 0) {
      throw new Error('No hay stickers disponibles');
    }

    const randomIndex = Math.floor(Math.random() * stickers.length);
    const targetSticker = stickers[randomIndex];

    return {
      id: targetSticker.id,
      name: targetSticker.namesticker,
      url: targetSticker.urlsticker,
      description: targetSticker.descriptionsticker,
      displayName: targetSticker.namesticker
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
    };

  } catch (error) {
    console.error('❌ Error obteniendo sticker objetivo:', error);
    throw error;
  }
};
