var renderer = require('./lib/renderer');

hexo.extend.filter.register('before_post_render', renderer.render, 9, { async: true });
