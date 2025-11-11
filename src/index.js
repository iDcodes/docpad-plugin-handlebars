// Modernized ES6+ docpad-plugin-handlebars
module.exports = function (BasePlugin) {
  class HandlebarsPlugin extends BasePlugin {
      constructor(...args) {
          super(...args);

          this.handlebars = require('handlebars');
          this.precompileOpts = {};
      }

      // REQUIRED BY DOCPAD
      get name() {
          return 'handlebars';
      }

      // Called after DocPad loads plugin config
      setConfig(config) {
          console.log("HandlebarsPlugin:setConfig()", config);

          const hb = this.handlebars;

          // Precompile options
          this.precompileOpts = config.precompileOpts || {};

          // Register helpers
          if (config.helpers) {
              Object.keys(config.helpers).forEach(name => {
                  console.log("Register helper:", name);
                  hb.registerHelper(name, config.helpers[name]);
              });
          }

          // Register partials
          if (config.partials) {
              Object.keys(config.partials).forEach(name => {
                  console.log("Register partial:", name);
                  hb.registerPartial(name, config.partials[name]);
              });
          }

          // MUST call parent last
          return super.setConfig(config);
      }

      // DOCPAD HOOK: render file
      render(opts, next) {
          const hb = this.handlebars;
          const { inExtension, outExtension, content, templateData } = opts;

          // Only process Handlebars templates
          if (!['hb', 'hbs', 'handlebars'].includes(inExtension)) {
              return next();
          }

          try {
              if (['js', 'inlinejs'].includes(outExtension)) {
                  opts.content = this.precompileTemplate(opts);
              } else {
                  opts.content = hb.compile(content)(templateData);
              }
              return next();
          } catch (err) {
              return next(err);
          }
      }

      // Precompile for client-side use
      precompileTemplate(opts) {
          const hb = this.handlebars;
          const slug = opts.file.attributes.slug;

          let pre = "(function(){\n";
          pre += "var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};\n";
          pre += `templates['${slug}'] = template(`;
          let post = ");})();";

          return pre + hb.precompile(opts.content) + post;
      }
  }

  return HandlebarsPlugin;
};