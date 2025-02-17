const yswsSchema = {
	name: `ysws`,
	type: `base`,
	fields: [
		{
			name: `title`,
			type: `text`,
			required: true,
			min: 3
		},
		{
			name: `description`,
			type: `text`,
			required: true
		},
		{
			name: `creator`,
			type: `text`,
			required: true
		},
		{
			name: `githubUrl`,
			type: `url`
		},
		{
			name: `liveUrl`,
			type: `url`
		},
		{
			name: `tags`,
			type: `text`,
			array: true
		},
		{
			name: `votes`,
			type: `relation`,
			options: { collectionId: `users` }
		},
		{
			name: `status`,
			type: `select`,
			options: {
				values: [`ideation`, `in_progress`, `completed`, `abandoned`]
			}
		}
	]
};
module.exports = yswsSchema;
