const path = require('path');
const hashUtil = require('../../util/hash');

exports = module.exports = function () {
  this.register('wepy-parser-wxs', function (node, ctx) {

    if (ctx.useCache && !node.src && ctx.sfc.template.parsed) {
      return Promise.resolve(true);
    }
    let moduleId = node.attrs.module;
    let code = node.compiled.code.trim();
    let output = `<wxs module="${moduleId}"${node.src ? ' src="' + node.src + '"' : ''}>${!node.src ? '\n' + code + '\n' : ''}</wxs>`;
    node.parsed = {
      output
    };
    const fileHash = node.src ? hashUtil.hash(code) : ctx.hash;
    const file = node.src ? path.resolve(path.dirname(ctx.file), node.src) : ctx.file;
    const isHashEqual = !!this.compiled[file] && fileHash === this.compiled[file].hash
    let wxsCtx = null;

    if (node.src && isHashEqual) {
      // If node has src, then use src file cache
      wxsCtx = this.compiled[file];
      wxsCtx.useCache = true;
      return Promise.resolve(wxsCtx);
    } else {
      wxsCtx = Object.assign({}, ctx, {
        file,
        wxs: true,
        type: 'wxs',
        hash: fileHash
      });
      this.compiled[file] = wxsCtx;

      // If sfc file hash is equal
      if (isHashEqual) {
        return Promise.resolve(wxsCtx);
      }
      if (node.src) {
        this.assets.add(wxsCtx.file, {
          npm: wxsCtx.npm,
          wxs: true,
          dep: true,
          component: wxsCtx.component,
          type: wxsCtx.type
        });
      }
    }

    node = {
      type: 'script',
      lang: node.lang,
      content: code,
      src: node.src
    };
    return this.applyCompiler(node, wxsCtx);
  });
};
