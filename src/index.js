// Modernized ES6+ version of docpad-plugin-handlebars
module.exports = function (BasePlugin) {
    class HandlebarsPlugin extends BasePlugin {
        constructor(...args) {
            super(...args);
            this.name = 'handlebars';
            this.handlebars = null;
            this.precompileOpts = {};
        }

        setConfig(config) {
            const docpad = this.docpad;
            const handlebars = (this.handlebars = require('handlebars'));

            this.precompileOpts = this.config.precompileOpts || {};

            // Register helpers
            if (this.config.helpers) {
                for (const [name, helper] of Object.entries(this.config.helpers)) {
                    handlebars.registerHelper(name, helper);
                }
            }

            // Register partials
            if (this.config.partials) {
                for (const [name, partial] of Object.entries(this.config.partials)) {
                    handlebars.registerPartial(name, partial);
                }
            }

            // Chain to super
            super.setConfig(config);
        }

        render(opts) {
            const { inExtension, outExtension, templateData, content } = opts;
            const handlebars = this.handlebars;

            if (['hb', 'hbs', 'handlebars'].includes(inExtension)) {
                if (['js', 'inlinejs'].includes(outExtension)) {
                    opts.content = this.handlePrecompileOpts(opts);
                } else {
                    opts.content = handlebars.compile(content)(templateData);
                }
            }
        }

        handlePrecompileOpts(opts) {
            const argv = this.precompileOpts;
            argv.wrapper ??= 'default';
            argv.amdPath ??= '';

            let pre = '';
            let post = '';

            // slug for template: {src}/tpl/a/abc/test.js.handlebars -> "tpl-a-abc-test"
            const templateName = opts.file.attributes.slug;

            if (argv.wrapper === 'amd') {
                pre += `define(['${argv.amdPath}handlebars'], function(Handlebars) {\n`;
            }

            if (argv.wrapper === 'default') {
                pre += '(function() {\n';
            }

            if (['default', 'amd'].includes(argv.wrapper)) {
                pre += '  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};\n';
                pre += `  templates['${templateName}'] = template(`;
                post += ');\n';
            }

            if (argv.wrapper === 'amd') post += '});';
            if (argv.wrapper === 'default') post += '})();';

            return pre + this.handlebars.precompile(opts.content) + post;
        }
    }

    return HandlebarsPlugin;
};  