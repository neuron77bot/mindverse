import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IApiKey {
  _id: string;
  key: string; // Hash de la key
  userId: Schema.Types.ObjectId;
  name: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  enabled: boolean;
}

const apiKeySchema = new Schema<IApiKey>(
  {
    key: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true 
    },
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true
    },
    name: { 
      type: String, 
      required: true,
      maxlength: 100
    },
    lastUsedAt: { 
      type: Date, 
      default: null 
    },
    expiresAt: { 
      type: Date, 
      default: null 
    },
    enabled: { 
      type: Boolean, 
      default: true 
    },
  },
  {
    timestamps: true,
  }
);

// Método estático para hashear una API key
apiKeySchema.statics.hashKey = async function(plainKey: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainKey, salt);
};

// Método estático para comparar una API key con su hash
apiKeySchema.statics.compareKey = async function(plainKey: string, hashedKey: string): Promise<boolean> {
  return bcrypt.compare(plainKey, hashedKey);
};

// Método de instancia para verificar si la key está activa
apiKeySchema.methods.isActive = function(): boolean {
  if (!this.enabled) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  return true;
};

export const ApiKey = model<IApiKey>('ApiKey', apiKeySchema);
