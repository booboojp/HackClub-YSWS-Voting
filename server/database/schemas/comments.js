const commentSchema = {
	name: `comments`,
	type: `base`,
	fields: [
		{
			name: `content`,
			type: `text`,
			required: true
		},
		{
			name: `yswsId`,
			type: `relation`,
			required: true,
			options: { collectionId: `ysws` }
		},
		{
			name: `author`,
			type: `text`,
			required: true
		}
	]
};

module.exports = commentSchema;
