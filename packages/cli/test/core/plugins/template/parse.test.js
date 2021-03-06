const { alias } = require('../../../config');
const expect = require('chai').expect;
const path = require('path');
const fs = require('fs-extra');
const Hook = require(`${alias.core}/hook`);
const tag = require(`${alias.core}/tag`);
const initPlugin = require(`${alias.core}/init/plugin`);
const moduleSet = require(`${alias.core}/moduleSet`);
const pt = require(`${alias.plugins}/template/parse`);

const spec = {
  attr: ['v-if', 'v-for', 'v-show', 'bindClass'],
  event: ['v-on'],
  directives: ['v-model']
}

function createCompiler (options = {}) {
  const instance = new Hook();
  const appConfig = options.appConfig || {};
  const userDefinedTags = appConfig.tags || {};
  instance.options = { plugins: [] };
  instance.logger = {
    info () {},
    error () {},
    silly () {},
  }
  instance.tags = {
    htmlTags: tag.combineTag(tag.HTML_TAGS, userDefinedTags.htmlTags),
    wxmlTags: tag.combineTag(tag.WXML_TAGS, userDefinedTags.wxmlTags),
    html2wxmlMap: tag.combineTagMap(tag.HTML2WXML_MAP, userDefinedTags.html2wxmlMap)
  };
  initPlugin(instance);

  instance.assets = new moduleSet();
  return instance;
}

function getRaw (file, lang = 'wxml') {
  const original = path.join(__dirname, '..', '..', 'fixtures/template/original', file + '.html');
  const assert = path.join(__dirname, '..', '..', 'fixtures/template/assert', file + '.wxml');

  return {
    originalRaw: fs.readFileSync(original, 'utf-8'),
    assertRaw: fs.readFileSync(assert, 'utf-8')
  };
}

function assetHanlder (handlers) {
  for (let id in handlers) {
    for (let type in handlers[id]) {
      const func = handlers[id][type];
      const funcfile = path.join(__dirname, '..', '..', 'fixtures/template/assert/v-on/', id + '.' + type + '.js');
      const fixture = fs.readFileSync(funcfile, 'utf-8');

      try {
        expect(func.replace(/\s*/ig, '').replace(/\n*/ig, '')).to.equal(fixture.replace(/\s*/ig, '').replace(/\n*/ig, ''));
      } catch (e) {
        console.log('Compiled Handler: ' + id + '.' + type + '.js')
        console.log(func);
        throw e;
      }
    }
  }
}

function assertCodegen (originalRaw, assertRaw, options = {}, file, done) {
  const compiler = createCompiler(options);
  compiler.assets.add(file);
  compiler.hookUnique('template-parse', originalRaw, {}, { file }).then((rst) => {
    expect(rst.code).to.equal(assertRaw);
    if (file === 'v-on') {
      assetHanlder(rst.rel.handlers);
    }
    done();
  }).catch(err => {
    done(err);
    // throw err;
  });
}

describe('template-parse', function () {

  spec.attr.forEach(file => {

    it('test attr: ' + file, function (done) {
      const { originalRaw, assertRaw } = getRaw(file);
      assertCodegen(originalRaw, assertRaw, {}, file, done)
    })
  });
  spec.event.forEach(file => {

    it('test attr: ' + file, function (done) {
      const { originalRaw, assertRaw } = getRaw(file);
      assertCodegen(originalRaw, assertRaw, {}, file, done)
    })
  });
});
