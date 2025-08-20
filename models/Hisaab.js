const mongoose = require('mongoose');

const hisaabSchema = new mongoose.Schema(
	{
		title: { type: String, required: true, trim: true },
		content: { type: String, default: '' },
		user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Hisaab', hisaabSchema);


