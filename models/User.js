const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({

  customerId:{
    type:String,
    unique:true
  },
  name: {
    type: String,
    required: true
  },

  mobile: {
    type: String,
    required: true,
    unique: true
  },
  email: {
  type: String,
  default: ''
  },
  password: {
    type: String
  },

  googleId: {
    type: String,
    unique: true,
    sparse: true
  },

  resetPasswordToken: {
    type: String,
    default: null
  },

  resetPasswordExpires: {
    type: Date,
    default: null
  }

}, {
  timestamps: true
});

UserSchema.statics.generateCustomerId = async function () {
  const users = await this.find({}, { customerId: 1 });

  let maxNum = 1000;

  users.forEach(u => {
    const match = /^NPC(\d+)$/.exec(u.customerId || '');
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });

  return 'NPC' + (maxNum + 1);
};

module.exports = mongoose.model('User', UserSchema);