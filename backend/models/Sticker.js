import mongoose from 'mongoose';

const stickerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true,
    maxlength: [100, 'El título no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida'],
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  imageUrl: {
    type: String,
    required: [true, 'La URL de la imagen es requerida']
  },
  category: {
    type: String,
    required: [true, 'La categoría es requerida'],
    enum: ['emojis', 'memes', 'animados', 'personalizados', 'otros']
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  downloads: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Por ahora opcional
  }
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// Índices para optimizar búsquedas
stickerSchema.index({ title: 'text', description: 'text', tags: 'text' });
stickerSchema.index({ category: 1 });
stickerSchema.index({ isActive: 1 });
stickerSchema.index({ createdAt: -1 });

// Middleware pre-save
stickerSchema.pre('save', function(next) {
  // Normalizar tags
  if (this.tags) {
    this.tags = this.tags.map(tag => tag.toLowerCase().trim());
  }
  next();
});

// Método estático para buscar stickers
stickerSchema.statics.searchStickers = function(query, options = {}) {
  const { category, limit = 20, skip = 0 } = options;
  
  let searchQuery = { isActive: true };
  
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  if (category) {
    searchQuery.category = category;
  }
  
  return this.find(searchQuery)
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

const Sticker = mongoose.model('Sticker', stickerSchema);

export default Sticker;
