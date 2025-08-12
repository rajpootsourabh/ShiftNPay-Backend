const path = require('path');
const Blog = require('../../model/Blog/Blog');
const { promises: fs } = require('fs');

exports.createBlog = async (req, res) => {
    const date = new Date();
    let tempFiles = [];

    try {

        // Extract fields from req.body
        const {
            title,
            content,
            excerpt,
            status,
            publishDate,
            categories,
            tags,
        } = req.body;

        // Validate required fields
        if (!title?.trim() || !content?.trim()) {
            console.log('Validation failed: Title or content missing');
            return res.status(400).json({ success: false, message: 'Title and content are required' });
        }

        // Extract files
        const featuredImage = req.files?.featuredImage;
        const galleryImages = req.files?.galleryImages
            ? Array.isArray(req.files.galleryImages)
                ? req.files.galleryImages
                : [req.files.galleryImages]
            : [];

        // Prepare blog data
        const blogData = {
            title,
            content,
            excerpt: excerpt || '',
            status: status || 'Draft',
            categories: Array.isArray(categories) ? categories.filter(Boolean) : categories ? [categories] : [],
            tags: Array.isArray(tags) ? tags.filter(Boolean) : tags ? [tags] : [],
            author: req.payload?.reqUserId || 'Admin',
            publishDate: status === 'Published' ? (publishDate ? new Date(publishDate) : new Date()) : undefined,
        };

        // Handle featuredImage
        if (featuredImage) {
            const fileName = `featured-${date.getTime()}-${featuredImage.name.replace(/\s+/g, '')}`;
            const filePath = path.join(__dirname, '..', '..',  'assets', 'uploads', fileName);
            tempFiles.push(filePath);

            await new Promise((resolve, reject) => {
                featuredImage.mv(filePath, err => {
                    if (err) {
                        console.error('Failed to upload featured image:', err);
                        reject(new Error('Failed to upload featured image'));
                    } else {
                        console.log(`Featured image saved: ${filePath}`);
                        resolve();
                    }
                });
            });

            blogData.featuredImage = `uploads/${fileName}`;
        }

        // Handle galleryImages
        if (galleryImages.length > 0) {
            blogData.galleryImages = await Promise.all(
                galleryImages.map(async (file) => {
                    const fileName = `gallery-${date.getTime()}-${Math.random().toString(36).slice(2, 11)}-${file.name.replace(/\s+/g, '')}`;
                    const filePath = path.join(__dirname, '..', '..', 'assets', 'uploads', fileName);
                    tempFiles.push(filePath);

                    await new Promise((resolve, reject) => {
                        file.mv(filePath, err => {
                            if (err) {
                                console.error('Failed to upload gallery image:', err);
                                reject(new Error('Failed to upload gallery image'));
                            } else {
                                console.log(`Gallery image saved: ${filePath}`);
                                resolve();
                            }
                        });
                    });

                    return `uploads/${fileName}`;
                })
            );
        }

        console.log('Saving blog to database');
        const newBlog = await Blog.create(blogData);
        console.log('Blog created, ID:', newBlog._id);

        console.log('Populating blog data');
        const populatedBlog = await Blog.findById(newBlog._id)
            .populate('categories', 'name slug')
            .populate('tags', 'name slug')
            .populate('author', 'name email');

        console.log('Blog populated successfully');
        tempFiles = [];

        res.status(201).json({
            success: true,
            data: populatedBlog,
        });
    } catch (error) {
        console.error('Error creating blog:', error);

        // Clean up temporary files
        for (const filePath of tempFiles) {
            try {
                await fs.unlink(filePath);
            } catch (err) {
                console.error('Error cleaning up file:', filePath, err);
            }
        }

        res.status(error.message === 'Title and content are required' ? 400 : 500).json({
            success: false,
            message: 'Error creating blog post',
            error: error.message,
        });
    }
};
// Get all blog posts
exports.getBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find()
            .populate('categories', 'name slug')
            .populate('tags', 'name slug')
            .populate('author', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: blogs.length,
            blogs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching blogs',
            error: error.message
        });
    }
};

exports.getBlogsForUsers = async (req, res) => {
     try {
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        let skip = (page - 1) * limit;

        const blogs = await Blog.find()
            .populate('categories', 'name slug')
            .populate('tags', 'name slug')
            .populate('author', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Blog.countDocuments();

        res.status(200).json({
            success: true,
            count: blogs.length,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            blogs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching blogs',
            error: error.message
        });
    }
};

// Get single blog post
exports.getBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id)
            .populate('categories', 'name slug')
            .populate('tags', 'name slug')
            .populate('author', 'name email');

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog post not found'
            });
        }

        res.status(200).json({
            success: true,
            data: blog
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching blog',
            error: error.message
        });
    }
};


