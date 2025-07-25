import Sticker from '../models/Sticker.js';

// Obtener todos los stickers
export const getAllStickers = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;
    const skip = (page - 1) * limit;

    let query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    const stickers = await Sticker.find(query)
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Sticker.countDocuments(query);

    res.json({
      success: true,
      data: stickers,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: stickers.length,
        totalDocuments: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener stickers',
      error: error.message
    });
  }
};

// Obtener un sticker por ID
export const getStickerById = async (req, res) => {
  try {
    const sticker = await Sticker.findById(req.params.id);
    
    if (!sticker) {
      return res.status(404).json({
        success: false,
        message: 'Sticker no encontrado'
      });
    }

    res.json({
      success: true,
      data: sticker
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener sticker',
      error: error.message
    });
  }
};

// Crear un nuevo sticker
export const createSticker = async (req, res) => {
  try {
    const sticker = new Sticker(req.body);
    await sticker.save();

    res.status(201).json({
      success: true,
      message: 'Sticker creado exitosamente',
      data: sticker
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al crear sticker',
      error: error.message
    });
  }
};

// Actualizar un sticker
export const updateSticker = async (req, res) => {
  try {
    const sticker = await Sticker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!sticker) {
      return res.status(404).json({
        success: false,
        message: 'Sticker no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Sticker actualizado exitosamente',
      data: sticker
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al actualizar sticker',
      error: error.message
    });
  }
};

// Eliminar un sticker (soft delete)
export const deleteSticker = async (req, res) => {
  try {
    const sticker = await Sticker.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!sticker) {
      return res.status(404).json({
        success: false,
        message: 'Sticker no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Sticker eliminado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar sticker',
      error: error.message
    });
  }
};

// Incrementar contador de descargas
export const incrementDownloads = async (req, res) => {
  try {
    const sticker = await Sticker.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    );

    if (!sticker) {
      return res.status(404).json({
        success: false,
        message: 'Sticker no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Descarga registrada',
      downloads: sticker.downloads
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al registrar descarga',
      error: error.message
    });
  }
};

// Buscar stickers
export const searchStickers = async (req, res) => {
  try {
    const { q, category, limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const stickers = await Sticker.searchStickers(q, {
      category,
      limit: parseInt(limit),
      skip
    });

    res.json({
      success: true,
      data: stickers,
      query: q,
      category: category || 'all'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en la búsqueda',
      error: error.message
    });
  }
};
