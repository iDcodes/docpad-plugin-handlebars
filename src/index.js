module.exports = function (BasePlugin) {
  // Use old-style constructor pattern (DocPad expects this)
  var HandlebarsPlugin = BasePlugin.extend({

      name: 'handlebars',

      // Called AFTER constructor, BEFORE rendering
      setConfig: function (config) {
          console.log("DocPad Handlebars Plugin: setConfig()");
          console.log("Incoming plugin config:", config);

          this.handlebars = this.handlebars || require('handlebars');

          // Use incoming config (NOT this.config yet)
          this.precompileOpts = config.precompileOpts || {};
          console.log("Precompile opts:", this.precompileOpts);

          if (config.helpers) {
              for (var name in config.helpers) {
                  console.log("Registering Handlebars helper:", name);
                  this.handlebars.registerHelper(name, config.helpers[name]);
              }
          }

          if (config.partials) {
              for (var name in config.partials) {
                  this.handlebars.registerPartial(name, config.partials[name]);
              }
          }

          // Now DocPad stores the config
          HandlebarsPlugin.__super__.setConfig.call(this, config);
      },

      render: function (opts) {
          var handlebars = this.handlebars;

          if (['hb', 'hbs', 'handlebars'].indexOf(opts.inExtension) !== -1) {
              if (['js', 'inlinejs'].indexOf(opts.outExtension) !== -1) {
                  opts.content = this.precompile(opts);
              } else {
                  opts.content = handlebars.compile(opts.content)(opts.templateData);
              }
          }

          return opts;
      },

      precompile: function (opts) {
          var handlebars = this.handlebars;
          var name = opts.file.attributes.slug;

          var pre = "(function(){\n";
          var post = "})();";

          pre += "var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};\n";
          pre += "templates['" + name + "'] = template(";
          post = ");\n" + post;

          return pre + handlebars.precompile(opts.content) + post;
      }
  });

  return HandlebarsPlugin;
};