exports.updateBlog = async (req, res) => {
    const date = new Date();
    let tempFiles = [];

    try {
        console.log('Starting blog update');
        console.log('Blog ID:', req.params.id);
        console.log('Request body:', req.body);
        console.log('Request files:', req.files ? Object.keys(req.files) : 'None');

        // Fetch the existing blog post
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            console.log('Blog not found');
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        // Extract fields from req.body
        const {
            title,
            content,
            excerpt,
            status,
            publishDate,
            categories,
            tags,
        } = req.body;

        // Validate required fields
        if (!title?.trim() || !content?.trim()) {
            console.log('Validation failed: Title or content missing');
            return res.status(400).json({ success: false, message: 'Title and content are required' });
        }

        // Prepare blog data for update
        const blogData = {
            title,
            content,
            excerpt: excerpt || '',
            status: status || blog.status || 'Draft',
            categories: Array.isArray(categories) ? categories.filter(Boolean) : categories ? [categories] : blog.categories || [],
            tags: Array.isArray(tags) ? tags.filter(Boolean) : tags ? [tags] : blog.tags || [],
            author: blog.author, // Preserve the original author
            publishDate: status === 'Published' ? (publishDate ? new Date(publishDate) : new Date()) : blog.publishDate,
        };

        // Check if req.files exists
        if (!req.files) {
            console.log('No files uploaded in request');
            blogData.featuredImage = blog.featuredImage; // Retain the old featured image
            blogData.galleryImages = blog.galleryImages || []; // Retain the old gallery images
        } else {
            // Handle featuredImage update
            const featuredImage = req.files.featuredImage;
            if (featuredImage && featuredImage.name) {
                const fileName = `featured-${date.getTime()}-${featuredImage.name.replace(/\s+/g, '')}`;
                const filePath = path.join(__dirname, '..', '..', 'assets', 'uploads', fileName);
                tempFiles.push(filePath);

                await new Promise((resolve, reject) => {
                    featuredImage.mv(filePath, err => {
                        if (err) {
                            console.error('Failed to upload featured image:', err);
                            reject(new Error('Failed to upload featured image'));
                        } else {
                            console.log(`Featured image saved: ${filePath}`);
                            resolve();
                        }
                    });
                });

                // Delete the old featured image if it exists
                if (blog.featuredImage) {
                    const oldFeaturedImagePath = path.join(__dirname, '..', '..', 'assets', blog.featuredImage);
                    try {
                        await fs.unlink(oldFeaturedImagePath);
                        console.log(`Deleted old featured image: ${oldFeaturedImagePath}`);
                    } catch (err) {
                        console.error(`Error deleting old featured image: ${oldFeaturedImagePath}`, err);
                    }
                }

                blogData.featuredImage = `uploads/${fileName}`;
            } else {
                blogData.featuredImage = blog.featuredImage; // Retain the old featured image
            }

            // Handle galleryImages update
            const galleryImages = req.files.galleryImages
                ? Array.isArray(req.files.galleryImages)
                    ? req.files.galleryImages
                    : [req.files.galleryImages]
                : null;

            if (galleryImages && galleryImages.length > 0 && galleryImages.every(file => file && file.name)) {
                // Delete all old gallery images if new ones are uploaded
                if (blog.galleryImages?.length > 0) {
                    for (const oldImage of blog.galleryImages) {
                        const oldImagePath = path.join(__dirname, '..', '..', 'assets', oldImage);
                        try {
                            await fs.unlink(oldImagePath);
                            console.log(`Deleted old gallery image: ${oldImagePath}`);
                        } catch (err) {
                            console.error(`Error deleting old gallery image: ${oldImagePath}`, err);
                        }
                    }
                }

                // Upload new gallery images
                blogData.galleryImages = await Promise.all(
                    galleryImages.map(async (file) => {
                        const fileName = `gallery-${date.getTime()}-${Math.random().toString(36).slice(2, 11)}-${file.name.replace(/\s+/g, '')}`;
                        const filePath = path.join(__dirname, '..', '..', 'assets', 'uploads', fileName);
                        tempFiles.push(filePath);

                        await new Promise((resolve, reject) => {
                            file.mv(filePath, err => {
                                if (err) {
                                    console.error('Failed to upload gallery image:', err);
                                    reject(new Error('Failed to upload gallery image'));
                                } else {
                                    console.log(`Gallery image saved: ${filePath}`);
                                    resolve();
                                }
                            });
                        });

                        return `uploads/${fileName}`;
                    })
                );
            } else {
                blogData.galleryImages = blog.galleryImages || []; // Retain the old gallery images
            }
        }

        console.log('Updating blog in database');
        const updatedBlog = await Blog.findByIdAndUpdate(
            req.params.id,
            blogData,
            { new: true, runValidators: true }
        );

        if (!updatedBlog) {
            console.log('Failed to update blog');
            return res.status(500).json({ success: false, message: 'Failed to update blog' });
        }

        console.log('Blog updated, ID:', updatedBlog._id);

        console.log('Populating updated blog data');
        const populatedBlog = await Blog.findById(updatedBlog._id)
            .populate('categories', 'name slug')
            .populate('tags', 'name slug')
            .populate('author', 'name email');

        console.log('Blog populated successfully');
        tempFiles = [];

        res.status(200).json({
            success: true,
            data: populatedBlog,
        });
    } catch (error) {
        console.error('Error updating blog:', error);

        // Clean up temporary files
        for (const filePath of tempFiles) {
            try {
                await fs.unlink(filePath);
            } catch (err) {
                console.error('Error cleaning up file:', filePath, err);
            }
        }

        res.status(error.message === 'Title and content are required' ? 400 : 500).json({
            success: false,
            message: 'Error updating blog post',
            error: error.message,
        });
    }
};

exports.deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findByIdAndDelete(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        res.status(200).json({ message: 'Blog deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting blog', error: error.message });
    }
};

exports.deleteAllBlog = async (req, res) => {
    try {
        const { ids } = req.body;
         if (!Array.isArray(ids) || ids.length === 0)
            return res.status(400).json({ error: 'No Blogs selected' });
            await Blog.deleteMany({ _id: { $in: ids } });

        res.status(200).json({ message: 'Blogs deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting blog', error: error.message });
    }
};